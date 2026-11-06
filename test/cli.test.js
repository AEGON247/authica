import assert from "node:assert/strict";
import { parse } from "@babel/parser";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "cli.js");
const fixtures = [];

function fixture(kind = "vite", routerPackage = "react-router-dom") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "authica-test-"));
  fixtures.push(dir);
  const next = kind === "next";
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({
    dependencies: next
      ? { next: "15.0.0", react: "19.0.0", tailwindcss: "4.0.0" }
      : { vite: "6.0.0", react: "19.0.0", [routerPackage]: "7.0.0", tailwindcss: "4.0.0" },
  }));
  fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "index.css"), ":root { --background: 0 0% 100%; }");
  if (next) fs.mkdirSync(path.join(dir, "app"), { recursive: true });
  else fs.writeFileSync(path.join(dir, "src", "App.tsx"), `import { Routes } from "${routerPackage}";\nexport default function App() { return <Routes />; }\n`);
  return dir;
}

function runCli(dir, args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: "utf8" });
}

const generationArgs = ["--yes", "--no-install", "--no-social", "--css=src/index.css"];

after(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

test("default generation retains legacy route injection and creates its backup", () => {
  const dir = fixture();
  const result = runCli(dir, generationArgs);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const router = fs.readFileSync(path.join(dir, "src", "App.tsx"), "utf8");
  assert.match(router, /<Route path="\/login" element=\{<authica \/>\} \/>/);
  assert.match(router, /import authica from "\.\/routes\/login";/);
  assert.equal(fs.readFileSync(path.join(dir, "src", "App.tsx.bak"), "utf8"), `import { Routes } from "react-router-dom";\nexport default function App() { return <Routes />; }\n`);
  assert.ok(fs.existsSync(path.join(dir, "src", "routes", "login.tsx")));
  assert.match(result.stdout, /https:\/\/authica\.dev/);
});

test("--help prints colored sections, subcommands, flags, and three examples", () => {
  const dir = fixture();
  const result = runCli(dir, ["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\u001b\[38;5;141m/);
  assert.match(result.stdout, /\[ NPM v2\.0\.0 \]/);
  assert.match(result.stdout, /\[ License: MIT \]/);
  assert.match(result.stdout, /SUBCOMMANDS[\s\S]*authica audit[\s\S]*authica preview/);
  for (const flag of ["--layout", "--style", "--auth", "--providers", "--ast-inject", "--middleware", "--force"]) {
    assert.ok(result.stdout.includes(flag), `missing ${flag}`);
  }
  assert.equal((result.stdout.match(/npx authica/g) ?? []).length, 4);
});

test("opt-in AST route injection preserves formatting and creates a valid route import", () => {
  const dir = fixture();
  const original = `import { Routes } from "react-router-dom";\n\nexport default function App() {\n  return (\n    <Routes>\n    </Routes>\n  );\n}\n`;
  fs.writeFileSync(path.join(dir, "src", "App.tsx"), original);
  const result = runCli(dir, [...generationArgs, "--ast-inject"]);
  assert.equal(result.status, 0, result.stderr);
  const router = fs.readFileSync(path.join(dir, "src", "App.tsx"), "utf8");
  assert.match(router, /import \{ Route \} from "react-router-dom";/);
  assert.match(router, /import Authica from "\.\/routes\/login";/);
  assert.match(router, /<Route path="\/login" element=\{<Authica \/>} \/>/);
  assert.equal(fs.readFileSync(path.join(dir, "src", "App.tsx.bak"), "utf8"), original);
});

test("AST route injection supports createBrowserRouter route arrays", () => {
  const dir = fixture();
  fs.writeFileSync(path.join(dir, "src", "App.tsx"), `import { createBrowserRouter } from "react-router-dom";\nexport const router = createBrowserRouter([\n  { path: "/", element: <div /> },\n]);\n`);
  const result = runCli(dir, [...generationArgs, "--ast-inject"]);
  assert.equal(result.status, 0, result.stderr);
  const router = fs.readFileSync(path.join(dir, "src", "App.tsx"), "utf8");
  assert.match(router, /import Authica from "\.\/routes\/login";/);
  assert.match(router, /path: "\/login",\s+element: <Authica \/>/);
  assert.equal(fs.readFileSync(path.join(dir, "src", "App.tsx.bak"), "utf8").includes("/login"), false);
});

test("AST route injection respects the installed react-router package", () => {
  const dir = fixture("vite", "react-router");
  const result = runCli(dir, [...generationArgs, "--ast-inject"]);
  assert.equal(result.status, 0, result.stderr);
  const router = fs.readFileSync(path.join(dir, "src", "App.tsx"), "utf8");
  assert.match(router, /import \{ Route \} from "react-router";/);
  assert.doesNotMatch(router, /react-router-dom/);
});

test("AST parse failure falls back to the legacy injector without losing the backup", () => {
  const dir = fixture();
  const original = `import { Routes } from "react-router-dom";\nconst invalid = ;\nexport default function App() { return <Routes />; }\n`;
  fs.writeFileSync(path.join(dir, "src", "App.tsx"), original);
  const result = runCli(dir, [...generationArgs, "--ast-inject"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /AST route insertion could not safely parse/);
  assert.match(fs.readFileSync(path.join(dir, "src", "App.tsx"), "utf8"), /<Route path="\/login"/);
  assert.equal(fs.readFileSync(path.join(dir, "src", "App.tsx.bak"), "utf8"), original);
});

test("middleware is generated only when explicitly requested and does not overwrite existing middleware", () => {
  const dir = fixture("next");
  fs.writeFileSync(path.join(dir, "app", "globals.css"), ":root { --background: white; }");
  const plain = runCli(dir, [...generationArgs, "--css=app/globals.css"]);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(fs.existsSync(path.join(dir, "middleware.ts")), false);

  const second = fixture("next");
  fs.writeFileSync(path.join(second, "app", "globals.css"), ":root { --background: white; }");
  const protectedRun = runCli(second, [...generationArgs, "--css=app/globals.css", "--auth=clerk", "--middleware"]);
  assert.equal(protectedRun.status, 0, protectedRun.stderr);
  const middleware = fs.readFileSync(path.join(second, "middleware.ts"), "utf8");
  assert.match(middleware, /createRouteMatcher\(\["\/dashboard\(\.\*\)"\]\)/);
  assert.match(middleware, /new URL\("\/login", request\.url\)/);
  assert.match(middleware, /matcher:/);
  assert.doesNotThrow(() => parse(middleware, { sourceType: "module", plugins: ["typescript"] }));
});

test("middleware overwrite requires --force and keeps a preflight backup", () => {
  const dir = fixture("next");
  fs.writeFileSync(path.join(dir, "app", "globals.css"), ":root { --background: white; }");
  const original = "export const middleware = () => undefined;\n";
  fs.writeFileSync(path.join(dir, "middleware.ts"), original);
  const blocked = runCli(dir, [...generationArgs, "--css=app/globals.css", "--auth=clerk", "--middleware"]);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /already exists/);
  assert.equal(fs.existsSync(path.join(dir, "app", "(auth)", "login", "page.tsx")), false);
  assert.equal(fs.readFileSync(path.join(dir, "middleware.ts"), "utf8"), original);

  const forced = runCli(dir, [...generationArgs, "--css=app/globals.css", "--auth=clerk", "--middleware", "--force"]);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(fs.readFileSync(path.join(dir, "middleware.ts.bak"), "utf8"), original);
});

test("Supabase middleware starter is valid TypeScript and redirects only dashboard routes", () => {
  const dir = fixture("next");
  fs.writeFileSync(path.join(dir, "app", "globals.css"), ":root { --background: white; }");
  const result = runCli(dir, [...generationArgs, "--auth=supabase", "--middleware"]);
  assert.equal(result.status, 0, result.stderr);
  const middleware = fs.readFileSync(path.join(dir, "middleware.ts"), "utf8");
  assert.match(middleware, /supabase\.auth\.getUser\(\)/);
  assert.match(middleware, /pathname\.startsWith\("\/dashboard"\)/);
  assert.doesNotThrow(() => parse(middleware, { sourceType: "module", plugins: ["typescript"] }));
});

test("NextAuth middleware explicitly targets the generated login route", () => {
  const dir = fixture("next");
  fs.writeFileSync(path.join(dir, "app", "globals.css"), ":root { --background: white; }");
  const result = runCli(dir, [...generationArgs, "--auth=next-auth", "--middleware"]);
  assert.equal(result.status, 0, result.stderr);
  const middleware = fs.readFileSync(path.join(dir, "middleware.ts"), "utf8");
  assert.match(middleware, /withAuth\(\{ pages: \{ signIn: "\/login" \} \}\)/);
  assert.match(middleware, /matcher: \["\/dashboard\/:path\*"\]/);
  assert.match(result.stdout, /Set `pages\.signIn` to "\/login"/);
  assert.doesNotThrow(() => parse(middleware, { sourceType: "module", plugins: ["typescript"] }));
});

test("WebAuthn is opt-in and does not install its browser dependency with --no-install", () => {
  const dir = fixture();
  const before = fs.readFileSync(path.join(dir, "package.json"), "utf8");
  const result = runCli(dir, [...generationArgs, "--auth=webauthn"]);
  assert.equal(result.status, 0, result.stderr);
  const generated = fs.readFileSync(path.join(dir, "src", "routes", "login.tsx"), "utf8");
  assert.match(generated, /@simplewebauthn\/browser/);
  assert.match(generated, /\/api\/generate-options/);
  assert.match(generated, /\/api\/verify/);
  assert.match(generated, /startRegistration\(\{ optionsJSON \}\)/);
  assert.match(generated, /Create a passkey/);
  assert.doesNotThrow(() => parse(generated, { sourceType: "module", plugins: ["jsx", "typescript"] }));
  assert.match(result.stdout, /challenge storage, origin\/RP validation/);
  assert.equal(fs.readFileSync(path.join(dir, "package.json"), "utf8"), before);
});

test("audit is read-only and reports likely auth tokens stored in localStorage", () => {
  const dir = fixture();
  const source = `localStorage.setItem("access_token", token);\n`;
  fs.writeFileSync(path.join(dir, "src", "unsafe.ts"), source);
  const result = runCli(dir, ["audit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /advisory security scan \(read-only\)/);
  assert.match(result.stderr, /access_token.*localStorage/);
  assert.equal(fs.readFileSync(path.join(dir, "src", "unsafe.ts"), "utf8"), source);
  assert.equal(fs.existsSync(path.join(dir, "src", "routes")), false);
});

test("audit reports skipped unparsable sources without stopping", () => {
  const dir = fixture();
  fs.writeFileSync(path.join(dir, "src", "broken.ts"), "const source = ;\n");
  const result = runCli(dir, ["audit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Skipped .*could not be read or parsed/);
});

test("--scan-security reports findings but still generates the selected route", () => {
  const dir = fixture();
  fs.writeFileSync(path.join(dir, "src", "unsafe.ts"), `localStorage.setItem("session_token", token);\n`);
  const result = runCli(dir, [...generationArgs, "--scan-security"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /advisory security scan \(read-only\)/);
  assert.match(result.stderr, /session_token.*localStorage/);
  assert.ok(fs.existsSync(path.join(dir, "src", "routes", "login.tsx")));
});

test("preview serves the isolated studio without modifying the project", async () => {
  const dir = fixture();
  const child = spawn(process.execPath, [cli, "preview"], { cwd: dir, stdio: "ignore" });
  try {
    let response;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        response = await fetch("http://127.0.0.1:4321/");
        break;
      } catch {
        await delay(100);
      }
    }
    assert.ok(response, "preview server did not start");
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /Authentication, styled\./);
    for (const feature of ["#0B0B0E", "#13131A", "#22222E", "#8B5CF6", "Layout Frameworks", "Aesthetic Presets", "data-color", "data-provider", "navigator.clipboard", "data-layout", "data-style"]) {
      assert.ok(body.includes(feature), `preview is missing ${feature}`);
    }
    assert.deepEqual(fs.readdirSync(dir).sort(), ["package.json", "src", "tsconfig.json"]);
  } finally {
    child.kill();
    await delay(100);
  }
});
