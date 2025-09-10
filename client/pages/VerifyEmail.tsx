import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"idle"|"ok"|"error">("idle");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const usp = new URLSearchParams(window.location.search);
        const token = usp.get("token") || "";
        const r = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        const d = await r.json().catch(()=>({}));
        if (!r.ok) throw new Error(d.error || "Verification failed");
        setStatus("ok"); setMsg("Email verified. You can sign in now.");
      } catch (e: any) { setStatus("error"); setMsg(e?.message || "Verification failed"); }
    })();
  }, []);
  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 text-center space-y-2">
          <div className="text-lg font-semibold">Verify email</div>
          <div className={status==="ok"?"text-emerald-300":"text-red-300"}>{msg || "Verifying..."}</div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
