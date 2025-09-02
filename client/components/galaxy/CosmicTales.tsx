import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Music2, MapPin, Users, X, Pause, Play } from "lucide-react";

export type TaleMedia = {
  id: string;
  type: "image" | "video" | "audio";
  src: string;
  texts?: { id: string; x: number; y: number; value: string }[];
  stickers?: { id: string; x: number; y: number; value: string }[];
  drawing?: string; // dataURL of drawing layer
};

export type Tale = {
  id: string;
  author: string;
  avatar?: string;
  items: TaleMedia[];
  music?: string; // background music attachment
  cosmicSpot?: string;
  orbitingWith?: string[];
  createdAt: number; // ms
  viewers: string[]; // usernames
};

function readTales(): Tale[] {
  try {
    const raw = localStorage.getItem("cosmic_tales");
    const arr: Tale[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const keep = arr.filter((t) => now - t.createdAt < 24 * 60 * 60 * 1000);
    if (keep.length !== arr.length) localStorage.setItem("cosmic_tales", JSON.stringify(keep));
    return keep;
  } catch {
    return [];
  }
}
function writeTales(tales: Tale[]) {
  localStorage.setItem("cosmic_tales", JSON.stringify(tales));
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function CosmicTales({ author, avatar }: { author: string; avatar?: string }) {
  const [tales, setTales] = useState<Tale[]>([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [viewing, setViewing] = useState<Tale | null>(null);

  useEffect(() => {
    setTales(readTales());
  }, []);

  const addTale = (t: Tale) => {
    const upd = [t, ...tales];
    setTales(upd);
    writeTales(upd);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Cosmic Tales 🌌</h2>
        <button onClick={() => setOpenEditor(true)} className="h-9 px-3 rounded-full border border-white/10 bg-gradient-to-r from-indigo-700/40 via-purple-700/40 to-amber-600/40 text-sm shadow-[0_0_20px_rgba(129,140,248,0.4)] hover:bg-white/10 flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Tale ✨
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AddCard onClick={() => setOpenEditor(true)} />
        {tales.map((t) => (
          <TaleCard key={t.id} tale={t} onOpen={() => setViewing(t)} />
        ))}
      </div>

      <AnimatePresence>
        {openEditor && (
          <EditorModal onClose={() => setOpenEditor(false)} onSave={(items, meta) => {
            const tale: Tale = {
              id: `tale-${Date.now()}`,
              author,
              avatar,
              items,
              music: meta.music || undefined,
              cosmicSpot: meta.cosmicSpot || undefined,
              orbitingWith: meta.orbitingWith || undefined,
              createdAt: Date.now(),
              viewers: [],
            };
            addTale(tale);
            setOpenEditor(false);
            setViewing(tale);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && (
          <Viewer tale={viewing} onClose={() => setViewing(null)} onViewed={(username) => {
            const upd = tales.map((t) => t.id === viewing.id ? { ...t, viewers: t.viewers.includes(username) ? t.viewers : [...t.viewers, username] } : t);
            setTales(upd); writeTales(upd);
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative aspect-[3/4] rounded-2xl p-[2px] bg-gradient-to-br from-fuchsia-500/50 via-cyan-400/50 to-indigo-400/50 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.45)]">
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 backdrop-blur border border-white/10 grid place-items-center">
        <div className="relative">
          <span className="absolute -inset-6 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 animate-ping opacity-40" />
          <span className="relative z-10 h-14 w-14 rounded-full grid place-items-center bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.7)]">
            <Plus className="h-8 w-8" />
          </span>
        </div>
        <div className="absolute bottom-2 text-xs text-white/80">Add Tale</div>
      </div>
    </button>
  );
}

function TaleCard({ tale, onOpen }: { tale: Tale; onOpen: () => void }) {
  const cover = tale.items.find((i) => i.type !== "audio") || tale.items[0];
  return (
    <button onClick={onOpen} className="relative aspect-[3/4] rounded-2xl p-[2px] bg-gradient-to-br from-fuchsia-500/50 via-cyan-400/50 to-indigo-400/50 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.45)] text-left">
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 backdrop-blur border border-white/10">
        {cover.type === "image" ? (
          <img src={cover.src} alt="cover" className="h-full w-full object-cover" />
        ) : cover.type === "video" ? (
          <video src={cover.src} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-black text-white/80">Audio Tale</div>
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-sm text-white">
          <div className="font-medium drop-shadow">{tale.cosmicSpot || tale.author}</div>
          <div className="px-2 py-0.5 rounded-full text-xs bg-black/50 border border-white/10 flex items-center gap-1">
            <Users className="h-3 w-3 text-cyan-300" /> {tale.viewers.length}
          </div>
        </div>
      </div>
    </button>
  );
}

export function EditorModal({ onClose, onSave }: { onClose: () => void; onSave: (items: TaleMedia[], meta: { music?: string; cosmicSpot?: string; orbitingWith?: string[] }) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<TaleMedia[]>([]);
  const [music, setMusic] = useState<string | undefined>();
  const [cosmicSpot, setCosmicSpot] = useState("");
  const [orbitingWith, setOrbitingWith] = useState("");

  useEffect(() => {
    if (!files.length) return;
    (async () => {
      const media: TaleMedia[] = [];
      for (const f of files) {
        const url = await fileToDataURL(f);
        const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "audio";
        media.push({ id: `${Date.now()}-${f.name}`.replace(/\s+/g, ""), type: kind, src: url, texts: [], stickers: [] });
      }
      setItems(media);
    })();
  }, [files]);

  const addText = (idx: number) => {
    const val = prompt("Enter text");
    if (!val) return;
    setItems((it) => it.map((m, i) => i === idx ? { ...m, texts: [...(m.texts||[]), { id: `${Date.now()}`, x: 50, y: 50, value: val }] } : m));
  };
  const addSticker = (idx: number) => {
    const val = prompt("Enter emoji or sticker text");
    if (!val) return;
    setItems((it) => it.map((m, i) => i === idx ? { ...m, stickers: [...(m.stickers||[]), { id: `${Date.now()}`, x: 60, y: 60, value: val }] } : m));
  };

  const drawRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const isDrawing = useRef(false);
  const last = useRef<{x:number;y:number}|null>(null);

  const handlePointer = (idx: number, type: "down"|"move"|"up", e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = drawRefs.current[idx];
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    if (type === "down") { isDrawing.current = true; last.current = {x,y}; }
    if (type === "move" && isDrawing.current && last.current) {
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(x,y);
      ctx.stroke();
      last.current = {x,y};
    }
    if (type === "up") { isDrawing.current = false; last.current = null; }
  };

  const snapshotDrawings = () => {
    setItems((it) => it.map((m, i) => {
      const c = drawRefs.current[i];
      if (!c) return m;
      try { return { ...m, drawing: c.toDataURL("image/png") }; } catch { return m; }
    }));
  };

  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur" onClick={onClose} />
      <motion.div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-card/90 backdrop-blur p-4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">New Tale ✨</div>
          <button onClick={onClose} className="h-8 w-8 rounded-md border border-white/10 grid place-items-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid md:grid-cols-[1fr_260px] gap-4">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Upload media (images, videos, audio)</span>
              <input multiple accept="image/*,video/*,audio/*" type="file" className="mt-1 block w-full text-xs" onChange={(e)=> setFiles(Array.from(e.target.files||[]))} />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((m, idx) => (
                <div key={m.id} className="relative aspect-[9/16] rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  {m.type === "image" && <img src={m.src} className="h-full w-full object-cover" />}
                  {m.type === "video" && <video src={m.src} className="h-full w-full object-cover" controls />}
                  {m.type === "audio" && <div className="h-full w-full grid place-items-center text-xs text-white/80">Audio clip</div>}
                  {/* overlay draw */}
                  {m.type !== "audio" && (
                    <canvas
                      ref={(el)=> drawRefs.current[idx] = el}
                      className="absolute inset-0"
                      onPointerDown={(e)=>handlePointer(idx, "down", e)}
                      onPointerMove={(e)=>handlePointer(idx, "move", e)}
                      onPointerUp={(e)=>handlePointer(idx, "up", e)}
                      width={300} height={533}
                    />
                  )}
                  {(m.texts||[]).map((t)=> (
                    <div key={t.id} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
                      <div className="px-2 py-0.5 rounded bg-black/50 text-white text-xs">{t.value}</div>
                    </div>
                  ))}
                  {(m.stickers||[]).map((s)=> (
                    <div key={s.id} className="absolute text-3xl" style={{ left: `${s.x}%`, top: `${s.y}%` }}>{s.value}</div>
                  ))}
                  <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                    <button className="px-2 py-1 rounded-md border border-white/10 text-xs bg-white/5" onClick={()=>addText(idx)}>Add Text</button>
                    <button className="px-2 py-1 rounded-md border border-white/10 text-xs bg-white/5" onClick={()=>addSticker(idx)}>Sticker/Emoji</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-xs">
              <span className="text-muted-foreground">Music</span>
              <input type="file" accept="audio/*" onChange={async (e)=>{
                const f = e.target.files?.[0];
                if (!f) return; setMusic(await fileToDataURL(f));
              }} />
              {music && <div className="mt-1 text-xs flex items-center gap-1"><Music2 className="h-3 w-3" /> Attached</div>}
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Cosmic Spot (location)</span>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-300" />
                <input className="flex-1 h-8 rounded-md bg-background border border-white/10 px-2" placeholder="e.g. Orion Belt" value={cosmicSpot} onChange={(e)=>setCosmicSpot(e.target.value)} />
              </div>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Orbiting With (mentions, comma separated)</span>
              <input className="mt-1 w-full h-8 rounded-md bg-background border border-white/10 px-2" placeholder="nova, orion, lyra" value={orbitingWith} onChange={(e)=>setOrbitingWith(e.target.value)} />
            </label>
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button onClick={()=>{ snapshotDrawings(); onSave(items, { music, cosmicSpot, orbitingWith: orbitingWith ? orbitingWith.split(/\s*,\s*/).filter(Boolean) : undefined }); }} className="flex-1 h-9 rounded-md bg-primary text-primary-foreground">Publish</button>
              <button onClick={onClose} className="h-9 px-3 rounded-md border border-white/10">Cancel</button>
            </div>
            <div className="text-[11px] text-muted-foreground">Tales auto-expire after 24h.</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Viewer({ tale, onClose, onViewed }: { tale: Tale; onClose: () => void; onViewed: (username: string) => void }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progress = useRef<HTMLDivElement[]>([]);
  const start = useRef<number>(0);

  const items = tale.items;

  useEffect(() => {
    // mark view by current user placeholder
    onViewed("you");
  }, []);

  useEffect(() => {
    if (paused) return;
    start.current = Date.now();
    const dur = 4000; // 4s per item
    const step = () => {
      const t = Date.now() - start.current;
      const ratio = Math.min(1, t / dur);
      const bar = progress.current[idx];
      if (bar) bar.style.width = `${ratio * 100}%`;
      if (ratio >= 1) next(); else timerRef.current = window.setTimeout(step, 16) as unknown as number;
    };
    step();
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [idx, paused]);

  const next = () => setIdx((i) => Math.min(items.length - 1, i + 1));
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  const onTap = (e: React.MouseEvent) => {
    const mid = (e.currentTarget as HTMLElement).clientWidth / 2;
    if (e.clientX < mid) prev(); else next();
  };

  // gestures: swipe down to close, left/right to nav
  const touch = useRef<{x:number;y:number}|null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x; const dy = t.clientY - touch.current.y;
    if (Math.abs(dy) > 60 && dy > 0) onClose();
    else if (Math.abs(dx) > 60) { if (dx < 0) next(); else prev(); }
    touch.current = null;
  };

  return (
    <motion.div className="fixed inset-0 z-[90] bg-black/90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        onPointerDown={()=>setPaused(true)} onPointerUp={()=>setPaused(false)}>
        {items[idx].type === "image" && (
          <img src={items[idx].src} className="absolute inset-0 h-full w-full object-contain" />
        )}
        {items[idx].type === "video" && (
          <video src={items[idx].src} className="absolute inset-0 h-full w-full object-contain" autoPlay muted={!paused} controls={false} />
        )}
        {items[idx].type === "audio" && (
          <div className="absolute inset-0 grid place-items-center text-white/90">Playing audio…</div>
        )}
        {/* overlays */}
        {(items[idx].texts||[]).map((t)=> (
          <div key={t.id} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
            <div className="px-2 py-0.5 rounded bg-black/50 text-white">{t.value}</div>
          </div>
        ))}
        {(items[idx].stickers||[]).map((s)=> (
          <div key={s.id} className="absolute text-5xl" style={{ left: `${s.x}%`, top: `${s.y}%` }}>{s.value}</div>
        ))}
        {items[idx].drawing && <img src={items[idx].drawing} className="absolute inset-0 h-full w-full object-contain pointer-events-none" />}
      </div>

      {/* header */}
      <div className="absolute top-0 left-0 right-0 p-3 pt-6">
        <div className="flex gap-1 mb-2">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div ref={(el)=> { if (el) (progress.current[i] = el); }} className="h-full w-0 bg-gradient-to-r from-yellow-300 via-amber-400 to-fuchsia-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-white/90">
          <div className="text-sm font-medium">{tale.cosmicSpot || "Cosmic Tale"}</div>
          <div className="flex items-center gap-2 text-xs">
            {tale.orbitingWith && tale.orbitingWith.length > 0 && (
              <div>Orbiting With: {tale.orbitingWith.join(", ")}</div>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-full border border-white/20 grid place-items-center"><X className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* footer controls */}
      <ViewerFooter tale={tale} paused={paused} onTogglePause={()=>setPaused(p=>!p)} />

      {/* background music */}
      {tale.music && <audio src={tale.music} autoPlay loop={!paused} />}
    </motion.div>
  );
}

function ViewerFooter({ tale, paused, onTogglePause }: { tale: Tale; paused: boolean; onTogglePause: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between text-white/90">
      <button onClick={onTogglePause} className="h-9 w-9 rounded-full border border-white/20 grid place-items-center bg-white/10">
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
      <button onClick={()=>setOpen(true)} className="text-xs flex items-center gap-1 px-2 h-8 rounded-md border border-white/20 bg-white/10">
        <Users className="h-4 w-4" /> Views
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[95] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={()=>setOpen(false)} />
            <motion.div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-card/90 backdrop-blur p-4 text-foreground" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Star Watchers</div>
                <button onClick={()=>setOpen(false)} className="h-7 w-7 rounded-md border border-white/10 grid place-items-center"><X className="h-4 w-4" /></button>
              </div>
              {tale.viewers.length === 0 ? (
                <div className="text-xs text-muted-foreground">No views yet</div>
              ) : (
                <ul className="max-h-60 overflow-y-auto space-y-1 text-sm">
                  {tale.viewers.map((v, i) => (
                    <li key={`${v}-${i}`} className="rounded-md border border-white/10 px-2 py-1">{v}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
