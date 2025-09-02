import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, X, ImagePlus } from "lucide-react";

export type PickedItem = { id: string; type: "image" | "video" | "audio"; src: string };

export default function StoryCamera({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (items: PickedItem[]) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
          setError("Camera not supported");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setError("Camera permission denied or dismissed");
      }
    })();
    return () => {
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      streamRef.current = null;
    };
  }, [open]);

  const capturePhoto = () => {
    try {
      const video = videoRef.current; if (!video) return;
      const w = 1080; const h = 1920; const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"); if (!ctx) return;
      const vw = video.videoWidth; const vh = video.videoHeight;
      // cover
      const vr = vw / vh; const cr = w / h;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (vr > cr) { // video wider than canvas
        sw = vh * cr; sx = (vw - sw) / 2;
      } else { // taller
        sh = vw / cr; sy = (vh - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
      const dataUrl = c.toDataURL("image/jpeg", 0.92);
      onPick([{ id: `cam-${Date.now()}`, type: "image", src: dataUrl }]);
    } catch {}
  };

  const onPickFile = async (file: File) => {
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "audio";
    const fr = new FileReader();
    fr.onload = () => onPick([{ id: `${type}-${Date.now()}`, type: type as any, src: String(fr.result) }]);
    fr.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[115]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/90" />
          <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-3">
            <div className="text-sm">Camera</div>
            <button onClick={onClose} className="h-9 w-9 rounded-full border border-white/15 grid place-items-center bg-black/20" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="absolute inset-0 grid place-items-center pt-8 pb-20 px-4">
            {error ? (
              <div className="text-sm text-white/80">{error}</div>
            ) : (
              <div className="w-[min(92vw,440px)] aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 bg-black">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between">
            <label className="h-12 w-12 rounded-full border border-white/20 bg-white/10 grid place-items-center cursor-pointer" aria-label="Pick media">
              <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) onPickFile(f); }} />
              <ImagePlus className="h-6 w-6" />
            </label>
            <button onClick={capturePhoto} className="h-14 w-14 rounded-full grid place-items-center bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]" aria-label="Capture">
              <Camera className="h-7 w-7" />
            </button>
            <div className="h-12 w-12" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
