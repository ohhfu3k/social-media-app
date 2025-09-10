import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

const samples = [
  { id: "r1", src: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", title: "Bunny in space", author: "Nova", music: "Orbit - @djceleste" },
  { id: "r2", src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", title: "Comet ride", author: "Lyra", music: "Milky Drift - @starlight" },
  { id: "r3", src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", title: "Warp jump", author: "Vega", music: "Hyperlane - @deepvoid" },
];

export default function Reels() {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const vids = Array.from(el.querySelectorAll<HTMLVideoElement>("video"));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) (e.target as HTMLVideoElement).play().catch(()=>{});
        else (e.target as HTMLVideoElement).pause();
      });
    }, { threshold: 0.6 });
    vids.forEach(v => obs.observe(v));
    return () => { vids.forEach(v => obs.unobserve(v)); obs.disconnect(); };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div ref={containerRef} className="h-[calc(100vh-4rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar">
        {samples.map((r) => (
          <section key={r.id} className="h-[calc(100vh-4rem)] relative snap-start">
            <video src={r.src} muted playsInline loop className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40 pointer-events-none" />
            <div className="absolute bottom-20 left-4 right-20 space-y-2 pointer-events-none">
              <div className="text-sm opacity-90">@{r.author}</div>
              <div className="text-lg font-semibold">{r.title}</div>
              <div className="text-sm opacity-80">♪ {r.music}</div>
            </div>
            <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4">
              <button onClick={()=>setLikes((l)=>({ ...l, [r.id]: !l[r.id] }))} className={`h-12 w-12 rounded-full grid place-items-center ${likes[r.id]?"bg-red-500/30":"bg-white/10"}`} aria-label="Like">{likes[r.id]?"❤️":"🤍"}</button>
              <button className="h-12 w-12 rounded-full grid place-items-center bg-white/10" aria-label="Comment">💬</button>
              <button className="h-12 w-12 rounded-full grid place-items-center bg-white/10" aria-label="Share">📤</button>
              <button className="h-12 w-12 rounded-full grid place-items-center bg-white/10" aria-label="Save">🔖</button>
            </div>
          </section>
        ))}
      </div>
      <Navbar />
    </div>
  );
}
