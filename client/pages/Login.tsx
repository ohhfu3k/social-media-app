import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const form = e.target as HTMLFormElement;
      const honey = (form.elements.namedItem('website') as HTMLInputElement)?.value || '';
      const resp = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password, honey }) });
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok) throw new Error(data.error || "Login failed");
      try {
        localStorage.setItem("galaxy-token", data.token);
        if (data.refreshToken) localStorage.setItem("galaxy-refresh", data.refreshToken);
        localStorage.setItem("galaxy-auth", "1");
      } catch {}
      navigate("/home");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally { setLoading(false); }
  };
  const startGoogle = async () => {
    try { const r = await fetch('/api/auth/oauth/google'); const d = await r.json(); if (d?.url) window.location.href = d.url; } catch {}
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
          <div className="text-lg font-semibold">Sign in</div>
          <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="Email, phone, or username" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
          <div className="relative">
            <input type={showPw?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10" required />
            <button type="button" onClick={()=>setShowPw(s=>!s)} aria-label={showPw?"Hide password":"Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
          </div>
          {err && <div className="text-xs text-red-300">{err}</div>}
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <button disabled={loading} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50">{loading?"Signing in...":"Sign in"}</button>
          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-white/10 flex-1" /><span className="text-[10px] text-muted-foreground">or</span><div className="h-px bg-white/10 flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={startGoogle} className="h-10 rounded-md border border-white/10 text-xs">Google</button>
            <Link to="/login/oauth/facebook" className="h-10 rounded-md border border-white/10 grid place-items-center text-xs">Facebook</Link>
            <Link to="/login/oauth/apple" className="h-10 rounded-md border border-white/10 grid place-items-center text-xs">Apple</Link>
          </div>
          <div className="text-xs text-center text-muted-foreground mt-2">
            <Link to="/login/passwordless" className="text-cyan-300 hover:underline">Use a magic link</Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            <Link to="/forgot-password" className="text-cyan-300 hover:underline">Forgot password?</Link>
          </div>
        </form>
      </section>
      <Navbar />
    </div>
  );
}
