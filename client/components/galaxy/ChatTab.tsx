import { useEffect } from "react";

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
}

export default function ChatTab({
  open,
  onClose,
  onMinimize,
  name,
  avatar,
  messages,
}: {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  name: string;
  avatar: string;
  messages: ChatMessage[];
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="fixed bottom-20 right-6 z-50 w-[min(480px,92vw)] h-[50vh] rounded-xl border border-white/10 bg-card/80 backdrop-blur shadow-[0_20px_80px_-20px_rgba(217,70,239,0.45)] animate-fade-in">
      <div className="h-12 px-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={avatar} className="h-7 w-7 rounded-full object-cover" alt="avatar" />
          <div className="text-sm font-medium">{name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-1 rounded border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/10">Star Link</button>
          <button onClick={onMinimize} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5">Minimize</button>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/5">Cancel</button>
        </div>
      </div>
      <div className="h-[calc(50vh-6rem)] overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="text-muted-foreground">{m.author} • {m.time}</span>
            <div className="mt-1 p-2 rounded-lg bg-muted/40 border border-white/10 max-w-[85%]">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="h-12 border-t border-white/10 px-2 flex items-center gap-2">
        <input
          placeholder="Message..."
          className="flex-1 h-8 px-3 rounded-md bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        />
        <button title="emoji" className="h-8 w-8 rounded-md border border-white/10 hover:bg-white/5 grid place-items-center">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16"/><path d="M15 9h.01"/><path d="M9 9h.01"/><path d="M8 13a4 4 0 0 0 8 0"/></svg>
        </button>
        <button title="attach" className="h-8 w-8 rounded-md border border-white/10 hover:bg-white/5 grid place-items-center">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05 12 20.5a6 6 0 0 1-8.49-8.49l9.19-9.18a4.5 4.5 0 1 1 6.36 6.36L9.88 18.36a3 3 0 1 1-4.24-4.24l8.49-8.49"/></svg>
        </button>
        <button title="mic" className="h-8 w-8 rounded-md border border-white/10 hover:bg-white/5 grid place-items-center">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M12 14v7"/><path d="M8 21h8"/><path d="M19 10a7 7 0 0 1-14 0"/></svg>
        </button>
        <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground">Send</button>
      </div>
    </div>
  );
}
