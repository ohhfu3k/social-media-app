export interface ReelItem {
  id: string;
  src: string;
  title: string;
  size?: "sm" | "md" | "lg";
}

export default function Reels({ items, onSelect }: { items: ReelItem[]; onSelect?: (r: ReelItem) => void }) {
  const sizeClass = (s?: "sm" | "md" | "lg") => {
    switch (s) {
      case "sm":
        return "w-36 h-64 sm:w-40 sm:h-72";
      case "lg":
        return "w-56 h-[26rem] sm:w-60 sm:h-[28rem] md:w-64 md:h-[30rem]";
      default:
        return "w-44 h-80 sm:w-48 sm:h-88 md:w-56 md:h-96";
    }
  };
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Blips</div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect?.(r)}
            className={`relative shrink-0 ${sizeClass(r.size)} rounded-xl overflow-hidden border border-white/10 bg-black/40 focus:outline-none focus:ring-2 focus:ring-ring`}
            aria-label={`Open blip: ${r.title}`}
            title={r.title}
          >
            <video
              src={r.src}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 text-white text-xs truncate">{r.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
