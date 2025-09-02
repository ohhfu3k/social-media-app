export default function EnergyBarVertical({ value = 75, height = 220 }: { value?: number; height?: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative w-4 rounded-full bg-muted/40 border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.35)]"
      style={{ height }}
      aria-label="Energy"
      role="meter"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400 via-fuchsia-500 to-indigo-400 animate-energy"
        style={{ height: `${safe}%` }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.3),transparent_50%)]" />
    </div>
  );
}
