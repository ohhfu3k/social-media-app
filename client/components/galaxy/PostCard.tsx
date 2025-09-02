import { cn } from "@/lib/utils";
import { useAppState } from "@/context/app-state";
import { MessageCircle, Send, Bookmark } from "lucide-react";

export interface Post {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  content: string;
  media?: { type: "image" | "video" | "audio"; src: string };
  energy: number; // 0-100
}

export default function PostCard({ post, className }: { post: Post; className?: string }) {
  const { anonymous } = useAppState();

  const showMedia = !anonymous || (post.media?.type === "audio");

  return (
    <article
      className={cn(
        "group rounded-xl border border-white/10 bg-card/70 backdrop-blur p-4 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_60px_-12px_rgba(168,85,247,0.45)] transition-all",
        "hover:border-fuchsia-500/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <img
          src={post.avatar}
          alt="avatar"
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="font-semibold">{post.name}</div>
              <div className="text-xs text-muted-foreground">{post.handle}</div>
            </div>
            {!anonymous && (
              <button className="text-xs px-2 py-1 rounded-full border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/10 transition-colors shadow-[0_0_8px_rgba(217,70,239,.35)]">
                Star Link
              </button>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/90">{post.content}</p>
          {post.media && showMedia && (
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
              {post.media.type === "image" && (
                <img src={post.media.src} className="w-full object-cover max-h-96" alt="media" />
              )}
              {post.media.type === "video" && (
                <video src={post.media.src} className="w-full max-h-96" controls />
              )}
              {post.media.type === "audio" && (
                <audio src={post.media.src} className="w-full" controls />
              )}
            </div>
          )}
          <EnergyBars value={post.energy} className="mt-3" />
          <div className="mt-3 flex items-center gap-3 text-xs">
            <Action label="Whisper" icon={<MessageCircle className="h-4 w-4" />} />
            <Action label="Toss" icon={<Send className="h-4 w-4" />} />
            <Action label="Save" icon={<Bookmark className="h-4 w-4" />} />
            <button className="ml-auto px-2 py-1 rounded-md border border-white/10 text-muted-foreground hover:text-red-300 hover:border-red-400/40" aria-label="Report" title="Report">🚩</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Action({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="px-3 py-1 rounded-full border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-200 transition-colors inline-flex items-center gap-2" aria-label={label} title={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EnergyBars({ value, className }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 animate-energy"
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground">Energy {safe}%</div>
    </div>
  );
}
