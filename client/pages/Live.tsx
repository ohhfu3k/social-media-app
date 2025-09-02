import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Radio, Tv } from "lucide-react";

type Stream = { id: string; userId: string; title: string; startedAt: number; viewers?: number };

export default function Live() {
  const [streams, setStreams] = useState<Stream[]>([]);

  const load = async () => {
    try { const r=await fetch('/api/live'); const d=await r.json(); setStreams(Array.isArray(d?.streams)?d.streams:[]); } catch {}
  };

  useEffect(()=>{ load(); },[]);

  const start = async () => {
    try {
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      await fetch('/api/live/start', { method: 'POST', headers, body: JSON.stringify({ title: 'Live Stream' }) });
      await load();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground relative">
      <TopBar />
      <section className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Live Streams</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {streams.map((s)=> (
            <div key={s.id} className="rounded-xl border border-white/10 bg-card/70 overflow-hidden">
              <div className="aspect-video bg-black/40 grid place-items-center">
                <Tv className="h-8 w-8" aria-label="Watch party" />
              </div>
              <div className="p-3 text-sm flex items-center justify-between">
                <div>{s.title}</div>
                <button className="px-2 h-8 rounded-md border border-white/10">Watch</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <button onClick={start} className="fixed bottom-20 right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg" aria-label="Go live" title="Go live">
        <Radio className="h-5 w-5" />
      </button>
      <Navbar />
    </div>
  );
}
