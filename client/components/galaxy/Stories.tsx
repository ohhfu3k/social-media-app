import { cn } from "@/lib/utils";

export interface Story {
  id: string;
  name: string;
  avatar: string;
  hasNew?: boolean;
}

export default function Stories({ items, className, onSelect, addButton }: { items: Story[]; className?: string; onSelect?: (story: Story, index: number) => void; addButton?: React.ReactNode }) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto no-scrollbar py-2", className)}>
      {addButton}
      {items.map((s, idx) => (
        <button
          key={s.id}
          onClick={() => onSelect?.(s, idx)}
          className="shrink-0 flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
          aria-label={`Open story: ${s.name}`}
          title={s.name}
        >
          <div className="relative">
            <img
              src={s.avatar}
              alt={s.name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-transparent hover:ring-primary transition-shadow shadow-[0_0_12px_rgba(99,102,241,0.35)]"
            />
            {s.hasNew && (
              <span className="pointer-events-none absolute -inset-0.5 rounded-full animate-orbit ring-2 ring-transparent">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-400/40 via-cyan-300/40 to-amber-300/40 blur-sm" />
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground max-w-16 truncate">{s.name}</span>
        </button>
      ))}
    </div>
  );
}
