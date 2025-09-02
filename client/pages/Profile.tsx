import TopBar from "@/components/galaxy/TopBar";
import EnergyBarVertical from "@/components/galaxy/EnergyBarVertical";
import FloatingPanel from "@/components/galaxy/FloatingPanel";
import HoloPost, { HoloPostData } from "@/components/galaxy/HoloPost";
import { useState } from "react";
import { Flame, Sparkles, Globe2, Award, Star, Stars, X } from "lucide-react";
import AvatarCropper from "@/components/galaxy/AvatarCropper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/galaxy/Navbar";

export default function Profile() {
  const [openHighlights, setOpenHighlights] = useState(false);
  const [openWorld, setOpenWorld] = useState(false);
  const [openBadges, setOpenBadges] = useState(false);

  const [name, setName] = useState("Nova Star");
  const [username, setUsername] = useState("nova");
  const [bio, setBio] = useState("Collector of star links and dragon food.");
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/180?img=1");
  const [editOpen, setEditOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [gender, setGender] = useState("");
  const [dob, setDob] = useState<string>("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [music, setMusic] = useState("");

  const posts: HoloPostData[] = [
    {
      id: "p1",
      title: "Nebula Drift",
      image: "https://images.unsplash.com/photo-1517976487492-576ea6b2936b?q=80&w=1470&auto=format&fit=crop",
      energy: 88,
    },
    {
      id: "p2",
      title: "Dragon Trail",
      image: "https://images.unsplash.com/photo-1514517220031-64db69a3e76f?q=80&w=1470&auto=format&fit=crop",
      energy: 73,
    },
    {
      id: "p3",
      title: "Starlink Peak",
      image: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=1470&auto=format&fit=crop",
      energy: 64,
    },
  ];

  const addHobby = () => {
    const v = hobbyInput.trim();
    if (!v) return;
    if (!hobbies.includes(v)) setHobbies([...hobbies, v]);
    setHobbyInput("");
  };

  const removeHobby = (h: string) => {
    setHobbies(hobbies.filter((x) => x !== h));
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur p-6 overflow-hidden">
          <div className="absolute -top-24 -left-12 h-60 w-60 rounded-full bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-12 h-60 w-60 rounded-full bg-gradient-to-br from-amber-400/20 to-pink-500/20 blur-3xl" />

          <div className="grid grid-cols-[auto_1fr_auto] gap-6 items-center">
            {/* Avatar + rings */}
            <div className="flex flex-col items-center">
              <div className="relative h-28 w-28">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 animate-spin-slow shadow-[0_0_60px_rgba(168,85,247,0.7)]"></span>
                <span className="absolute inset-1 rounded-full bg-background"></span>
                <img src={avatar} alt="avatar" className="absolute inset-2 rounded-full object-cover" />
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="mt-2 px-3 h-7 rounded-full border border-white/10 bg-card/80 backdrop-blur text-xs hover:bg-white/5"
              >
                Edit Profile
              </button>
            </div>

            {/* Name + dragon + actions */}
            <div>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{name}</h1>
                    <div className="h-8 w-8 rounded-full grid place-items-center bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-xl shadow-[0_0_30px_rgba(217,70,239,0.6)]">
                      <Flame className="h-5 w-5 text-amber-300 drop-shadow-neon" />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">@{username} • Dragon Rider</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                    <div className="rounded-lg border border-white/10 bg-card/70 px-3 py-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-300" />
                      <div className="text-xs">
                        <div className="text-muted-foreground">Linked Stars</div>
                        <div className="font-semibold text-sm leading-tight">12,800</div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-card/70 px-3 py-2 flex items-center gap-2">
                      <Stars className="h-4 w-4 text-cyan-300" />
                      <div className="text-xs">
                        <div className="text-muted-foreground">Starlit</div>
                        <div className="font-semibold text-sm leading-tight">342</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 hidden sm:flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md border border-white/10 text-[10px]">Energy 86%</span>
                    <span className="px-2 py-0.5 rounded-md border border-white/10 text-[10px]">Badges 9</span>
                  </div>
                </div>
                <div className="hidden">
                  <div className="flex items-center gap-2 -translate-y-2 md:-translate-y-3">
                    <div className="relative h-12 w-12">
                      <svg viewBox="0 0 24 24" className="absolute inset-0 text-yellow-300 drop-shadow-neon"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.8 5.5 21 7.5 13.5 2 9 9 12 2" fill="currentColor"/></svg>
                      <span className="absolute inset-0 grid place-items-center text-[10px] font-bold uppercase tracking-wide">link</span>
                    </div>
                    <span className="font-semibold text-sm">12,800</span>
                  </div>
                  <div className="flex items-center gap-2 -translate-y-2 md:-translate-y-3">
                    <div className="relative h-12 w-12">
                      <svg viewBox="0 0 24 24" className="absolute inset-0 text-cyan-300 drop-shadow-neon"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.8 5.5 21 7.5 13.5 2 9 9 12 2" fill="currentColor"/></svg>
                      <span className="absolute inset-0 grid place-items-center text-[10px] font-bold uppercase tracking-wide">lit</span>
                    </div>
                    <span className="font-semibold text-sm">342</span>
                  </div>
                  <div className="mt-1 hidden sm:flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full border border-white/10 text-[10px]">Energy 86%</span>
                    <span className="px-2 py-0.5 rounded-full border border-white/10 text-[10px]">Badges 9</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setOpenHighlights(true)}
                  className="h-9 w-9 rounded-full border border-yellow-300/40 bg-yellow-300/10 hover:bg-yellow-300/15 grid place-items-center shadow-[0_0_12px_rgba(234,179,8,0.25)]"
                  aria-label="Highlights"
                  title="Highlights"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </button>
                <button
                  onClick={() => setOpenWorld(true)}
                  className="h-9 w-9 rounded-full border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/15 grid place-items-center"
                  aria-label="World"
                  title="World"
                >
                  <Globe2 className="h-4 w-4 text-cyan-300" />
                </button>
                <button
                  onClick={() => setOpenBadges(true)}
                  className="h-9 w-9 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 hover:bg-fuchsia-400/15 grid place-items-center"
                  aria-label="Badges"
                  title="Badges"
                >
                  <Award className="h-4 w-4 text-fuchsia-300" />
                </button>
              </div>

              <div className="mt-3 -ml-2 max-w-xl rounded-lg border border-white/10 bg-card/70 backdrop-blur p-3 text-sm text-foreground/90">
                {bio}
              </div>

            </div>

            {/* Vertical Energy */}
            <div className="hidden sm:block">
              <EnergyBarVertical value={86} height={220} />
            </div>
          </div>

        </div>

        {/* Posts grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <HoloPost key={p.id} post={p} />
          ))}
        </div>
      </section>

      {/* Panels */}
      <FloatingPanel open={openHighlights} onClose={() => setOpenHighlights(false)} title="Highlights">
        <div className="grid gap-3 sm:grid-cols-2">
          {["First Starlink", "Dragon Run #7", "Nebula Concert", "Phoenix Rising"].map((h) => (
            <div key={h} className="rounded-xl border border-white/10 bg-background/60 p-3 backdrop-blur">
              <div className="text-sm font-medium">{h}</div>
              <div className="text-xs text-muted-foreground">A magical scroll of memories.</div>
            </div>
          ))}
        </div>
      </FloatingPanel>

      <FloatingPanel open={openWorld} onClose={() => setOpenWorld(false)} title="World • Most energetic post of the month">
        <HoloPost
          post={{
            id: "pm",
            title: "Crown of Orion",
            image: "https://images.unsplash.com/photo-1473929734678-b47b3a7f5936?q=80&w=1470&auto=format&fit=crop",
            energy: 97,
          }}
        />
      </FloatingPanel>

      <FloatingPanel open={openBadges} onClose={() => setOpenBadges(false)} title="Badges">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {["Dragon Rider", "Whisperer", "Explorer", "Nebula Diver", "Starlinked", "Phoenix", "Guardian", "Seer"].map(
            (b) => (
              <div key={b} className="rounded-xl border border-white/10 bg-card/70 backdrop-blur p-3 text-center">
                <Award className="h-6 w-6 mx-auto text-amber-300" />
                <div className="mt-1 text-[11px]">{b}</div>
              </div>
            )
          )}
        </div>
      </FloatingPanel>
      <FloatingPanel open={editOpen} onClose={() => { setEditOpen(false); setCropSrc(null); }} title="Edit Profile">
        <div className="space-y-4">
          <Tabs defaultValue="main" className="w-full">
            <TabsList>
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <div className="flex items-center gap-4">
                <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover border border-white/10" />
                <div className="space-x-2">
                  <label className="px-3 h-9 inline-flex items-center rounded-md border border-white/10 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCropSrc(URL.createObjectURL(file));
                      }}
                    />
                    Change photo
                  </label>
                  <button className="px-3 h-9 rounded-md border border-white/10" onClick={() => setCropSrc(null)}>
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Username</label>
                  <div className="mt-1 flex items-center">
                    <span className="px-2 h-10 border border-r-0 border-white/10 rounded-l-md bg-background text-sm">@</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_\-]/g, ""))}
                      className="flex-1 h-10 px-3 rounded-r-md bg-background border border-white/10 border-l-0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-white/10"
                  >
                    <option value="">Select Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-white/10"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-background border border-white/10"
                />
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Favorite Music</label>
                <input
                  value={music}
                  onChange={(e) => setMusic(e.target.value)}
                  placeholder="e.g., Synthwave, Classical, Rock or a song/artist"
                  className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-white/10"
                />
              </div>

              {cropSrc && (
                <div className="mt-4">
                  <AvatarCropper
                    src={cropSrc}
                    onCancel={() => setCropSrc(null)}
                    onSave={(url) => {
                      setAvatar(url);
                      setCropSrc(null);
                    }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="hobbies">
              <div>
                <label className="text-xs text-muted-foreground">Hobbies</label>
                <div className="mt-1 rounded-md border border-white/10 bg-background p-2">
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/70 px-2 py-1 text-xs"
                      >
                        {h}
                        <button
                          onClick={() => removeHobby(h)}
                          className="hover:text-destructive"
                          aria-label={`Remove ${h}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={hobbyInput}
                      onChange={(e) => setHobbyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addHobby();
                        }
                      }}
                      placeholder="Type a hobby and press Enter"
                      className="flex-1 h-10 px-3 rounded-md bg-background border border-white/10"
                    />
                    <button onClick={addHobby} className="px-3 h-10 rounded-md border border-white/10">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <button className="px-3 h-9 rounded-md border border-white/10" onClick={() => { setEditOpen(false); }}>
              Close
            </button>
            <button
              className="px-3 h-9 rounded-md bg-primary text-primary-foreground"
              onClick={() => setEditOpen(false)}
            >
              Save Changes
            </button>
          </div>
        </div>
      </FloatingPanel>
      <Navbar />
    </div>
  );
}
