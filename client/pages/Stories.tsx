import { useMemo, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useParams } from "react-router-dom";

export default function Stories() {
  const [media, setMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [views, setViews] = useState(128);
  const { userId } = useParams();

  const displayName = useMemo(() => {
    return userId || "You";
  }, [userId]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
          <div className="text-sm font-medium mb-2">Add Story — {displayName}</div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              setMedia(url);
              setIsVideo(f.type.startsWith("video/"));
            }}
          />
          <div className="mt-3 rounded-xl overflow-hidden border border-white/10 min-h-40 bg-background/60 grid place-items-center">
            {media ? (
              isVideo ? (
                <video src={media} autoPlay loop muted playsInline className="w-full" />
              ) : (
                <img src={media} className="w-full" />
              )
            ) : (
              <div className="text-sm text-muted-foreground">Upload media</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
          <div className="text-sm font-medium">Viewer analytics</div>
          <div className="text-sm text-muted-foreground">Views: {views}</div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{ width: `${Math.min(100, views / 2)}%` }} />
          </div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
