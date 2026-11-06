import http from "node:http";
import { spawn } from "node:child_process";

const port = 4321;
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Authica · Visual Studio</title>
<style>
:root{color-scheme:dark;--bg:#0B0B0E;--canvas:#0B0B0E;--panel:#13131A;--border:#22222E;--accent:#8B5CF6;--accent-soft:#8B5CF626;--text:#F4F2FA;--muted:#92909F;--card:#181820;--field:#101016}
*{box-sizing:border-box}body{margin:0;min-width:320px;background:var(--canvas);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button,input{font:inherit}button{color:inherit}.app{min-height:100vh;display:grid;grid-template-columns:248px minmax(0,1fr) 250px}
.sidebar,.inspector{background:var(--panel);border-color:var(--border);min-height:100vh}.sidebar{border-right:1px solid var(--border);padding:22px 14px;position:sticky;top:0;height:100vh;overflow:auto}.inspector{border-left:1px solid var(--border);padding:22px 16px}
.brand{display:flex;align-items:center;gap:10px;padding:0 8px 22px;font-weight:700;font-size:15px}.brand-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:linear-gradient(145deg,#a78bfa,var(--accent));box-shadow:0 0 24px #8b5cf644}
.brand small{display:block;color:var(--muted);font-size:11px;font-weight:500}.search{width:100%;height:38px;border:1px solid var(--border);border-radius:11px;background:#0d0d13;color:var(--text);padding:0 11px;outline:none;margin-bottom:24px}.search:focus{border-color:var(--accent)}
.section{margin:0 0 22px}.section-title,.panel-title{margin:0 8px 9px;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
.nav-list{display:grid;gap:4px}.nav-item{width:100%;border:1px solid transparent;border-radius:999px;background:transparent;padding:8px 11px;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;color:#bbb9c7;transition:background .16s,border-color .16s,color .16s}
.nav-item:hover{background:#ffffff08;color:var(--text)}.nav-item[aria-pressed=true]{color:#e5d9ff;background:var(--accent-soft);border-color:#8b5cf640}.nav-icon{width:19px;text-align:center;color:#a6a2b3}.nav-item[aria-pressed=true] .nav-icon{color:#c4aaff}
.main{min-width:0;padding:24px clamp(18px,3vw,42px) 36px}.topbar{display:flex;align-items:center;gap:10px;border:1px solid var(--border);background:#121219;border-radius:14px;padding:8px 9px 8px 14px;box-shadow:0 8px 32px #0002}
.command{flex:1;min-width:0;overflow:auto;color:#d5c6ff;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap}.prompt{color:#8f8c9a;margin-right:8px}
.copy{flex:none;border:1px solid #8b5cf64d;border-radius:9px;background:#8b5cf61a;padding:7px 11px;color:#d7c8ff;font-size:12px;cursor:pointer}.copy:hover{background:#8b5cf633}
.intro{display:flex;justify-content:space-between;align-items:end;gap:18px;margin:30px 0 17px}.eyebrow{color:#b79aff;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.intro h1{margin:5px 0 3px;font-size:25px;letter-spacing:-.04em}.intro p{margin:0;color:var(--muted);font-size:13px}
.preview-label{color:var(--muted);font-size:11px}.viewport{min-height:520px;position:relative;display:grid;place-items:center;overflow:hidden;border:1px solid var(--border);border-radius:18px;background:radial-gradient(ellipse at 50% 45%,#171521,#0d0d12 70%);box-shadow:0 24px 80px #0004}
.viewport::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.28;background-image:radial-gradient(#777084 0.6px,transparent 0.6px);background-size:22px 22px}
.mock{position:relative;z-index:1;width:min(760px,88%);min-height:400px;display:flex;overflow:hidden;border:1px solid #ffffff24;border-radius:20px;background:var(--card);box-shadow:0 24px 80px #0008;transition:all .22s}
.mock.centered,.mock.canvas,.mock.modal,.mock.glass{width:min(410px,88%);min-height:0}.mock.canvas{background:radial-gradient(ellipse at 80% 0%,#8b5cf644,#17151f 65%)}.mock.modal{border-radius:14px;box-shadow:0 30px 90px #000b,0 0 0 999px #0002}.mock.glass{background:linear-gradient(145deg,#211a35,#111721);box-shadow:0 0 55px #8b5cf622}
.hero{display:none;position:relative;flex:1;background:linear-gradient(145deg,#5036a0,#241c41 58%,#17171f);padding:26px}.mock.split .hero{display:flex;flex-direction:column;justify-content:space-between}
.hero-chip{width:max-content;border:1px solid #ffffff30;background:#ffffff12;border-radius:999px;padding:6px 10px;color:#e9ddff;font-size:10px}.hero h2{max-width:230px;margin:0;font-size:27px;line-height:1.15;letter-spacing:-.04em}.hero p{margin:8px 0 0;color:#d4cae8;font-size:12px}
.form{width:100%;padding:clamp(22px,4vw,36px);display:flex;flex-direction:column;justify-content:center}.mock.split .form{width:50%}.form-brand{color:#c3aaff;font-size:11px;font-weight:700;letter-spacing:.08em}.form h2{margin:12px 0 3px;font-size:23px;letter-spacing:-.04em}.form .hint{margin:0 0 20px;color:#9c99a8;font-size:12px}
.field-label{font-size:10px;color:#c1becc;margin:10px 0 5px}.field{height:38px;border:1px solid #353441;border-radius:9px;background:var(--field);padding:0 11px;color:#d0ced8;font-size:11px;display:flex;align-items:center}.mock.glass .field{background:#ffffff0b}
.submit{height:39px;margin-top:16px;border:0;border-radius:999px;background:var(--accent);color:white;font-weight:650;font-size:11px;box-shadow:0 5px 22px #8b5cf644}
.mock.brutalist{border:3px solid #f4f2fa;border-radius:3px;box-shadow:7px 7px 0 #000}.mock.brutalist .submit{border-radius:4px;background:#facc15;color:#17130a;box-shadow:none}.mock.glassmorphism{background:linear-gradient(145deg,#8b5cf633,#111721dd);border-color:#ffffff30;backdrop-filter:blur(16px)}.mock.glassmorphism .form{background:#ffffff08}
.divider{display:flex;align-items:center;gap:9px;color:#777482;font-size:9px;margin:17px 0 10px}.divider::before,.divider::after{content:"";height:1px;flex:1;background:#34323f}
.social{display:flex;gap:8px}.social span{height:34px;flex:1;display:grid;place-items:center;border:1px solid #353441;border-radius:9px;color:#c7c4d0;font-size:10px}
.inspector-heading{padding:1px 5px 20px}.inspector-heading h2{font-size:14px;margin:0 0 3px}.inspector-heading p{font-size:11px;color:var(--muted);margin:0}
.panel{border-top:1px solid var(--border);padding:17px 3px}.panel-title{margin:0 0 12px}.swatches{display:grid;gap:9px}.swatch-row{display:flex;align-items:center;justify-content:space-between;color:#c1becc;font-size:11px}.swatch-value{display:flex;align-items:center;gap:7px;color:var(--muted);font:10px ui-monospace,monospace}
.color-input{appearance:none;width:20px;height:20px;border:1px solid #ffffff30;border-radius:7px;padding:0;background:transparent;overflow:hidden;cursor:pointer}.color-input::-webkit-color-swatch-wrapper{padding:0}.color-input::-webkit-color-swatch{border:0;border-radius:6px}
.providers{display:grid;gap:7px}.provider{width:100%;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);border-radius:10px;background:#0f0f15;padding:9px 10px;cursor:pointer;color:#c4c1ce;font-size:11px}.provider[aria-pressed=true]{border-color:#8b5cf655;background:#8b5cf610;color:#e2d7ff}
.switch{width:27px;height:16px;border-radius:999px;background:#34323e;padding:2px;transition:background .15s}.switch::after{content:"";display:block;width:12px;height:12px;border-radius:50%;background:#a09dab;transition:transform .15s}.provider[aria-pressed=true] .switch{background:var(--accent)}.provider[aria-pressed=true] .switch::after{transform:translateX(11px);background:white}
.empty{display:none;color:var(--muted);padding:8px;font-size:12px}.footer-note{margin-top:20px;color:#777482;font-size:10px;line-height:1.6}
@media(max-width:1050px){.app{grid-template-columns:220px minmax(0,1fr)}.inspector{grid-column:2;min-height:0;border-left:0;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:0 24px}.inspector-heading{grid-column:1/-1}.panel{align-self:start}}
@media(max-width:700px){.app{display:block}.sidebar{position:relative;height:auto;min-height:0;border-right:0;border-bottom:1px solid var(--border);padding:14px}.brand{padding-bottom:12px}.search{margin-bottom:13px}.section{margin-bottom:11px}.nav-list{display:flex;flex-wrap:wrap}.nav-item{width:auto;padding:7px 10px;font-size:12px}.main{padding:20px 14px}.intro{align-items:start;flex-direction:column;margin-top:22px}.viewport{min-height:450px}.mock.split{width:94%;min-height:360px}.mock.split .form{width:58%;padding:18px}.mock.split .hero{padding:18px}.hero h2{font-size:22px}.inspector{display:block;padding:18px 16px}.panel{padding:14px 3px}}
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar" aria-label="Studio navigation">
    <div class="brand"><span class="brand-mark">⚡</span><span>authica <small>VISUAL STUDIO</small></span></div>
    <input id="search" class="search" type="search" placeholder="Search templates…" aria-label="Search templates">
    <section class="section" data-section="layouts">
      <h2 class="section-title">Layout Frameworks</h2>
      <nav class="nav-list" aria-label="Layout Frameworks">
        <button class="nav-item" data-layout="split" aria-pressed="true"><span class="nav-icon">◫</span>Split</button>
        <button class="nav-item" data-layout="centered" aria-pressed="false"><span class="nav-icon">▣</span>Centered</button>
        <button class="nav-item" data-layout="canvas" aria-pressed="false"><span class="nav-icon">▧</span>Canvas</button>
        <button class="nav-item" data-layout="modal" aria-pressed="false"><span class="nav-icon">▢</span>Modal</button>
        <button class="nav-item" data-layout="glass" aria-pressed="false"><span class="nav-icon">✧</span>Glass</button>
      </nav><p class="empty" data-empty="layouts">No layouts match.</p>
    </section>
    <section class="section" data-section="styles">
      <h2 class="section-title">Aesthetic Presets</h2>
      <nav class="nav-list" aria-label="Aesthetic Presets">
        <button class="nav-item" data-style="default" aria-pressed="true"><span class="nav-icon">◌</span>Default</button>
        <button class="nav-item" data-style="brutalist" aria-pressed="false"><span class="nav-icon">▦</span>Brutalist</button>
        <button class="nav-item" data-style="glassmorphism" aria-pressed="false"><span class="nav-icon">◈</span>Glassmorphism</button>
      </nav><p class="empty" data-empty="styles">No presets match.</p>
    </section>
  </aside>
  <main class="main">
    <div class="topbar"><code class="command"><span class="prompt">$</span><span id="command">npx authica --layout=split --style=default</span></code><button class="copy" id="copy" type="button">Copy</button></div>
    <div class="intro"><div><span class="eyebrow">Design your sign-in flow</span><h1>Authentication, styled.</h1><p>Choose a layout and preset. Your CLI command updates as you explore.</p></div><span class="preview-label">LIVE PREVIEW&nbsp; · &nbsp;LOCAL ONLY</span></div>
    <section class="viewport" aria-label="Interactive login preview">
      <div id="mock" class="mock split">
        <div class="hero"><span class="hero-chip">✦ &nbsp; Secure by design</span><div><h2>Welcome to your next chapter.</h2><p>A sign-in experience that feels like your product.</p></div></div>
        <div class="form"><span class="form-brand">AUTHICA</span><h2>Welcome back</h2><p class="hint">Sign in to continue to your account.</p><label class="field-label">Email address</label><div class="field">you@example.com</div><label class="field-label">Password</label><div class="field">••••••••••</div><button class="submit" type="button">Sign in</button><div class="divider">OR CONTINUE WITH</div><div class="social" id="mock-social"><span>G &nbsp; Google</span><span>⌘ &nbsp; GitHub</span></div></div>
      </div>
    </section>
  </main>
  <aside class="inspector" aria-label="Theme and provider settings">
    <div class="inspector-heading"><h2>Quick customize</h2><p>Adjust preview-only options.</p></div>
    <section class="panel"><h3 class="panel-title">CSS theme variables</h3><div class="swatches">
      <label class="swatch-row">Primary accent <span class="swatch-value"><input class="color-input" type="color" data-color="accent" value="#8b5cf6"><code id="accent-value">#8B5CF6</code></span></label>
      <label class="swatch-row">Card surface <span class="swatch-value"><input class="color-input" type="color" data-color="card" value="#181820"><code id="card-value">#181820</code></span></label>
      <label class="swatch-row">Field surface <span class="swatch-value"><input class="color-input" type="color" data-color="field" value="#101016"><code id="field-value">#101016</code></span></label>
      <label class="swatch-row">Canvas <span class="swatch-value"><input class="color-input" type="color" data-color="canvas" value="#0b0b0e"><code id="canvas-value">#0B0B0E</code></span></label>
    </div></section>
    <section class="panel"><h3 class="panel-title">OAuth providers</h3><div class="providers">
      <button class="provider" data-provider="google" aria-pressed="true"><span>Google</span><span class="switch"></span></button>
      <button class="provider" data-provider="github" aria-pressed="true"><span>GitHub</span><span class="switch"></span></button>
      <button class="provider" data-provider="apple" aria-pressed="false"><span>Apple</span><span class="switch"></span></button>
    </div><p class="footer-note">These controls are a visual preview only. Authica does not write project files in Studio.</p></section>
  </aside>
</div>
<script>
(() => {
  const layoutButtons = [...document.querySelectorAll("[data-layout]")];
  const styleButtons = [...document.querySelectorAll("[data-style]")];
  const search = document.querySelector("#search");
  const mock = document.querySelector("#mock");
  const command = document.querySelector("#command");
  const providers = [...document.querySelectorAll("[data-provider]")];
  let layout = "split", style = "default";
  const selectedProviders = new Set(["google", "github"]);
  const upper = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  function update() {
    mock.className = "mock " + layout + (style === "default" ? "" : " " + style);
    document.querySelector(".intro h1").textContent = upper(layout) + " authentication.";
    command.textContent = "npx authica --layout=" + layout + " --style=" + style +
      (selectedProviders.size ? " --providers=" + [...selectedProviders].join(",") : "");
    layoutButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.layout === layout)));
    styleButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.style === style)));
    providers.forEach((button) => button.setAttribute("aria-pressed", String(selectedProviders.has(button.dataset.provider))));
    const social = document.querySelector("#mock-social");
    const names = [...selectedProviders].map(upper);
    social.innerHTML = names.length ? names.map((name) => "<span>" + name + "</span>").join("") : "<span>Email sign-in</span>";
  }
  layoutButtons.forEach((button) => button.addEventListener("click", () => { layout = button.dataset.layout; update(); }));
  styleButtons.forEach((button) => button.addEventListener("click", () => { style = button.dataset.style; update(); }));
  providers.forEach((button) => button.addEventListener("click", () => {
    const name = button.dataset.provider;
    if (selectedProviders.has(name)) selectedProviders.delete(name); else selectedProviders.add(name);
    update();
  }));
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    for (const section of document.querySelectorAll("[data-section]")) {
      const buttons = [...section.querySelectorAll(".nav-item")];
      let visible = 0;
      buttons.forEach((button) => {
        const show = button.textContent.toLowerCase().includes(query);
        button.hidden = !show;
        if (show) visible++;
      });
      section.querySelector(".empty").style.display = visible ? "none" : "block";
      section.querySelector(".section-title").hidden = !visible;
    }
  });
  document.querySelectorAll("[data-color]").forEach((input) => input.addEventListener("input", () => {
    const name = input.dataset.color;
    const value = input.value.toUpperCase();
    document.documentElement.style.setProperty("--" + name, input.value);
    document.querySelector("#" + name + "-value").textContent = value;
  }));
  document.querySelector("#copy").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(command.textContent);
      button.textContent = "Copied!";
      setTimeout(() => { button.textContent = "Copy"; }, 1400);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(command);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Select & copy";
      setTimeout(() => { button.textContent = "Copy"; selection.removeAllRanges(); }, 1800);
    }
  });
  update();
})();
</script>
</body></html>`;

function openBrowser() {
  const url = `http://localhost:${port}`;
  const platform = process.platform;
  const command = platform === "win32" ? "cmd.exe" : platform === "darwin" ? "open" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  const browser = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  browser.on("error", (error) => console.error(`Could not open a browser automatically: ${error.message}`));
  browser.unref();
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" || (request.url !== "/" && request.url !== "/index.html")) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  });
  response.end(page);
});

server.on("error", (error) => {
  console.error(`Could not start Authica preview at http://localhost:${port}: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Authica preview running at http://localhost:${port} (local-only; Ctrl+C to stop).`);
  if (process.argv.includes("--open")) openBrowser();
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
