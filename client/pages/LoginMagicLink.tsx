import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function LoginMagicLink() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string|undefined>();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(undefined);
    try {
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json().catch(()=>({})); if (!r.ok) throw new Error(d.error || "Failed");
      setSent(true);
    } catch (e: any) { setErr(e?.message || "Failed"); }
  };
  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        {!sent ? (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Send magic link</div>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@domain.com" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
            {err && <div className="text-xs text-red-300">{err}</div>}
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Send</button>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 text-center">
            <div className="text-lg font-semibold">Check your email</div>
            <div className="text-sm text-muted-foreground">We sent a link to {email} to sign you in.</div>
          </div>
        )}
      </section>
      <Navbar />
    </div>
  );
}
