import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Bug, LifeBuoy } from "lucide-react";

type Ticket = { id: string; subject: string; message: string; status: string; createdAt: number };

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const load = async () => {
    try {
      const headers: Record<string,string> = {};
      try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      const r = await fetch('/api/support', { headers });
      const d = await r.json();
      setTickets(Array.isArray(d?.tickets)?d.tickets:[]);
    } catch {}
  };

  useEffect(()=>{ load(); },[]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
      await fetch('/api/support', { method: 'POST', headers, body: JSON.stringify({ subject, message }) });
      setSubject(""); setMessage("");
      await load();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Support</h1>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 p-4 space-y-3 text-sm">
          <div>
            <label className="text-xs">Subject</label>
            <input value={subject} onChange={(e)=>setSubject(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-background border border-white/10" />
          </div>
          <div>
            <label className="text-xs">Message</label>
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 rounded-md bg-background border border-white/10" />
          </div>
          <div className="flex gap-2">
            <button className="px-3 h-9 rounded-md border border-white/10 inline-flex items-center gap-2" aria-label="Report issue" title="Report issue">
              <Bug className="h-4 w-4" /> Submit Ticket
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-white/10 bg-card/70 p-4 text-sm">
          <div className="font-medium mb-2">My Tickets</div>
          <div className="divide-y divide-white/10">
            {tickets.map(t => (
              <div key={t.id} className="py-2 flex items-center justify-between">
                <div>
                  <div>{t.subject}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-md border border-white/10">{t.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
