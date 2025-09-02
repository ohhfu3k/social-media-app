import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";

export default function StoriesView() {
  const { userId } = useParams();

  const items = useMemo(() => [
    { id: "admin", name: "SHANTANU CLUB", avatar: "https://i.pravatar.cc/150?img=1", media: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1470&auto=format&fit=crop" },
    { id: "2", name: "Lyra", avatar: "https://i.pravatar.cc/150?img=2", media: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1470&auto=format&fit=crop" },
    { id: "3", name: "Nova", avatar: "https://i.pravatar.cc/150?img=3", media: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1470&auto=format&fit=crop" },
    { id: "4", name: "Vega", avatar: "https://i.pravatar.cc/150?img=4", media: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1470&auto=format&fit=crop" },
  ], []);

  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!userId) return;
    const index = items.findIndex(i => i.id === userId);
    if (index >= 0) refs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [userId, items]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {items.map((s, i) => (
          <div key={s.id} ref={el => refs.current[i] = el} className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur overflow-hidden">
            <div className="flex items-center gap-3 p-3 border-b border-white/10">
              <img src={s.avatar} alt={s.name} className="h-8 w-8 rounded-full" />
              <div className="text-sm font-medium">{s.name}</div>
            </div>
            <div className="aspect-[9/16] w-full bg-black/60">
              <img src={s.media} alt={s.name} className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </main>
      <Navbar />
    </div>
  );
}
