import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { CalendarDays } from "lucide-react";

type Event = { id: string; title: string; at: number };

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/events"); const d = await r.json(); setEvents(Array.isArray(d?.events)?d.events:[]); } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Events</h1>
        </div>
        <div className="space-y-2">
          {events.map((ev)=> (
            <div key={ev.id} className="rounded-lg border border-white/10 bg-card/70 p-3 text-sm flex items-center justify-between">
              <div>{ev.title}</div>
              <button
                className="px-2 h-8 rounded-md border border-white/10"
                aria-label="Join event"
                title="Join"
                onClick={async ()=>{ try { const headers: Record<string,string> = { "Content-Type": "application/json" }; try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}; await fetch(`/api/events/${encodeURIComponent(ev.id)}/join`, { method: 'POST', headers }); } catch {} }}
              >Join</button>
            </div>
          ))}
        </div>
      </section>
      <Navbar />
    </div>
  );
}
