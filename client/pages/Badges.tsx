import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Flame, Medal } from "lucide-react";

type Badge = { id: string; name: string };

export default function Badges() {
  const [catalog, setCatalog] = useState<Badge[]>([]);
  const [mine, setMine] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch("/api/badges/catalog");
        const d1 = await r1.json();
        setCatalog(Array.isArray(d1?.badges)?d1.badges:[]);
      } catch {}
      try {
        const headers: Record<string,string> = {};
        try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
        const r2 = await fetch("/api/badges/me", { headers });
        const d2 = await r2.json();
        setMine(Array.isArray(d2?.badges)?d2.badges.map((b:Badge)=>b.id):[]);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Badges</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {catalog.map((b)=> (
            <div key={b.id} className={`rounded-xl border p-3 text-center ${mine.includes(b.id)?"border-amber-300/60 bg-amber-400/10":"border-white/10 bg-card/70"}`}>
              <Flame className="h-6 w-6 mx-auto text-amber-300" aria-label={`${b.name} badge`} />
              <div className="mt-1 text-sm">{b.name}</div>
            </div>
          ))}
        </div>
      </section>
      <Navbar />
    </div>
  );
}
