import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Shield, Palette, CheckCircle2, XCircle, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";

const entranceOptions = ["Comet Trail", "Warp Jump", "Starlight"] as const;
const genders = ["Male","Female","Non-binary","Prefer not to say"] as const;
const pronouns = ["He/Him","She/Her","They/Them","Prefer not to say"] as const;
const themes = [
  { key: "dark", label: "Dark Mode" },
  { key: "dragon", label: "Galaxy Glow" },
] as const;

export default function ProfileSetup() {
  const nav = useNavigate();
  const { setTheme } = useAppState();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [bio, setBio] = useState("");
  const [entrance, setEntrance] = useState<(typeof entranceOptions)[number]>("Comet Trail");
  const [emailVerified, setEmailVerified] = useState(false);
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [gender, setGender] = useState(genders[3]);
  const [pronoun, setPronoun] = useState(pronouns[3]);
  const [theme, setThemeChoice] = useState<typeof themes[number]["key"]>(themes[0].key);
  const [isPrivate, setIsPrivate] = useState(false);
  const [dob, setDob] = useState("");
  const [accountType, setAccountType] = useState<'personal'|'creator'|'business'>('personal');

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz || "");
      setEmailVerified(localStorage.getItem("galaxy-email-verified") === "1");
      if (!location && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }, () => {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!username) { setAvailable(null); return; }
    const id = window.setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const d = await r.json();
        setAvailable(!!d.available);
      } catch { setAvailable(null); }
      setChecking(false);
    }, 400);
    return () => window.clearTimeout(id);
  }, [username]);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  const canSave = useMemo(() => displayName && username && available !== false, [displayName, username, available]);

  const fileToDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_error"));
    reader.readAsDataURL(f);
  });

  const onSave = async () => {
    let avatarDataUrl: string | undefined;
    try {
      if (avatarFile) avatarDataUrl = await fileToDataUrl(avatarFile);
    } catch {}

    try {
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      await fetch("/api/profile/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          displayName,
          username,
          bio,
          entrance,
          location,
          timezone,
          gender,
          pronoun,
          theme,
          isPrivate,
          emailVerified,
          avatarDataUrl,
          dob: dob || undefined,
          accountType,
        }),
      });
    } catch {}

    try {
      localStorage.setItem("profile-displayName", displayName);
      localStorage.setItem("profile-username", username);
      localStorage.setItem("profile-bio", bio);
      localStorage.setItem("profile-entrance", entrance);
      localStorage.setItem("profile-theme", theme);
      localStorage.setItem("profile-private", isPrivate ? "1" : "0");
      localStorage.setItem("galaxy-entrance-style", entrance);
      localStorage.setItem("galaxy-entrance-trigger", "1");
    } catch {}
    if (theme === "dragon") setTheme("dragon");
    else if (theme === "dark") setTheme("dark");
    else setTheme("dark");
    nav(`/profile/view/${encodeURIComponent(username)}`);
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground relative overflow-x-hidden">
      <TopBar />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 -translate-x-1/2 top-24 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 blur-3xl" />
      </div>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-indigo-400 drop-shadow-neon">Profile Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize how you appear across the galaxy.</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-fuchsia-400/40 bg-black/30 grid place-items-center">
                {avatarUrl ? (
                  <img src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 opacity-60" />
                )}
              </div>
              <button onClick={() => fileRef.current?.click()} className="mt-2 text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/5">Upload</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-[240px]">
              <div>
                <label className="text-xs">Display Name</label>
                <input value={displayName} onChange={(e)=> setDisplayName(e.target.value)} className="w-full h-11 px-3 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40" placeholder="Nova Star" />
              </div>
              <div>
                <label className="text-xs">Username</label>
                <div className="relative">
                  <input value={username} onChange={(e)=> setUsername(e.target.value)} className="w-full h-11 pl-3 pr-16 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40" placeholder="nova" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                    {checking && <span className="opacity-70">checking…</span>}
                    {!checking && available === true && <span className="text-green-300">available</span>}
                    {!checking && available === false && <span className="text-red-300">taken</span>}
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs">Bio / About Me</label>
                <textarea value={bio} onChange={(e)=> setBio(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40" placeholder="Exploring nebulas and collecting dragon food." />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
          <div className="text-sm font-semibold mb-3">Entrance Style</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            {entranceOptions.map(opt => (
              <button key={opt} type="button" onClick={()=> setEntrance(opt)} className={"px-3 py-2 rounded-md border transition " + (entrance===opt?"border-fuchsia-400/60 bg-fuchsia-500/10 shadow-[0_0_24px_rgba(99,102,241,0.4)]":"border-white/10 hover:bg-white/5")}>{opt}</button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 opacity-80" /> Location</div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input value={location} onChange={(e)=> setLocation(e.target.value)} className="h-10 px-3 rounded-md bg-background border border-white/10 flex-1 min-w-[180px]" placeholder="Auto-detected" />
              <select value={timezone} onChange={(e)=> setTimezone(e.target.value)} className="h-10 px-2 rounded-md bg-background border border-white/10 min-w-[180px]">
                {timezones.map(tz => (<option key={tz} value={tz}>{tz}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs">Date of Birth</label>
              <input type="date" value={dob} onChange={(e)=>setDob(e.target.value)} className="h-10 w-full px-3 rounded-md bg-background border border-white/10" />
            </div>
            <div>
              <label className="text-xs">Account Type</label>
              <select value={accountType} onChange={(e)=>setAccountType(e.target.value as any)} className="h-10 w-full px-2 rounded-md bg-background border border-white/10">
                <option value="personal">Personal</option>
                <option value="creator">Creator</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold mb-2">Gender</div>
            <select value={gender} onChange={(e)=> setGender(e.target.value as any)} className="h-10 px-2 rounded-md bg-background border border-white/10 w-full">
              {genders.map(g => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Pronouns</div>
            <select value={pronoun} onChange={(e)=> setPronoun(e.target.value as any)} className="h-10 px-2 rounded-md bg-background border border-white/10 w-full">
              {pronouns.map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
          <div className="flex items-center gap-2 text-sm mb-3"><Palette className="h-4 w-4 opacity-80" /> Theme Preference</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {themes.map(t => (
              <label key={t.key} className={"px-3 py-2 rounded-md border cursor-pointer " + (theme===t.key?"border-cyan-400/60 bg-cyan-500/10":"border-white/10 hover:bg-white/5") }>
                <input type="radio" name="theme" value={t.key} checked={theme===t.key} onChange={()=> setThemeChoice(t.key)} className="mr-2" /> {t.label}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 opacity-80" /> Privacy</div>
          <div className="flex items-center justify-between">
            <div className="text-sm">Public Profile / Private Profile</div>
            <label className="inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" className="hidden" checked={isPrivate} onChange={(e)=> setIsPrivate(e.target.checked)} />
              <span className={"w-12 h-6 rounded-full transition relative " + (isPrivate?"bg-fuchsia-600":"bg-white/20") }>
                <span className={"absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition " + (isPrivate?"translate-x-6":"")}></span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-5 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)]">
          <div className="text-sm font-semibold mb-2">Email Verification</div>
          <div className="flex items-center gap-2">
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-green-300 text-sm"><CheckCircle2 className="h-4 w-4" /> Verified</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-300 text-sm"><XCircle className="h-4 w-4" /> Not Verified</span>
            )}
            {!emailVerified && (
              <button className="text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/5" onClick={() => alert('Verification email sent (dev)')}>Send Verification</button>
            )}
          </div>
        </section>

        <div className="pt-2">
          <button disabled={!canSave} onClick={onSave} className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-indigo-500 text-black font-semibold shadow-[0_0_40px_rgba(99,102,241,0.45)] hover:brightness-110 transition disabled:opacity-60">
            Save & Continue
          </button>
        </div>
      </main>
      <Navbar />
    </div>
  );
}

const timezones = (() => {
  try {
    return (Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : [Intl.DateTimeFormat().resolvedOptions().timeZone];
  } catch { return ["UTC"]; }
})();
