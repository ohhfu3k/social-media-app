import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

type NotificationItem = { id: string; kind: 'star'|'whisper'|'energy'; text: string; time: string; read: boolean };

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<'all'|'star'|'whisper'|'energy'>('all');
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/notifications");
        const d = await r.json();
        const list = Array.isArray(d?.notifications) ? d.notifications : [];
        if (list.length === 0) {
          const headers: Record<string,string> = { "Content-Type": "application/json" };
          try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
          await fetch("/api/notifications/seed", { method: "POST", headers });
          const r2 = await fetch("/api/notifications");
          const d2 = await r2.json();
          setItems(Array.isArray(d2?.notifications)?d2.notifications:[]);
        } else {
          setItems(list);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(()=> items.filter(i => tab==='all' || i.kind===tab), [items, tab]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground relative">
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.06),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,.04),transparent_50%)]" />
      </div>
      <TopBar />
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-2">
          {(['all','star','whisper','energy'] as const).map(k => (
            <button key={k} onClick={()=>setTab(k)} className={`px-3 h-9 rounded-md border ${tab===k?"border-amber-300/50 bg-amber-400/10":"border-white/10"}`}>{k==='all'?'All':k.charAt(0).toUpperCase()+k.slice(1)}</button>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur divide-y divide-white/10">
          {filtered.map(n => (
            <button
              key={n.id}
              onClick={async ()=>{
                setItems(prev=>prev.map(p=>p.id===n.id?{...p,read:true}:p));
                try {
                  const headers: Record<string,string> = { "Content-Type": "application/json" };
                  try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
                  await fetch(`/api/notifications/${encodeURIComponent(n.id)}/read`, { method: "POST", headers });
                } catch {}
              }}
              className={`w-full text-left p-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 ${n.read?"opacity-70":""}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${n.read?"bg-transparent border border-white/20":"bg-fuchsia-300"}`} />
              <div className="text-sm">{n.text}</div>
              <div className="text-xs text-muted-foreground">{n.time}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-4">
          <div className="text-sm font-medium mb-2">Settings</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={push} onChange={(e)=>setPush(e.target.checked)} /> Push notifications</label>
          <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={email} onChange={(e)=>setEmail(e.target.checked)} /> Email notifications</label>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
