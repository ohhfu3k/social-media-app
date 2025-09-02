export default function SpinningGalaxy({ size = 48 }: { size?: number }) {
  const s = `${size}px`;
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative grid place-items-center"
      style={{ width: s, height: s }}
    >
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(217,70,239,.6), rgba(34,211,238,.6), rgba(251,191,36,.6), rgba(217,70,239,.6))",
          WebkitMask: "radial-gradient(transparent 55%, black 56%)",
          mask: "radial-gradient(transparent 55%, black 56%)",
        }}
      />
      <div className="h-1.5 w-1.5 rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,.8)] translate-x-5" />
    </div>
  );
}
