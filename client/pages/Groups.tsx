import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

type Group = { id: string; name: string; members?: string[] };

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [active, setActive] = useState<Group | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/groups");
        const d = await r.json();
        setGroups(Array.isArray(d?.groups) ? d.groups : []);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-3">
          <div className="text-sm font-medium">Groups</div>
          <div className="mt-2 space-y-2">
            {groups.map(g => (
              <button key={g.id} onClick={()=>setActive(g)} className={`w-full text-left rounded-lg border p-2 ${active?.id===g.id?"border-cyan-300/50 bg-cyan-400/10":"border-white/10 bg-background/60"}`}>{g.name}</button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={async (e)=>{e.preventDefault(); const v=name.trim(); if(!v) return; try { const headers: Record<string,string> = { "Content-Type": "application/json" }; try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}; const r = await fetch('/api/groups', { method: 'POST', headers, body: JSON.stringify({ name: v }) }); const d = await r.json(); if (d?.group) setGroups(gs => [d.group, ...gs]); setName(""); } catch {} }}>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="New group" className="flex-1 h-9 px-2 rounded-md bg-background border border-white/10" />
            <button className="px-2 h-9 rounded-md border border-white/10">Create</button>
          </form>
        </aside>
        <main className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-3 min-h-[60vh] relative">
          <svg className="absolute inset-0 w-full h-full opacity-20 -z-10" viewBox="0 0 600 400">
            <g stroke="white" strokeOpacity=".2">
              {Array.from({length:20}).map((_,i)=> (
                <line key={i} x1={Math.random()*600} y1={Math.random()*400} x2={Math.random()*600} y2={Math.random()*400} />
              ))}
            </g>
          </svg>
          {active ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">{active.name} Feed</div>
              {Array.from({length:6}).map((_,i)=> (
                <div key={i} className="rounded-lg border border-white/10 bg-background/60 p-3 text-sm">A constellation event #{i+1} in {active.name}</div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a group to view its feed.</div>
          )}
        </main>
      </section>
      <Navbar />
    </div>
  );
}
