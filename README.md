<div align="center">

# ⚡ authica

**Zero-config CLI that inspects your design tokens and injects polished, animated authentication routes into React & Next.js apps in seconds.**

[![npm version](https://img.shields.io/npm/v/authica.svg?style=for-the-badge&color=8B5CF6&labelColor=0F172A)](https://www.npmjs.com/package/authica)
[![npm downloads](https://img.shields.io/npm/dm/authica.svg?style=for-the-badge&color=3B82F6&labelColor=0F172A)](https://www.npmjs.com/package/authica)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981.svg?style=for-the-badge&labelColor=0F172A)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-EC4899.svg?style=for-the-badge&labelColor=0F172A)](http://makeapullrequest.com)

<br />

### npx authica@latest

[✨ Features](https://www.google.com/search?q=%23-features) • [🚀 Quickstart](https://www.google.com/search?q=%23-quickstart) • [🎨 Styles & Layouts](https://www.google.com/search?q=%23-styles--layouts) • [🔌 Auth Providers](https://www.google.com/search?q=%23-auth-providers) • [⚙️ Configuration](https://www.google.com/search?q=%23%25EF%25B8%258F-configuration)
</div>

## 📸 Preview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ authica v1.2.0                                                             │
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

