import { useEffect } from "react";

export default function FloatingPanel({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[min(680px,92vw)]">
        <div className="p-[2px] rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 shadow-[0_20px_80px_-20px_rgba(234,179,8,0.45)]">
          <div className="rounded-2xl bg-card/80 backdrop-blur p-4 border border-white/10">
            {title && <div className="text-sm font-semibold mb-2">{title}</div>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
