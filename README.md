<div align="center">

# ⚡authica 🔏

**Zero-config CLI that inspects your design tokens and injects polished, animated authentication routes into React & Next.js apps in seconds.**

[![npm version](https://img.shields.io/npm/v/authica?style=for-the-badge&color=8B5CF6&labelColor=0F172A)](https://www.npmjs.com/package/authica)
[![npm total downloads](https://img.shields.io/npm/dt/authica?style=for-the-badge&color=3B82F6&labelColor=0F172A)](https://www.npmjs.com/package/authica)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981.svg?style=for-the-badge&labelColor=0F172A)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-EC4899.svg?style=for-the-badge&labelColor=0F172A)](http://makeapullrequest.com)

<br />

### npx authica@latest

[✨ Features](https://www.google.com/search?q=%23-features) • [🚀 Quickstart](https://www.google.com/search?q=%23-quickstart) • [🎨 Styles & Layouts](https://www.google.com/search?q=%23-styles--layouts) • [🔌 Auth Providers](https://www.google.com/search?q=%23-auth-providers) • [⚙️ Configuration](https://www.google.com/search?q=%23%25EF%25B8%258F-configuration)
</div>

## 📸 Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ authica v2.0.0                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ? Global CSS path? (src/index.css)                                         │
│  ✔ Theme read from src/index.css (13 tokens)                               │
│  ? Layout: split, centered, canvas, modal, or glass? (split)                │
│  ? Style preset: default, brutalist, or glassmorphism? (default)            │
│  ? Auth provider: none, supabase, next-auth, or clerk? (supabase)           │
│  ? Select OAuth providers: Google, GitHub, Apple                            │
│                                                                             │
│  ✔ Created src/routes/login.tsx                                             │
│  ✔ Wired /login into src/main.tsx                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
``` 



## ✨ Features

* **🎨 Auto Theme Scanning:** Automatically parses `:root` HSL, RGB, and OKLCH CSS variables from your `globals.css` or `index.css`.
* **🚀 Zero-Config Route Injection:** Safely creates routes and injects imports into Next.js App/Pages Router or Vite (`react-router-dom`) with automatic `.bak` safety backups.
* **🛡️ Pluggable Backend Handlers:** Generates pre-typed hooks for **Supabase**, **Clerk**, **Next-Auth**, or **Custom APIs**.
* **⚡ Zero Tailwind Lock-in:** Includes self-contained CSS fallbacks so animated cards look hyper-polished even without pre-configured Tailwind directives.
* **🎨 5 Layout Frameworks:** Choose between `split`, `centered`, `canvas`, `modal`, and `glass`.
* **✨ 3 Aesthetic Presets:** Toggle between `default` (Shadcn-esque), `brutalist` (hard shadows, 2px borders), and `glassmorphism` (frosted blur).
* **🔑 Pure Inline SVG OAuth:** Built-in crisp vector logos for **Google**, **GitHub**, **Apple**, **Discord**, and **Facebook**—no extra icon packages required.
* **🧪 Opt-in tooling:** AST route insertion with regex fallback, an advisory token-storage scan, Next.js middleware starters, and an isolated local preview studio.



## 🚀 Quickstart

Run `authica` inside the root directory of any existing React or Next.js project:

 
>npx authica

 
---
### Non-Interactive One-Liner
---
Skip prompts by passing flags directly:

 
>npx authica --layout=split --style=brutalist --auth=supabase --providers=google,github --yes

--- 



## 🎨 Styles & Layouts

| Layout | Description |
|---|---|
| `split` | Modern two-column hero layout with animated side-swapping cards on tab toggle. |
| `centered` | Clean, floating authentication card focused on high conversion and low cognitive load. |
| `canvas` | Full-screen interactive gradient canvas background with a centered glass form. |
| `modal` | Triggerable overlay dialog with `backdrop-filter` background blurring. |
| `glass` | Standalone translucent frosted card with glowing neon border accents. |

---

| Preset | Visual Vibe |
|---|---|
| `default` | Neutral, high-contrast, subtle borders, and soft shadows (Shadcn aesthetic). |
| `brutalist` | Bold 2px dark borders, hard 4px offset drop-shadows, yellow active accents, and monospaced typography. |
| `glassmorphism` | Ultra-frosted blur backdrop (`backdrop-blur-xl`) over glowing radial background meshes. |

---

## 🔌 Auth Providers

| Backend | Flag | Features Handled |
|---|---|---|
| **None / Custom** | `--auth=none` | Pure unopinionated state & submit payload handlers. |
| **Supabase** | `--auth=supabase` | `@supabase/supabase-js` client initialization, `signInWithPassword`, `signUp`, and OAuth redirects. |
| **Clerk** | `--auth=clerk` | `@clerk/react` or `@clerk/nextjs` hooks, auto-created `/sso-callback` redirect route. |
| **Next-Auth** | `--auth=next-auth` | `signIn("credentials")` and provider mapping for Auth.js. |
| **WebAuthn starter** | `--auth=webauthn` | Adds passkey sign-in/registration browser calls; requires your own verified server endpoints and credential storage. |

### Opt-in developer tools

These features do not change the default `npx authica` generation path:

```sh
npx authica --ast-inject --yes
npx authica --auth=clerk --middleware --yes
npx authica --scan-security --yes
npx authica audit
npx authica preview
```

* `--ast-inject` enables Recast/Babel route edits for Vite + React Router. If parsing fails, Authica tries its legacy injector; if it cannot place the route safely, it prints manual steps and leaves the router untouched. Next.js uses file-system routes, so there is no entry file to edit.
* `--middleware` is Next.js-only and requires `--auth=supabase`, `--auth=clerk`, or `--auth=next-auth`. It protects `/dashboard`; existing middleware is backed up when `--force` is used. Supabase middleware also needs `@supabase/ssr`; NextAuth config should set `pages.signIn` to `/login` too.
* `--scan-security` and `authica audit` perform a read-only heuristic scan for likely auth-token writes to `localStorage`. Findings are advisory and may be incomplete.
* `--auth=webauthn` installs `@simplewebauthn/browser` in the target app unless `--no-install` is passed. Implement POST `/api/generate-options` and `/api/verify` on the server, including per-session challenge storage, origin/RP validation, credential persistence, and mode-aware registration/authentication verification. This starter is not a complete authentication backend and does not configure OAuth.
* `authica preview` serves a local-only visual preview at `http://localhost:4321`; it does not install dependencies or write to the project.

The CLI also accepts the existing `--layout`, `--style`, `--auth`, `--providers`, `--css`, and `--yes` options in non-interactive use. The Web Studio reference is [authica.dev](https://authica.dev).


## ⚙️ Configuration (`.authicarc`)

Teams can enforce brand consistency across repositories by placing an `.authicarc` or `.authicarc.` file in the project root:

```
{
  "auth": "supabase",
  "layout": "split",
  "style": "default",
  "providers": ["google", "github"],
  "css": "src/index.css",
  "name": true,
  "confirm": true
}
```
 

> **Precedence Order:** Command-line flags > `.authicarc` config file > Interactive CLI prompts.



## 📄 License

Distributed under the MIT License. See [`LICENSE`](https://www.google.com/search?q=./LICENSE) for more information.

Made with ❤️ by [Sachin Mehta](https://github.com/AEGON247)

[★ Star on GitHub](https://www.google.com/search?q=https://github.com/AEGON247/authica)
