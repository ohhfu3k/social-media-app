import { Zap } from "lucide-react";

export interface HoloPostData {
  id: string;
  title: string;
  image: string;
  energy?: number;
}

export default function HoloPost({ post }: { post: HoloPostData }) {
  return (
    <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-fuchsia-500/50 via-cyan-400/50 to-indigo-400/50 shadow-[0_20px_60px_-20px_rgba(168,85,247,0.45)]">
      <div className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur border border-white/10">
        <img src={post.image} alt={post.title} className="h-52 w-full object-cover" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-sm text-white">
          <div className="font-medium drop-shadow">{post.title}</div>
          {typeof post.energy === "number" && (
            <div className="px-2 py-0.5 rounded-full text-xs bg-black/50 border border-white/10 flex items-center gap-1">
              <Zap className="h-3 w-3 text-cyan-300" /> {post.energy}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
