export default function ProfileCard({
  avatar,
  name,
  handle,
  bio,
  energy,
  followers,
}: {
  avatar: string;
  name: string;
  handle: string;
  bio: string;
  energy: number;
  followers: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur p-6 shadow-[0_20px_80px_-20px_rgba(99,102,241,0.35)] relative overflow-hidden">
      <div className="absolute -top-24 -right-16 h-52 w-52 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/30 blur-3xl" />
      <div className="flex items-center gap-4">
        <img src={avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover ring-2 ring-fuchsia-400/40" />
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-sm text-muted-foreground">{handle}</div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-foreground/90">{bio}</p>
      <div className="mt-4">
        <div className="h-2 w-full rounded bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400" style={{ width: `${energy}%` }} />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">Energy {energy}%</div>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <div className="px-3 py-1 rounded-full border border-fuchsia-400/40 text-fuchsia-200">Star-linked {followers}</div>
        <div className="px-3 py-1 rounded-full border border-white/10">Dragon animation</div>
      </div>
    </div>
  );
}
