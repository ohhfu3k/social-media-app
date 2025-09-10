import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [step, setStep] = useState<"collect"|"verify"|"password">("collect");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"email"|"phone">("email");
  const [code, setCode] = useState(["","","","","",""]);
  const inputsRef = useRef<(HTMLInputElement|null)[]>([]);
  const [resendIn, setResendIn] = useState(0);
  const [hint, setHint] = useState<string|undefined>();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const requestOtp = async (id: string) => {
    const isEmail = /@/.test(id) && /.+@.+\..+/.test(id);
    setChannel(isEmail?"email":"phone");
    const r = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: isEmail?"email":"phone", identifier: id }) });
    const d = await r.json().catch(()=>({}));
    setHint(typeof d?.devHint === "string" ? d.devHint : undefined);
    setResendIn(30);
  };

  const start = async (e: React.FormEvent) => {
    e.preventDefault(); setError(undefined);
    await requestOtp(identifier);
    setStep("verify");
  };

  useEffect(() => {
    if (resendIn <= 0) return; const t = window.setInterval(()=>setResendIn(s=>s>0?s-1:0), 1000); return () => window.clearInterval(t);
  }, [resendIn]);

  const resend = async () => { if (resendIn>0) return; await requestOtp(identifier); };

  useEffect(() => {
    if (!username) { setAvailable(null); return; }
    const id = window.setTimeout(async () => {
      setChecking(true);
      try { const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`); const d = await r.json(); setAvailable(!!d.available); } catch { setAvailable(null); }
      setChecking(false);
    }, 400);
    return () => window.clearTimeout(id);
  }, [username]);

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setVerifying(true); setError(undefined);
    try {
      const resp = await fetch("/api/auth/verify", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ channel, identifier, code: code.join("") }) });
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok) throw new Error(data.error || "Verification failed");
      setStep("password");
    } catch (err: any) { setError(err?.message || "Verification failed"); } finally { setVerifying(false); }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(undefined);
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== password2) { setError("Passwords do not match"); return; }
    const resp = await fetch("/api/auth/set-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, identifier, password }) });
    const data = await resp.json().catch(()=>({}));
    if (!resp.ok) { setError(data.error || "Could not set password"); return; }
    navigate("/profile/setup");
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        {step === "collect" && (
          <form onSubmit={start} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Create your account</div>
            <input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="Email or phone" className="w-full h-11 px-3 rounded-md bg-background border border-white/10" required />
            <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" className="h-11 w-full pl-3 pr-16 rounded-md bg-background border border-white/10" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                  {checking && <span className="opacity-70">checking…</span>}
                  {!checking && available === true && <span className="text-green-300">available</span>}
                  {!checking && available === false && <span className="text-red-300">taken</span>}
                </span>
              </div>
              <input type="date" value={dob} onChange={(e)=>setDob(e.target.value)} placeholder="DOB" className="h-11 px-3 rounded-md bg-background border border-white/10" />
            </div>
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Continue</button>
            <div className="text-xs text-muted-foreground text-center">Already have an account? <Link to="/login" className="text-cyan-300 hover:underline">Login</Link></div>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={submitVerify} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Verify your {channel}</div>
            {hint ? <div className="text-xs text-cyan-300 text-center">Dev code: {hint}</div> : <div className="text-xs text-muted-foreground text-center">Tip: use 000000 in dev</div>}
            <div className="flex gap-3 justify-center">
              {code.map((v,i)=> (
                <input key={i} ref={(el)=>inputsRef.current[i]=el} inputMode="numeric" maxLength={1} value={v} onChange={(e)=>{ const digit=e.target.value.replace(/\D/g,"").slice(0,1); const next=[...code]; next[i]=digit; setCode(next); if(digit&&i<code.length-1) inputsRef.current[i+1]?.focus(); }} onKeyDown={(e)=>{ if(e.key==='Backspace'&&!code[i]&&i>0) inputsRef.current[i-1]?.focus(); }} className="w-12 h-12 text-center text-lg rounded-md bg-background border border-white/10" />
              ))}
            </div>
            <div className="text-xs text-center text-muted-foreground">{resendIn>0?`Resend in ${resendIn}s`:<button type="button" onClick={resend} className="text-cyan-300 hover:underline">Resend</button>}</div>
            {error && <div className="text-xs text-red-300 text-center">{error}</div>}
            <button disabled={verifying || code.join("").length!==6} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50">Verify</button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Create password</div>
            <div className="relative">
              <input type={showPw?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10" required />
              <button type="button" onClick={()=>setShowPw(s=>!s)} aria-label={showPw?"Hide":"Show"} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
            </div>
            <div className="relative">
              <input type={showPw2?"text":"password"} value={password2} onChange={(e)=>setPassword2(e.target.value)} placeholder="Confirm password" className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10" required />
              <button type="button" onClick={()=>setShowPw2(s=>!s)} aria-label={showPw2?"Hide":"Show"} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">{showPw2?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
            </div>
            {error && <div className="text-xs text-red-300">{error}</div>}
            <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Create account</button>
          </form>
        )}
      </section>
      <Navbar />
    </div>
  );
}
