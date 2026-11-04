#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

const args = process.argv.slice(2);
const created = [], modified = [], steps = [];
let themeNote = "", rcNote = "", extraRoutes = [];
const flag = (n) => args.includes(`--${n}`);
let rc = {};
const hasOpt = (n) => args.some((a) => a.startsWith(`--${n}=`)) || rc[n] !== undefined;
const opt = (n, d) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  if (a) return a.slice(n.length + 3);
  const v = rc[n];
  return v === undefined ? d : Array.isArray(v) ? v.join(",") : String(v);
};
if (flag("help") || flag("h")) {
  console.log("Usage: npx authica [--auth=none|supabase|next-auth|clerk] [--layout=split|centered|canvas|modal|glass] [--hero=<path|url>] [--providers=google,github,...] [--style=default|brutalist|glassmorphism] [--otp|--magic-link] [--css=<file>] [--entry=<file>] [--no-name] [--confirm] [--no-social] [--yes] [--force] [--no-install]");
  process.exit(0);
}
const fail = (m) => { console.error(`✖ ${m}`); process.exit(1); };
const cwd = process.cwd();
const p = (...x) => path.join(cwd, ...x);
const ex = (f) => fs.existsSync(p(f));

// ---- team config (.authicarc / .authicarc.json); CLI flags win over it
const rcFile = [".authicarc", ".authicarc.json"].find(ex);
if (rcFile) {
  try { rc = JSON.parse(fs.readFileSync(p(rcFile), "utf8")); }
  catch (e) { fail(`${rcFile} is not valid JSON: ${e.message}`); }
  if (!rc || typeof rc !== "object" || Array.isArray(rc)) fail(`${rcFile} must contain a JSON object.`);
  const known = ["auth", "layout", "style", "method", "css", "hero", "entry", "providers", "name", "confirm", "social"];
  const unknown = Object.keys(rc).filter((k) => !known.includes(k));
  if (unknown.length) console.warn(`⚠ ${rcFile}: ignoring unknown keys: ${unknown.join(", ")}`);
  rcNote = rcFile;
}
const auth = opt("auth", "none");
if (!["none", "supabase", "next-auth", "clerk"].includes(auth)) fail(`Unknown auth "${auth}"`);
if (!ex("package.json")) fail("No package.json found. Run this in your project root.");
const pkg = JSON.parse(fs.readFileSync(p("package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

// ---- detect stack
const isNext = !!deps.next;
const isVite = !isNext && !!deps.vite && !!(deps["react-router-dom"] || deps["react-router"]);
if (!isNext && !isVite) fail("Unsupported project: need Next.js, or Vite + react-router(-dom).");
if (!deps.react) fail("React not found in package.json.");
if (!ex("tsconfig.json")) fail("TypeScript project required (tsconfig.json not found).");
if (auth === "next-auth" && !isNext) fail("--auth=next-auth requires Next.js.");

if (!deps.tailwindcss && !deps["@tailwindcss/vite"] && !deps["@tailwindcss/postcss"])
  console.warn("⚠ Tailwind CSS not detected; using self-contained CSS fallbacks.");

// ---- interactive onboarding (falls back to defaults when non-interactive or --yes)
const interactive = process.stdin.isTTY && !flag("yes");
const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const ask = async (q, def) => (rl ? (await rl.question(`${q} ${def !== "" ? `(${def}) ` : ""}`)).trim() || def : def);
const askBool = async (q, def) => {
  const a = (await ask(`${q} [y/n]`, def ? "y" : "n")).toLowerCase();
  return a.startsWith("y");
};

// ---- image path normalizer
function processHeroImage(inputPath) {
  if (!inputPath || inputPath.trim() === "") return "";
  const cleaned = inputPath.trim().replace(/^["']|["']$/g, ""); // Strip quotes

  // 1. Return web URLs directly
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  // 2. Resolve absolute or relative path against project root
  const absolutePath = path.isAbsolute(cleaned) ? cleaned : p(cleaned);
  const publicDir = p("public");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 3. If file is already inside public directory, return clean root-relative path (/filename)
  const relativeToPublic = path.relative(publicDir, absolutePath);
  if (!relativeToPublic.startsWith("..") && !path.isAbsolute(relativeToPublic)) {
    return "/" + relativeToPublic.replace(/\\/g, "/");
  }

  // 4. If file exists outside public, copy it into public/ directory
  if (fs.existsSync(absolutePath)) {
    const ext = path.extname(absolutePath) || ".png";
    const destName = `auth-hero${ext}`;
    const destPath = path.join(publicDir, destName);
    fs.copyFileSync(absolutePath, destPath);
    created.push(`public/${destName}`);
    return `/${destName}`;
  }

  // Fallback: assume clean root-relative path
  const normalized = cleaned.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : "/" + normalized;
}

// ---- theme scan
const cssCandidates = ["app/globals.css", "src/app/globals.css", "styles/globals.css", "src/styles/globals.css", "src/globals.css", "src/index.css", "app/global.css", "src/App.css"];
let cssFile = opt("css", "") || (await ask("Global CSS path?", cssCandidates.find(ex) || ""));
if (cssFile && !ex(cssFile)) { console.warn(`⚠ ${cssFile} not found; using fallback colors.`); cssFile = ""; }
const vars = {};
if (cssFile) {
  const css = fs.readFileSync(p(cssFile), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;}]+);/g)) if (!(m[1] in vars)) vars[m[1]] = m[2].trim();
  themeNote = `${cssFile} (${Object.keys(vars).length} tokens)`;
} else console.warn("⚠ No global CSS found; using neutral fallback colors.");

const channels = /^-?[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%(\s*\/\s*[\d.%]+)?$/;
function tok(names, fb) {
  for (const n of names) if (n in vars) return channels.test(vars[n]) ? `hsl(var(--${n}))` : `var(--${n},${fb})`;
  for (const n of names) if (`color-${n}` in vars) return `var(--color-${n},${fb})`;
  return fb;
}
const map = {
  BG: tok(["background"], "#ffffff"),
  FG: tok(["foreground"], "#0a0a0a"),
  PRIMARY: tok(["primary"], "#4f5bff"),
  PRIMARYFG: tok(["primary-foreground"], "#ffffff"),
  MUTED: tok(["muted"], "#f4f4f5"),
  BORDER: tok(["border"], "#e4e4e7"),
  DESTRUCTIVE: tok(["destructive"], "#ef4444"),
};
map.CARD = tok(["card", "background"], "#ffffff");
map.CARDFG = tok(["card-foreground", "foreground"], "#0a0a0a");

// ---- layout / fields / hero choices
let layout = opt("layout", "") || (await ask("Layout: split, centered, canvas, modal or glass?", "split"));
if (!["split", "centered", "canvas", "modal", "glass"].includes(layout)) { console.warn(`⚠ Unknown layout "${layout}", using split.`); layout = "split"; }
let style = opt("style", "") || (await ask("Visual style: default, brutalist or glassmorphism?", "default"));
if (!["default", "brutalist", "glassmorphism"].includes(style)) { console.warn(`⚠ Unknown style "${style}", using default.`); style = "default"; }
let method = flag("otp") ? "otp" : flag("magic-link") ? "magic" : opt("method", "") || (await ask("Sign-in method: password, otp or magic-link?", "password"));
if (method === "magic-link") method = "magic";
if (!["password", "otp", "magic"].includes(method)) { console.warn(`⚠ Unknown method "${method}", using password.`); method = "password"; }
if (method === "magic" && auth === "clerk") fail("--magic-link is not supported with --auth=clerk (use --otp, or --auth=supabase/next-auth).");
const showName = flag("no-name") ? false : rc.name !== undefined ? !!rc.name : await askBool("Include full-name field?", true);
const confirmPw = method !== "password" ? false : flag("confirm") ? true : rc.confirm !== undefined ? !!rc.confirm : await askBool("Include confirm-password field?", false);
const ALL = ["google", "github", "apple", "discord", "facebook"];
let providers = [];
if (!flag("no-social") && rc.social !== false) {
  const raw = hasOpt("providers") ? opt("providers", "") : (await ask(`Social providers, comma-separated (${ALL.join("/")}; blank = none)?`, "google,github"));
  providers = raw.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  const bad = providers.filter((x) => !ALL.includes(x));
  if (bad.length) console.warn(`⚠ Ignoring unknown providers: ${bad.join(", ")}`);
  providers = [...new Set(providers.filter((x) => ALL.includes(x)))];
}
const rawHero = !["split", "canvas"].includes(layout) ? "" : opt("hero", "") || (hasOpt("hero") ? "" : await ask("Hero image path or URL (blank = built-in artwork)?", ""));
const hero = processHeroImage(rawHero);

// ---- auth wiring
const env = (k) => (isNext ? `process.env.NEXT_PUBLIC_${k}` : `import.meta.env.VITE_${k}`);
const hooks = {
  none: {
    imports: "",
    hook: `function useAuth() {
  return {
    submit: async (mode: Mode, d: Data) => { console.log(mode, d); /* TODO: connect your backend */ },
    social: async (p: Social) => { console.log("social", p); /* TODO */ },
  };
}`,
    pkgs: [],
  },
  supabase: {
    imports: `import { createClient } from "@supabase/supabase-js";\n`,
    hook: `const supabase = createClient(${env("SUPABASE_URL")} as string, ${env("SUPABASE_ANON_KEY")} as string);

function useAuth() {
  return {
    submit: async (mode: Mode, d: Data) => {
      const r =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email: d.email, password: d.password })
          : await supabase.auth.signUp({ email: d.email, password: d.password, options: { data: { name: d.name } } });
      if (r.error) throw r.error;
      if (!r.data.session) throw new Error("Check your email to confirm your account.");
      window.location.href = "/";
    },
    social: async (p: Social) => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: p });
      if (error) throw error;
    },
  };
}`,
    pkgs: ["@supabase/supabase-js"],
  },
  "next-auth": {
    imports: `import { signIn } from "next-auth/react";\n`,
    hook: `function useAuth() {
  return {
    submit: async (mode: Mode, d: Data) => {
      if (mode === "signup") {
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (!r.ok) throw new Error((await r.text()) || "Sign up failed");
      }
      const res = await signIn("credentials", { email: d.email, password: d.password, redirect: false });
      if (res?.error) throw new Error("Invalid credentials");
      window.location.href = "/";
    },
    social: async (p: Social) => { await signIn(p, { callbackUrl: "/" }); },
  };
}`,
    pkgs: ["next-auth"],
  },
  clerk: {
    imports: `import { useSignIn, useSignUp } from "${isNext ? "@clerk/nextjs" : "@clerk/react"}";\n`,
    hook: `function useAuth() {
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  return {
    submit: async (mode: Mode, d: Data) => {
      if (mode === "login") {
        const r = await signIn!.create({ identifier: d.email, password: d.password });
        if (r.status !== "complete") throw new Error("Additional verification required.");
        await setSignInActive!({ session: r.createdSessionId });
      } else {
        const r = await signUp!.create({ emailAddress: d.email, password: d.password, firstName: d.name });
        if (r.status !== "complete") throw new Error("Check your email to verify your account.");
        await setSignUpActive!({ session: r.createdSessionId });
      }
      window.location.href = "/";
    },
    social: async (p: Social) => {
      // Requires a /sso-callback route rendering Clerk's AuthenticateWithRedirectCallback.
      await signIn!.authenticateWithRedirect({
        strategy: ("oauth_" + p) as "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    },
  };
}`,
    pkgs: [isNext ? "@clerk/nextjs" : "@clerk/react"],
  },
}[auth];

const pw = method === "password";
const stub = `    send: async (_m: Mode, _d: Data) => {},
    verify: async (_m: Mode, _e: string, _c: string) => {},`;
const extras = {
  none: `    send: async (mode: Mode, d: Data) => { console.log("send", mode, d); /* TODO */ },
    verify: async (mode: Mode, email: string, code: string) => { console.log("verify", mode, email, code); /* TODO */ },`,
  supabase: `    send: async (mode: Mode, d: Data) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: d.email,
        options: {
          shouldCreateUser: mode === "signup",
          data: mode === "signup" ? { name: d.name } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    },
    verify: async (_m: Mode, email: string, code: string) => {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
      if (error) throw error;
      window.location.href = "/";
    },`,
  "next-auth": `    send: async (_m: Mode, d: Data) => {
      // Needs an Email provider (id "email" in next-auth v4) configured on the server.
      const res = await signIn("email", { email: d.email, redirect: false, callbackUrl: "/" });
      if (res?.error) throw new Error("Could not send the email.");
    },
    verify: async (_m: Mode, email: string, code: string) => {
      // Needs a custom generateVerificationToken on the Email provider that returns a 6-digit code.
      window.location.href = "/api/auth/callback/email?email=" + encodeURIComponent(email) + "&token=" + encodeURIComponent(code) + "&callbackUrl=%2F";
    },`,
  clerk: `    send: async (mode: Mode, d: Data) => {
      if (mode === "login") {
        const r = await signIn!.create({ identifier: d.email });
        const f = r.supportedFirstFactors?.find((x) => x.strategy === "email_code") as unknown as { emailAddressId: string } | undefined;
        if (!f) throw new Error("Email code sign-in is not enabled for this account.");
        await signIn!.prepareFirstFactor({ strategy: "email_code", emailAddressId: f.emailAddressId });
      } else {
        await signUp!.create({ emailAddress: d.email, firstName: d.name });
        await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      }
    },
    verify: async (mode: Mode, _e: string, code: string) => {
      if (mode === "login") {
        const r = await signIn!.attemptFirstFactor({ strategy: "email_code", code });
        if (r.status !== "complete") throw new Error("Additional verification required.");
        await setSignInActive!({ session: r.createdSessionId });
      } else {
        const r = await signUp!.attemptEmailAddressVerification({ code });
        if (r.status !== "complete") throw new Error("Additional sign-up steps required.");
        await setSignUpActive!({ session: r.createdSessionId });
      }
      window.location.href = "/";
    },`,
};
hooks.hook = hooks.hook.replace(/\n  \};\n\}$/, () => "\n" + (pw ? stub : extras[auth]) + "\n  };\n}");
if (!hooks.hook.includes("send:")) fail("Internal error: could not attach auth handlers.");

// ---- render template
const here = path.dirname(fileURLToPath(import.meta.url));
const rep = (t, k, v) => t.split(`__${k}__`).join(v);
let src = fs.readFileSync(path.join(here, "..", "templates", "authica.tsx.tpl"), "utf8");
src = src.replace("__DIRECTIVE__", () => (isNext ? '"use client";\n\n' : ""))
  .replace("__AUTH_IMPORTS__", () => hooks.imports)
  .replace("__AUTH_HOOK__", () => hooks.hook);
for (const [k, v] of Object.entries({ ...map, LAYOUT: layout, STYLE: style, METHOD: method, SHOW_NAME: String(showName), CONFIRM: String(confirmPw), PROVIDERS: JSON.stringify(providers), HERO: JSON.stringify(hero) })) src = rep(src, k, v);
if (/__[A-Z]+__/.test(src)) fail("Unresolved template placeholder (internal error).");

// ---- target path
let target;
if (isNext) {
  const base = ["app", "src/app"].find(ex);
  target = base ? `${base}/(auth)/login/page.tsx` : `${["pages", "src/pages"].find(ex) || fail("No app/ or pages/ directory found.")}/login.tsx`;
} else target = "src/routes/login.tsx";
if (ex(target) && !flag("force")) fail(`${target} already exists. Use --force to overwrite.`);
fs.mkdirSync(path.dirname(p(target)), { recursive: true });
fs.writeFileSync(p(target), src);
created.push(target);

// ---- vite route injection
if (isVite) {
  const detected = ["src/main.tsx", "src/App.tsx"].find((f) => ex(f) && /<Routes[\s>]|create\w*Router\(\s*\[/.test(fs.readFileSync(p(f), "utf8"))) || "src/App.tsx";
  const entry = opt("entry", "") || (await ask("File that defines your routes?", detected));
  const file = ex(entry) && /<Routes[\s>]|create\w*Router\(\s*\[/.test(fs.readFileSync(p(entry), "utf8")) ? entry : null;
  const manual = () => steps.push(`Add a /login route in your router: import authica from "./routes/login"; { path: "/login", element: <authica /> }`);
  if (!file) manual();
  else {
    let c = fs.readFileSync(p(file), "utf8");
    if (c.includes("authica")) modified.push(`${file} (already wired)`);
    else {
      let rel = path.posix.relative(path.posix.dirname(file), "src/routes/login");
      if (!rel.startsWith(".")) rel = "./" + rel;
      if (/<Routes[\s>]/.test(c)) c = c.replace(/<Routes(\s[^>]*)?>/, (m) => `${m}\n        <Route path="/login" element={<authica />} />`);
      else c = c.replace(/(create\w*Router\(\s*\[)/, `$1\n  { path: "/login", element: <authica /> },`);
      let end = 0;
      for (const m of c.matchAll(/^import\s[^;]*?['"][^'"]+['"];?[ \t]*$/gm)) end = Math.max(end, m.index + m[0].length);
      const imp = `import authica from "${rel}";`;
      c = end ? c.slice(0, end) + "\n" + imp + c.slice(end) : imp + "\n" + c;
      const dirty = spawnSync("git", ["status", "--porcelain", "--", file], { cwd, encoding: "utf8" });
      if (dirty.status === 0 && dirty.stdout.trim()) console.warn(`⚠ ${file} has uncommitted changes.`);
      if (!ex(file + ".bak")) fs.copyFileSync(p(file), p(file + ".bak"));
      fs.writeFileSync(p(file), c);
      modified.push(`${file} (+/login route, backup ${file}.bak)`);
    }
  }
}

// ---- provider notices / Clerk SSO callback route
if (providers.length) {
  if (auth === "clerk") {
    const pkgName = isNext ? "@clerk/nextjs" : "@clerk/react";
    const cb = `${isNext ? '"use client";\n\n' : ""}import { AuthenticateWithRedirectCallback } from "${pkgName}";\n\nexport default function SSOCallback() {\n  return <AuthenticateWithRedirectCallback />;\n}\n`;
    let cbTarget;
    if (isNext) {
      const appBase = ["app", "src/app"].find(ex);
      cbTarget = appBase ? `${appBase}/sso-callback/page.tsx` : `${["pages", "src/pages"].find(ex)}/sso-callback.tsx`;
    } else cbTarget = "src/routes/sso-callback.tsx";
    if (!ex(cbTarget) || flag("force")) {
      fs.mkdirSync(path.dirname(p(cbTarget)), { recursive: true });
      fs.writeFileSync(p(cbTarget), cb);
      created.push(cbTarget);
      extraRoutes.push(isVite ? "/sso-callback (route to add)" : "/sso-callback");
    }
    steps.push(`Clerk dashboard: enable ${providers.join(", ")} under Social connections.`);
    if (isVite) steps.push(`Add a /sso-callback route: import SSOCallback from "./routes/sso-callback"; { path: "/sso-callback", element: <SSOCallback /> }`);
  } else if (auth === "next-auth") {
    steps.push(`next-auth config: add providers ${providers.join(", ")} (ids must match).`);
  } else if (auth === "supabase") {
    steps.push(`Supabase dashboard: enable ${providers.join(", ")} under Authentication → Providers.`);
  }
}
if (method === "otp" && auth === "supabase") steps.push("Supabase email templates: include {{ .Token }} so users receive the 6-digit code.");
if (method !== "password" && auth === "next-auth") steps.push('next-auth: add an Email provider (id "email")' + (method === "otp" ? " with generateVerificationToken returning 6 digits." : "."));

// ---- dependencies
const need = ["framer-motion", ...hooks.pkgs].filter((d) => !deps[d]);
if (need.length && !flag("no-install")) {
  const pm = ex("pnpm-lock.yaml") ? "pnpm" : ex("yarn.lock") ? "yarn" : ex("bun.lockb") || ex("bun.lock") ? "bun" : "npm";
  console.log(`Installing ${need.join(", ")} with ${pm}…`);
  const r = spawnSync(pm, [pm === "npm" ? "install" : "add", ...need], { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) steps.unshift(`Install failed — run: ${pm} ${pm === "npm" ? "install" : "add"} ${need.join(" ")}`);
} else if (need.length) steps.unshift(`Install: npm install ${need.join(" ")}`);
rl?.close();

// ---- summary box
const pre = isNext ? "NEXT_PUBLIC_" : "VITE_";
const envVars = {
  none: [],
  supabase: [pre + "SUPABASE_URL", pre + "SUPABASE_ANON_KEY"],
  clerk: isNext ? ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] : ["VITE_CLERK_PUBLISHABLE_KEY"],
  "next-auth": ["NEXTAUTH_URL", "NEXTAUTH_SECRET"],
}[auth];
const next = [...steps];
if (envVars.length) next.splice(next.findIndex((x) => !x.startsWith("Install")) < 0 ? next.length : next.findIndex((x) => !x.startsWith("Install")), 0, `Add to ${isNext ? ".env.local" : ".env"}: ${envVars.join(", ")}`);
if (auth === "clerk") next.push(`Wrap your app in <ClerkProvider publishableKey={...}>.`);
if (auth === "next-auth") next.push("OAuth client ID/secret for each provider go in your NextAuth config.");
if (layout === "modal") next.push('Modal: use as the /login route, or render <authica trigger="Sign in" /> (props: open, onClose, trigger).');
next.push("Start your dev server and open /login.");
const routes = ["/login", ...extraRoutes];
const rows = [
  ["Routes", routes.join(", ")],
  ["Auth", auth === "none" ? "none (UI only; wire your backend)" : auth],
  ["Providers", providers.length ? providers.join(", ") : "none"],
  ["Layout", `${layout} · ${style}`],
  ["Sign-in", { password: "password", otp: "6-digit code (OTP)", magic: "magic link" }[method]],
  ...(themeNote ? [["Theme", themeNote]] : []),
  ...(rcNote ? [["Config", rcNote]] : []),
  ...created.map((x, i) => [i ? "" : "Created", x]),
  ...modified.map((x, i) => [i ? "" : "Modified", x]),
];
const W = Math.max(40, Math.min((process.stdout.columns || 80) - 2, 78)), inner = W - 4;
const wrap = (prefix, text, ind) => {
  const out = []; let cur = prefix;
  for (const w of text.split(" ")) {
    const sep = cur.trim() === "" || cur === prefix ? "" : " ";
    if (cur.trim() !== "" && cur.length > ind && (cur + sep + w).length > inner) { out.push(cur); cur = " ".repeat(ind) + w; }
    else cur += sep + w;
  }
  out.push(cur);
  return out;
};
const body = [];
for (const [k, v] of rows) body.push(...wrap(k.padEnd(11), v, 11));
body.push("");
body.push("Next steps");
next.forEach((x, i) => body.push(...wrap(`${i + 1}. `, x, 3)));
const title = " authica ✔ ";
console.log("\n╭" + title + "─".repeat(W - 2 - title.length) + "╮");
for (const l of body) console.log("│ " + l.padEnd(inner) + " │");
console.log("╰" + "─".repeat(W - 2) + "╯");
