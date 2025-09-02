import { useEffect, useMemo, useRef, useState } from "react";

export default function AvatarCropper({
  src,
  initialScale = 1,
  onSave,
  onCancel,
}: {
  src: string;
  initialScale?: number;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [scale, setScale] = useState(initialScale);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const size = 256; // export size

  const previewTransform = useMemo(() => {
    return `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }, [offsetX, offsetY, scale]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    imgRef.current = img;
  }, [src]);

  const handleSave = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current) return;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Compute draw parameters
    const img = imgRef.current;
    // Base scale so that the smallest side fits
    const baseScale = Math.max(size / img.width, size / img.height);
    const finalScale = baseScale * scale;
    const drawW = img.width * finalScale;
    const drawH = img.height * finalScale;
    const centerX = size / 2 + offsetX;
    const centerY = size / 2 + offsetY;
    const dx = centerX - drawW / 2;
    const dy = centerY - drawH / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    const url = canvas.toDataURL("image/png");
    onSave(url);
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto h-48 w-48 rounded-full overflow-hidden border border-white/10 bg-black/30 relative">
        <img src={src} alt="avatar" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform" style={{ transform: previewTransform }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <label className="text-xs text-muted-foreground">Zoom</label>
        <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="sm:col-span-2 w-full" />
        <label className="text-xs text-muted-foreground">Horizontal</label>
        <input type="range" min={-120} max={120} step={1} value={offsetX} onChange={(e) => setOffsetX(parseFloat(e.target.value))} className="sm:col-span-2 w-full" />
        <label className="text-xs text-muted-foreground">Vertical</label>
        <input type="range" min={-120} max={120} step={1} value={offsetY} onChange={(e) => setOffsetY(parseFloat(e.target.value))} className="sm:col-span-2 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 h-9 rounded-md border border-white/10">Cancel</button>
        <button onClick={handleSave} className="px-3 h-9 rounded-md bg-primary text-primary-foreground">Save</button>
      </div>
    </div>
  );
}
