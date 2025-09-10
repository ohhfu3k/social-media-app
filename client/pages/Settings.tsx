import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useEffect, useState } from "react";
import { useAppState } from "@/context/app-state";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { theme, setTheme, twoFactor, setTwoFactor } = useAppState();
  const initialTab = (() => {
    try { const usp = new URLSearchParams(window.location.search); const t = usp.get('tab') as any; if (t && ['account','privacy','notifications','theme','manage'].includes(t)) return t; } catch {}
    return 'account';
  })() as 'account'|'privacy'|'notifications'|'theme'|'manage';
  const [tab, setTab] = useState<'account'|'privacy'|'notifications'|'theme'|'manage'>(initialTab);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-2">
          {(['account','privacy','notifications','theme','manage'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-3 h-9 rounded-md border ${tab===t?"border-cyan-300/50 bg-cyan-400/10":"border-white/10"}`}>{t}</button>
          ))}
        </div>

        {tab==='account' && (
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 space-y-3">
            <div className="text-sm font-medium">Password</div>
            <div className="relative">
              <input type={showCurrent?"text":"password"} placeholder="Current password" className="h-10 w-full px-3 pr-10 rounded-md bg-background border border-white/10" />
              <button type="button" aria-label={showCurrent?"Hide password":"Show password"} onClick={()=>setShowCurrent(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <input type={showNew?"text":"password"} placeholder="New password" className="h-10 w-full px-3 pr-10 rounded-md bg-background border border-white/10" />
              <button type="button" aria-label={showNew?"Hide password":"Show password"} onClick={()=>setShowNew(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button className="px-3 h-9 rounded-md bg-primary text-primary-foreground w-max">Change</button>

            <div className="pt-3 border-t border-white/10" />
            <div className="text-sm font-medium">Security</div>
            <label className="flex items-center justify-between text-sm rounded-md border border-white/10 bg-background/60 p-3">
              <div>
                <div>Two-step verification</div>
                <div className="text-xs text-muted-foreground">Require a code after password</div>
              </div>
              <input type="checkbox" checked={twoFactor} onChange={(e)=>setTwoFactor(e.target.checked)} />
            </label>

            <div className="pt-3 border-t border-white/10" />
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch {}
                try {
                  localStorage.removeItem('galaxy-auth');
                  localStorage.removeItem('galaxy-token');
                  localStorage.removeItem('galaxy-refresh');
                  localStorage.removeItem('galaxy-2fa');
                } catch {}
                navigate('/login', { replace: true });
              }}
              className="px-3 h-9 rounded-md border border-white/10 w-max"
            >
              Logout
            </button>

            <div className="pt-3 border-t border-white/10" />
            <button className="px-3 h-9 rounded-md border border-white/10 text-destructive w-max">Delete account</button>
          </div>
        )}

        {tab==='privacy' && (
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 space-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Private account</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Hide energy</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Allow messages</label>
          </div>
        )}

        {tab==='notifications' && (
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 space-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Push</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Email</label>
          </div>
        )}

        {tab==='theme' && (
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 space-y-2">
            <div className="text-sm font-medium">Theme</div>
            <div className="flex gap-2">
              {(['light','dark','dragon'] as const).map(m => (
                <button key={m} onClick={()=>setTheme(m)} className={`px-3 h-9 rounded-md border ${theme===m?"border-fuchsia-400/50 bg-fuchsia-500/10":"border-white/10"}`}>{m}</button>
              ))}
            </div>
          </div>
        )}

        {tab==='manage' && (
          <div className="rounded-2xl border border-white/10 bg-card/70 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Integrations</div>
              <IntegrationsPanel />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Badges</div>
              <div className="flex flex-wrap gap-2">
                {["Explorer","Nebula Diver","Guardian"].map(b => (
                  <span key={b} className="text-xs px-2 py-1 rounded-md border border-white/10">{b}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      <Navbar />
    </div>
  );
}

function IntegrationsPanel() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/integrations/status");
        const d = await r.json();
        setStatus(d);
      } finally { setLoading(false); }
    })();
  }, []);
  const triggerNetlify = async () => {
    setMsg("");
    const r = await fetch("/api/integrations/netlify/deploy", { method: "POST" });
    const d = await r.json().catch(()=>({}));
    if (r.ok) setMsg("Netlify build triggered"); else setMsg(d.error || "Failed to trigger");
  };
  if (loading) return <div className="text-sm text-muted-foreground">Checking status…</div>;
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border border-white/10 p-3">
        <div className="font-medium">Storage</div>
        <div className="text-xs text-muted-foreground">{status?.storage?.configured?"Configured":"Not configured"} {status?.storage?.bucket?`(${status.storage.bucket})`:""}</div>
      </div>
      <div className="rounded-md border border-white/10 p-3">
        <div className="font-medium">Database (Neon/Postgres)</div>
        <div className="text-xs text-muted-foreground">{status?.database?.urlPresent?"Configured":"Not configured"}</div>
        <div className="mt-2 flex gap-2">
          <a href="#open-mcp-popover" className="px-3 h-8 rounded-md border border-white/10">Connect Neon</a>
        </div>
      </div>
      <div className="rounded-md border border-white/10 p-3">
        <div className="font-medium">Monitoring (Sentry)</div>
        <div className="text-xs text-muted-foreground">{status?.sentry?.configured?"Configured":"Not configured"}</div>
        <div className="mt-2 flex gap-2">
          <a href="#open-mcp-popover" className="px-3 h-8 rounded-md border border-white/10">Connect Sentry</a>
        </div>
      </div>
      <div className="rounded-md border border-white/10 p-3">
        <div className="font-medium">Deploy (Netlify)</div>
        <div className="text-xs text-muted-foreground">{status?.netlify?.configured?"Build hook set":"Build hook not set"}</div>
        <div className="mt-2 flex gap-2">
          <button onClick={triggerNetlify} className="px-3 h-8 rounded-md bg-primary text-primary-foreground disabled:opacity-50" disabled={!status?.netlify?.configured}>Trigger Netlify Deploy</button>
        </div>
        {msg && <div className="text-xs mt-2">{msg}</div>}
      </div>
    </div>
  );
}
