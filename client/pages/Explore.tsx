import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useAppState } from "@/context/app-state";

export default function Explore() {
  const [comet, setComet] = useState(0);
  useEffect(()=>{ const i=setInterval(()=>setComet(c=>c+1), 5000); return ()=>clearInterval(i); },[]);

  const { anonymous } = useAppState();
  return (
    <div className="min-h-screen bg-galaxy text-foreground overflow-hidden">
      <TopBar />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-20 h-1 w-[120%] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" style={{ transform:`translateX(${(comet%2)*100 - 10}%)` }} />
      </div>
      <section className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="text-xs text-muted-foreground">Recommended users <span className="inline-block align-middle">+</span></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Trending", "Orion Arm", "For You"].map((title, idx) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-3">
              <div className="text-sm font-medium mb-2">{title}</div>
              {anonymous ? (
                <div className="space-y-2">
                  {["Audio rooms", "Text threads", "Signal bursts"].map((t)=> (
                    <button key={t} className="w-full px-3 py-2 rounded-md border border-white/10 text-left text-sm hover:bg-white/5">{t}</button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({length:6}).map((_,i)=> (
                    <img key={i} src={`https://picsum.photos/seed/${title}-${i}/200/200`} className="rounded-md object-cover h-24 w-full" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-4">
          <div className="text-sm font-medium mb-2">Hobby-based recommendations</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {["#coding","#music","#dragons","#nebula","#photography","#gaming"].map(h => (
              <button key={h} className="px-3 py-1.5 rounded-md border border-white/10 text-xs">{h}</button>
            ))}
          </div>
        </div>
      </section>
      <button className="fixed bottom-20 right-6 h-12 w-12 rounded-full border border-white/10 bg-card/80 backdrop-blur grid place-items-center" aria-label="Find nearby" title="Find nearby">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>
      </button>
      <Navbar />
    </div>
  );
}
