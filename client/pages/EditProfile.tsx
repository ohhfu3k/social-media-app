import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAppState } from "@/context/app-state";

export default function EditProfile() {
  const navigate = useNavigate();
  const { setTheme } = useAppState();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    pronoun: "",
    themeMode: "dark" as "dark" | "stardust" | "nebula",
    ring: "purple" as "purple" | "neon" | "gold" | "starlight",
    starSign: "",
    energyStyle: "meteor" as "meteor" | "nebula" | "beam",
    website: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    discord: "",
    contactEmail: "",
    contactPhone: "",
    contactVisibility: "public" as "public" | "friends" | "private",
    accountType: "public" as "public" | "friends" | "private",
    whoCanMessage: "everyone" as "everyone" | "starlits" | "none",
    showFollowers: true,
    showHighlights: true,
    showEnergy: true,
    themeSong: "",
    mood: "",
    tagline: "",
    avatarUrl: "",
  });

  const ownUsername = useMemo(() => {
    try { return (localStorage.getItem("profile-username") || ""); } catch { return ""; }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers: Record<string,string> = {};
        try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
        const r = await fetch("/api/profile/me", { headers });
        const d = await r.json();
        const p = d?.profile;
        if (mounted && p) {
          setForm((f) => ({
            ...f,
            displayName: p.displayName || f.displayName,
            username: p.username || ownUsername || f.username,
            bio: p.bio || f.bio,
            pronoun: p.pronoun && p.pronoun !== "Prefer not to say" ? p.pronoun : "",
            avatarUrl: p.avatarUrl || f.avatarUrl,
            themeMode: p.theme === "dragon" ? "stardust" : "dark",
          }));
          if (p.avatarUrl) setPreview(p.avatarUrl);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [ownUsername]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload: any = {
        displayName: form.displayName,
        username: form.username,
        bio: form.bio,
        pronoun: form.pronoun || "Prefer not to say",
        entrance: "Comet Trail",
        theme: form.themeMode === "dark" ? "dark" : "dragon",
        avatarDataUrl: preview || form.avatarUrl || undefined,
        // Persist extras for future use
        extras: {
          ring: form.ring,
          starSign: form.starSign,
          energyStyle: form.energyStyle,
          links: {
            website: form.website,
            instagram: form.instagram,
            twitter: form.twitter,
            linkedin: form.linkedin,
            discord: form.discord,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            contactVisibility: form.contactVisibility,
          },
          prefs: {
            accountType: form.accountType,
            whoCanMessage: form.whoCanMessage,
            showFollowers: form.showFollowers,
            showHighlights: form.showHighlights,
            showEnergy: form.showEnergy,
          },
          fun: {
            themeSong: form.themeSong,
            mood: form.mood,
            tagline: form.tagline,
          },
        },
      };
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      toast({ title: "Profile saved", description: "Your cosmic profile has been updated." });
      // optionally update theme immediately
      setTheme(payload.theme === "dragon" ? "dragon" : "dark");
      setLoading(false);
      navigate(`/profile/view/${encodeURIComponent(form.username || ownUsername || "me")}`);
    } catch (e) {
      setLoading(false);
      toast({ title: "Save failed", description: "Please try again." });
    }
  };

  const ringClass =
    form.ring === "neon"
      ? "from-fuchsia-500 to-cyan-400"
      : form.ring === "gold"
      ? "from-amber-400 to-yellow-300"
      : form.ring === "starlight"
      ? "from-cyan-300 to-blue-400"
      : "from-purple-500 to-indigo-500";

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur p-4 sm:p-6">
            <Tabs defaultValue="basic">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-xl font-semibold">Edit Profile</h1>
                <TabsList className="bg-card/70">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="custom">Customization</TabsTrigger>
                  <TabsTrigger value="links">Links</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="fun">Fun</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="basic">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative h-20 w-20">
                        <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringClass} opacity-70 blur-[2px]`} />
                        <span className="absolute inset-[3px] rounded-full bg-background" />
                        {preview ? (
                          <img src={preview} alt="avatar" className="absolute inset-[6px] rounded-full object-cover" />
                        ) : (
                          <div className="absolute inset-[6px] rounded-full grid place-items-center text-xs text-muted-foreground">Upload</div>
                        )}
                      </div>
                      <Input type="file" accept="image/*" onChange={onFile} className="max-w-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Nova Star" />
                  </div>
                  <div className="space-y-2">
                    <Label>Username / Handle</Label>
                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s+/g, "") })} placeholder="nova" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Bio / Status Line</Label>
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 200) })} placeholder="Explorer of nebulas and seeker of dragon trails." rows={3} />
                    <div className="text-xs text-muted-foreground text-right">{form.bio.length}/200</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pronouns</Label>
                    <Input value={form.pronoun} onChange={(e) => setForm({ ...form, pronoun: e.target.value })} placeholder="she/her, he/him, they/them" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Glow Ring</Label>
                    <Select value={form.ring} onValueChange={(v) => setForm({ ...form, ring: v as any })}>
                      <SelectTrigger><SelectValue placeholder="Select ring" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purple">Purple Aura</SelectItem>
                        <SelectItem value="neon">Neon</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="starlight">Starlight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Constellation / Star Sign</Label>
                    <Input value={form.starSign} onChange={(e) => setForm({ ...form, starSign: e.target.value })} placeholder="Orion" />
                  </div>
                  <div className="space-y-2">
                    <Label>Energy Bar Style</Label>
                    <Select value={form.energyStyle} onValueChange={(v) => setForm({ ...form, energyStyle: v as any })}>
                      <SelectTrigger><SelectValue placeholder="Choose style" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meteor">Meteor Pulse</SelectItem>
                        <SelectItem value="nebula">Nebula Glow</SelectItem>
                        <SelectItem value="beam">Cosmic Beam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme Mode</Label>
                    <RadioGroup value={form.themeMode} onValueChange={(v) => setForm({ ...form, themeMode: v as any })} className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="dark" /><Label htmlFor="dark">Dark Galaxy</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="stardust" id="stardust" /><Label htmlFor="stardust">Stardust</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="nebula" id="nebula" /><Label htmlFor="nebula">Nebula</Label></div>
                    </RadioGroup>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="links">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e)=>setForm({...form, website:e.target.value})} placeholder="https://" /></div>
                  <div className="space-y-2"><Label>Instagram</Label><Input value={form.instagram} onChange={(e)=>setForm({...form, instagram:e.target.value})} placeholder="@" /></div>
                  <div className="space-y-2"><Label>X (Twitter)</Label><Input value={form.twitter} onChange={(e)=>setForm({...form, twitter:e.target.value})} placeholder="@" /></div>
                  <div className="space-y-2"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e)=>setForm({...form, linkedin:e.target.value})} placeholder="https://" /></div>
                  <div className="space-y-2"><Label>Discord</Label><Input value={form.discord} onChange={(e)=>setForm({...form, discord:e.target.value})} placeholder="username#0000" /></div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Contact Email</Label>
                    <Input value={form.contactEmail} onChange={(e)=>setForm({...form, contactEmail:e.target.value})} placeholder="you@galaxy.io" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input value={form.contactPhone} onChange={(e)=>setForm({...form, contactPhone:e.target.value})} placeholder="+1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Visibility</Label>
                    <Select value={form.contactVisibility} onValueChange={(v)=>setForm({...form, contactVisibility: v as any})}>
                      <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="privacy">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 p-3">
                    <div>
                      <div className="text-sm font-medium">Account Type</div>
                      <div className="text-xs text-muted-foreground">Public / Friends / Private</div>
                    </div>
                    <Select value={form.accountType} onValueChange={(v)=>setForm({...form, accountType: v as any})}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 p-3">
                    <div>
                      <div className="text-sm font-medium">Who Can Message Me?</div>
                      <div className="text-xs text-muted-foreground">Everyone / Starlits / No one</div>
                    </div>
                    <Select value={form.whoCanMessage} onValueChange={(v)=>setForm({...form, whoCanMessage: v as any})}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="starlits">Starlits only</SelectItem>
                        <SelectItem value="none">No one</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 p-3"><div className="text-sm">Followers & Following Visibility</div><Switch checked={form.showFollowers} onCheckedChange={(v)=>setForm({...form, showFollowers: v})} /></div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 p-3"><div className="text-sm">Highlights Visibility</div><Switch checked={form.showHighlights} onCheckedChange={(v)=>setForm({...form, showHighlights: v})} /></div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/60 p-3"><div className="text-sm">Energy Bar Visibility</div><Switch checked={form.showEnergy} onCheckedChange={(v)=>setForm({...form, showEnergy: v})} /></div>
                </div>
              </TabsContent>

              <TabsContent value="fun">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Profile Theme Song (URL)</Label><Input value={form.themeSong} onChange={(e)=>setForm({...form, themeSong: e.target.value})} placeholder="https://" /></div>
                  <div className="space-y-2"><Label>Mood Status</Label><Input value={form.mood} onChange={(e)=>setForm({...form, mood: e.target.value})} placeholder="🌙 Dreaming in starlight" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Custom Tagline</Label><Input value={form.tagline} onChange={(e)=>setForm({...form, tagline: e.target.value})} placeholder="Seeker of dragon trails" /></div>
                </div>
              </TabsContent>

              <div className="mt-4 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button onClick={save} disabled={loading} className="rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 shadow-[0_0_24px_rgba(99,102,241,0.45)] hover:opacity-90">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur p-6">
            <div className="text-sm text-muted-foreground mb-3">Live Profile Preview</div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative h-28 w-28">
                <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${ringClass} opacity-70 blur-[2px] shadow-[0_0_50px_rgba(168,85,247,0.6)]`} />
                <span className="absolute inset-[3px] rounded-full bg-background" />
                {preview ? (
                  <img src={preview} alt="avatar" className="absolute inset-[6px] rounded-full object-cover" />
                ) : (
                  <div className="absolute inset-[6px] rounded-full grid place-items-center text-xs text-muted-foreground">No Image</div>
                )}
              </div>
              <div className="text-xl font-bold">{form.displayName}</div>
              <div className="text-sm text-muted-foreground">@{form.username || ownUsername || ""}</div>
              <div className="max-w-md text-sm text-foreground/90">{form.bio}</div>
              <div className="w-full mt-4 rounded-xl border border-white/10 p-3 bg-card/70">
                <div className="text-xs text-muted-foreground">Theme</div>
                <div className="mt-1 text-sm">{form.themeMode === "dark" ? "Dark Galaxy" : form.themeMode === "stardust" ? "Stardust" : "Nebula"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
