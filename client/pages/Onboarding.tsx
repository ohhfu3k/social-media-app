import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-galaxy text-foreground relative overflow-hidden">
      <TopBar />
      <svg className="absolute inset-0 -z-10 opacity-30" viewBox="0 0 800 400">
        <g fill="none" stroke="white" strokeOpacity=".2">
          {Array.from({length:30}).map((_,i)=> (
            <circle key={i} cx={Math.random()*800} cy={Math.random()*400} r={Math.random()*2+1} />
          ))}
        </g>
      </svg>
      <section className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
          <div className="text-lg font-semibold">Welcome</div>
          <div className="text-sm text-muted-foreground">Learn about Energy, Whispers, Badges and more.</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{t:"Energy",d:"Vote and power up posts."},{t:"Whispers",d:"Comment and reply."},{t:"Badges",d:"Collect achievements."}].map(s => (
            <div key={s.t} className="rounded-2xl border border-white/10 bg-card/70 p-4">
              <div className="text-sm font-medium">{s.t}</div>
              <div className="text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>
      <Navbar />
    </div>
  );
}
