import { Link } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { useState } from "react";
import { BellRing, UserRound } from "lucide-react";

export default function FloatingOrbNav() {
  const { anonymous, setAnonymous } = useAppState();
  const [showNoti, setShowNoti] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="relative group flex items-center justify-center">
        {/* Satellites */}
        <Link
          to="/profile"
          className="pointer-events-auto absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out -translate-y-10 -translate-x-14 h-10 w-10 rounded-full border border-white/10 bg-card/80 backdrop-blur flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          aria-label="Open profile"
        >
          <UserRound className="h-5 w-5" />
        </Link>
        <button
          onClick={() => setShowNoti((v) => !v)}
          className="pointer-events-auto absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out -translate-y-16 translate-x-2 h-10 w-10 rounded-full border border-white/10 bg-card/80 backdrop-blur flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.35)]"
          aria-label="Notifications"
          title="Notifications"
        >
          <div className="relative">
            <BellRing className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </button>

        {/* Main orb - Anonymous toggle */}
        <button
          onClick={() => setAnonymous(!anonymous)}
          className="relative h-14 w-14 rounded-full ring-2 ring-white/20 transition-all shadow-[0_0_40px_rgba(34,211,238,.45)] group"
          aria-pressed={anonymous}
          aria-label={anonymous ? "Exit Anonymous World" : "Enter Anonymous World"}
          title={anonymous ? "Exit Anonymous World" : "Enter Anonymous World"}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 opacity-80"></span>
          <span className="absolute inset-1 rounded-full bg-background"></span>
          <span className={"absolute inset-2 rounded-full " + (anonymous ? "bg-[radial-gradient(circle_at_40%_40%,rgba(251,191,36,0.9),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(239,68,68,0.8),transparent_60%)]" : "bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.9),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.9),transparent_60%)]")}></span>
        </button>

        {/* Minimal notifications panel */}
        {showNoti && (
          <div className="absolute bottom-16 right-[-2rem] w-60 rounded-xl border border-white/10 bg-card/90 backdrop-blur p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)]">
            <div className="text-xs text-muted-foreground mb-2">Notifications</div>
            <ul className="space-y-2 text-sm">
              <li className="p-2 rounded-md bg-muted/40 border border-white/10">Vega star-linked you ✨</li>
              <li className="p-2 rounded-md bg-muted/40 border border-white/10">New Whisper from Lyra</li>
              <li className="p-2 rounded-md bg-muted/40 border border-white/10">Energy +5 from Dragon Food</li>
            </ul>
          </div>
        )}
      </div>
      <div className="mt-1 text-[10px] text-center text-muted-foreground">{anonymous ? "Anonymous" : "Identity"}</div>
    </div>
  );
}
