import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import SpinningGalaxy from "@/components/galaxy/SpinningGalaxy";
import Navbar from "@/components/galaxy/Navbar";

export default function ForgotPassword() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = /@/.test(value) || /^\+?\d{7,15}$/.test(value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      const channel = /@/.test(value) ? "email" : "phone";
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, identifier: value }) });
      await r.json().catch(()=>({}));
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        {!sent ? (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
            <div className="text-lg font-semibold">Reset access</div>
            <div className="text-sm text-muted-foreground">Enter your email or phone number</div>
            <input
              aria-label="Email or phone"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="email@galaxy.space or +123456789"
              className="w-full h-11 px-3 rounded-md bg-background border border-white/10"
            />
            <button disabled={!valid || loading} className="w-full h-11 rounded-md bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <SpinningGalaxy size={18} />}<span>Send Reset Link</span>
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 text-center space-y-3">
            <div className="mx-auto"><SpinningGalaxy size={40} /></div>
            <div className="text-lg font-semibold">Check your email</div>
            <div className="text-sm text-muted-foreground">We sent a link to {value}. Follow it to reset your password.</div>
          </div>
        )}
      </section>
      <Navbar />
    </div>
  );
}
