import { NavLink } from "react-router-dom";
import { Compass, Home, PlusCircle, User, Film } from "lucide-react";
import { useAppState } from "@/context/app-state";

export default function Navbar() {
  const { anonymous } = useAppState();
  const base = "flex flex-col items-center justify-center gap-1 px-3 py-2 text-[11px] min-w-[56px] min-h-[48px] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] rounded-xl";
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    base + (isActive ? " text-foreground" : " text-muted-foreground hover:text-foreground");

  return (
    <nav aria-label="Primary" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur shadow-[0_20px_80px_-20px_rgba(168,85,247,0.35)]">
        <ul className="grid grid-cols-5 gap-1">
          <li>
            <NavLink to="/home" className={linkClass} aria-label="Home">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/explore" className={linkClass} aria-label="Explore">
              <Compass className="h-5 w-5" />
              <span>Explore</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/create" className={({ isActive }) =>
              base + (isActive ? " text-foreground" : " text-fuchsia-300 hover:text-fuchsia-200")
            } aria-label="Create">
              <PlusCircle className="h-6 w-6" />
              <span>Create</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile/view/nova" className={linkClass} aria-label="Profile">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </NavLink>
          </li>
          <li>
            {anonymous ? (
              <button
                className={`${base} text-muted-foreground cursor-not-allowed opacity-50`}
                aria-label="Blips disabled"
                title="Blips are unavailable in the anonymous universe"
                aria-disabled
              >
                <Film className="h-5 w-5" />
                <span>Blips</span>
              </button>
            ) : (
              <NavLink to="/blips" className={linkClass} aria-label="Blips">
                <Film className="h-5 w-5" />
                <span>Blips</span>
              </NavLink>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
