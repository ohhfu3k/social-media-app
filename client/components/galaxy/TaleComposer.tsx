import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X, Mic, Type, Music2, MapPin, Users, Star, RotateCw, Copy, Trash2, Lock, Unlock, ImagePlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import StoryViewer, { StoryUser, StorySegment } from "./StoryViewer";
import StickerSearch from "./StickerSearch";
import SpotifyMusicModal, { SpotifyTrack } from "./SpotifyMusicModal";
import PhotoCropperModal from "./PhotoCropperModal";

export type ComposerResult = {
  items: { id: string; type: "image" | "video" | "audio"; src: string }[];
  meta: { music?: string; cosmicSpot?: string; orbitingWith?: string[]; lifespanMs: number; avatarKind: string; privacy?: "public" | "friends" | "private"; layers?: LayerMeta[] };
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
  opacity: number; // 0..1
  letterSpacing: number; // px
  locked: boolean;
};

type StickerLayer = {
  id: string;
  kind: "sticker";
  url: string;
  x: number; y: number; scale: number; rotation: number; locked: boolean;
};

type MusicLayer = {
  id: string;
  kind: "music";
  track: { id: string; name: string; artists: string; albumArt: string; previewUrl: string | null };
  x: number; y: number; scale: number; rotation: number; locked: boolean;
};

type LayerMeta = (
  | ({ type: "text" } & Pick<TextLayer, "id" | "x" | "y" | "scale" | "rotation" | "align" | "font" | "size" | "color" | "strokeColor" | "strokeWidth" | "shadowBlur" | "shadowColor" | "bold" | "italic" | "underline" | "bgPill" | "bgOpacity" | "opacity" | "letterSpacing"> & { content: string })
  | ({ type: "sticker" } & Pick<StickerLayer, "id" | "url" | "x" | "y" | "scale" | "rotation">)
  | ({ type: "music" } & Pick<MusicLayer, "id" | "x" | "y" | "scale" | "rotation"> & { trackId: string; previewUrl: string | null })
);

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
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [music, setMusic] = useState<string | undefined>();
  const [cosmicSpot, setCosmicSpot] = useState("");
  const [orbitingWith, setOrbitingWith] = useState<string>("");
  const [lifespan, setLifespan] = useState<number>(24);
  const [privacy, setPrivacy] = useState<"public"|"friends"|"private">("public");
  const [avatarKind, setAvatarKind] = useState<string>(randPick(AVATAR_KINDS));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioDataURL, setAudioDataURL] = useState<string | undefined>();
  const [localBase, setLocalBase] = useState<{ id: string; type: "image" | "video" | "audio"; src: string } | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicLayer, setMusicLayer] = useState<MusicLayer | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const selected = useMemo(() => layers.find((l) => l.id === selectedId) || null, [layers, selectedId]);

  // Autosave
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      const draft = { mode, layers, stickers, music, cosmicSpot, orbitingWith, lifespan, avatarKind, privacy };
      try { localStorage.setItem("tale_composer_draft", JSON.stringify(draft)); } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [open, mode, layers, stickers, music, cosmicSpot, orbitingWith, lifespan, avatarKind, privacy]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("tale_composer_draft");
      if (raw) {
        const d = JSON.parse(raw);
        setMode(d.mode || "text");
        setLayers((d.layers || []).map((l:any)=> ({ ...l, opacity: l.opacity ?? 1, letterSpacing: l.letterSpacing ?? 0 })));
        setStickers(d.stickers || []);
        setMusic(d.music);
        setCosmicSpot(d.cosmicSpot || "");
        setOrbitingWith(d.orbitingWith || "");
        setLifespan(d.lifespan || 24);
        setAvatarKind(d.avatarKind || randPick(AVATAR_KINDS));
        setPrivacy(d.privacy || "public");
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

  // Keyboard nudge for accessibility
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const step = e.shiftKey ? 0.02 : 0.005;
      if (e.key === 'ArrowLeft') { setLayers((ls)=> ls.map((l)=> l.id===selectedId && !l.locked ? { ...l, x: Math.max(0.02, l.x - step) } : l)); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setLayers((ls)=> ls.map((l)=> l.id===selectedId && !l.locked ? { ...l, x: Math.min(0.98, l.x + step) } : l)); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setLayers((ls)=> ls.map((l)=> l.id===selectedId && !l.locked ? { ...l, y: Math.max(0.05, l.y - step) } : l)); e.preventDefault(); }
      if (e.key === 'ArrowDown') { setLayers((ls)=> ls.map((l)=> l.id===selectedId && !l.locked ? { ...l, y: Math.min(0.95, l.y + step) } : l)); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectedId]);

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
      content: "Tap to edit",
      x: 0.5, y: 0.5, scale: 1, rotation: 0, align: "center",
      font: "Poppins", size: 64, color: "#ffffff", strokeColor: "#000000", strokeWidth: 0,
      shadowBlur: 8, shadowColor: "rgba(0,0,0,0.6)", bold: false, italic: false, underline: false,
      bgPill: false, bgOpacity: 0.3, opacity: 1, letterSpacing: 0, locked: false,
    };
    pushHistory();
    setLayers((ls) => [...ls, nl]); setSelectedId(nl.id); setMode("text");
  };

  const addSticker = (url: string) => {
    const s: StickerLayer = { id: `s-${Date.now()}`, kind: "sticker", url, x: 0.5, y: 0.5, scale: 1, rotation: 0, locked: false };
    pushHistory();
    setStickers((ss) => [...ss, s]); setSelectedId(s.id);
  };

  // Drag & pinch/rotate
  const dragging = useRef(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef<{ dist: number; angle: number; scale: number; rotation: number } | null>(null);
  const onPointerDownLayer = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest("[data-ui]") ) return; // skip when interacting with UI controls
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSelectedId(id);
    if (pointers.current.size === 1) {
      dragging.current = true;
    } else if (pointers.current.size === 2) {
      const ps = Array.from(pointers.current.values());
      const dx = ps[1].x - ps[0].x; const dy = ps[1].y - ps[0].y;
      const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
      const cur = layers.find((l)=> l.id === id);
      gestureStart.current = { dist, angle, scale: cur?.scale || 1, rotation: cur?.rotation || 0 };
      dragging.current = false;
    }
  };
  const onPointerMoveLayer = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement; const rect = el.getBoundingClientRect();
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && gestureStart.current) {
      const ps = Array.from(pointers.current.values());
      const dx = ps[1].x - ps[0].x; const dy = ps[1].y - ps[0].y;
      const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
      const gs = gestureStart.current;
      const scale = Math.max(0.2, Math.min(3, gs.scale * (dist / Math.max(1, gs.dist))));
      const rotation = ((gs.rotation + (angle - gs.angle) * (180/Math.PI)) + 360) % 360;
      setLayers((ls) => ls.map((l) => l.id === id && !l.locked ? { ...l, scale, rotation } : l));
      return;
    }
    if (!dragging.current) return;
    const px = (e.clientX - rect.left) / rect.width; const py = (e.clientY - rect.top) / rect.height;
    setLayers((ls) => ls.map((l) => l.id === id && !l.locked ? { ...l, x: Math.min(0.98, Math.max(0.02, px)), y: Math.min(0.95, Math.max(0.05, py)) } : l));
  };
  const onPointerUpLayer = (e?: React.PointerEvent) => {
    if (e) { try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {} pointers.current.delete(e.pointerId); }
    if (pointers.current.size === 0) { dragging.current = false; gestureStart.current = null; }
  };

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
    const base = localBase || baseItem;
    if (base && base.type === 'image') {
      await new Promise<void>((resolve) => {
        const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve(); }; img.src = base.src;
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
        ctx.globalAlpha = l.opacity;
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
      ctx.globalAlpha = l.opacity; ctx.fillStyle = l.color; ctx.fillText(l.content, 0, 0);
      ctx.restore();
    });
    // Music widget (if present)
    if (musicLayer) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => resolve(im); im.src = musicLayer.track.albumArt; });
        ctx.save();
        ctx.translate(musicLayer.x * w, musicLayer.y * h);
        ctx.rotate((musicLayer.rotation * Math.PI) / 180);
        ctx.scale(musicLayer.scale, musicLayer.scale);
        const mw = 480, mh = 96;
        ctx.globalAlpha = 0.9; ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.roundRect?.(-mw/2, -mh/2, mw, mh, 16 as any);
        if (!('roundRect' in ctx)) { ctx.fillRect(-mw/2, -mh/2, mw, mh); } else { ctx.fill(); }
        ctx.drawImage(img, -mw/2 + 8, -mh/2 + 8, 80, 80);
        ctx.fillStyle = "#fff"; ctx.globalAlpha = 1;
        ctx.font = `700 36px Inter`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(musicLayer.track.name, -mw/2 + 100, -mh/2 + 16);
        ctx.font = `400 28px Inter`; ctx.fillStyle = "#ddd"; ctx.fillText(musicLayer.track.artists, -mw/2 + 100, -mh/2 + 52);
        ctx.restore();
      } catch {}
    }
    // Stickers
    for (const s of stickers) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => resolve(im); im.src = s.url; });
        const ww = 240; const hh = 240; // base sticker size
        ctx.save();
        ctx.translate(s.x * w, s.y * h);
        ctx.rotate((s.rotation * Math.PI) / 180);
        ctx.scale(s.scale, s.scale);
        ctx.drawImage(img, -ww/2, -hh/2, ww, hh);
        ctx.restore();
      } catch {}
    }
    // draw top/bottom safe guides lightly
    ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(0, 0, w, padTop); ctx.fillRect(0, h - padBottom, w, padBottom);
    return c.toDataURL("image/png");
  };

  const launch = async () => {
    const avatar = avatarKind;
    const layersMeta: LayerMeta[] = [
      ...layers.map((l)=> ({ type: "text" as const, id: l.id, content: l.content, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation, align: l.align, font: l.font, size: l.size, color: l.color, strokeColor: l.strokeColor, strokeWidth: l.strokeWidth, shadowBlur: l.shadowBlur, shadowColor: l.shadowColor, bold: l.bold, italic: l.italic, underline: l.underline, bgPill: l.bgPill, bgOpacity: l.bgOpacity, opacity: l.opacity, letterSpacing: l.letterSpacing })),
      ...stickers.map((s)=> ({ type: "sticker" as const, id: s.id, url: s.url, x: s.x, y: s.y, scale: s.scale, rotation: s.rotation })),
      ...(musicLayer ? [{ type: "music" as const, id: musicLayer.id, x: musicLayer.x, y: musicLayer.y, scale: musicLayer.scale, rotation: musicLayer.rotation, trackId: musicLayer.track.id, previewUrl: musicLayer.track.previewUrl }] : [])
    ];
    const meta = { music: musicLayer ? { id: musicLayer.track.id, name: musicLayer.track.name, artists: musicLayer.track.artists, albumArt: musicLayer.track.albumArt, previewUrl: musicLayer.track.previewUrl } : undefined, cosmicSpot: cosmicSpot || undefined, orbitingWith: orbitingWith ? orbitingWith.split(/\s*,\s*/).filter(Boolean) : undefined, lifespanMs: lifespan * 3600_000, avatarKind: avatar, privacy, layers: layersMeta };
    const items: ComposerResult["items"] = [];
    const base = localBase || baseItem; if (base) items.push(base);
    if (mode === "voice" && audioDataURL) { items.push({ id: `aud-${Date.now()}`, type: "audio", src: audioDataURL }); }
    // always render a visual image of overlays for preview
    if (layers.length > 0 || stickers.length > 0) {
      const dataUrl = await renderTextToImage(); items.push({ id: `img-${Date.now()}`, type: "image", src: dataUrl });
    }
    if (items.length === 0) return;
    onLaunch({ items, meta });
  };

  // UI state updates for style controls
  const updateSelected = (patch: Partial<TextLayer>) => {
    if (!selected) return; pushHistory(); setLayers((ls) => ls.map((l) => (l.id === selected.id ? { ...l, ...patch } : l)));
  };
  const duplicateSelected = () => { if (!selected) return; pushHistory(); const c = { ...selected, id: `t-${Date.now()}` }; setLayers((ls) => [...ls, c]); setSelectedId(c.id); };
  const deleteSelected = () => { if (!selected) return; pushHistory(); setLayers((ls) => ls.filter((l) => l.id !== selected.id)); setSelectedId(null); };
  const bringFront = () => { if (!selected) return; pushHistory(); setLayers((ls) => { const others = ls.filter((l)=>l.id!==selected.id); return [...others, selected]; }); };
  const sendBack = () => { if (!selected) return; pushHistory(); setLayers((ls) => { const others = ls.filter((l)=>l.id!==selected.id); return [selected, ...others]; }); };

  const moveLayer = (id: string, dir: -1 | 1) => {
    pushHistory();
    setLayers((ls) => {
      const idx = ls.findIndex((l)=> l.id===id); if (idx<0) return ls;
      const ni = Math.max(0, Math.min(ls.length-1, idx + dir));
      const arr = ls.slice(); const [it] = arr.splice(idx,1); arr.splice(ni,0,it); return arr;
    });
  };
  const moveSticker = (id: string, dir: -1 | 1) => {
    pushHistory();
    setStickers((ss) => {
      const idx = ss.findIndex((s)=> s.id===id); if (idx<0) return ss;
      const ni = Math.max(0, Math.min(ss.length-1, idx + dir));
      const arr = ss.slice(); const [it] = arr.splice(idx,1); arr.splice(ni,0,it); return arr;
    });
  };

  // Undo/Redo stacks
  const historyRef = useRef<{ layers: TextLayer[]; stickers: StickerLayer[] }[]>([]);
  const futureRef = useRef<{ layers: TextLayer[]; stickers: StickerLayer[] }[]>([]);
  const pushHistory = () => { historyRef.current.push({ layers: JSON.parse(JSON.stringify(layers)), stickers: JSON.parse(JSON.stringify(stickers)) }); futureRef.current = []; };
  const undo = () => { const last = historyRef.current.pop(); if (!last) return; futureRef.current.push({ layers, stickers }); setLayers(last.layers); setStickers(last.stickers); };
  const redo = () => { const nxt = futureRef.current.pop(); if (!nxt) return; historyRef.current.push({ layers, stickers }); setLayers(nxt.layers); setStickers(nxt.stickers); };

  // Prepare preview image when preview opens
  useEffect(() => {
    if (!previewOpen) return;
    (async () => {
      try { const url = await renderTextToImage(); setPreviewImage(url); } catch { setPreviewImage(null); }
    })();
  }, [previewOpen, layers, stickers, localBase, baseItem]);

  const viewerUsers = useMemo(() => {
    const now = Date.now();
    const segs: StorySegment[] = [];
    const base = localBase || baseItem;
    const metaMusic = musicLayer ? { music: { id: musicLayer.track.id, name: musicLayer.track.name, artists: musicLayer.track.artists, albumArt: musicLayer.track.albumArt, previewUrl: musicLayer.track.previewUrl } } : undefined;
    if (base) {
      if (base.type === 'video') segs.push({ id: `v-${now}`, type: 'video', src: base.src, createdAt: now, lifespanMs: lifespan*3600_000, meta: metaMusic as any });
      else segs.push({ id: `i-${now}`, type: 'image', src: previewImage || base.src, createdAt: now, lifespanMs: lifespan*3600_000, meta: metaMusic as any });
    } else if (previewImage) {
      segs.push({ id: `i-${now}`, type: 'image', src: previewImage, createdAt: now, lifespanMs: lifespan*3600_000, meta: metaMusic as any });
    }
    return [{ id: 'you', name: 'You', avatar: undefined, kind: 'cosmic' as const, segments: segs } as StoryUser];
  }, [previewOpen, localBase, baseItem, lifespan, previewImage]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.18), transparent 40%)" }} />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-14 px-3 flex items-center justify-between backdrop-blur bg-black/20">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center bg-black/20" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
              <div className="text-sm font-medium">New Tale ✨</div>
              <button onClick={undo} className="h-9 px-2 rounded-md border border-white/15 bg-black/20 text-xs" aria-label="Undo">Undo</button>
              <button onClick={redo} className="h-9 px-2 rounded-md border border-white/15 bg-black/20 text-xs" aria-label="Redo">Redo</button>
              <button onClick={()=>{ try{ localStorage.setItem('tale_composer_draft', JSON.stringify({ mode, layers, stickers, music, cosmicSpot, orbitingWith, lifespan, avatarKind, privacy })); }catch{} }} className="h-9 px-2 rounded-md border border-white/15 bg-black/20 text-xs" aria-label="Save draft">Save</button>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <label className="flex items-center gap-2" data-ui>
                <span>Life</span>
                <select className="h-8 rounded-md bg-black/40 border border-white/20 px-2" value={lifespan} onChange={(e)=> setLifespan(parseInt(e.target.value))}>
                  {LIFESPANS.map((h)=> (<option key={h} value={h}>{h}h</option>))}
                </select>
              </label>
              <label className="flex items-center gap-2" data-ui>
                <span>Privacy</span>
                <select className="h-8 rounded-md bg-black/40 border border-white/20 px-2" value={privacy} onChange={(e)=> setPrivacy(e.target.value as any)}>
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <div className="text-xs">Avatar: {avatarKind}</div>
              <button onClick={()=> setAvatarKind(randPick(AVATAR_KINDS))} className="h-9 px-2 rounded-md border border-white/15 bg-black/20 text-xs" data-ui>Shuffle</button>
            </div>
            <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center bg-black/20" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>

          {/* Center preview 9:16 canvas */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[48%] w-[min(90vw,420px)] aspect-[9/16] rounded-2xl border border-white/15 bg-black/40 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {/* comet trail progress bar */}
            <div className="absolute top-3 left-3 right-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-yellow-300 via-amber-400 to-fuchsia-400 animate-[slide_2s_linear_infinite]" style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.8))" }} />
            </div>
            {/* base media if any */}
            {(localBase || baseItem) && ((localBase || baseItem)!.type === 'image' ? (
              <img src={(localBase || baseItem)!.src} className="absolute inset-0 h-full w-full object-cover" />
            ) : (localBase || baseItem)!.type === 'video' ? (
              <video src={(localBase || baseItem)!.src} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/80">Audio selected</div>
            ))}

            {/* animated star field bg when no base */}
            {!localBase && !baseItem && (
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(circle at 20% 20%, rgba(147,51,234,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.12), transparent 40%)" }} />
            )}

            {/* faint safe guides */}
            <div className="absolute left-0 right-0 top-[8%] h-[2px] bg-white/10" />
            <div className="absolute left-0 right-0 bottom-[12%] h-[2px] bg-white/10" />

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

            {/* overlays */}
            <div className="absolute inset-0">
              {layers.map((l) => (
                <div
                  key={l.id}
                  role="button"
                  tabIndex={0}
                  aria-label="Text overlay"
                  onDoubleClick={() => {
                    const nv = prompt("Edit text", l.content);
                    if (nv !== null) updateSelected({ content: nv });
                  }}
                  onPointerDown={(e) => onPointerDownLayer(e, l.id)}
                  onPointerMove={(e) => onPointerMoveLayer(e, l.id)}
                  onPointerUp={(e)=> onPointerUpLayer(e)}
                  onClick={() => setSelectedId(l.id)}
                  className={`absolute select-none transition-transform ${selectedId === l.id ? "ring-2 ring-cyan-300/60" : ""}`}
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
                    opacity: l.opacity,
                    letterSpacing: `${l.letterSpacing / 4}px`,
                    borderRadius: l.bgPill ? 9999 : 0,
                  }}>
                    {l.content}
                  </div>
                </div>
              ))}
              {musicLayer && (
                <div role="button" aria-label="Music overlay" onPointerDown={(e)=>{ const el=e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); setSelectedId(musicLayer.id); dragging.current = true; }} onPointerMove={(e)=>{ if (!dragging.current) return; const el=e.currentTarget as HTMLElement; const rect=el.parentElement!.getBoundingClientRect(); const px=(e.clientX-rect.left)/rect.width; const py=(e.clientY-rect.top)/rect.height; setMusicLayer((ml)=> ml && !ml.locked ? ({ ...ml, x: Math.min(0.98, Math.max(0.02, px)), y: Math.min(0.95, Math.max(0.05, py)) }) : ml); }} onPointerUp={(e)=>{ try{(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);}catch{} dragging.current=false; }} className={`absolute select-none ${selectedId===musicLayer.id? 'ring-2 ring-emerald-300/60':''}`} style={{ left: `${musicLayer.x*100}%`, top: `${musicLayer.y*100}%`, transform: `translate(-50%, -50%) rotate(${musicLayer.rotation}deg) scale(${musicLayer.scale})` }}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur border border-white/10">
                    <img src={musicLayer.track.albumArt} className="h-8 w-8 rounded" />
                    <div className="text-xs">
                      <div className="font-semibold leading-4">{musicLayer.track.name}</div>
                      <div className="text-white/70 leading-4">{musicLayer.track.artists}</div>
                    </div>
                  </div>
                </div>
              )}
              {stickers.map((s) => (
                <div key={s.id}
                  role="img"
                  aria-label="Sticker"
                  onPointerDown={(e)=> onPointerDownLayer(e, s.id)}
                  onPointerMove={(e)=> onPointerMoveLayer(e, s.id)}
                  onPointerUp={(e)=> onPointerUpLayer(e)}
                  onClick={()=> setSelectedId(s.id)}
                  className={`absolute select-none ${selectedId===s.id? 'ring-2 ring-fuchsia-300/60':''}`}
                  style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})` }}>
                  <img src={s.url} className="h-24 w-24 object-contain" />
                </div>
              ))}

              {/* snap guides */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute top-[12%] left-0 right-0 h-px bg-white/10" />
              <div className="absolute bottom-[12%] left-0 right-0 h-px bg-white/10" />
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pb-5">
            <div className="mx-auto max-w-md lg:max-w-md">
              <div className="mb-2 flex items-center justify-between text-xs text-white/80 lg:flex-row">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 justify-center" data-ui>
                    <select className="h-8 rounded-md bg-black/40 border border-white/20 px-2 mt-11 ml-4 lg:mt-px lg:ml-0" value={lifespan} onChange={(e)=> setLifespan(parseInt(e.target.value))}>
                      {LIFESPANS.map((h)=> (<option key={h} value={h}>{h}h</option>))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-2" />
              </div>
              <div className="flex gap-2 justify-center items-start -ml-1 mt-[3px] lg:grid lg:grid-cols-8 lg:gap-2 lg:ml-0 lg:mt-0">
                <button onClick={()=> (recording ? stopRecord() : startRecord())} onMouseDown={startRecord} onMouseUp={stopRecord} onTouchStart={startRecord} onTouchEnd={stopRecord} className={`h-[51px] max-w-[36px] lg:h-12 lg:max-w-none rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center ${mode==='voice' ? 'ring-2 ring-fuchsia-400/60' : ''}`} data-ui aria-label="Record"><Mic className="h-5 w-5" /></button>
                <button onClick={addTextLayer} className={`h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center ${mode==='text' ? 'ring-2 ring-cyan-300/60' : ''}`} data-ui aria-label="Text"><Type className="h-5 w-5" /></button>
                <label className="h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center cursor-pointer" data-ui aria-label="Gallery">
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=> { try { const mime = f.type; const t = (mime && mime.startsWith('image/')) ? 'image' : 'video'; if (t==='image') { setPendingPhoto(String(fr.result)); } else { setLocalBase({ id: `${t}-${Date.now()}`, type: t as any, src: String(fr.result) }); } } catch {} }; fr.readAsDataURL(f); }} />
                  <ImagePlus className="h-5 w-5" />
                </label>
                <button className="h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center" onClick={()=> setStickersOpen(true)} data-ui aria-label="Sticker"><Star className="h-5 w-5" /></button>
                <button className="h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center" onClick={()=> setMusicOpen(true)} data-ui aria-label="Music"><Music2 className="h-5 w-5" /></button>
                <button className="h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center" onClick={()=>{
                  const spot = prompt('Cosmic Spot'); if (spot!==null) setCosmicSpot(spot);
                }} data-ui aria-label="Location"><MapPin className="h-5 w-5" /></button>
                <button className="h-12 rounded-xl border-8 lg:border border-white/15 bg-black/40 grid place-items-center" onClick={()=>{
                  const m = prompt('Orbiting With (comma separated)'); if (m!==null) setOrbitingWith(m);
                }} data-ui aria-label="Mentions"><Users className="h-5 w-5" /></button>
                <button onClick={()=> setPreviewOpen(true)} className="h-12 rounded-xl border-4 lg:border border-white/15 bg-black/40 text-white" data-ui aria-label="Preview">Preview</button>
                <button onClick={launch} className="h-12 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 text-white font-semibold shadow-[0_0_40px_rgba(236,72,153,0.6)] border-4 lg:border border-white/10 mt-[2px] -ml-1 lg:mt-0 lg:ml-0" data-ui aria-label="Publish">Publish</button>
              </div>

              {selected && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 grid grid-cols-2 gap-2 text-[11px]" data-ui>
                  <div className="col-span-2 flex gap-2 flex-wrap">
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ bold: !selected.bold })}>Bold</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ italic: !selected.italic })}>Italic</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ underline: !selected.underline })}>Underline</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ bgPill: !selected.bgPill })}>BG Pill</button>
                    <button className="h-8 px-2 rounded-md border border-white/20" onClick={()=>updateSelected({ locked: !selected.locked })}>{selected.locked ? <><Lock className="h-3 w-3" /> Unlock</> : <><Unlock className="h-3 w-3" /> Lock</>}</button>
                  </div>
                  <label className="flex items-center gap-2">Size<input type="range" min={24} max={140} value={selected.size} onChange={(e)=>updateSelected({ size: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Scale<input type="range" min={0.3} max={3} step={0.1} value={selected.scale} onChange={(e)=>updateSelected({ scale: parseFloat(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Rotate<input type="range" min={-180} max={180} value={selected.rotation} onChange={(e)=>updateSelected({ rotation: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Opacity<input type="range" min={0.1} max={1} step={0.05} value={selected.opacity} onChange={(e)=>updateSelected({ opacity: parseFloat(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Letter<input type="range" min={-4} max={20} step={1} value={selected.letterSpacing} onChange={(e)=>updateSelected({ letterSpacing: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Stroke<input type="range" min={0} max={16} value={selected.strokeWidth} onChange={(e)=>updateSelected({ strokeWidth: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Shadow<input type="range" min={0} max={40} value={selected.shadowBlur} onChange={(e)=>updateSelected({ shadowBlur: parseInt(e.target.value) })} /></label>
                  <label className="flex items-center gap-2">Color<input type="color" value={selected.color} onChange={(e)=>updateSelected({ color: e.target.value })} /></label>
                  <label className="flex items-center gap-2">Stroke<input type="color" value={selected.strokeColor} onChange={(e)=>updateSelected({ strokeColor: e.target.value })} /></label>
                  <label className="flex items-center gap-2">Shadow<input type="color" value={selected.shadowColor} onChange={(e)=>updateSelected({ shadowColor: e.target.value })} /></label>
                  <div className="col-span-2 flex items-center gap-2 flex-wrap">
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

            </div>
          </div>
          {/* Layers panel */}
          <div className="absolute z-[125] w-48 rounded-xl border border-white/10 bg-black/40 backdrop-blur p-2 text-xs space-y-2 top-[3px] left-[139px] right-auto lg:top-16 lg:right-3 lg:left-auto" aria-label="Layers panel">
            <div className="font-medium opacity-80">Text Layers</div>
            <div className="space-y-1 max-h-40 overflow-auto">
              {layers.map((l,i)=> (
                <div key={l.id} className={`flex items-center gap-2 p-1 rounded hover:bg-white/5 ${selectedId===l.id? 'bg-white/10':''}`}>
                  <button onClick={()=> setSelectedId(l.id)} className="flex-1 text-left truncate">T • {l.content || 'Text'}</button>
                  <button onClick={()=> moveLayer(l.id, -1)} aria-label="Up">▲</button>
                  <button onClick={()=> moveLayer(l.id, 1)} aria-label="Down">▼</button>
                  <button onClick={()=> updateSelected({ locked: !l.locked })} aria-label="Lock">{l.locked? '🔒':'🔓'}</button>
                  <button onClick={()=> { pushHistory(); setLayers((ls)=> ls.filter(x=> x.id!==l.id)); if (selectedId===l.id) setSelectedId(null);} } aria-label="Delete">✕</button>
                </div>
              ))}
              {!layers.length && <div className="opacity-60">No text layers</div>}
            </div>
            <div className="font-medium opacity-80 mt-1 lg:mt-1">Stickers</div>
            <div className="space-y-1 max-h-28 overflow-auto">
              {stickers.map((s)=> (
                <div key={s.id} className={`flex items-center gap-2 p-1 rounded hover:bg-white/5 ${selectedId===s.id? 'bg-white/10':''}`}>
                  <button onClick={()=> setSelectedId(s.id)} className="flex-1 text-left truncate">Sticker</button>
                  <button onClick={()=> moveSticker(s.id, -1)} aria-label="Up">▲</button>
                  <button onClick={()=> moveSticker(s.id, 1)} aria-label="Down">▼</button>
                  <button onClick={()=> { pushHistory(); setStickers((ss)=> ss.filter(x=> x.id!==s.id)); if (selectedId===s.id) setSelectedId(null);} } aria-label="Delete">✕</button>
                </div>
              ))}
              {!stickers.length && <div className="opacity-60">No stickers</div>}
            </div>
          </div>

          {/* Preview viewer */}
          <StoryViewer
            open={previewOpen}
            onClose={()=> setPreviewOpen(false)}
            users={viewerUsers}
            startUser={0}
          />
          <StickerSearch open={stickersOpen} onClose={()=> setStickersOpen(false)} onPick={(url)=> addSticker(url)} />
          <SpotifyMusicModal open={musicOpen} onClose={()=> setMusicOpen(false)} onPick={(t: SpotifyTrack)=>{
            const artists = t.artists.map(a=>a.name).join(", ");
            const art = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "";
            const ml: MusicLayer = { id: `m-${Date.now()}`, kind: 'music', track: { id: t.id, name: t.name, artists, albumArt: art, previewUrl: t.preview_url }, x: 0.5, y: 0.88, scale: 1, rotation: 0, locked: false };
            setMusicLayer(ml);
          }} />
          <PhotoCropperModal open={!!pendingPhoto} src={pendingPhoto} onCancel={()=> setPendingPhoto(null)} onSave={(url)=>{ setPendingPhoto(null); setLocalBase({ id: `image-${Date.now()}`, type: 'image', src: url }); }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
