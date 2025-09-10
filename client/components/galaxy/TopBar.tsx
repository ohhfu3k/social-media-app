import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, MessageCircle, Bell, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppState } from "@/context/app-state";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";

export default function TopBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { anonymous, setAnonymous } = useAppState();
  const showBack = pathname !== "/" && pathname !== "/home";
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  const [transitioning, setTransitioning] = useState(false);
  const [stage, setStage] = useState<'anim' | 'code' | null>(null);
  const [code, setCode] = useState('');
  const prefersReduced = useReducedMotion();
  const stars = useMemo(() =>
    Array.from({ length: 42 }).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 1.2,
      opacity: 0.4 + Math.random() * 0.6,
    })), []);

  const startUniverseJump = () => {
    if (transitioning) return;
    setTransitioning(true);
    setStage(prefersReduced ? 'code' : 'anim');
    if (navigator.vibrate) {
      try { navigator.vibrate([15, 30, 15]); } catch {}
    }
    const dur = prefersReduced ? 0 : 1200;
    if (!prefersReduced) {
      window.setTimeout(() => setStage('code'), dur);
    }
  };

  const submitCode = () => {
    if (!/^\d{4}$/.test(code)) return;
    setAnonymous(!anonymous);
    setTransitioning(false);
    setStage(null);
    setCode('');
    navigate('/home');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const b = document.body;
    if (transitioning) {
      const prev = b.style.overflow;
      b.style.overflow = 'hidden';
      return () => { b.style.overflow = prev; };
    }
  }, [transitioning]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-white/10",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <Link
          to={"/home"}
          onClick={(e) => { e.preventDefault(); startUniverseJump(); }}
          className="flex items-center gap-3 select-none group shrink-0"
          aria-label="Galaxy Social UI"
          title="Jump to another universe"
        >
          <div className="relative h-8 w-8">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-amber-400 animate-spin-slow shadow-[0_0_30px_rgba(168,85,247,0.6)]"></span>
            <span className="absolute inset-1 rounded-full bg-background"></span>
            <span className="absolute inset-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 blur-[6px] opacity-70 animate-pulse"></span>
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-indigo-400 drop-shadow-neon">
            <br />
          </span>
        </Link>

        <div className="flex-1 mx-3">
          <div className="w-full relative">
            <input
              placeholder="Search Galaxy..."
              aria-label="Search"
              className="w-full h-9 pl-10 pr-3 rounded-full bg-background border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
            />
            <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => navigate('/direct/inbox')}
            className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 grid place-items-center focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Messages"
            title="Messages"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 grid place-items-center focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 grid place-items-center focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="More"
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem asChild><Link to="/profile/view/nova">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/badges">Badges</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/marketplace">Marketplace</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/events">Events</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/support">Support</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {transitioning && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="universe-jump"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[1000] pointer-events-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-950 to-purple-900" />
            {stage === 'anim' && (
              <>
                <motion.div className="absolute inset-0" initial={{ scale: 1 }} animate={{ scale: [1, 0.9, 1.12] }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                <div className="absolute inset-0 overflow-hidden">
                  {stars.map((s, i) => (
                    <span key={i} className="absolute rounded-full bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.5)]" style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, opacity: s.opacity }} />
                  ))}
                </div>
                <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" initial={{ rotate: 0, opacity: 0.8 }} animate={{ rotate: 360, opacity: [0.8, 1, 0.8] }} transition={{ duration: 1.2, ease: "easeInOut" }}>
                  <div className="relative">
                    <div className="h-48 w-48 rounded-full border-2 border-fuchsia-400/40 blur-[1px]" />
                    <div className="absolute inset-6 h-36 w-36 rounded-full border-2 border-cyan-300/30" />
                    <div className="absolute inset-12 h-24 w-24 rounded-full border border-white/20" />
                  </div>
                </motion.div>
              </>
            )}
            {stage === 'code' && (
              <div className="absolute inset-0 grid place-items-center px-4">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/50 backdrop-blur p-5 shadow-[0_0_60px_rgba(99,102,241,0.35)]">
                  <div className="text-sm font-medium mb-2 text-center">Enter 4-digit access code</div>
                  <input
                    inputMode="numeric"
                    pattern="\\d{4}"
                    maxLength={4}
                    value={code}
                    onChange={(e)=>setCode(e.target.value.replace(/[^0-9]/g, '').slice(0,4))}
                    onKeyDown={(e)=>{ if (e.key === 'Enter' && /^\d{4}$/.test(code)) submitCode(); }}
                    className="w-full h-12 text-center tracking-[0.5em] text-lg rounded-md bg-background border border-white/10"
                    aria-label="4 digit code"
                    autoFocus
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={()=>{setTransitioning(false); setStage(null); setCode('');}} className="h-10 rounded-md border border-white/10">Cancel</button>
                    <button onClick={submitCode} disabled={!/^\d{4}$/.test(code)} className="h-10 rounded-md bg-primary text-primary-foreground disabled:opacity-50">Enter</button>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground text-center">Tip: any 4 digits will work</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
