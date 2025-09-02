import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";

const data = Array.from({length:12}).map((_,i)=> ({ month: `M${i+1}`, views: Math.round(100+Math.random()*900) }));

export default function Analytics() {
  const [stats, setStats] = useState<{ profileViews: number; postViews: number; messages: number } | null>(null);

  useEffect(()=>{
    (async () => {
      try {
        const headers: Record<string,string> = {};
        try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
        const r = await fetch('/api/analytics/me', { headers });
        const d = await r.json();
        setStats(d?.stats || null);
      } catch {}
    })();
  },[]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="text-lg font-semibold">Your Star Links & Views</div>
        <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
          <ChartContainer config={{ views: { label: "Views", color: "hsl(280 90% 70%)" } }}>
            <LineChart data={data}>
              <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
              <YAxis stroke="currentColor" opacity={0.6} />
              <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </div>
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Profile Views" value={stats.profileViews} />
            <Stat label="Post Views" value={stats.postViews} />
            <Stat label="Messages" value={stats.messages} />
          </div>
        )}
      </section>
      <Navbar />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/70 p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}
