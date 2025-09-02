import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X, Mic, Type, Music2, MapPin, Users, Star, RotateCw, Copy, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export type ComposerResult = {
  items: { id: string; type: "image" | "video" | "audio"; src: string }[];
  meta: { music?: string; cosmicSpot?: string; orbitingWith?: string[]; lifespanMs: number; avatarKind: string };
};

type Mode = "text" | "voice";

type TextLayer = {
  id: string;
  content: string;
  x: number; // 0..1 relative
  y: number; // 0..1 relative
  scale: number; // 0.2..3
  rotation: number; // degrees
  align: "left" | "center" | "right";
  font: "Inter" | "Poppins" | "Orbitron" | "Audiowide";
  size: number; // px relative to 1080 canvas
  color: string;
  strokeColor: string;
  strokeWidth: number;
  shadowBlur: number;
  shadowColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bgPill: boolean;
  bgOpacity: number; // 0..1
  locked: boolean;
};

const AVATAR_KINDS = ["Nebula", "Pulsar", "Quasar", "Comet", "Supernova"];
const LIFESPANS = [6,12,18,24,30,36];

function randPick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function drawStarryBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1a1140");
  g.addColorStop(1, "#061839");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * w; const y = Math.random() * h; const r = Math.random() * 1.6;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(blob); });
}

export default function TaleComposer({ open, onBack, onClose, onLaunch, baseItem }: { open: boolean; onBack?: () => void; onClose: () => void; onLaunch: (res: ComposerResult) => void; baseItem?: { id: string; type: "image" | "video" | "audio"; src: string } }) {
  const [mode, setMode] = useState<Mode>("text");
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [music, setMusic] = useState<string | undefined>();
  const [cosmicSpot, setCosmicSpot] = useState("");
  const [orbitingWith, setOrbitingWith] = useState<string>("");
  const [lifespan, setLifespan] = useState<number>(24);
  const [avatarKind, setAvatarKind] = useState<string>(randPick(AVATAR_KINDS));
  const [recording, setRecording] = useState(false);
  const [audioDataURL, setAudioDataURL] = useState<string | undefined>();
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Autosave
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      const draft = { mode, layers, music, cosmicSpot, orbitingWith, lifespan, avatarKind };
      try { localStorage.setItem("tale_composer_draft", JSON.stringify(draft)); } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [open, mode, layers, music, cosmicSpot, orbitingWith, lifespan, avatarKind]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("tale_composer_draft");
      if (raw) {
        const d = JSON.parse(raw);
        setMode(d.mode || "text");
        setLayers(d.layers || []);
        setMusic(d.music);
        setCosmicSpot(d.cosmicSpot || "");
        setOrbitingWith(d.orbitingWith || "");
        setLifespan(d.lifespan || 24);
        setAvatarKind(d.avatarKind || randPick(AVATAR_KINDS));
      }
    } catch {}
  }, [open]);

  // Cleanup on unmount/close
  useEffect(() => {
    return () => {
      try {
        if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") mediaRecRef.current.stop();
      } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    };
  }, []);

  // Swipe between modes
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return; const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x; const dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) { setMode((m) => (dx < 0 ? (m === "text" ? "voice" : "text") : (m === "voice" ? "text" : "voice"))); }
    touch.current = null;
  };

  const addTextLayer = () => {
    const nl: TextLayer = {
      id: `t-${Date.now()}`,
      content: "Type your whisper…",
      x: 0.5, y: 0.5, scale: 1, rotation: 0, align: "center",
      font: "Poppins", size: 64, color: "#ffffff", strokeColor: "#000000", strokeWidth: 0,
      shadowBlur: 8, shadowColor: "rgba(0,0,0,0.6)", bold: false, italic: false, underline: false,
      bgPill: false, bgOpacity: 0.3, locked: false,
    };
    setLayers((ls) => [...ls, nl]); setSelectedId(nl.id); setMode("text");
  };

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) || null, [layers, selectedId]);

  // Drag & snap
  const dragging = useRef(false);
  const onPointerDownLayer = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest("[data-ui]") ) return; // skip when interacting with UI controls
    dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setSelectedId(id);
  };
  const onPointerMoveLayer = (e: React.PointerEvent, id: string) => {
    if (!dragging.current) return; const el = e.currentTarget as HTMLElement; const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; const py = (e.clientY - rect.top) / rect.height;
    setLayers((ls) => ls.map((l) => l.id === id && !l.locked ? { ...l, x: Math.min(0.98, Math.max(0.02, px)), y: Math.min(0.95, Math.max(0.05, py)) } : l));
  };
  const onPointerUpLayer = () => { dragging.current = false; };

  // Record voice
  const startRecord = async () => {
    try {
      if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
        toast({ title: "Recording not supported", description: "Your browser doesn't support microphone access." });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const dataUrl = await blobToDataURL(blob);
          setAudioDataURL(dataUrl);
        } catch {}
        try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
        streamRef.current = null;
      };
      mr.start(); setRecording(true);
    } catch (e: any) {
      const msg = (e && (e.name || e.message)) || "Microphone permission denied";
      if (String(msg).toLowerCase().includes("notallowed") || String(msg).toLowerCase().includes("dismissed") || String(msg).toLowerCase().includes("denied")) {
        toast({ title: "Microphone blocked", description: "Permission denied/dismissed. Enable mic to record Echo." });
      } else {
        toast({ title: "Recording error", description: String(msg) });
      }
      setRecording(false);
    }
  };
  const stopRecord = () => {
    try { const mr = mediaRecRef.current; if (mr && mr.state !== "inactive") mr.stop(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    streamRef.current = null; setRecording(false);
  };

  // Export text composition to dataURL
  const renderTextToImage = async (): Promise<string> => {
    const w = 1080, h = 1920; const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); if (!ctx) return "";
    if (baseItem && baseItem.type === 'image') {
      await new Promise<void>((resolve) => {
        const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve(); }; img.src = baseItem.src;
      });
    } else {
      drawStarryBackground(ctx, w, h);
    }
    // safe margins
    const padTop = 140, padBottom = 200;
    layers.forEach((l) => {
      ctx.save();
      ctx.translate(l.x * w, l.y * h);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.scale(l.scale, l.scale);
      ctx.textAlign = l.align as CanvasTextAlign; ctx.textBaseline = "middle";
      const fontStyle = `${l.italic ? "italic " : ""}${l.bold ? "700 " : ""}${l.size}px ${l.font}`;
      ctx.font = fontStyle;
      ctx.shadowBlur = l.shadowBlur; ctx.shadowColor = l.shadowColor;
      if (l.bgPill) {
        const text = l.content; const metrics = ctx.measureText(text);
        const tw = metrics.width + 40; const th = l.size + 24;
        ctx.fillStyle = `rgba(0,0,0,${l.bgOpacity})`;
        const x = 0 - tw/2; const y = -th/2;
        const r = th/2; // pill
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + tw, y, x + tw, y + th, r);
        ctx.arcTo(x + tw, y + th, x, y + th, r);
        ctx.arcTo(x, y + th, x, y, r);
        ctx.arcTo(x, y, x + tw, y, r);
        ctx.closePath(); ctx.fill();
      }
      if (l.strokeWidth > 0) { ctx.lineWidth = l.strokeWidth; ctx.strokeStyle = l.strokeColor; ctx.strokeText(l.content, 0, 0); }
      ctx.fillStyle = l.color; ctx.fillText(l.content, 0, 0);
      ctx.restore();
    });
    // draw top/bottom safe guides lightly
    ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(0, 0, w, padTop); ctx.fillRect(0, h - padBottom, w, padBottom);
    return c.toDataURL("image/png");
  };

  const launch = async () => {
    const avatar = avatarKind;
    const meta = { music, cosmicSpot: cosmicSpot || undefined, orbitingWith: orbitingWith ? orbitingWith.split(/\s*,\s*/).filter(Boolean) : undefined, lifespanMs: lifespan * 3600_000, avatarKind: avatar };
    const items: ComposerResult["items"] = [];
    if (baseItem) items.push(baseItem);
    if (mode === "voice" && audioDataURL) { items.push({ id: `aud-${Date.now()}`, type: "audio", src: audioDataURL }); }
    // always render a visual image of text layers if any
    if (layers.length > 0) {
      const dataUrl = await renderTextToImage(); items.push({ id: `img-${Date.now()}`, type: "image", src: dataUrl });
    }
    if (items.length === 0) return;
    onLaunch({ items, meta });
  };

  // UI state updates for style controls
  const updateSelected = (patch: Partial<TextLayer>) => {
    if (!selected) return; setLayers((ls) => ls.map((l) => (l.id === selected.id ? { ...l, ...patch } : l)));
  };
  const duplicateSelected = () => { if (!selected) return; const c = { ...selected, id: `t-${Date.now()}` }; setLayers((ls) => [...ls, c]); setSelectedId(c.id); };
  const deleteSelected = () => { if (!selected) return; setLayers((ls) => ls.filter((l) => l.id !== selected.id)); setSelectedId(null); };
  const bringFront = () => { if (!selected) return; setLayers((ls) => { const others = ls.filter((l)=>l.id!==selected.id); return [...others, selected]; }); };
  const sendBack = () => { if (!selected) return; setLayers((ls) => { const others = ls.filter((l)=>l.id!==selected.id); return [selected, ...others]; }); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.18), transparent 40%)" }} />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-14 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center bg-black/20" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
              <div className="text-sm font-medium">New Tale ✨</div>
            </div>
            <div className="text-xs text-white/70">Anonymous Avatar: {avatarKind}</div>
            <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center bg-black/20" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>

          {/* Center preview 9:16 canvas */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[48%] w-[min(90vw,420px)] aspect-[9/16] rounded-2xl border border-white/15 bg-black/40 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {/* comet trail progress bar */}
            <div className="absolute top-3 left-3 right-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-yellow-300 via-amber-400 to-fuchsia-400 animate-[slide_2s_linear_infinite]" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.8))" }} />
            </div>
            {/* base media if any */}
            {baseItem && (baseItem.type === 'image' ? (
              <img src={baseItem.src} className="absolute inset-0 h-full w-full object-cover" />
            ) : baseItem.type === 'video' ? (
              <video src={baseItem.src} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/80">Audio selected</div>
            ))}

            {/* animated star field bg when no base */}
            {!baseItem && (
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(circle at 20% 20%, rgba(147,51,234,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.12), transparent 40%)" }} />
            )}

            {mode === "voice" && (
              <div className="absolute inset-0 grid place-items-center">
                <div className={`relative h-40 w-40 rounded-full grid place-items-center ${recording ? "animate-pulse" : ""}`}>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 opacity-30 blur-xl" />
                  <span className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 opacity-50 blur-md" />
                  <div className="relative z-10 h-20 w-20 rounded-full bg-black/50 border border-white/20 grid place-items-center">
                    <Mic className="h-8 w-8" />
                  </div>
                </div>
                {audioDataURL && <div className="absolute bottom-4 text-xs text-white/80">Recorded • tap Launch to post</div>}
              </div>
            )}

            {mode === "text" && (
              <div className="absolute inset-0">
                {/* layers */}
                {layers.map((l) => (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onDoubleClick={() => {
                      const nv = prompt("Edit text", l.content);
                      if (nv !== null) updateSelected({ content: nv });
                    }}
                    onPointerDown={(e) => onPointerDownLayer(e, l.id)}
                    onPointerMove={(e) => onPointerMoveLayer(e, l.id)}
                    onPointerUp={onPointerUpLayer}
                    onClick={() => setSelectedId(l.id)}
                    className={`absolute select-none ${selectedId === l.id ? "ring-2 ring-cyan-300/60" : ""}`}
                    style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, transform: `translate(-50%, -50%) rotate(${l.rotation}deg) scale(${l.scale})`, textAlign: l.align as any }}
                  >
                    <div className="px-3 py-1" style={{
                      color: l.color,
                      fontFamily: l.font,
                      fontWeight: l.bold ? 700 : 400,
                      fontStyle: l.italic ? "italic" : "normal",
                      textDecoration: l.underline ? "underline" : "none",
                      fontSize: `${l.size / 12}px`,
                      textShadow: l.shadowBlur ? `0 0 ${l.shadowBlur / 4}px ${l.shadowColor}` : undefined,
                      WebkitTextStroke: l.strokeWidth ? `${l.strokeWidth / 4}px ${l.strokeColor}` : undefined,
                      background: l.bgPill ? `rgba(0,0,0,${l.bgOpacity})` : undefined,
                      borderRadius: l.bgPill ? 9999 : 0,
                    }}>
                      {l.content}
                    </div>
                  </div>
                ))}

                {/* snap guides */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute top-[12%] left-0 right-0 h-px bg-white/10" />
                <div className="absolute bottom-[12%] left-0 right-0 h-px bg-white/10" />
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pb-5">
            <div className="mx-auto max-w-md">
              <div className="mb-2 flex items-center justify-between text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2" data-ui>
                    <span>Tale Lifespan ⏳</span>
                    <select className="h-8 rounded-md bg-black/40 border border-white/20 px-2" value={lifespan} onChange={(e)=> setLifespan(parseInt(e.target.value))}>
                      {LIFESPANS.map((h)=> (<option key={h} value={h}>{h}h</option>))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-2 rounded-md border border-white/20 bg-black/30" onClick={()=> setAvatarKind(randPick(AVATAR_KINDS))} data-ui>Avatar: {avatarKind}</button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <button onClick={()=> (recording ? stopRecord() : startRecord())} onMouseDown={startRecord} onMouseUp={stopRecord} onTouchStart={startRecord} onTouchEnd={stopRecord} className={`h-12 rounded-xl border border-white/15 bg-black/40 grid place-items-center ${mode==='voice' ? 'ring-2 ring-fuchsia-400/60' : ''}`} data-ui aria-label="Record"><Mic className="h-5 w-5" /></button>
                <button onClick={addTextLayer} className={`h-12 rounded-xl border border-white/15 bg-black/40 grid place-items-center ${mode==='text' ? 'ring-2 ring-cyan-300/60' : ''}`} data-ui aria-label="Text"><Type className="h-5 w-5" /></button>
                <label className="h-12 rounded-xl border border-white/15 bg-black/40 grid place-items-center cursor-pointer" data-ui aria-label="Music">
                  <input type="file" accept="audio/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=> setMusic(String(fr.result)); fr.readAsDataURL(f); }} />
                  <Music2 className="h-5 w-5" />
                </label>
                <button className="h-12 rounded-xl border border-white/15 bg-black/40 grid place-items-center" onClick={()=>{
                  const spot = prompt('Cosmic Spot'); if (spot!==null) setCosmicSpot(spot);
                }} data-ui aria-label="Location"><MapPin className="h-5 w-5" /></button>
                <button className="h-12 rounded-xl border border-white/15 bg-black/40 grid place-items-center" onClick={()=>{
                  const m = prompt('Orbiting With (comma separated)'); if (m!==null) setOrbitingWith(m);
                }} data-ui aria-label="Mentions"><Users className="h-5 w-5" /></button>
              </div>

              {selected && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 grid grid-cols-2 gap-2 text-[11px]" data-ui>
                  <div className="col-span-2 flex gap-2">
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ bold: !selected.bold })}>Bold</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ italic: !selected.italic })}>Italic</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ underline: !selected.underline })}>Underline</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ bgPill: !selected.bgPill })}>BG Pill</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ locked: !selected.locked })}>{selected.locked ? <><Lock className="h-3 w-3" /> Unlock</> : <><Unlock className="h-3 w-3" /> Lock</>}</button>
                  </div>
                  <label className="flex items-center gap-2">Size<input type="range" min={24} max={140} value={selected.size} onChange={(e)=>updateSelected({ size: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Scale<input type="range" min={0.3} max={3} step={0.1} value={selected.scale} onChange={(e)=>updateSelected({ scale: parseFloat(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Rotate<input type="range" min={-180} max={180} value={selected.rotation} onChange={(e)=>updateSelected({ rotation: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Stroke<input type="range" min={0} max={16} value={selected.strokeWidth} onChange={(e)=>updateSelected({ strokeWidth: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Shadow<input type="range" min={0} max={40} value={selected.shadowBlur} onChange={(e)=>updateSelected({ shadowBlur: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Color<input type="color" value={selected.color} onChange={(e)=>updateSelected({ color: e.target.value })} /></label>
                  <label className="flex items-center gap-2">Stroke<input type="color" value={selected.strokeColor} onChange={(e)=>updateSelected({ strokeColor: e.target.value })} /></label>
                  <label className="flex items-center gap-2">Shadow<input type="color" value={selected.shadowColor} onChange={(e)=>updateSelected({ shadowColor: e.target.value })} /></label>
                  <div className="col-span-2 flex items-center gap-2">
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ align: "left" })}>Left</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ align: "center" })}>Center</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ align: "right" })}>Right</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={duplicateSelected}><Copy className="h-3 w-3" /> Duplicate</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={bringFront}><RotateCw className="h-3 w-3" /> Front</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={sendBack}><RotateCw className="h-3 w-3 rotate-180" /> Back</button>
                    <button className="h-8 px-2 rounded-md border border-white/20 text-red-300" onClick={deleteSelected}><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              )}

              <div className="mt-3 grid">
                <button onClick={launch} className="h-12 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 text-white font-semibold shadow-[0_0_40px_rgba(236,72,153,0.6)] border border-white/10">🚀 Launch Tale</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
