import fs from "node:fs";
import path from "node:path";
import babelParser from "@babel/parser";
import recast from "recast";
import recastBabelTsParser from "recast/parsers/babel-ts.js";

const traverse = (node, visit) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) traverse(item, visit);
    return;
  }
  if (typeof node.type === "string") visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key !== "loc" && key !== "tokens" && key !== "comments" && key !== "extra") traverse(value, visit);
  }
};

export function insertViteRoute(source, importPath, routerPackage = "react-router-dom") {
  const ast = recast.parse(source, { parser: recastBabelTsParser });
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1);
  const offset = (position) => lineStarts[position.line - 1] + position.column;
  let routeContainer = null;
  let routeKind = "";
  let hasLogin = false;
  let hasRouteImport = false;

  traverse(ast, (node) => {
    if (node.type === "ImportDeclaration" && node.source.value === routerPackage) {
      hasRouteImport ||= node.specifiers.some((specifier) =>
        specifier.type === "ImportSpecifier" &&
        (specifier.imported.name ?? specifier.imported.value) === "Route" &&
        specifier.local.name === "Route",
      );
    }
    if (node.type === "JSXElement" && node.openingElement.name.type === "JSXIdentifier") {
      if (node.openingElement.name.name === "Route") {
        const pathAttr = node.openingElement.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === "path");
        if (pathAttr?.value?.value === "/login") hasLogin = true;
      }
      if (node.openingElement.name.name === "Routes") {
        routeContainer = node;
        routeKind = "jsx";
      }
    }
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && /create(?:Browser|Hash|Memory)Router/.test(node.callee.name)) {
      if (node.arguments[0]?.type === "ArrayExpression" && !routeContainer) {
        routeContainer = node.arguments[0];
        routeKind = "object";
      }
    }
  });

  if (!routeContainer) throw new Error("No supported <Routes> or create*Router([...]) route container found.");
  if (routeKind === "object") {
    hasLogin = routeContainer.elements.some((entry) => entry.type === "ObjectExpression" &&
      entry.properties.some((property) => property.type === "ObjectProperty" &&
        (property.key.name ?? property.key.value) === "path" &&
        property.value.type === "StringLiteral" && property.value.value === "/login"));
  }
  if (hasLogin) return { code: source, alreadyWired: true };

  const edits = [];
  let routeSnippet;
  if (routeKind === "jsx") {
    routeSnippet = '<Route path="/login" element={<Authica />} />';
    if (routeContainer.openingElement.selfClosing) {
      const openingEnd = offset(routeContainer.openingElement.loc.end);
      edits.push({
        start: openingEnd - 2,
        end: openingEnd,
        text: `>${routeSnippet}</${routeContainer.openingElement.name.name}>`,
      });
    } else {
      const closeStart = offset(routeContainer.closingElement.loc.start);
      const lineStart = source.lastIndexOf("\n", closeStart) + 1;
      const closeIndent = source.slice(lineStart, closeStart);
      if (closeIndent.trim() === "") {
        edits.push({ start: lineStart, end: lineStart, text: `${closeIndent}  ${routeSnippet}\n` });
      } else {
        const openLineStart = source.lastIndexOf("\n", routeContainer.openingElement.start) + 1;
        const indent = source.slice(openLineStart, routeContainer.openingElement.start).match(/^[\t ]*/)?.[0] ?? "";
        edits.push({ start: closeStart, end: closeStart, text: `\n${indent}  ${routeSnippet}\n${indent}` });
      }
    }
  } else {
    routeSnippet = '{ path: "/login", element: <Authica /> }';
    const close = offset(routeContainer.loc.end) - 1;
    if (routeContainer.elements.length) {
      const last = routeContainer.elements.at(-1);
      const lastStart = offset(last.loc.start);
      const lastEnd = offset(last.loc.end);
      const lastLineStart = source.lastIndexOf("\n", lastStart) + 1;
      const indent = source.slice(lastLineStart, lastStart).match(/^[\t ]*/)?.[0] ?? "  ";
      const comma = source.indexOf(",", lastEnd);
      if (comma >= 0 && comma < close) {
        edits.push({ start: comma + 1, end: comma + 1, text: `\n${indent}${routeSnippet},` });
      } else {
        edits.push({ start: lastEnd, end: lastEnd, text: `,\n${indent}${routeSnippet}` });
      }
    } else {
      const open = offset(routeContainer.loc.start);
      const lineStart = source.lastIndexOf("\n", open) + 1;
      const baseIndent = source.slice(lineStart, open).match(/^[\t ]*/)?.[0] ?? "";
      edits.push({ start: open + 1, end: open + 1, text: `\n${baseIndent}  ${routeSnippet}\n${baseIndent}` });
    }
  }

  const lastImport = [...ast.program.body].reverse().find((node) => node.type === "ImportDeclaration");
  const importPos = lastImport ? offset(lastImport.loc.end) : 0;
  const importText = `${lastImport ? "\n" : ""}import Authica from ${JSON.stringify(importPath)};${routeKind === "jsx" && !hasRouteImport ? `\nimport { Route } from "${routerPackage}";` : ""}\n`;
  edits.push({ start: importPos, end: importPos, text: importText });
  let code = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  }
  return { code, alreadyWired: false };
}

const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const ignoredDirectories = new Set([
  "node_modules", ".git", ".next", ".turbo", ".vercel", ".cache", "dist", "build", "out", "coverage",
  "vendor", "storybook-static", "test-results", "playwright-report",
]);
const tokenKey = /(?:token|auth|session|jwt|access|refresh)/i;

function sourceFiles(root) {
  const found = [];
  const errors = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      errors.push(`${path.relative(root, dir) || "."}: ${error.message}`);
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) walk(path.join(dir, entry.name));
      } else if (sourceExtensions.has(path.extname(entry.name))) {
        found.push(path.join(dir, entry.name));
      }
    }
  };
  walk(root);
  return { files: found, errors };
}

export function scanLocalStorage(root) {
  const findings = [];
  const { files, errors } = sourceFiles(root);
  for (const file of files) {
    let ast;
    try {
      ast = babelParser.parse(fs.readFileSync(file, "utf8"), {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript", "decorators-legacy", "importAttributes"],
      });
    } catch (error) {
      errors.push(`${path.relative(root, file)}: ${error.message}`);
      continue;
    }
    traverse(ast, (node) => {
      if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return;
      const { object, property, computed } = node.callee;
      const member = computed ? node.callee.property.value : property.name;
      if (object.type !== "Identifier" || object.name !== "localStorage" || member !== "setItem") return;
      const key = node.arguments[0];
      if (key && (key.type === "StringLiteral" || key.type === "TemplateLiteral") && tokenKey.test(key.value ?? key.quasis?.[0]?.value?.cooked ?? "")) {
        findings.push({ file: path.relative(root, file), line: node.loc?.start.line ?? 1, key: key.value ?? key.quasis[0].value.cooked });
      }
    });
  }
  return { findings, errors };
}

export function printAudit(root) {
  const { findings, errors } = scanLocalStorage(root);
  console.log("\nAuthica advisory security scan (read-only)");
  if (!findings.length) console.log("No likely auth-token localStorage writes found.");
  for (const finding of findings) {
    console.warn(`⚠ ${finding.file}:${finding.line} stores "${finding.key}" in localStorage. Consider a server-managed, httpOnly cookie where appropriate.`);
  }
  if (errors.length) {
    console.warn(`Skipped ${errors.length} file(s) or directories that could not be read or parsed; findings may be incomplete.`);
    for (const error of errors.slice(0, 10)) console.warn(`  ${error}`);
    if (errors.length > 10) console.warn(`  ...and ${errors.length - 10} more.`);
  }
  console.log("This heuristic scan is advisory and does not prove a vulnerability or guarantee coverage.");
  return findings.length;
}
