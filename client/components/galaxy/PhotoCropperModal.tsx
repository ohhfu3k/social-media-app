import { useEffect, useMemo, useRef, useState } from "react";

export default function PhotoCropperModal({ open, src, onSave, onCancel }: { open: boolean; src: string | null; onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const w = 1080, h = 1920;

  useEffect(() => { if (!open) return; const img = new Image(); img.crossOrigin = "anonymous"; img.src = src || ""; imgRef.current = img; setScale(1); setOffsetX(0); setOffsetY(0); }, [open, src]);

  const t = useMemo(()=>`translate(${offsetX}px, ${offsetY}px) scale(${scale})`, [offsetX, offsetY, scale]);

  if (!open || !src) return null;

  const save = () => {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const ctx = canvas.getContext("2d"); if (!ctx || !imgRef.current) return;
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,w,h);
    const img = imgRef.current;
    const baseScale = Math.max(w / img.width, h / img.height);
    const finalScale = baseScale * scale;
    const drawW = img.width * finalScale; const drawH = img.height * finalScale;
    const centerX = w/2 + offsetX; const centerY = h/2 + offsetY;
    const dx = centerX - drawW/2; const dy = centerY - drawH/2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    onSave(canvas.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-[180]">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-3">
        <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-black/50">
          <img src={src} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform" style={{ transform: t }} />
        </div>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <label className="text-xs text-white/80">Zoom</label>
          <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e)=> setScale(parseFloat(e.target.value))} />
          <label className="text-xs text-white/80">Horizontal</label>
          <input type="range" min={-240} max={240} step={1} value={offsetX} onChange={(e)=> setOffsetX(parseFloat(e.target.value))} />
          <label className="text-xs text-white/80">Vertical</label>
          <input type="range" min={-240} max={240} step={1} value={offsetY} onChange={(e)=> setOffsetY(parseFloat(e.target.value))} />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onCancel} className="h-9 px-3 rounded-md border border-white/15">Cancel</button>
          <button onClick={save} className="h-9 px-3 rounded-md bg-primary text-primary-foreground">Add</button>
        </div>
      </div>
    </div>
  );
}
