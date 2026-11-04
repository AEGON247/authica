__DIRECTIVE__import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
__AUTH_IMPORTS__
type Mode = "login" | "signup";
type Social = "google" | "github" | "apple" | "discord" | "facebook";
type Method = "password" | "otp" | "magic";
type Data = { name: string; email: string; password: string };

// ---- Generated options (edit freely) ----
const LAYOUT = "__LAYOUT__" as "split" | "centered" | "canvas" | "modal" | "glass";
const STYLE = "__STYLE__" as "default" | "brutalist" | "glassmorphism";
const METHOD = "__METHOD__" as Method;
const PASSWORDLESS = METHOD !== "password";
const RESEND_SECONDS = 30;
const SHOW_NAME = __SHOW_NAME__ as boolean;
const CONFIRM_PASSWORD = __CONFIRM__ as boolean;
const PROVIDERS = __PROVIDERS__ as Social[];
const HERO_IMAGE = __HERO__ as string;

__AUTH_HOOK__

// Self-contained styles: no Tailwind needed. Colors come from your theme variables, with fallbacks.
const CSS = `
.as-root,.as-vars{--as-bg:__BG__;--as-fg:__FG__;--as-card:__CARD__;--as-cardfg:__CARDFG__;--as-primary:__PRIMARY__;--as-primaryfg:__PRIMARYFG__;--as-muted:__MUTED__;--as-border:__BORDER__;--as-danger:__DESTRUCTIVE__;--as-ok:#16a34a}
.as-root{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--as-bg);color:var(--as-fg);box-sizing:border-box}
.as-root *,.as-vars *{box-sizing:border-box}
.as-card{position:relative;display:flex;width:100%;max-width:440px;background:var(--as-card);color:var(--as-cardfg);border:1px solid var(--as-border);border-radius:var(--radius,1rem);overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.15)}
.as-split{max-width:980px;min-height:620px}
.as-canvas,.as-s-glassmorphism,.as-glass{background:radial-gradient(60% 60% at 20% 10%,color-mix(in srgb,var(--as-primary) 55%,transparent),transparent),radial-gradient(50% 50% at 85% 90%,color-mix(in srgb,var(--as-primary) 35%,transparent),transparent),#0b0b12;background-size:cover;background-position:center;color:#fff}
.as-canvas .as-card,.as-s-glassmorphism .as-card,.as-glass .as-card{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.18);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
.as-canvas .as-tabs,.as-s-glassmorphism .as-tabs,.as-glass .as-tabs{background:rgba(255,255,255,.1)}.as-canvas .as-pill,.as-s-glassmorphism .as-pill,.as-glass .as-pill{background:rgba(255,255,255,.22)}
.as-canvas .as-field,.as-canvas .as-sbtn,.as-s-glassmorphism .as-field,.as-glass .as-field,.as-s-glassmorphism .as-sbtn,.as-glass .as-sbtn{border-color:rgba(255,255,255,.25)}
.as-canvas .as-field input::placeholder,.as-s-glassmorphism .as-field input::placeholder,.as-glass .as-field input::placeholder{color:rgba(255,255,255,.55)}
.as-s-glassmorphism .as-card{box-shadow:0 0 0 1px rgba(255,255,255,.12),0 0 90px -10px color-mix(in srgb,var(--as-primary) 65%,transparent)}
.as-s-glassmorphism .as-btn{box-shadow:0 0 24px color-mix(in srgb,var(--as-primary) 70%,transparent)}
.as-glass{background:radial-gradient(40% 40% at 15% 20%,color-mix(in srgb,var(--as-primary) 60%,transparent),transparent),radial-gradient(35% 35% at 85% 15%,rgba(168,85,247,.45),transparent),radial-gradient(40% 40% at 80% 85%,rgba(6,182,212,.4),transparent),radial-gradient(35% 35% at 10% 90%,rgba(236,72,153,.3),transparent),#07070d}
.as-glass .as-card{background:rgba(255,255,255,.05);backdrop-filter:blur(32px) saturate(150%);-webkit-backdrop-filter:blur(32px) saturate(150%);border:1px solid color-mix(in srgb,var(--as-primary) 55%,rgba(255,255,255,.2));box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 0 32px color-mix(in srgb,var(--as-primary) 45%,transparent),0 0 90px -20px color-mix(in srgb,var(--as-primary) 60%,transparent)}
.as-glass .as-btn{box-shadow:0 0 24px color-mix(in srgb,var(--as-primary) 70%,transparent)}
.as-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;background:rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.as-close{position:absolute;top:10px;right:12px;z-index:2;width:32px;height:32px;border:0;border-radius:999px;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer;opacity:.7}.as-close:hover{opacity:1}
.as-trigger{width:auto;padding:10px 20px}
.as-form{flex:1 1 0;min-width:0;padding:40px;display:flex;flex-direction:column;justify-content:center}
.as-hero{flex:1 1 0;display:none;position:relative;overflow:hidden;background:var(--as-primary);background-size:cover;background-position:center;color:var(--as-primaryfg)}
.as-hero.as-img::after{content:"";position:absolute;inset:0;background:linear-gradient(transparent 35%,rgba(0,0,0,.6))}
@media(min-width:860px){.as-split .as-hero{display:block}}
.as-shape{position:absolute;border-radius:32px;background:rgba(255,255,255,.14)}
.as-hcard{position:absolute;z-index:1;background:var(--as-card);color:var(--as-cardfg);border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px}
.as-htext{position:absolute;z-index:1;left:32px;right:32px;bottom:32px}
.as-htext h2{margin:0 0 6px;font-size:26px;font-weight:700}.as-htext p{margin:0;opacity:.85;font-size:14px}
.as-tabs{position:relative;display:flex;background:var(--as-muted);padding:4px;border-radius:10px}
.as-tab{position:relative;z-index:1;flex:1;padding:8px;font:inherit;font-size:14px;font-weight:500;border:0;background:none;color:inherit;cursor:pointer}
.as-pill{position:absolute;inset:0;z-index:-1;border-radius:7px;background:var(--as-bg);box-shadow:0 1px 3px rgba(0,0,0,.2)}
.as-title{font-size:30px;font-weight:700;margin:28px 0 4px}.as-sub{font-size:13px;opacity:.6;margin:0 0 20px}
.as-field{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--as-border);padding:10px 2px;margin-bottom:14px}
.as-field:focus-within{border-color:var(--as-primary)}
.as-field svg{width:18px;height:18px;flex:none;opacity:.5}.as-field svg.as-ok{color:var(--as-ok);opacity:1}
.as-field input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:inherit;font:inherit;font-size:14px}
.as-rules{list-style:none;margin:-6px 0 14px;padding:0;font-size:12px}
.as-rules li{opacity:.55}.as-rules li.on{color:var(--as-ok);opacity:1}
.as-err{color:var(--as-danger);font-size:13px;margin:0 0 10px}
.as-btn{width:100%;border:0;border-radius:999px;padding:12px;font:inherit;font-size:14px;font-weight:600;background:var(--as-primary);color:var(--as-primaryfg);cursor:pointer}
.as-btn:disabled{opacity:.6;cursor:default}
.as-social{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.as-sbtn svg{width:18px;height:18px;flex:none}
.as-link{display:block;width:100%;margin-top:10px;padding:6px;border:0;background:none;color:inherit;font:inherit;font-size:13px;opacity:.75;cursor:pointer;text-decoration:underline}.as-link:disabled{opacity:.45;cursor:default;text-decoration:none}
.as-s-brutalist{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.as-s-brutalist .as-card{background:#fff;color:#000;border:2px solid #000;border-radius:0;box-shadow:4px 4px 0 0 #000;backdrop-filter:none;-webkit-backdrop-filter:none}
.as-s-brutalist .as-tabs{background:#fff;border:2px solid #000;border-radius:0;padding:0}
.as-s-brutalist .as-tab{font-weight:700;text-transform:uppercase}
.as-s-brutalist .as-pill{background:#ffe14d;border-radius:0;box-shadow:none}
.as-s-brutalist .as-field{background:#fff;border:2px solid #000;border-radius:0;padding:10px}
.as-s-brutalist .as-field:focus-within{border-color:#000;box-shadow:4px 4px 0 0 #000}
.as-s-brutalist .as-field input::placeholder{color:rgba(0,0,0,.5)}
.as-s-brutalist .as-btn,.as-s-brutalist .as-sbtn{border:2px solid #000;border-radius:0;box-shadow:4px 4px 0 0 #000;font-weight:700;text-transform:uppercase}
.as-s-brutalist .as-sbtn{background:#fff;color:#000}
.as-s-brutalist .as-btn:active,.as-s-brutalist .as-sbtn:active{transform:translate(4px,4px);box-shadow:none}
.as-s-brutalist .as-hero{border-left:2px solid #000}
.as-s-brutalist .as-hcard{border:2px solid #000;border-radius:0;box-shadow:4px 4px 0 0 #000}
.as-s-brutalist .as-tab,.as-s-brutalist .as-link{color:#000}
.as-sbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid var(--as-border);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}
`;

const ICONS = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  check: "M5 13l4 4L19 7",
};
const BRANDS: Record<Social, { label: string; svg: ReactNode }> = {
  google: { label: "Google", svg: (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>) },
  github: { label: "GitHub", svg: (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>) },
  apple: { label: "Apple", svg: (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.2-.8A4.8 4.8 0 0 0 3.8 9.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.2 3.100-2.5a11 11 0 0 0 1.400-2.900c-.1 0-2.600-1-2.600-4.300zM14 5.200a4.500 4.500 0 0 0 1-3.200 4.600 4.600 0 0 0-3 1.500 4.300 4.300 0 0 0-1.100 3.100A3.800 3.800 0 0 0 14 5.200z"/></svg>) },
  discord: { label: "Discord", svg: (<svg viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true"><path d="M20.3 4.4A19.800 19.800 0 0 0 15.400 3l-.2.500a18.400 18.400 0 0 0-6.400 0L8.600 3a19.700 19.700 0 0 0-4.900 1.400C.600 9 -.200 13.500.200 18a19.900 19.900 0 0 0 6 3l1.300-2.100c-.7-.3-1.400-.600-2-1l.5-.4a14.200 14.200 0 0 0 12 0l.5.400c-.6.400-1.300.700-2 1l1.300 2.100a19.900 19.900 0 0 0 6-3c.5-5.200-.8-9.700-3.500-13.600zM8.300 15.300c-1.200 0-2.100-1.100-2.100-2.400s.9-2.400 2.100-2.400 2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400zm7.400 0c-1.200 0-2.100-1.100-2.100-2.400s.9-2.400 2.100-2.400 2.100 1.100 2.100 2.400-.9 2.400-2.100 2.400z"/></svg>) },
  facebook: { label: "Facebook", svg: (<svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12a12 12 0 1 0-13.900 11.900v-8.400h-3V12h3V9.400c0-3 1.800-4.700 4.500-4.700 1.300 0 2.700.2 2.700.2v3h-1.500c-1.500 0-2 .9-2 1.900V12h3.400l-.5 3.500h-2.800v8.400A12 12 0 0 0 24 12z"/></svg>) },
};
function Icon({ d, ok }: { d: string; ok?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ok ? "as-ok" : undefined} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
function Field({ icon, valid, ...p }: { icon: string; valid: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="as-field">
      <Icon d={icon} />
      <input {...p} />
      {valid && <Icon d={ICONS.check} ok />}
    </label>
  );
}

type ModalProps = { open?: boolean; onClose?: () => void; trigger?: ReactNode };

export default function authica({ open, onClose, trigger }: ModalProps = {}) {
  const routeMode = open === undefined && trigger === undefined;
  const [inner, setInner] = useState(routeMode);
  const isOpen = open ?? inner;
  const close = () => {
    setInner(false);
    if (onClose) onClose();
    else if (routeMode) { if (window.history.length > 1) window.history.back(); else window.location.href = "/"; }
  };
  useEffect(() => {
    if (LAYOUT !== "modal" || !isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const [mode, setMode] = useState<Mode>("login");
  const [v, setV] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const { submit, social, send, verify } = useAuth();
  const isLogin = mode === "login";
  const split = LAYOUT === "split";
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  const rules = [
    ["At least 8 characters", v.password.length >= 8],
    ["A number or a symbol", /[\d\W_]/.test(v.password)],
    ["Lowercase and uppercase letters", /[a-z]/.test(v.password) && /[A-Z]/.test(v.password)],
  ] as const;
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const emailOk = /^\S+@\S+\.\S+$/.test(v.email);

  async function run(fn: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resend() {
    run(async () => {
      await send(mode, { name: v.name, email: v.email, password: "" });
      setLeft(RESEND_SECONDS);
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === "code") return run(() => verify(mode, v.email, code));
    if (PASSWORDLESS) {
      return run(async () => {
        await send(mode, { name: v.name, email: v.email, password: "" });
        setStep("code");
        setLeft(RESEND_SECONDS);
      });
    }
    if (!isLogin) {
      if (!rules.every((r) => r[1])) return setError("Password does not meet the requirements.");
      if (CONFIRM_PASSWORD && v.password !== v.confirm) return setError("Passwords do not match.");
    }
    run(() => submit(mode, { name: v.name, email: v.email, password: v.password }));
  }

  const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
  const formPanel = (
    <motion.div layout="position" transition={spring} className="as-form" style={{ order: isLogin ? 1 : 2 }}>
      <div className="as-tabs">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} type="button" className="as-tab" onClick={() => { setMode(m); setError(""); setStep("form"); setCode(""); setLeft(0); }}>
            {mode === m && <motion.span layoutId="as-pill" className="as-pill" transition={spring} />}
            {m === "login" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.form
          key={mode + step}
          onSubmit={onSubmit}
          initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === "form" ? (
            <>
              <h1 className="as-title">{isLogin ? "Welcome back" : "Sign Up"}</h1>
                  <p className="as-sub">{isLogin ? "Sign in to continue." : "Create your account in seconds."}</p>
              {!isLogin && SHOW_NAME && (
                    <Field icon={ICONS.user} valid={v.name.trim().length > 1} name="name" required placeholder="Full name" autoComplete="name" value={v.name} onChange={set("name")} />
              )}
                  <Field icon={ICONS.mail} valid={emailOk} name="email" type="email" required placeholder="Email" autoComplete="email" value={v.email} onChange={set("email")} />
              {!PASSWORDLESS && (
                <>
                  <Field icon={ICONS.lock} valid={!isLogin && rules.every((r) => r[1])} name="password" type="password" required placeholder="Password" autoComplete={isLogin ? "current-password" : "new-password"} value={v.password} onChange={set("password")} />
                  {!isLogin && (
                            <ul className="as-rules">
                      {rules.map(([t, ok]) => <li key={t} className={ok ? "on" : ""}>{ok ? "✓" : "•"} {t}</li>)}
                            </ul>
                  )}
                  {!isLogin && CONFIRM_PASSWORD && (
                            <Field icon={ICONS.lock} valid={v.confirm.length > 0 && v.confirm === v.password} name="confirm" type="password" required placeholder="Re-type password" autoComplete="new-password" value={v.confirm} onChange={set("confirm")} />
                  )}
                </>
              )}
          {error && <p role="alert" className="as-err">{error}</p>}
          <button type="submit" disabled={loading} className="as-btn">
            {loading ? "Please wait…" : PASSWORDLESS ? (METHOD === "otp" ? "Send code" : "Send magic link") : isLogin ? "Sign In" : "Sign Up"}
          </button>
            </>
          ) : (
            <>
              <h1 className="as-title">{METHOD === "otp" ? "Enter your code" : "Check your email"}</h1>
              <p className="as-sub">We sent {METHOD === "otp" ? "a 6-digit code" : "a magic link"} to {v.email}.</p>
              {METHOD === "otp" && (
                <Field icon={ICONS.lock} valid={code.length === 6} name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="123456" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              )}
              {error && <p role="alert" className="as-err">{error}</p>}
              {METHOD === "otp" && (
                <button type="submit" disabled={loading || code.length !== 6} className="as-btn">
                  {loading ? "Please wait…" : "Verify"}
                </button>
              )}
              <button type="button" className="as-link" disabled={left > 0 || loading} onClick={resend}>
                {left > 0 ? "Resend in " + left + "s" : METHOD === "otp" ? "Resend code" : "Resend link"}
              </button>
              <button type="button" className="as-link" onClick={() => { setStep("form"); setCode(""); setError(""); setLeft(0); }}>
                Use a different email
              </button>
            </>
          )}
          {step === "form" && PROVIDERS.length > 0 && (
            <div className="as-social">
              {PROVIDERS.map((p) => (
                <button key={p} type="button" className="as-sbtn" disabled={loading} onClick={() => run(() => social(p))}>
                  {BRANDS[p].svg}
                  {BRANDS[p].label}
                </button>
              ))}
            </div>
          )}
        </motion.form>
      </AnimatePresence>
    </motion.div>
  );

  const heroPanel = (
    <motion.div
      layout="position"
      transition={spring}
      className={"as-hero" + (HERO_IMAGE ? " as-img" : "")}
      style={{ order: isLogin ? 2 : 1, backgroundImage: HERO_IMAGE ? `url(${HERO_IMAGE})` : undefined }}
    >
      {!HERO_IMAGE && (
        <>
          <div className="as-shape" style={{ width: 360, height: 360, top: -120, right: -80, transform: "rotate(18deg)" }} />
          <div className="as-shape" style={{ width: 420, height: 420, bottom: -180, left: -120, transform: "rotate(-14deg)", background: "rgba(255,255,255,.1)" }} />
        </>
      )}
      <div className="as-hcard" style={{ top: 60, left: 40, width: 190 }}>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Secure</div>
        <strong style={{ fontSize: 20 }}>Your data, your rules</strong>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} className="as-htext" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
          <h2>{isLogin ? "Good to see you again" : "Join in a few clicks"}</h2>
          <p>{isLogin ? "Pick up right where you left off." : "One account for everything you need."}</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  const card = (
    <motion.div layout transition={spring} className={"as-card" + (split ? " as-split" : "")}>
      {LAYOUT === "modal" && <button type="button" className="as-close" aria-label="Close" onClick={close}>×</button>}
      {formPanel}
      {split && heroPanel}
    </motion.div>
  );

  if (LAYOUT === "modal") {
    return (
      <div className={"as-vars as-s-" + STYLE} style={{ display: "contents" }}>
        <style>{CSS}</style>
        {typeof trigger === "string" ? (
          <button type="button" className="as-btn as-trigger" onClick={() => setInner(true)}>{trigger}</button>
        ) : trigger !== undefined ? (
          <span role="presentation" onClick={() => setInner(true)}>{trigger}</span>
        ) : null}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="as-overlay"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
            >
              {card}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={"as-root as-s-" + STYLE + (LAYOUT === "canvas" ? " as-canvas" : LAYOUT === "glass" ? " as-glass" : "")} style={LAYOUT === "canvas" && HERO_IMAGE ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${HERO_IMAGE})` } : undefined}>
      <style>{CSS}</style>
      {card}
    </div>
  );
}
