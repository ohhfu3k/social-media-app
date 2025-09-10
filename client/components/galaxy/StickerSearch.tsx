import { useEffect, useMemo, useState } from "react";

export default function StickerSearch({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string) => void }) {
  const key = import.meta.env.VITE_GIPHY_KEY as string | undefined;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    const run = async () => {
      if (!key) return;
      setLoading(true);
      try {
        const endpoint = q.trim()
          ? `https://api.giphy.com/v1/stickers/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q.trim())}&limit=50&rating=g&bundle=messaging_non_clips`
          : `https://api.giphy.com/v1/stickers/trending?api_key=${encodeURIComponent(key)}&limit=50&rating=g&bundle=messaging_non_clips`;
        const r = await fetch(endpoint);
        const d = await r.json().catch(() => ({}));
        if (!stop && Array.isArray(d?.data)) setItems(d.data);
      } catch {
        if (!stop) setItems([]);
      } finally {
        if (!stop) setLoading(false);
      }
    };
    run();
    return () => { stop = true; };
  }, [open, q, key]);

  const canUseGiphy = !!key;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[min(680px,96vw)] max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={canUseGiphy ? "Search stickers" : "Enter sticker URL (png/gif)"}
            className="flex-1 h-10 rounded-md bg-black/50 border border-white/15 px-3 text-sm"
          />
          {canUseGiphy ? (
            <button onClick={() => setQ("")} className="h-10 px-3 rounded-md border border-white/15 bg-black/40 text-sm">Clear</button>
          ) : (
            <button onClick={() => { if (q.trim()) onPick(q.trim()); onClose(); }} className="h-10 px-3 rounded-md border border-white/15 bg-black/40 text-sm">Add</button>
          )}
        </div>
        {!canUseGiphy && (
          <div className="mt-2 text-xs text-white/70">Set VITE_GIPHY_KEY to enable search.</div>
        )}
        {canUseGiphy && (
          <div className="mt-3">
            {loading && <div className="text-xs text-white/70">Loading…</div>}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {items.map((it) => {
                const src = it?.images?.fixed_width_small?.url || it?.images?.fixed_width?.url || it?.images?.downsized_small?.mp4 || it?.images?.downsized?.url;
                if (!src) return null;
                return (
                  <button key={it.id} className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-white/30" onClick={() => { onPick(src); onClose(); }}>
                    <img src={src} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
            {!loading && items.length === 0 && (
              <div className="text-xs text-white/70">No stickers found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
