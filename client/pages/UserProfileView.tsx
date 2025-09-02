import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import EnergyBarVertical from "@/components/galaxy/EnergyBarVertical";
import EnergyBarHorizontal from "@/components/galaxy/EnergyBarHorizontal";
import { CheckCircle2, Flame, Star, Sparkles, MessageCircle, Award, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FloatingPanel from "@/components/galaxy/FloatingPanel";

interface PostItem {
  postId: string;
  contentType: "image" | "reel" | "text";
  contentUrl: string;
  caption: string;
  likes: number;
  comments: { userId: string; text: string; date: string }[];
  createdAt: string;
}
interface HighlightItem { highlightId: string; contentUrl: string; title: string }
interface AchievementItem { badgeId: string; badgeName: string; iconUrl: string }
interface ConnectionItem { friendId: string; username: string; profilePic: string }

export default function UserProfileView() {
  const { username = "nova" } = useParams();
  const { anonymous, setTheme } = useAppState();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    bio: string;
    entrance: string;
    location?: string;
    timezone?: string;
    gender?: string;
    pronoun?: string;
    theme?: string;
    isPrivate?: boolean;
    emailVerified?: boolean;
    avatarUrl?: string;
    linkedStars?: number;
    starlit?: number;
  } | null>(null);

  const [showMoreBio, setShowMoreBio] = useState(false);
  const [linked, setLinked] = useState(false);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);

  const [openHighlight, setOpenHighlight] = useState<HighlightItem | null>(null);
  const [openConnection, setOpenConnection] = useState<ConnectionItem | null>(null);

  const ownUsername = useMemo(() => {
    try { return (localStorage.getItem("profile-username") || "").toLowerCase(); } catch { return ""; }
  }, []);
  const isOwn = ownUsername && ownUsername === String(username || "").toLowerCase();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers: Record<string,string> = {};
        try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
        const r = await fetch(`/api/profile/me?username=${encodeURIComponent(String(username||""))}`, { headers });
        const d = await r.json();
        if (mounted && d && d.profile) {
          setProfile(d.profile);
          if (isOwn) {
            if (d.profile.theme === "dragon") setTheme("dragon"); else setTheme("dark");
          }
        } else if (mounted) {
          setProfile(null);
        }
      } catch {
        if (mounted) setProfile(null);
      }
    })();
    return () => { mounted = false; };
  }, [username, anonymous, isOwn, setTheme]);

  // Load lower-half data
  useEffect(() => {
    let active = true;
    const id = encodeURIComponent(String(username||""));
    (async () => {
      try {
        const [pr, po, hi, ach, con] = await Promise.all([
          fetch(`/api/profile/${id}`),
          fetch(`/api/profile/${id}/posts`),
          fetch(`/api/profile/${id}/highlights`),
          fetch(`/api/profile/${id}/achievements`),
          fetch(`/api/profile/${id}/connections`),
        ]);
        if (!active) return;
        try { const pj = await pr.json(); if (pj?.profile) setProfile((p)=> ({ ...pj.profile, ...p })); } catch {}
        try { const pj = await po.json(); if (Array.isArray(pj?.posts)) setPosts(pj.posts); } catch {}
        try { const hj = await hi.json(); if (Array.isArray(hj?.highlights)) setHighlights(hj.highlights); } catch {}
        try { const aj = await ach.json(); if (Array.isArray(aj?.achievements)) setAchievements(aj.achievements); } catch {}
        try { const cj = await con.json(); if (Array.isArray(cj?.connections)) setConnections(cj.connections); } catch {}
      } catch {}
    })();
    return () => { active = false; };
  }, [username]);

  const energy = 82;
  const name = profile?.displayName || String(username||"");
  const avatar = profile?.avatarUrl || "/placeholder.svg";
  const bio = profile?.bio || "";
  const pronoun = profile?.pronoun && profile.pronoun !== "Prefer not to say" ? profile.pronoun : "";
  const emailVerified = !!profile?.emailVerified;

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 mb-[-2px] sm:mb-0">
        <div className="relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur p-6 overflow-hidden mt-[-5px] sm:mt-0">
          <div className="absolute -top-24 -left-12 h-60 w-60 rounded-full bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-12 h-60 w-60 rounded-full bg-gradient-to-br from-amber-400/20 to-pink-500/20 blur-3xl" />

          <div className="mb-3">
            <EnergyBarHorizontal value={energy} />
          </div>

          {/* Header row: info left, actions right (stack on mobile) */}
          <div className="flex flex-row items-start justify-between gap-4">
            {/* Info */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 sm:gap-1 mr-auto">
              <div className="relative h-24 w-24">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 opacity-70 blur-[2px] shadow-[0_0_50px_rgba(168,85,247,0.6)]" />
                <span className="absolute inset-[3px] rounded-full bg-background" />
                <img src={avatar} alt="avatar" className="absolute inset-[6px] rounded-full object-cover" />
              </div>
              <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold">{name}</h1>
                <div className="h-7 w-7 rounded-full grid place-items-center bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-xl shadow-[0_0_24px_rgba(217,70,239,0.6)]">
                  <Flame className="h-4 w-4 text-amber-300 drop-shadow-neon" />
                </div>
                {emailVerified && <span className="inline-flex items-center gap-1 text-green-300 text-xs"><CheckCircle2 className="h-4 w-4" /> Verified</span>}
                {pronoun && <span className="px-2 py-0.5 rounded-full border border-white/10 text-[10px]">{pronoun}</span>}
              </div>
              <div className="text-sm text-muted-foreground mt-[-4px] sm:mt-0">@{username} • Dragon Rider</div>
            </div>

            {/* Actions */}
            <div className="w-[44%] sm:w-56 ml-auto space-y-2 sm:mt-1">
              <button onClick={() => { setLinked((v)=>!v); toast({ title: linked ? "Star unlinked" : "Star linked", description: `@${username}` }); }} className="w-full h-11 rounded-full border border-white/10 bg-gradient-to-r from-indigo-700/40 via-purple-700/40 to-amber-600/40 text-sm shadow-[0_0_20px_rgba(129,140,248,0.4)] hover:bg-white/10 flex items-center justify-center gap-2">
                <Star className="h-4 w-4" /> {linked ? "Unlink Star" : "Link Star"}
              </button>
              <button onClick={() => navigate('/profile/edit')} className="w-full h-11 rounded-full border border-white/10 bg-card/80 backdrop-blur text-sm shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:bg-white/5 flex items-center justify-center gap-2">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F616e40df5b1444fa9277ddaec7058a00%2F2cb3ea125c7d4572bdc3cb8d91602249?format=webp&width=24" alt="edit" className="h-4 w-4" /> Edit Profile
              </button>
              <button onClick={() => navigate(`/messages?to=${encodeURIComponent(String(username||''))}`)} className="w-full h-11 rounded-full border border-white/10 bg-card/80 backdrop-blur text-sm shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:bg-white/5 flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" /> Whisper
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-[3px] sm:mt-4 grid grid-cols-2 gap-2 w-full sm:max-w-md mx-auto sm:mx-0">
            <div className="rounded-lg border border-white/10 bg-card/70 px-3 py-2 flex items-center gap-2 shadow-[0_0_18px_rgba(129,140,248,0.25)]">
              <Star className="h-4 w-4 text-yellow-300" />
              <div className="text-xs">
                <div className="text-muted-foreground">Linked Stars</div>
                <div className="font-semibold text-sm leading-tight">{profile?.linkedStars ?? 0}</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-card/70 px-3 py-2 flex items-center gap-2 shadow-[0_0_18px_rgba(99,102,241,0.25)]">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <div className="text-xs">
                <div className="text-muted-foreground">Starlit</div>
                <div className="font-semibold text-sm leading-tight">{profile?.starlit ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Bio (clamp w/ see more) */}
          <div className="mt-[-5px] sm:mt-3 mx-auto sm:mx-0 max-w-2xl text-center sm:text-left">
            <div className={"relative rounded-lg border border-white/10 bg-card/70 backdrop-blur p-3 text-sm text-foreground/90 " + (!showMoreBio ? "max-h-16 overflow-hidden" : "") + " mt-2 sm:mt-0"}>{bio}</div>
            {!showMoreBio && bio && bio.length > 60 && (
              <div className="mt-1">
                <button onClick={() => setShowMoreBio(true)} className="text-xs text-cyan-300 hover:underline">See more</button>
              </div>
            )}
          </div>

          {/* Desktop energy bar (kept hidden for layout parity) */}
          <div className="hidden">
            <EnergyBarVertical value={energy} height={220} />
          </div>
        </div>

        {/* Lower half: Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="connections">Friends</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((p) => (
                  <div key={p.postId} className="rounded-xl border border-white/10 bg-card/70 backdrop-blur overflow-hidden">
                    {p.contentType !== 'text' && (
                      <img src={p.contentUrl} alt={p.caption} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3 text-sm">
                      <div className="line-clamp-2">{p.caption}</div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>❤ {p.likes}</span>
                        <span>💬 {p.comments?.length || 0}</span>
                        <span>↗︎ {Math.max(0, Math.round((p.likes || 0) / 7))}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!posts.length && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">No posts yet.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="highlights">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {highlights.map((h) => (
                  <button key={h.highlightId} onClick={() => setOpenHighlight(h)} className="group relative rounded-xl overflow-hidden border border-white/10">
                    <img src={h.contentUrl} alt={h.title} className="w-full h-32 object-cover group-hover:scale-[1.02] transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-1 left-2 right-2 text-[11px] text-white/90">{h.title}</div>
                  </button>
                ))}
                {!highlights.length && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">No highlights yet.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {achievements.map((b) => (
                  <div key={b.badgeId} className="relative rounded-xl border border-white/10 bg-card/70 p-3 text-center overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,.12),transparent_70%)]" />
                    <img src={b.iconUrl} alt={b.badgeName} className="h-8 w-8 mx-auto" />
                    <div className="mt-1 text-[11px]">{b.badgeName}</div>
                  </div>
                ))}
                {!achievements.length && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">No achievements yet.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="connections">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {connections.map((c) => (
                  <button key={c.friendId} onClick={() => setOpenConnection(c)} className="rounded-xl border border-white/10 bg-card/70 p-3 text-left hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition">
                    <div className="flex items-center gap-2">
                      <img src={c.profilePic} alt={c.username} className="h-8 w-8 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-medium">{c.username}</div>
                        <div className="text-[11px] text-muted-foreground">Friend</div>
                      </div>
                    </div>
                  </button>
                ))}
                {!connections.length && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">No connections yet.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-center">
            <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-white/10 bg-card/80 hover:bg-white/5">
              <Users className="h-4 w-4" /> Explore More Stars
            </button>
          </div>
        </div>
      </section>

      <FloatingPanel open={!!openHighlight} onClose={() => setOpenHighlight(null)} title={openHighlight?.title || ""}>
        {openHighlight && (
          <div className="space-y-2">
            <img src={openHighlight.contentUrl} alt={openHighlight.title} className="w-full max-h-[60vh] object-cover rounded-lg" />
            <div className="text-sm text-muted-foreground">{openHighlight.title}</div>
          </div>
        )}
      </FloatingPanel>

      <FloatingPanel open={!!openConnection} onClose={() => setOpenConnection(null)} title={openConnection?.username || "Profile"}>
        {openConnection && (
          <div className="flex items-center gap-3">
            <img src={openConnection.profilePic} alt={openConnection.username} className="h-12 w-12 rounded-full object-cover" />
            <div>
              <div className="font-semibold">{openConnection.username}</div>
              <div className="text-xs text-muted-foreground">Cosmic friend</div>
              <div className="mt-2">
                <button onClick={() => { setOpenConnection(null); navigate(`/profile/view/${encodeURIComponent(openConnection.username)}`); }} className="px-3 h-9 rounded-md border border-white/10">Visit profile</button>
              </div>
            </div>
          </div>
        )}
      </FloatingPanel>

      <Navbar />
    </div>
  );
}
