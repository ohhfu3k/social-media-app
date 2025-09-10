import { useEffect, useRef, useState } from "react";

export type SpotifyTrack = { id: string; name: string; preview_url: string | null; artists: { name: string }[]; album: { images?: { url: string; width: number; height: number }[] } };

export default function SpotifyMusicModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (t: SpotifyTrack) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { if (!open) return; setQ(""); setItems([]); }, [open]);

  useEffect(() => {
    if (!open) return;
    if (abort.current) abort.current.abort();
    const ac = new AbortController(); abort.current = ac;
    const run = async () => {
      setLoading(true);
      try {
        const u = new URL("/api/spotify/search", window.location.origin);
        u.searchParams.set("q", q || "*");
        const r = await fetch(u.toString(), { signal: ac.signal, credentials: "include" });
        if (r.status === 401) { /* not connected */ setItems([]); return; }
        const d = await r.json();
        const arr = (d?.tracks?.items || []) as SpotifyTrack[];
        setItems(arr);
      } catch { /* noop */ } finally { setLoading(false); }
    };
    run();
    return () => ac.abort();
  }, [q, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[170]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[min(720px,96vw)] max-h-[75vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 backdrop-blur p-3">
        <div className="flex gap-2 items-center mb-2">
          <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="Search tracks" className="flex-1 h-10 rounded-md bg-black/50 border border-white/15 px-3 text-sm" />
          <a href="/api/spotify/login" className="h-10 px-3 rounded-md border border-white/15 bg-black/40 text-sm">Connect Spotify</a>
        </div>
        {loading && <div className="text-xs text-white/70">Loading…</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((t)=> {
            const img = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "";
            return (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 hover:bg-white/5">
                <img src={img} className="h-12 w-12 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{t.name}</div>
                  <div className="text-xs text-white/70 truncate">{t.artists.map(a=>a.name).join(", ")}</div>
                </div>
                {t.preview_url ? (
                  <audio controls preload="none" src={t.preview_url} className="h-8" />
                ) : (
                  <div className="text-[10px] text-white/50">No preview</div>
                )}
                <button onClick={()=> { onPick(t); onClose(); }} className="h-8 px-2 rounded-md border border-white/15 bg-black/40 text-xs">Use</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
