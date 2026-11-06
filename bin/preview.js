import http from "node:http";

const port = 4321;
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authica preview studio</title>
<style>
*{box-sizing:border-box}body{margin:0;font:15px system-ui,sans-serif;background:#09090f;color:#f8fafc}
header{padding:24px 5vw;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #272735}
header a{color:#c4b5fd}main{padding:32px 5vw}h1{margin-top:0}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}
button{border:1px solid #454558;background:#171722;color:inherit;padding:9px 13px;border-radius:8px;cursor:pointer}
button[aria-pressed=true]{border-color:#a78bfa;background:#30234d}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
.sample{min-height:320px;padding:24px;display:grid;place-items:center;border:1px solid #30303e;border-radius:14px;overflow:hidden}
.card{width:min(100%,260px);background:#fff;color:#161621;border-radius:14px;padding:22px;box-shadow:0 12px 40px #0005}
.card h2{margin:0 0 16px}.field{height:35px;border:1px solid #ddd;border-radius:7px;margin:10px 0}
.submit{height:36px;border-radius:99px;background:#6456e8;margin-top:16px}.split{background:linear-gradient(110deg,#3b2b76 0 50%,#171722 50%)}.canvas{background:radial-gradient(circle at 30% 20%,#7458db,#121222 70%)}
.modal{background:#242433;box-shadow:inset 0 0 0 999px #0005}.glass{background:linear-gradient(135deg,#25204b,#112e38)}.glass .card{background:#ffffff20;color:white;border:1px solid #ffffff50;backdrop-filter:blur(16px)}
.brutalist .card{border:3px solid #111;border-radius:0;box-shadow:6px 6px #000}.brutalist .submit{border-radius:0;background:#ffe14d}
.glassmorphism .card{background:#ffffff20;color:white;border:1px solid #ffffff50;backdrop-filter:blur(16px)}
.sample label{align-self:end;font-size:13px;color:#ddd}
</style>
</head>
<body>
<header><strong>⚡ authica preview studio</strong><a href="https://authica.dev" rel="noreferrer">authica.dev</a></header>
<main><h1>Explore layouts & styles</h1><p>Local-only visual previews. Nothing is written to your project.</p>
<div class="controls" id="styles"><button data-style="default" aria-pressed="true">Default</button><button data-style="brutalist" aria-pressed="false">Brutalist</button><button data-style="glassmorphism" aria-pressed="false">Glassmorphism</button></div>
<section class="grid" id="layouts"></section></main>
<script>
const layouts=["split","centered","canvas","modal","glass"], grid=document.querySelector("#layouts");
function render(style){grid.innerHTML=layouts.map(name=>'<article class="sample '+name+' '+style+'"><div class="card"><h2>Welcome back</h2><div class="field"></div><div class="field"></div><div class="submit"></div></div><label>'+name+'</label></article>').join("");}
document.querySelector("#styles").addEventListener("click",event=>{const button=event.target.closest("button");if(!button)return;document.querySelectorAll("#styles button").forEach(item=>item.setAttribute("aria-pressed",String(item===button)));render(button.dataset.style);});render("default");
</script>
</body></html>`;

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
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
