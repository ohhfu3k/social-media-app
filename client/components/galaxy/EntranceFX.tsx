import { useEffect, useState } from "react";

export type EntranceStyle = "Comet Trail" | "Warp Jump" | "Starlight";

export default function EntranceFX({ style, onDone }: { style: EntranceStyle; onDone?: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => { setShow(false); onDone?.(); }, 1600);
    return () => window.clearTimeout(t);
  }, [onDone]);
  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {style === "Comet Trail" && <CometTrail />}
      {style === "Warp Jump" && <WarpJump />}
      {style === "Starlight" && <Starlight />}
    </div>
  );
}

function CometTrail() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute left-[-10%] top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_12px_4px_rgba(255,255,255,0.35)] comet-fly" />
      <div className="absolute left-[-20%] top-1/2 -translate-y-1/2 h-0.5 w-[35vw] bg-gradient-to-r from-transparent via-fuchsia-400/30 to-cyan-300/40 blur-sm comet-tail" />
    </div>
  );
}

function WarpJump() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="h-6 w-6 rounded-full bg-white/80 shadow-[0_0_18px_6px_rgba(255,255,255,0.35)] warp-core" />
      <div className="absolute inset-0 warp-lines" />
      <div className="absolute inset-0 warp-rings" />
    </div>
  );
}

function Starlight() {
  const stars = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0">
      {stars.map((_, i) => (
        <span key={i} className={`absolute star twinkle-${(i % 5) + 1}`} style={{ left: `${5 + Math.random()*90}%`, top: `${15 + Math.random()*60}%`, opacity: 0.7 }} />
      ))}
      <div className="absolute inset-0 grid place-items-center">
        <div className="h-14 w-14 rounded-full bg-white/5 border border-white/20 shadow-[0_0_40px_12px_rgba(255,255,255,0.12)]" />
      </div>
    </div>
  );
}
