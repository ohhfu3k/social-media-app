import TopBar from "@/components/galaxy/TopBar";
import Stories, { Story } from "@/components/galaxy/Stories";
import PostCard, { Post } from "@/components/galaxy/PostCard";
import ChatTab, { ChatMessage } from "@/components/galaxy/ChatTab";
import Reels from "@/components/galaxy/Reels";
import { useMemo, useState, useEffect } from "react";
import Navbar from "@/components/galaxy/Navbar";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import AddStoryButton from "@/components/galaxy/AddStoryButton";
import TaleComposer, { ComposerResult } from "@/components/galaxy/TaleComposer";
import StoryCamera from "@/components/galaxy/StoryCamera";
import StoryViewer, { StoryUser, StorySegment } from "@/components/galaxy/StoryViewer";
import EntranceFX from "@/components/galaxy/EntranceFX";

const avatars = [
  "https://i.pravatar.cc/150?img=1",
  "https://i.pravatar.cc/150?img=2",
  "https://i.pravatar.cc/150?img=3",
  "https://i.pravatar.cc/150?img=4",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=6",
];

function cartoon(seed: string) {
  const enc = encodeURIComponent(seed);
  return `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${enc}`;
}

export default function Home() {
  const { anonymous } = useAppState();
  const [openChat, setOpenChat] = useState<{ name: string; avatar: string } | null>(null);
  const [chatMin, setChatMin] = useState(false);
  const navigate = useNavigate();
  const messages: ChatMessage[] = [
    { id: "1", author: "You", text: "Hey there!", time: "2m" },
    { id: "2", author: openChat?.name || "", text: "Starlink connected ✨", time: "1m" },
  ];

  const [openAdd, setOpenAdd] = useState(false);
  const [openCamera, setOpenCamera] = useState(false);
  const [baseMedia, setBaseMedia] = useState<{ id: string; type: "image" | "video" | "audio"; src: string } | null>(null);

  const reels = useMemo<import("@/components/galaxy/Reels").ReelItem[]>(() => ([
    { id: "r1", src: "https://www.w3schools.com/html/mov_bbb.mp4", title: "Comet Chase", size: "md" },
    { id: "r2", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", title: "Nebula Bloom", size: "sm" },
    { id: "r3", src: "https://www.w3schools.com/html/movie.mp4", title: "Warp Jump", size: "lg" },
    { id: "r4", src: "https://media.w3.org/2010/05/sintel/trailer.mp4", title: "Dragon Flight", size: "md" },
    { id: "r5", src: "https://media.w3.org/2010/05/bunny/movie.mp4", title: "Lunar Hop", size: "sm" },
  ]), []);

  const [userHasNew, setUserHasNew] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("home_stories_user_new");
    setUserHasNew(raw === "1");
  }, []);

  const normalStories: Story[] = useMemo(() => {
    const base = Array.from({ length: 12 }).map((_, i) => ({
      id: String(i + 2),
      name: ["Orion", "Lyra", "Nova", "Vega", "Andromeda", "Draco"][i % 6],
      avatar: avatars[(i + 1) % avatars.length],
      hasNew: Math.random() > 0.5,
    }));
    const currentUser: Story = { id: "admin", name: "SHANTANU CLUB", avatar: avatars[0], hasNew: userHasNew };
    return [currentUser, ...base];
  }, [userHasNew]);

  const anonStories: Story[] = useMemo(() => {
    const base = Array.from({ length: 12 }).map((_, i) => ({
      id: `star-${i + 2}`,
      name: `Star-${(1000 + i)}`,
      avatar: cartoon(`star-${i + 2}`),
    }));
    const currentUser: Story = { id: "anon-you", name: "Anon-You", avatar: cartoon("you") };
    return [currentUser, ...base];
  }, []);

  const stories = anonymous ? anonStories : normalStories;

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartUser, setViewerStartUser] = useState(0);

  const buildViewerUsers = (): StoryUser[] => {
    const entriesRaw = localStorage.getItem("home_stories_user_entries");
    const entries: any[] = entriesRaw ? JSON.parse(entriesRaw) : [];
    const now = Date.now();
    const currentUserSegments: StorySegment[] = entries
      .filter((e) => now - e.createdAt < (e.meta?.lifespanMs || 24*3600_000))
      .flatMap((e) => (e.items as any[]).map((it, idx) => ({
        id: `${e.createdAt}-${idx}`,
        type: it.type,
        src: it.src,
        createdAt: e.createdAt,
        lifespanMs: e.meta?.lifespanMs || 24*3600_000,
        meta: { cosmicSpot: e.meta?.cosmicSpot, avatarKind: e.meta?.avatarKind, authorName: "SHANTANU CLUB", authorAvatar: avatars[0] },
      })));

    const mockFor = (name: string, avatar: string): StorySegment[] => [
      { id: `${name}-1`, type: "image", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1080&auto=format&fit=crop", createdAt: now-1000*60*10, lifespanMs: 24*3600_000, meta: { cosmicSpot: "Orion Belt", authorName: name, authorAvatar: avatar } },
      { id: `${name}-2",`, type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4", createdAt: now-1000*60*9, lifespanMs: 24*3600_000, meta: { cosmicSpot: "Dragon Trail", authorName: name, authorAvatar: avatar } },
      { id: `${name}-3`, type: "audio", src: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav", createdAt: now-1000*60*8, lifespanMs: 24*3600_000, meta: { authorName: name, authorAvatar: avatar } },
    ];

    const users: StoryUser[] = [];
    // current user first
    users.push({ id: "you", name: anonymous ? undefined : "SHANTANU CLUB", avatar: anonymous ? undefined : avatars[0], kind: anonymous ? "anonymous" : "cosmic", segments: currentUserSegments });
    // others
    const base = stories.slice(1, 7);
    base.forEach((s) => {
      const kind = anonymous ? "anonymous" : "cosmic";
      const segs = mockFor(s.name, s.avatar);
      users.push({ id: s.id, name: kind==='cosmic' ? s.name : undefined, avatar: kind==='cosmic' ? s.avatar : undefined, kind, segments: segs });
    });
    return users.filter((u) => u.segments.length > 0);
  };

  const viewerUsers = useMemo(buildViewerUsers, [stories, anonymous]);

  const [feed, setFeed] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/posts?limit=30");
        const d = await r.json();
        if (Array.isArray(d?.posts)) {
          const mapped: Post[] = d.posts.map((p: any, i: number) => ({
            id: p.postId || String(i),
            name: p.username || "Star",
            handle: p.username ? `@${p.username}` : "@star",
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(p.username || p.userId || String(i))}`,
            content: p.caption || "",
            media: p.contentType === 'text' ? undefined : (p.contentType === 'reel' ? { type: 'video', src: p.contentUrl } : { type: 'image', src: p.contentUrl }),
            energy: Math.max(10, Math.min(100, (Number(p.likes||0) % 90) + 10)),
          }));
          setFeed(mapped);
        }
      } catch {}
    })();
  }, []);

  const normalPosts: Post[] = useMemo(() => feed.length ? feed : ([
    {
      id: "1",
      name: "Nova Star",
      handle: "@nova",
      avatar: avatars[0],
      content: "Exploring the Orion arm tonight. The nebulas are glowing!",
      media: { type: "image", src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1470&auto=format&fit=crop" },
      energy: 84,
    },
    {
      id: "2",
      name: "Vega",
      handle: "@vega",
      avatar: avatars[1],
      content: "New starlink connection established. Signal crystal clear across the belt.",
      media: { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      energy: 62,
    },
    {
      id: "3",
      name: "Lyra",
      handle: "@lyra",
      avatar: avatars[2],
      content: "Whispers across the void. Anyone up for a dragon run?",
      energy: 45,
    },
  ]), [feed]);

  const anonPosts: Post[] = useMemo(() => ([
    {
      id: "a1",
      name: "Anon-3421",
      handle: "@anon-3421",
      avatar: cartoon("a1"),
      content: "Echoes in the void. Sound carries farther without a name.",
      media: { type: "audio", src: "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav" },
      energy: 73,
    },
    {
      id: "a2",
      name: "Anon-9077",
      handle: "@anon-9077",
      avatar: cartoon("a2"),
      content: "Text-only transmission received.",
      energy: 51,
    },
    {
      id: "a3",
      name: "Anon-1204",
      handle: "@anon-1204",
      avatar: cartoon("a3"),
      content: "Signal ping — listening…",
      media: { type: "audio", src: "https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav" },
      energy: 64,
    },
  ]), []);

  const posts = anonymous ? anonPosts : normalPosts;

  const chats = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({
    id: String(i + 1),
    name: ["Andromeda", "Draco", "Pegasus", "Phoenix", "Sirius"][i % 5],
    avatar: anonymous ? cartoon(`chat-${i}`) : avatars[(i + 2) % avatars.length],
  })), [anonymous]);

  const [entranceStyle, setEntranceStyle] = useState<string | null>(null);
  const [showEntrance, setShowEntrance] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("galaxy-entrance-trigger") === "1") {
        const style = localStorage.getItem("galaxy-entrance-style") || "Comet Trail";
        setEntranceStyle(style);
        setShowEntrance(true);
        localStorage.removeItem("galaxy-entrance-trigger");
        window.setTimeout(() => setShowEntrance(false), 2800);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      {showEntrance && entranceStyle && (
        <EntranceFX style={entranceStyle as any} />
      )}
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
        <section className="lg:col-span-2 space-y-4">
          <Stories
            items={stories}
            addButton={<AddStoryButton onClick={() => setOpenCamera(true)} label="New Tale" />}
            onSelect={(s, idx) => {
              setViewerStartUser(Math.max(0, Math.min(idx, viewerUsers.length - 1)));
              setViewerOpen(true);
            }}
          />
          <Reels items={reels} onSelect={() => navigate('/blips')} />
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>

        <aside className="hidden lg:block space-y-4">
          <div className="sticky top-20 space-y-4">
            <Widget title="Trending">
              <ul className="text-sm space-y-2">
                <li>#OrionRun</li>
                <li>#DragonMode</li>
                <li>#NeonNebula</li>
              </ul>
            </Widget>
            {anonymous && (
              <Widget title="Stars (Followers)">
                <div className="text-2xl font-semibold">1,284</div>
                <div className="text-xs text-muted-foreground">in your anonymous universe</div>
              </Widget>
            )}
            <Widget title="StarLink">
              <p className="text-sm text-muted-foreground">Connect and share across galaxies.</p>
            </Widget>
            <Widget title="Badges">
              <div className="flex gap-2">
                <Badge>Explorer</Badge>
                <Badge>Dragon Rider</Badge>
                <Badge>Whisperer</Badge>
              </div>
            </Widget>
            <Widget title="Dragon Food">
              <p className="text-sm">+5 Energy every hour</p>
            </Widget>
            <Widget title="Suggestions">
              <ul className="text-sm space-y-2">
                {stories.slice(1, 6).map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <img src={s.avatar} className="h-6 w-6 rounded-full" />
                    <span>{s.name}</span>
                  </li>
                ))}
              </ul>
            </Widget>
          </div>
        </aside>
      </main>

      <div className="fixed right-4 top-20 bottom-24 hidden xl:flex w-[min(380px,28vw)] flex-col">
        <div className="rounded-xl border border-white/10 bg-card/80 backdrop-blur shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="h-10 flex items-center px-3 border-b border-white/10 text-sm">Chats</div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenChat({ name: c.name, avatar: c.avatar })}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5"
              >
                <img src={c.avatar} className="h-7 w-7 rounded-full" />
                <div className="text-left">
                  <div className="text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">Tap to open</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {openChat && chatMin && (
        <button
          onClick={() => setChatMin(false)}
          className="fixed bottom-20 right-6 z-50 px-3 h-10 rounded-full border border-white/10 bg-card/80 backdrop-blur flex items-center gap-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <img src={openChat.avatar} className="h-7 w-7 rounded-full" />
          <span className="text-sm">{openChat.name}</span>
        </button>
      )}

      <ChatTab
        open={!!openChat && !chatMin}
        onClose={() => { setOpenChat(null); setChatMin(false); }}
        onMinimize={() => setChatMin(true)}
        name={openChat?.name || ""}
        avatar={openChat?.avatar || ""}
        messages={messages}
      />

      <StoryCamera
        open={openCamera}
        onClose={() => setOpenCamera(false)}
        onPick={(items) => {
          setOpenCamera(false);
          setBaseMedia(items[0] || null);
          setOpenAdd(true);
        }}
      />

      <TaleComposer
        open={openAdd}
        onBack={() => setOpenAdd(false)}
        onClose={() => setOpenAdd(false)}
        baseItem={baseMedia || undefined}
        onLaunch={(res: ComposerResult) => {
          try {
            const entry = { items: res.items, meta: res.meta, createdAt: Date.now() };
            const raw = localStorage.getItem("home_stories_user_entries");
            const arr = raw ? JSON.parse(raw) : [];
            arr.unshift(entry);
            localStorage.setItem("home_stories_user_entries", JSON.stringify(arr));
            localStorage.setItem("home_stories_user_new", "1");
            setUserHasNew(true);
          } catch {}
          setBaseMedia(null);
          setOpenAdd(false);
        }}
      />

      <StoryViewer open={viewerOpen} onClose={() => setViewerOpen(false)} users={viewerUsers} startUser={viewerStartUser} />

      <Navbar />
    </div>
  );
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/80 backdrop-blur p-4 shadow-[0_10px_40px_-12px_rgba(168,85,247,0.25)]">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded-full border border-cyan-400/40 text-cyan-200">
      {children}
    </span>
  );
}
