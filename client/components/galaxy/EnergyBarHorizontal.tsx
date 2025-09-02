import React from "react";

export default function EnergyBarHorizontal({ value = 0, width = "100%" }: { value?: number; width?: number | string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative h-2 rounded-full bg-muted/40 border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.35)]"
      style={{ width }}
      aria-label="Energy"
      role="meter"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 animate-energy"
        style={{ width: `${safe}%` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.3),transparent_50%)]" />
    </div>
  );
}
