import { useEffect, useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { Music, Palette, ShoppingBag, Image } from "lucide-react";

type Item = { id: string; name: string; kind: string; price: number };

function kindIcon(kind: string) {
  if (kind === 'music') return <Music className="h-5 w-5" />;
  if (kind === 'theme') return <Palette className="h-5 w-5" />;
  if (kind === 'sticker') return <Image className="h-5 w-5" />;
  return <ShoppingBag className="h-5 w-5" />;
}

export default function Marketplace() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(()=>{ (async ()=>{ try { const r=await fetch('/api/marketplace'); const d=await r.json(); setItems(Array.isArray(d?.items)?d.items:[]); } catch {} })(); },[]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Marketplace</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(it => (
            <button
              key={it.id}
              className="rounded-xl border border-white/10 bg-card/70 p-3 text-left flex items-center gap-3 justify-between"
              aria-label={`Buy ${it.name}`}
              title={`Buy ${it.name}`}
              onClick={async ()=>{ try { const headers: Record<string,string> = { "Content-Type": "application/json" }; try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}; await fetch('/api/marketplace/purchase', { method: 'POST', headers, body: JSON.stringify({ itemId: it.id }) }); } catch {} }}
            >
              <div className="flex items-center gap-3">
                {kindIcon(it.kind)}
                <div className="text-sm">{it.name}</div>
              </div>
              <div className="text-xs opacity-80">${(it.price/100).toFixed(2)}</div>
            </button>
          ))}
        </div>
      </section>
      <Navbar />
    </div>
  );
}
