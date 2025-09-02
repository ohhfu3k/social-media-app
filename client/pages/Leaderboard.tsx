import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

type Entry = { id: string; name: string; avatar: string; starlit: number; linkedStars: number };

export default function Leaderboard() {
  const [by, setBy] = useState<'starlit'|'linkedStars'>('starlit');
  const [range, setRange] = useState<'day'|'week'|'month'>('day');
  const [items, setItems] = useState<Entry[]>([]);

  useEffect(()=>{
    (async () => {
      try {
        const r = await fetch(`/api/leaderboard?by=${encodeURIComponent(by)}`);
        const d = await r.json();
        setItems(Array.isArray(d?.leaderboard)?d.leaderboard:[]);
      } catch {}
    })();
  }, [by]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-2">
          {(['starlit','linkedStars'] as const).map(k => (
            <button key={k} onClick={()=>setBy(k)} className={`px-3 h-9 rounded-md border ${by===k?"border-amber-300/50 bg-amber-400/10":"border-white/10"}`}>{k}</button>
          ))}
          <div className="ml-auto flex gap-2">
            {(['day','week','month'] as const).map(r => (
              <button key={r} onClick={()=>setRange(r)} className={`px-3 h-9 rounded-md border ${range===r?"border-cyan-300/50 bg-cyan-400/10":"border-white/10"}`}>{r}</button>
            ))}
          </div>
        </div>
        <ol className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur divide-y divide-white/10">
          {items.map((u, i) => (
            <li key={u.id} className="p-3 grid grid-cols-[auto_auto_1fr_auto] items-center gap-3">
              <div className={`h-8 w-8 grid place-items-center rounded-full ${i<3?"bg-amber-400/20 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,.3)]":"bg-white/5"}`}>{i+1}</div>
              <img src={u.avatar} className="h-9 w-9 rounded-full object-cover" />
              <div className="text-sm">{u.name}</div>
              <div className="text-sm font-semibold tabular-nums">{(by==='starlit'?u.starlit:u.linkedStars).toLocaleString()}</div>
            </li>
          ))}
        </ol>
      </section>
      <Navbar />
    </div>
  );
}
