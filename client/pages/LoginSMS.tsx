import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useNavigate } from "react-router-dom";

export default function LoginSMS() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"request"|"verify">("request");
  const [code, setCode] = useState(["","","","","",""]);
  const inputsRef = useRef<(HTMLInputElement|null)[]>([]);
  const [resendIn, setResendIn] = useState(0);
  const [hint, setHint] = useState<string|undefined>();
  const [err, setErr] = useState<string|undefined>();
  const navigate = useNavigate();

  const request = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(undefined);
    const r = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "phone", identifier: phone }) });
    const d = await r.json().catch(()=>({})); if (!r.ok) { setErr(d.error||"Failed"); return; }
    setHint(typeof d?.devHint === 'string' ? d.devHint : undefined);
    setResendIn(30); setStep("verify");
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(undefined);
    const r = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "phone", identifier: phone, code: code.join("") }) });
    const d = await r.json().catch(()=>({})); if (!r.ok) { setErr(d.error||"Failed"); return; }
    try { localStorage.setItem("galaxy-auth","1"); } catch {}
    navigate("/home");
  };
  useEffect(()=>{ if(resendIn<=0) return; const t=setInterval(()=>setResendIn(s=>s>0?s-1:0),1000); return ()=>clearInterval(t); },[resendIn]);
  const resend = async ()=>{ if(resendIn>0) return; const r = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: "phone", identifier: phone }) }); const d = await r.json().catch(()=>({})); setHint(typeof d?.devHint==='string'?d.devHint:undefined); setResendIn(30); };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        {step==="request" ? (
          <form onSubmit={request} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Login via SMS</div>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone number" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
            {err && <div className="text-xs text-red-300">{err}</div>}
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Send code</button>
          </form>
        ) : (
          <form onSubmit={verify} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Enter the code</div>
            {hint ? <div className="text-xs text-cyan-300 text-center">Dev code: {hint}</div> : <div className="text-xs text-muted-foreground text-center">Tip: use 000000 in dev</div>}
            <div className="flex gap-3 justify-center">
              {code.map((v,i)=> (
                <input key={i} ref={(el)=>inputsRef.current[i]=el} inputMode="numeric" maxLength={1} value={v} onChange={(e)=>{ const digit=e.target.value.replace(/\D/g,"").slice(0,1); const next=[...code]; next[i]=digit; setCode(next); if(digit&&i<code.length-1) inputsRef.current[i+1]?.focus(); }} className="w-12 h-12 text-center text-lg rounded-md bg-background border border-white/10" />
              ))}
            </div>
            <div className="text-xs text-center text-muted-foreground">{resendIn>0?`Resend in ${resendIn}s`:<button type="button" onClick={resend} className="text-cyan-300 hover:underline">Resend</button>}</div>
            {err && <div className="text-xs text-red-300 text-center">{err}</div>}
            <button disabled={code.join("").length!==6} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50">Verify</button>
          </form>
        )}
      </section>
      <Navbar />
    </div>
  );
}
