import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/galaxy/TopBar";
import { Eye, EyeOff } from "lucide-react";
import { useAppState } from "@/context/app-state";

export default function Index() {
  const [step, setStep] = useState<"login" | "verify" | "profile" | "signup_auth" | "signup_verify" | "signup_password">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("Nova Star");
  const [username, setUsername] = useState("nova");
  const [bio, setBio] = useState("Exploring nebulas and collecting dragon food.");
  const [entrance, setEntrance] = useState("Comet Trail");
  const [rememberLogin, setRememberLogin] = useState(false);
  const [rememberSignup, setRememberSignup] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const signupInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [signupIdentifier, setSignupIdentifier] = useState("");
  const [signupChannel, setSignupChannel] = useState<"email" | "phone">("email");
  const [signupCode, setSignupCode] = useState(["","","","","",""]);
  const [signupResendIn, setSignupResendIn] = useState(0);
  const [signupVerifying, setSignupVerifying] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupOtpHint, setSignupOtpHint] = useState<string | null>(null);
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPassword2, setSignupPassword2] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupPw2, setShowSignupPw2] = useState(false);
  const [signupPasswordErr, setSignupPasswordErr] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("galaxy-auth") === "1") {
      navigate("/home");
      return;
    }
    if (localStorage.getItem("galaxy-remember-login") === "1") {
      setRememberLogin(true);
      setIdentifier(localStorage.getItem("galaxy-remember-identifier") || "");
    }
    if (localStorage.getItem("galaxy-remember-signup") === "1") {
      setRememberSignup(true);
      setDisplayName(localStorage.getItem("galaxy-remember-displayName") || "Nova Star");
      setUsername(localStorage.getItem("galaxy-remember-username") || "nova");
      setBio(localStorage.getItem("galaxy-remember-bio") || "Exploring nebulas and collecting dragon food.");
    }
  }, [navigate]);
  const { twoFactor } = useAppState();

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberLogin) {
      localStorage.setItem("galaxy-remember-login", "1");
      localStorage.setItem("galaxy-remember-identifier", identifier);
    } else {
      localStorage.removeItem("galaxy-remember-login");
      localStorage.removeItem("galaxy-remember-identifier");
    }
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await resp.json().catch(()=>({}));
      if (!resp.ok) throw new Error(data.error || "Login failed");
      try {
        localStorage.setItem("galaxy-token", data.token);
        if (data.refreshToken) localStorage.setItem("galaxy-refresh", data.refreshToken);
        localStorage.setItem("galaxy-auth", "1");
      } catch {}
      navigate("/home");
    } catch (err) {
      if (twoFactor) {
        const isEmail = /@/.test(identifier) && /.+@.+\..+/.test(identifier);
        setChannel(isEmail ? "email" : "phone");
        setCode(["","","","","",""]);
        setVerifyError(null);
        setStep("verify");
        try {
          const r = await fetch("/api/auth/request-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel: isEmail ? "email" : "phone", identifier }),
          });
          const d = await r.json().catch(() => ({}));
          if (d && typeof d.devHint === 'string') setOtpHint(d.devHint);
          else setOtpHint(null);
        } catch { setOtpHint(null); }
        setResendIn(30);
      }
    }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError(null);
    try {
      const codeStr = code.join("");
      const resp = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier, code: codeStr }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Verification failed");
      try { localStorage.setItem("galaxy-auth", "1"); } catch {}
      navigate("/home");
    } catch (err: any) {
      setVerifyError(err?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  const resendOtp = async () => {
    if (resendIn > 0) return;
    try {
      const r = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, identifier }),
      });
      const d = await r.json().catch(() => ({}));
      if (d && typeof d.devHint === 'string') setOtpHint(d.devHint);
    } catch {}
    setResendIn(30);
  };

  const submitSignupAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEmail = /@/.test(signupIdentifier) && /.+@.+\..+/.test(signupIdentifier);
    setSignupChannel(isEmail ? "email" : "phone");
    setSignupCode(["","","","","",""]);
    setSignupError(null);
    try {
      const r = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: isEmail ? "email" : "phone", identifier: signupIdentifier }),
      });
      const d = await r.json().catch(() => ({}));
      if (d && typeof d.devHint === 'string') setSignupOtpHint(d.devHint);
      else setSignupOtpHint(null);
    } catch { setSignupOtpHint(null); }
    setSignupResendIn(30);
    setStep("signup_verify");
  };

  const resendSignupOtp = async () => {
    if (signupResendIn > 0) return;
    try {
      const r = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: signupChannel, identifier: signupIdentifier }),
      });
      const d = await r.json().catch(() => ({}));
      if (d && typeof d.devHint === 'string') setSignupOtpHint(d.devHint);
    } catch {}
    setSignupResendIn(30);
  };

  useEffect(() => {
    if (signupResendIn <= 0) return;
    const t = window.setInterval(() => setSignupResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [signupResendIn]);

  const submitSignupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupVerifying(true);
    setSignupError(null);
    try {
      const codeStr = signupCode.join("");
      const resp = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: signupChannel, identifier: signupIdentifier, code: codeStr }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Verification failed");
      try { localStorage.setItem("galaxy-email-verified", "1"); } catch {}
      setStep("signup_password");
    } catch (err: any) {
      setSignupError(err?.message || "Verification failed");
    } finally {
      setSignupVerifying(false);
    }
  };

  const submitSignupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupPasswordErr(null);
    if (signupPassword.length < 6) { setSignupPasswordErr("Password must be at least 6 characters"); return; }
    if (signupPassword !== signupPassword2) { setSignupPasswordErr("Passwords do not match"); return; }
    try {
      const resp = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: signupChannel, identifier: signupIdentifier, password: signupPassword }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "Could not set password");
      navigate("/profile/setup");
    } catch (err: any) {
      setSignupPasswordErr(err?.message || "Could not set password");
    }
  };

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberSignup) {
      localStorage.setItem("galaxy-remember-signup", "1");
      localStorage.setItem("galaxy-remember-displayName", displayName);
      localStorage.setItem("galaxy-remember-username", username);
      localStorage.setItem("galaxy-remember-bio", bio);
    } else {
      localStorage.removeItem("galaxy-remember-signup");
      localStorage.removeItem("galaxy-remember-displayName");
      localStorage.removeItem("galaxy-remember-username");
      localStorage.removeItem("galaxy-remember-bio");
    }
    // trigger entrance FX on next page
    try {
      localStorage.setItem("galaxy-entrance-style", entrance);
      localStorage.setItem("galaxy-entrance-trigger", "1");
    } catch {}
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground relative">
      <TopBar />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 top-24 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 blur-3xl" />
      </div>

      <section className="pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3">
              <div className="relative h-16 w-16">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 animate-spin-slow shadow-[0_0_50px_rgba(168,85,247,0.6)]"></span>
                <span className="absolute inset-1 rounded-full bg-background"></span>
                <span className="absolute inset-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 blur-[8px] opacity-70 animate-pulse"></span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-indigo-400 drop-shadow-neon">
                Galaxy Social UI
              </h1>
            </div>
            <p className="mt-6 text-muted-foreground text-lg max-w-xl">
              A galaxy-themed social experience. Orbit Access, Star Links, Whisper, Toss and more.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
            {step === "login" && (
              <form onSubmit={submitLogin} className="space-y-4">
                <div className="text-xl font-semibold">Welcome</div>
                <div className="text-sm text-muted-foreground">Login with email or phone</div>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or phone"
                  className="w-full h-11 px-3 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
                <div className="relative">
                  <input
                    required
                    type={showLoginPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  <button
                    type="button"
                    aria-label={showLoginPw ? "Hide password" : "Show password"}
                    onClick={() => setShowLoginPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5"
                  >
                    {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={rememberLogin} onChange={(e)=>setRememberLogin(e.target.checked)} /> Remember me</label>
                  <button type="button" onClick={() => navigate('/forgot')} className="inline-flex items-center gap-1 text-cyan-300 hover:underline" aria-label="Account recovery" title="Account recovery">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l2-2 4 4 8-8 2 2-10 10-4-4z"/></svg>
                    Forgot password?
                  </button>
                </div>
                <button className="w-full h-11 rounded-md bg-primary text-primary-foreground hover:brightness-110 transition">Orbit Access</button>
                <div className="text-sm text-center text-muted-foreground">
                  Don't have an account? <button type="button" className="text-fuchsia-300 hover:underline" onClick={() => setStep("signup_auth")}>Sign Up</button>
                </div>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={submitVerify} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep("login")} aria-label="Back" className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5">←</button>
                  <div className="text-xl font-semibold">Verification</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {channel === 'email' ? 'Enter the code we emailed to ' : 'Enter the code we texted to '} {identifier}
                </div>
                {otpHint && (
                  <div className="text-xs text-cyan-300 text-center">Dev code: {otpHint}</div>
                )}
                {!otpHint && (
                  <div className="text-xs text-muted-foreground text-center">Tip: In development you can also use 000000</div>
                )}
                <div className="flex gap-3 justify-center">
                  {code.map((v, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      autoFocus={i === 0}
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
                        const next = [...code];
                        next[i] = digit;
                        setCode(next);
                        if (digit && i < code.length - 1) {
                          inputsRef.current[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          if (code[i]) {
                            const next = [...code];
                            next[i] = "";
                            setCode(next);
                          } else if (i > 0) {
                            inputsRef.current[i - 1]?.focus();
                          }
                        } else if (e.key === "ArrowLeft" && i > 0) {
                          inputsRef.current[i - 1]?.focus();
                        } else if (e.key === "ArrowRight" && i < code.length - 1) {
                          inputsRef.current[i + 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                        if (pasted) {
                          e.preventDefault();
                          const next = [...code];
                          for (let j = 0; j < code.length; j++) {
                            next[j] = pasted[j] ?? next[j];
                          }
                          setCode(next);
                          const lastIndex = Math.min(pasted.length, code.length) - 1;
                          if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 transition-transform focus:scale-105"
                    />
                  ))}
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {resendIn > 0 ? (
                    <span>Resend OTP in {resendIn}s</span>
                  ) : (
                    <button type="button" onClick={resendOtp} className="text-cyan-300 hover:underline">Resend OTP</button>
                  )}
                </div>
                {verifyError && <div className="text-xs text-red-300 text-center">{verifyError}</div>}
                {verifying && <div className="text-sm text-center">🌌 Verifying your identity…</div>}
                <button disabled={verifying || code.join("").length !== 6} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-60">Verify</button>
              </form>
            )}

            {step === "signup_auth" && (
              <form onSubmit={submitSignupAuth} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep("login")} aria-label="Back" className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5">←</button>
                  <div className="text-xl font-semibold">Sign up verification</div>
                </div>
                <div className="text-sm text-muted-foreground">Enter your email or phone to receive a verification code</div>
                <input
                  required
                  value={signupIdentifier}
                  onChange={(e) => setSignupIdentifier(e.target.value)}
                  placeholder="Email or phone"
                  className="w-full h-11 px-3 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
                <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Next</button>
              </form>
            )}

            {step === "signup_verify" && (
              <form onSubmit={submitSignupVerify} className="space-y-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep("signup_auth")} aria-label="Back" className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5">←</button>
                  <div className="text-xl font-semibold">Verify your contact</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {signupChannel === 'email' ? 'Enter the code we emailed to ' : 'Enter the code we texted to '} {signupIdentifier}
                </div>
                {signupOtpHint && (
                  <div className="text-xs text-cyan-300 text-center">Dev code: {signupOtpHint}</div>
                )}
                {!signupOtpHint && (
                  <div className="text-xs text-muted-foreground text-center">Tip: In development you can also use 000000</div>
                )}
                <div className="flex gap-3 justify-center">
                  {signupCode.map((v, i) => (
                    <input
                      key={i}
                      ref={(el) => (signupInputsRef.current[i] = el)}
                      autoFocus={i === 0}
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
                        const next = [...signupCode];
                        next[i] = digit;
                        setSignupCode(next);
                        if (digit && i < signupCode.length - 1) {
                          signupInputsRef.current[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          if (signupCode[i]) {
                            const next = [...signupCode];
                            next[i] = "";
                            setSignupCode(next);
                          } else if (i > 0) {
                            signupInputsRef.current[i - 1]?.focus();
                          }
                        } else if (e.key === "ArrowLeft" && i > 0) {
                          signupInputsRef.current[i - 1]?.focus();
                        } else if (e.key === "ArrowRight" && i < signupCode.length - 1) {
                          signupInputsRef.current[i + 1]?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                        if (pasted) {
                          e.preventDefault();
                          const next = [...signupCode];
                          for (let j = 0; j < signupCode.length; j++) {
                            next[j] = pasted[j] ?? next[j];
                          }
                          setSignupCode(next);
                          const lastIndex = Math.min(pasted.length, signupCode.length) - 1;
                          if (lastIndex >= 0) signupInputsRef.current[lastIndex]?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 transition-transform focus:scale-105"
                    />
                  ))}
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {signupResendIn > 0 ? (
                    <span>Resend OTP in {signupResendIn}s</span>
                  ) : (
                    <button type="button" onClick={resendSignupOtp} className="text-cyan-300 hover:underline">Resend OTP</button>
                  )}
                </div>
                {signupError && <div className="text-xs text-red-300 text-center">{signupError}</div>}
                {signupVerifying && <div className="text-sm text-center">🌌 Verifying your identity…</div>}
                <button disabled={signupVerifying || signupCode.join("").length !== 6} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-60">Verify & Continue</button>
              </form>
            )}

            {step === "signup_password" && (
              <form onSubmit={submitSignupPassword} className="space-y-4">
                <div className="text-xl font-semibold">Create password</div>
                <div className="text-sm text-muted-foreground">Secure your new account for {signupIdentifier}</div>
                <div className="relative">
                  <input
                    required
                    type={showSignupPw ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  <button type="button" aria-label="Show password" onClick={() => setShowSignupPw((s)=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">
                    {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    required
                    type={showSignupPw2 ? "text" : "password"}
                    value={signupPassword2}
                    onChange={(e) => setSignupPassword2(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full h-11 px-3 pr-10 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  />
                  <button type="button" aria-label="Show password" onClick={() => setShowSignupPw2((s)=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md hover:bg-white/5">
                    {showSignupPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupPasswordErr && <div className="text-xs text-red-300">{signupPasswordErr}</div>}
                <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Set Password</button>
              </form>
            )}

            {step === "profile" && (
              <form onSubmit={submitProfile} className="space-y-4">
                <div className="text-xl font-semibold">Profile setup</div>
                <label className="text-xs inline-flex items-center gap-2"><input type="checkbox" checked={rememberSignup} onChange={(e)=>setRememberSignup(e.target.checked)} /> Remember me</label>
                <div className="flex items-center gap-4">
                  <img src="https://i.pravatar.cc/150?img=1" className="h-16 w-16 rounded-full object-cover ring-2 ring-fuchsia-400/40" />
                  <button type="button" className="text-xs px-3 py-1 rounded-full border border-white/10">Change</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="h-11 px-3 rounded-md bg-background border border-white/10"
                  />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="h-11 px-3 rounded-md bg-background border border-white/10"
                  />
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-background border border-white/10"
                />
                <label className="text-sm">Entrance style</label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    "Comet Trail",
                    "Warp Jump",
                    "Starlight",
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setEntrance(opt)}
                      className={"px-2 py-1 rounded-md border " + (entrance === opt ? "border-fuchsia-400/60 bg-fuchsia-500/10" : "border-white/10")}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Continue</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
