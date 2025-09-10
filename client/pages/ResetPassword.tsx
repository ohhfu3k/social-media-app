import { useMemo, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const usp = useMemo(()=> new URLSearchParams(window.location.search), []);
  const token = usp.get("token") || "";
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"email"|"phone">("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<string|undefined>();
  const [err, setErr] = useState<string|undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(undefined); setErr(undefined); setLoading(true);
    try {
      if (token) {
        const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
        const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||"Reset failed");
      } else {
        const ch = /@/.test(identifier) ? "email" : "phone"; setChannel(ch as any);
        const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: ch, identifier, code, password }) });
        const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error||"Reset failed");
      }
      setMsg("Password updated. You can sign in now.");
    } catch (e: any) { setErr(e?.message || "Reset failed"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
          <div className="text-lg font-semibold">Reset password</div>
          {token ? (
            <div className="text-xs text-muted-foreground">Using secure token</div>
          ) : (
            <>
              <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="Email or phone" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
              <input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="OTP code" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" maxLength={6} required />
            </>
          )}
          <div className="relative">
            <input type={show?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="New password" className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10" required />
            <button type="button" onClick={()=>setShow(s=>!s)} aria-label={show?"Hide password":"Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
          </div>
          {msg && <div className="text-xs text-emerald-300">{msg}</div>}
          {err && <div className="text-xs text-red-300">{err}</div>}
          <button disabled={loading} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50">{loading?"Updating...":"Update password"}</button>
        </form>
      </section>
      <Navbar />
    </div>
  );
}
