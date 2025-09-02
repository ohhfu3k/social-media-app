export default function CosmicStats({ followers, following, energy, badges }: { followers: number; following: number; energy: number; badges: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <Stat label="Followers" value={followers.toLocaleString()} deco="stars" />
      <Stat label="Following" value={following.toLocaleString()} deco="paths" />
      <Stat label="Energy" value={`${energy}%`} deco="sparks" />
      <Stat label="Badges" value={badges.toString()} deco="emblems" />
    </div>
  );
}

function Stat({ label, value, deco }: { label: string; value: string; deco: "stars" | "paths" | "sparks" | "emblems" }) {
  const bg =
    deco === "stars"
      ? "bg-[radial-gradient(circle_at_10%_50%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_90%_50%,rgba(255,255,255,0.2),transparent_40%)]"
      : deco === "paths"
      ? "bg-[linear-gradient(90deg,rgba(34,211,238,0.2)_0,transparent_30%,rgba(34,211,238,0.2)_60%,transparent_100%)]"
      : deco === "sparks"
      ? "bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.25),transparent_40%)]"
      : "bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.25),transparent_40%)]";

  return (
    <div className={`rounded-xl border border-white/10 bg-card/70 backdrop-blur p-3 ${bg}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
