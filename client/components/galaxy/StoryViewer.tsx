import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
export type StorySegment = {
  id: string;
  type: "image" | "video" | "audio";
  src: string;
  createdAt: number;
  lifespanMs: number; // expiry window
  meta?: { cosmicSpot?: string; avatarKind?: string; authorName?: string; authorAvatar?: string };
};

export type StoryUser = {
  id: string;
  name?: string; // omitted for anonymous
  avatar?: string; // omitted for anonymous
  kind: "cosmic" | "anonymous";
  segments: StorySegment[];
};

export default function StoryViewer({ open, onClose, users, startUser }: { open: boolean; onClose: () => void; users: StoryUser[]; startUser?: number }) {
  const [uIdx, setUIdx] = useState(startUser ?? 0);
  const [sIdx, setSIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reply, setReply] = useState("");
  const pressRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const progRefs = useRef<HTMLDivElement[]>([]);
  const touch = useRef<{x:number;y:number}|null>(null);

  const validUsers = useMemo(() => users.map((u) => ({ ...u, segments: u.segments.filter((seg) => Date.now() - seg.createdAt < seg.lifespanMs) })).filter((u) => u.segments.length > 0), [users]);
  const user = validUsers[Math.min(uIdx, Math.max(0, validUsers.length - 1))];
  const segs = user?.segments || [];
  const seg = segs[sIdx] || null;
  const duration = 4500; // 4.5s per segment default
  const starlit = user && user.kind === 'cosmic' ? ((user.id.length + segs.length) % 2 === 0) : false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(()=>{ // handle preview playback per segment
    try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.remove(); audioRef.current = null; } } catch {}
    if (!seg?.meta?.music?.previewUrl) return;
    const a = new Audio(seg.meta.music.previewUrl as string);
    a.volume = muted ? 0 : 1;
    a.play().catch(()=>{});
    audioRef.current = a;
    return () => { try { a.pause(); } catch {} };
  }, [sIdx, uIdx, muted]);

  // derive display name and handle
  const displayName = user?.name || seg?.meta?.authorName || (user?.kind === 'anonymous' ? 'Anonymous' : 'User');
  const handle = '@' + String(displayName).toLowerCase().replace(/[^a-z0-9]+/g, '');

  useEffect(() => { setSIdx(0); }, [uIdx]);

  // Track views when a segment becomes active
  useEffect(() => {
    if (!open) return;
    const current = segs[sIdx];
    if (!current) return;
    try { fetch(`/api/v1/stories/${encodeURIComponent(current.id)}/view`, { method: "POST" }); } catch {}
  }, [open, sIdx, segs]);

  // Ensure viewer starts at the requested user whenever opened
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, Math.min(startUser ?? 0, Math.max(0, validUsers.length - 1)));
    setUIdx(idx);
    setSIdx(0);
  }, [open, startUser, validUsers.length]);

  useEffect(() => {
    if (!open || !seg || paused) return;
    const start = Date.now();
    const step = () => {
      const t = Date.now() - start;
      const r = Math.min(1, t / duration);
      const bar = progRefs.current[sIdx]; if (bar) bar.style.width = `${r * 100}%`;
      if (r >= 1) next(); else timerRef.current = window.setTimeout(step, 16) as unknown as number;
    };
    step();
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [open, sIdx, seg, paused]);

  useEffect(() => { // preload next/prev
    const nextSeg = segs[sIdx + 1]; const prevSeg = segs[sIdx - 1];
    [nextSeg, prevSeg].forEach((sg) => {
      if (!sg) return;
      if (sg.type === "image") { const img = new Image(); img.src = sg.src; }
      // videos will buffer on demand
    });
  }, [sIdx, segs]);

  const next = () => {
    if (sIdx < segs.length - 1) setSIdx(sIdx + 1);
    else if (uIdx < validUsers.length - 1) { setUIdx(uIdx + 1); setSIdx(0); }
    else onClose();
  };
  const prev = () => { if (sIdx > 0) setSIdx(sIdx - 1); else if (uIdx > 0) { setUIdx(uIdx - 1); setSIdx(0); } };

  const onTap = (e: React.MouseEvent) => { const mid = (e.currentTarget as HTMLElement).clientWidth / 2; if (e.clientX < mid) prev(); else next(); };
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; pressRef.current = window.setTimeout(()=> setPaused(true), 220) as unknown as number; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pressRef.current) { window.clearTimeout(pressRef.current); pressRef.current = null; setPaused(false); }
    if (!touch.current) return; const t = e.changedTouches[0]; const dx = t.clientX - touch.current.x; const dy = t.clientY - touch.current.y;
    if (Math.abs(dy) > 70 && dy > 0) onClose();
    else if (Math.abs(dx) > 60) { if (dx < 0) { setUIdx(Math.min(validUsers.length - 1, uIdx + 1)); setSIdx(0);} else { if (uIdx > 0) { setUIdx(uIdx - 1); setSIdx(0);} } }
    touch.current = null;
  };

  if (!user || !seg) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[130]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.18), transparent 40%)" }} />
          {seg?.meta?.music && (
            <div className="absolute left-1/2 bottom-8 -translate-x-1/2 rounded-full bg-black/60 backdrop-blur border border-white/10 px-3 py-2 flex items-center gap-2 z-20">
              <img src={seg.meta.music.albumArt} className="h-8 w-8 rounded" />
              <div className="text-xs">
                <div className="font-semibold leading-4 truncate max-w-[50vw]">{seg.meta.music.name}</div>
                <div className="text-white/70 leading-4 truncate max-w-[50vw]">{seg.meta.music.artists}</div>
              </div>
            </div>
          )}

          {/* Top bar with Orbit Trail */}
          <div className="absolute top-0 left-0 right-0 px-3 pt-5 z-30 pointer-events-auto" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
            <div className="flex gap-1 mb-2">
              {segs.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div ref={(el)=> { if (el) (progRefs.current[i] = el); if (i < sIdx) el && (el.style.width = '100%'); if (i > sIdx) el && (el.style.width = '0%'); }} className="h-full w-0 bg-gradient-to-r from-yellow-300 via-amber-400 to-fuchsia-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8">
                  {user.avatar ? (
                    <img src={user.avatar} className="h-8 w-8 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="h-8 w-8 rounded-full border border-white/30 bg-black/20" />
                  )}
                  <svg className="absolute -inset-1" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                      <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill="none" stroke={starlit ? 'url(#starGrad)' : 'rgba(255,255,255,0.35)'} strokeWidth={starlit ? 4 : 2} filter={starlit ? 'url(#starGlow)' : undefined as any} />
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="font-medium flex items-center gap-2">
                    <span>{displayName}</span>
                    <span className="text-[11px] opacity-80">{handle}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {seg.type !== 'audio' && (
                  <button onClick={(e)=>{ e.stopPropagation(); setMuted((m) => !m); }} className="h-8 w-8 rounded-full border border-white/20 bg-black/20 grid place-items-center" aria-label="Toggle sound">
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                )}
                <button onClick={(e)=>{ e.stopPropagation(); onClose(); }} className="h-8 w-8 rounded-full border border-white/20 bg-black/20 grid place-items-center" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {/* Media stage */}
          <div className="absolute inset-0 flex items-center justify-center pt-10 pb-16 px-4 z-10" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onPointerDown={()=> setPaused(true)} onPointerUp={()=> setPaused(false)}>
            <div className="relative w-[min(92vw,460px)] aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 bg-black/40">
              {seg.type === 'image' && (
                <motion.img key={seg.id} src={seg.src} initial={{ scale: 1.05 }} animate={{ scale: 1.2 }} transition={{ duration }} className="absolute inset-0 h-full w-full object-cover" />
              )}
              {seg.type === 'video' && (
                <video key={seg.id} src={seg.src} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted={muted} playsInline />
              )}
              {seg.type === 'audio' && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className={`relative h-44 w-44 rounded-full grid place-items-center ${!paused ? 'animate-pulse' : ''}`}>
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 opacity-30 blur-xl" />
                    <span className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 opacity-50 blur-md" />
                    <div className="relative z-10 h-24 w-24 rounded-full bg-black/50 border border-white/20" />
                  </div>
                  <audio src={seg.src} autoPlay={!paused} />
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-2 left-2 right-2 text-white/90 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.avatar && <img src={user.avatar} className="h-6 w-6 rounded-full" />}
                    <div className="font-medium">{displayName}</div>
                    <div className="opacity-75">{handle}</div>
                    {seg.meta?.cosmicSpot && <div className="px-2 py-0.5 rounded-full border border-white/20 bg-black/30">{seg.meta.cosmicSpot}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reply bar */}
          {user.kind === 'cosmic' && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="mx-auto max-w-md space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  {['❤️','🔥','😂','😢','👏','👍'].map((e)=> (
                    <button key={e} onClick={(ev)=>{ ev.stopPropagation(); try { fetch(`/api/v1/stories/${encodeURIComponent(seg.id)}/react`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji: e }) }); } catch {} }} className="h-8 px-3 rounded-full border border-white/20 bg-black/20 text-sm">
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input value={reply} onChange={(e)=>setReply(e.target.value)} className="flex-1 h-10 rounded-full bg-black/40 border border-white/20 px-3 text-sm" placeholder="Send a Star Reply ✨" />
                  <button onClick={(e)=>{ e.stopPropagation(); const text = reply.trim(); if (!text) return; setReply(""); try { const to = user?.name || seg.meta?.authorName || 'User'; fetch(`/api/messages/story-${encodeURIComponent(user.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, to }) }); } catch {} }} className="h-10 px-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 border border-white/10 text-sm shadow-[0_0_18px_rgba(236,72,153,0.5)]">Send</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
