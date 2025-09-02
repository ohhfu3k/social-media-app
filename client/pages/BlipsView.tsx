import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useEffect, useRef } from "react";

const videos = [
  { id: "b1", title: "Comet Chase", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: "b2", title: "Nebula Bloom", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "b3", title: "Warp Jump", src: "https://www.w3schools.com/html/movie.mp4" },
  { id: "b4", title: "Dragon Flight", src: "https://media.w3.org/2010/05/sintel/trailer.mp4" },
];

export default function BlipsView() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLVideoElement>("video[data-blip]"));
    const obs = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            v.muted = true;
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { root: container, threshold: [0, 0.6, 1] }
    );
    items.forEach((v) => obs.observe(v));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-0 sm:px-0 lg:px-0">
        <div
          ref={containerRef}
          className="h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-7.5rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar"
        >
          {videos.map((v) => (
            <section key={v.id} className="snap-start h-[calc(100vh-7.5rem)] grid">
              <div className="relative">
                <video
                  data-blip
                  src={v.src}
                  className="w-full h-[calc(100vh-7.5rem)] object-cover"
                  playsInline
                  loop
                  muted
                />
                <div className="absolute inset-x-0 bottom-0 p-4 pt-24 bg-gradient-to-t from-black/60 to-transparent text-white">
                  <div className="text-sm font-medium">{v.title}</div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Navbar />
    </div>
  );
}
