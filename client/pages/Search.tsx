import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

type SearchItem =
  | { type: "user"; id: string; name: string; username: string; avatar: string; energy: number }
  | { type: "post"; id: string; title: string; image: string }
  | { type: "hashtag"; tag: string; count: number };

function ResultCard({ item }: { item: SearchItem }) {
  if (item.type === "user") {
    return (
      <div className="rounded-xl border border-white/10 bg-card/70 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src={item.avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">@{item.username} • Energy {item.energy}%</div>
          </div>
        </div>
      </div>
    );
  }
  if (item.type === "post") {
    return (
      <div className="rounded-xl border border-white/10 bg-card/70 overflow-hidden">
        <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
        <div className="p-2 text-sm">{item.title}</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-card/70 p-3 text-sm flex items-center justify-between">
      <div>
        <span className="text-fuchsia-300">{item.tag}</span>
        <span className="ml-2 text-muted-foreground">{item.count.toLocaleString()} posts</span>
      </div>
      <button className="h-8 w-8 grid place-items-center rounded-md border border-white/10" aria-label={`Follow ${item.tag}`} title="Follow hashtag">#</button>
    </div>
  );
}

export default function Search() {
  const [q, setQ] = useState("");
  const [energy, setEnergy] = useState(0);
  const [theme, setTheme] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ob = new IntersectionObserver((entries) => {
      entries.forEach(async (e) => {
        if (e.isIntersecting && !loading) {
          setLoading(true);
          try {
            const params = new URLSearchParams({ q: q + theme + String(energy), page: String(page + 1) });
            const r = await fetch(`/api/search?${params.toString()}`);
            const d = await r.json();
            const res = Array.isArray(d?.results) ? d.results : [];
            setItems((prev) => [...prev, ...res]);
            setPage((p) => p + 1);
          } catch {}
          setLoading(false);
        }
      });
    });
    if (endRef.current) ob.observe(endRef.current);
    return () => ob.disconnect();
  }, [q, theme, energy, page, loading]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setItems([]);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <div className="absolute inset-0 -z-10 opacity-[0.4] pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-gradient-to-br from-amber-400/25 to-pink-500/25 blur-3xl" />
      </div>
      <TopBar />
      <section className="mx-auto max-w-6xl px-4 py-6">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users, posts, hashtags" className="h-10 px-3 rounded-md bg-background border border-white/10" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Energy</label>
            <input type="range" min={0} max={100} value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} />
          </div>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 px-3 rounded-md bg-background border border-white/10">
            <option value="">All themes</option>
            <option value="dragon">Dragon</option>
            <option value="nebula">Nebula</option>
            <option value="orion">Orion</option>
          </select>
        </form>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <ResultCard key={`${it.type}-${(it as any).id || (it as any).tag || idx}`} item={it} />
          ))}
        </div>
        <div ref={endRef} className="h-12" />
        {loading && <div className="text-center text-sm text-muted-foreground">Loading…</div>}
      </section>
      <Navbar />
    </div>
  );
}
