import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function AppealSuspended() {
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    try {
      const r = await fetch("/api/support/appeal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, reason }) });
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || "Failed");
      setMsg("Submitted. We'll review and respond via email.");
    } catch (e: any) { setMsg(e?.message || "Failed"); }
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
          <div className="text-lg font-semibold">Appeal suspension</div>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Your email" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
          <textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Explain why your account should be reinstated" rows={5} className="w-full px-3 py-2 rounded-md bg-background border border-white/10" />
          <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Submit appeal</button>
          {msg && <div className="text-xs mt-2">{msg}</div>}
        </form>
      </section>
      <Navbar />
    </div>
  );
}
