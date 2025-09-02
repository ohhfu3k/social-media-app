import { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Star, Phone, Video, Send, ChevronLeft } from "lucide-react";

type Conversation = { id: string; name: string; participants: string[]; avatar: string; online: boolean };
type Message = { id: string; author: string; text: string; time: string };

type Tab = "known" | "annonyms" | "signals";

type ChatRequest = { id: string; convoId: string; source: Exclude<Tab, "signals"> };

function categorize(c: Conversation): Tab {
  const n = parseInt(c.id.replace(/\D/g, "")) || 0;
  const mod = n % 3;
  if (mod === 0) return "known";
  if (mod === 1) return "annonyms";
  return "signals";
}

function toUsername(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "star";
}

export default function Messaging() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<Tab>("known");
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [accepted, setAccepted] = useState<Record<string, Exclude<Tab, "signals">>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/messages/conversations");
        const d = await r.json();
        if (Array.isArray(d?.conversations)) setConvos(d.conversations);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!active) return;
      try {
        const r = await fetch(`/api/messages/${encodeURIComponent(active)}`);
        const d = await r.json();
        if (Array.isArray(d?.messages)) setMessages(d.messages);
      } catch {}
    })();
  }, [active]);

  // Support preselect via ?to=username
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      const to = usp.get("to");
      if (to) {
        const id = `conv_${to}`;
        setConvos((prev) => prev.find((c) => c.id === id) ? prev : [{ id, name: to, participants: [to], avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(to)}`, online: true }, ...prev]);
        setActive(id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // no-op live updates placeholder removed; could be replaced by websockets later
  }, [active]);

  // Initialize chat requests once based on conversations categorized as "signals"
  useEffect(() => {
    if (!convos.length || requests.length) return;
    const initial: ChatRequest[] = convos
      .filter((c) => categorize(c) === "signals")
      .map((c) => {
        const n = parseInt(c.id.replace(/\D/g, "")) || 0;
        const source: Exclude<Tab, "signals"> = n % 2 === 0 ? "known" : "annonyms";
        return { id: `req-${c.id}`, convoId: c.id, source };
      });
    if (initial.length) setRequests(initial);
  }, [convos, requests.length]);

  // If no requests remain and current tab is signals, switch to known
  useEffect(() => {
    if (tab === "signals" && requests.length === 0) setTab("known");
  }, [requests.length, tab]);

  const requestedIds = useMemo(() => new Set(requests.map((r) => r.convoId)), [requests]);
  const baseConvos = useMemo(() => convos.filter((c) => !requestedIds.has(c.id)), [convos, requestedIds]);

  const filtered = useMemo(() => {
    if (tab === "signals") return [] as Conversation[];
    return baseConvos.filter((c) => (accepted[c.id] ?? categorize(c)) === tab);
  }, [baseConvos, accepted, tab]);

  const activeConvo = useMemo(() => convos.find((c) => c.id === active) || null, [convos, active]);
  const isStarlit = useMemo(() => {
    if (!activeConvo) return false;
    const n = parseInt(activeConvo.id.replace(/\D/g, "")) || 0;
    return n % 2 === 0; // deterministic mock: even ids are followed
  }, [activeConvo]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };
  useEffect(() => { if (active) scrollToBottom(); }, [messages, active]);

  const agreeRequest = (req: ChatRequest) => {
    setRequests((rs) => rs.filter((r) => r.id !== req.id));
    setAccepted((a) => ({ ...a, [req.convoId]: req.source }));
    setTab(req.source);
    setActive(req.convoId);
  };

  const disagreeRequest = (req: ChatRequest) => {
    setRequests((rs) => rs.filter((r) => r.id !== req.id));
  };

  const ChatView = (
    <main className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur flex flex-col sm:grid sm:grid-rows-[auto_1fr_auto] min-h-[50vh] max-h-[calc(100vh-6rem)]">
      <div className="h-14 px-3 border-b border-white/10 flex items-center justify-between sm:border-b">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button onClick={() => setActive(null)} aria-label="Back" title="Back" className="h-8 w-8 rounded-md border border-white/10 grid place-items-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {activeConvo && (
            <img src={activeConvo.avatar} className="h-9 w-9 rounded-full object-cover" alt="avatar" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{activeConvo?.name || "Conversation"}</div>
            <div className="text-xs text-muted-foreground truncate">@{toUsername(activeConvo?.name || "")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="h-8 w-8 rounded-md grid place-items-center border border-white/10" aria-label="Audio call" title="Audio call">
            <Phone className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 rounded-md grid place-items-center border border-white/10" aria-label="Video call" title="Video call">
            <Video className="h-4 w-4" />
          </button>
          <button
            className={`h-8 w-8 rounded-md grid place-items-center border ${isStarlit ? "border-yellow-300/40 bg-yellow-500/10" : "border-white/10"}`}
            aria-label={isStarlit ? "Starlit" : "Not starlit"}
            title={isStarlit ? "Starlit" : "Star"}
            aria-pressed={isStarlit}
          >
            <Star className={`h-4 w-4 ${isStarlit ? "text-yellow-300 fill-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>
      <div ref={listRef} className="p-3 space-y-2 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] p-2 rounded-lg border ${m.author === "You" ? "ml-auto bg-fuchsia-500/10 border-fuchsia-400/40" : "bg-background/60 border-white/10"}`}
          >
            <div className="text-[11px] text-muted-foreground">{m.author} • {m.time}</div>
            <div className="text-sm mt-0.5">{m.text}</div>
          </div>
        ))}
      </div>
      <form
        className="h-14 border-t border-white/10 px-2 flex items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.elements.namedItem("message") as HTMLInputElement;
          const val = input.value.trim();
          if (!val || !active) return;
          try {
            const headers: Record<string,string> = { "Content-Type": "application/json" };
            try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
            const r = await fetch(`/api/messages/${encodeURIComponent(active)}`, { method: "POST", headers, body: JSON.stringify({ text: val }) });
            const d = await r.json();
            if (d?.message) setMessages((m) => [...m, d.message]);
          } catch {
            setMessages((m) => [...m, { id: `temp-${Date.now()}`, author: "You", text: val, time: new Date().toLocaleTimeString() }]);
          }
          input.value = "";
          setTimeout(scrollToBottom, 0);
        }}
      >
        <div className="relative flex-1">
          <input aria-label="Message" name="message" placeholder="Message..." className="w-full h-10 pl-10 pr-10 rounded-md bg-background border border-white/10" />
          <button type="button" title="emoji" aria-label="Emoji" className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md border border-white/10 grid place-items-center text-base">😊</button>
        </div>
        <button type="button" title="voice" aria-label="Voice" className="h-10 w-10 rounded-md border border-white/10">🎤</button>
        <button type="button" title="attach" aria-label="Attach" className="h-10 w-10 rounded-md border border-white/10">📎</button>
        <button type="submit" aria-label="Send" className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </main>
  );

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="grid grid-cols-1 md:grid-cols-[300px_1fr] max-w-6xl mx-auto px-4 py-6 gap-4 relative">
        <aside className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-3 space-y-3 relative">
          <div className="text-sm font-medium">Conversations</div>
          <div className="flex gap-2 sticky top-2 z-10">
            <button onClick={() => setTab("known")} className={`px-3 py-1.5 rounded-full border text-xs ${tab === "known" ? "border-cyan-400/50 text-cyan-200 bg-cyan-500/10" : "border-white/10 text-muted-foreground"}`}>Known</button>
            <button onClick={() => setTab("annonyms")} className={`px-3 py-1.5 rounded-full border text-xs ${tab === "annonyms" ? "border-fuchsia-400/50 text-fuchsia-200 bg-fuchsia-500/10" : "border-white/10 text-muted-foreground"}`}>Annonyms</button>
            {requests.length > 0 && (
              <button onClick={() => setTab("signals")} className={`px-3 py-1.5 rounded-full border text-xs ${tab === "signals" ? "border-amber-400/50 text-amber-200 bg-amber-500/10" : "border-white/10 text-muted-foreground"}`}>Signals</button>
            )}
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {tab === "signals" ? (
              requests.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">No chat requests</div>
              ) : (
                requests.map((r) => {
                  const c = convos.find((cv) => cv.id === r.convoId)!;
                  return (
                    <div key={r.id} className="w-full rounded-lg border border-amber-400/40 bg-amber-500/5 p-2">
                      <div className="flex items-center gap-3">
                        <img src={c.avatar} className="h-9 w-9 rounded-full object-cover" alt="avatar" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">@{toUsername(c.name)} requested to chat ({r.source})</div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => agreeRequest(r)} className="px-3 py-1.5 rounded-md text-xs bg-emerald-500/20 border border-emerald-400/40">Agree</button>
                        <button onClick={() => disagreeRequest(r)} className="px-3 py-1.5 rounded-md text-xs bg-red-500/10 border border-red-400/40">Disagree</button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={`w-full text-left rounded-lg border p-2 flex items-center gap-3 ${active === c.id ? "border-fuchsia-400/50 bg-fuchsia-500/10" : "border-white/10 bg-background/60"}`}
                >
                  <div className="relative">
                    <img src={c.avatar} className="h-9 w-9 rounded-full object-cover" />
                    {c.online && <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">@{toUsername(c.name)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {!isMobile && ChatView}

        {isMobile && active && (
          <div className="md:hidden fixed inset-0 z-40 px-3 pt-14 pb-4 bg-black/40 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal>
            <div className="relative max-w-xl mx-auto w-full">
              <div className="h-[calc(100vh-6rem)] overflow-hidden">{ChatView}</div>
            </div>
          </div>
        )}
      </section>
      {!active && <Navbar />}
    </div>
  );
}
