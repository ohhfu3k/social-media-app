import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useNavigate } from "react-router-dom";

export default function LoginTwoFactor() {
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState(["","","","","",""]);
  const inputsRef = useRef<(HTMLInputElement|null)[]>([]);
  const [err, setErr] = useState<string|undefined>();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(undefined);
    const channel = /@/.test(identifier) ? "email" : "phone";
    const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, identifier, code: code.join("") }) });
    const d = await r.json().catch(()=>({})); if (!r.ok) { setErr(d.error||"Failed"); return; }
    try { localStorage.setItem("galaxy-auth","1"); } catch {}
    navigate("/home");
  };

  useEffect(()=>{ inputsRef.current[0]?.focus(); },[]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
          <div className="text-lg font-semibold">Two-factor verification</div>
          <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="Email or phone" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
          <div className="flex gap-3 justify-center">
            {code.map((v,i)=> (
              <input key={i} ref={(el)=>inputsRef.current[i]=el} inputMode="numeric" maxLength={1} value={v} onChange={(e)=>{ const digit=e.target.value.replace(/\D/g,"").slice(0,1); const next=[...code]; next[i]=digit; setCode(next); if(digit&&i<code.length-1) inputsRef.current[i+1]?.focus(); }} className="w-12 h-12 text-center text-lg rounded-md bg-background border border-white/10" />
            ))}
          </div>
          {err && <div className="text-xs text-red-300 text-center">{err}</div>}
          <button disabled={code.join("").length!==6} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50">Verify</button>
        </form>
      </section>
      <Navbar />
    </div>
  );
}
