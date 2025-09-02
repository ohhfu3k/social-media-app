import { Plus } from "lucide-react";

export default function AddStoryButton({ onClick, label = "New Tale" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
      aria-label={label}
      title={label}
    >
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 animate-spin-slow shadow-[0_0_24px_rgba(168,85,247,0.6)]" />
        <span className="absolute inset-1 rounded-full bg-background grid place-items-center text-white">
          <span className="h-10 w-10 rounded-full grid place-items-center bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-[0_0_24px_rgba(99,102,241,0.7)]">
            <Plus className="h-5 w-5" />
          </span>
        </span>
      </div>
      <span className="text-xs text-muted-foreground max-w-16 truncate">Add</span>
    </button>
  );
}
