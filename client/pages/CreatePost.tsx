import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";

export default function CreatePost() {
  const [text, setText] = useState("");
  const [energy, setEnergy] = useState(50);
  const [theme, setTheme] = useState("nebula");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const [media, setMedia] = useState<string | null>(null);
  const { anonymous } = useAppState();
  const navigate = useNavigate();

  const addTag = () => { const v = tag.trim().replace(/^#?/, "#"); if(!v) return; if(!hashtags.includes(v)) setHashtags([...hashtags, v]); setTag(""); };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Creator tools</span>
              <button className="h-8 w-8 grid place-items-center rounded-md border border-white/10" aria-label="Add poll" title="Add poll">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18"/><path d="M21 3v18"/><rect x="7" y="6" width="3" height="9"/><rect x="14" y="10" width="3" height="5"/></svg>
              </button>
              <button className="h-8 w-8 grid place-items-center rounded-md border border-white/10" aria-label="Schedule" title="Schedule">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
              </button>
              <button className="h-8 w-8 grid place-items-center rounded-md border border-white/10" aria-label="Collaborate" title="Collaborate">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </button>
            </div>
            <button className="h-8 px-2 rounded-md border border-white/10 text-xs inline-flex items-center gap-2" aria-label="Write article" title="Write article">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18"/><path d="M3 8h18"/><path d="M3 12h18"/><path d="M3 16h18"/><path d="M3 20h18"/></svg>
              Article
            </button>
          </div>
          <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="What's happening in your galaxy?" rows={4} className="w-full px-3 py-2 rounded-md bg-background border border-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Energy</label>
              <input type="range" min={0} max={100} value={energy} onChange={(e)=>setEnergy(parseInt(e.target.value))} />
              <span className="text-xs">{energy}%</span>
            </div>
            <select value={theme} onChange={(e)=>setTheme(e.target.value)} className="h-10 px-3 rounded-md bg-background border border-white/10">
              <option value="nebula">Nebula</option>
              <option value="dragon">Dragon</option>
              <option value="orion">Orion</option>
            </select>
            <div className="flex items-center gap-2">
              <input value={tag} onChange={(e)=>setTag(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addTag();}}} placeholder="#tags" className="flex-1 h-10 px-3 rounded-md bg-background border border-white/10" />
              <button onClick={addTag} className="px-3 h-10 rounded-md border border-white/10">Add</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hashtags.map(h => (
              <span key={h} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-card/70">{h}</span>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Media {anonymous ? '(audio only)' : ''}</label>
            <input type="file" accept={anonymous ? "audio/*" : "image/*,video/*,audio/*"} onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; const url=URL.createObjectURL(f); setMedia(url);}} />
          </div>
          {media && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              {anonymous ? (
                <audio src={media} className="w-full" controls />
              ) : media.match(/\.mp4|video\//) ? (
                <video src={media} controls className="w-full" />
              ) : media.match(/\.mp3|audio\//) ? (
                <audio src={media} className="w-full" controls />
              ) : (
                <img src={media} className="w-full" />
              )}
            </div>
          )}
          <div className="text-sm text-muted-foreground">Preview</div>
          <div className="rounded-xl border border-white/10 bg-background/60 p-3">
            <div className="text-sm font-medium">{text || "Your post preview"}</div>
            <div className="text-xs text-muted-foreground">Theme: {theme} • Energy {energy}%</div>
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 h-10 rounded-md bg-primary text-primary-foreground"
              onClick={async () => {
                try {
                  const uname = localStorage.getItem("profile-username") || "me";
                  const contentType = anonymous ? (media ? "audio" : "text") : (media ? (media.match(/\.mp4|video\//) ? "reel" : (media.match(/audio\//) ? "text" : "image")) : "text");
                  const headers: Record<string,string> = { "Content-Type": "application/json" };
                  try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
                  await fetch(`/api/profile/${encodeURIComponent(uname)}/posts`, { method: "POST", headers, body: JSON.stringify({ contentType, contentUrl: media || "", caption: text }) });
                } catch {}
                navigate('/home');
              }}
            >
              Toss
            </button>
          </div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
