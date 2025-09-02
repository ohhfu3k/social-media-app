import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { fetchPost, Post } from "@shared/mockApi";

export default function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [energy, setEnergy] = useState(0);
  const [comments, setComments] = useState<{id:string;author:string;text:string}[]>([]);

  useEffect(() => { if(id) fetchPost(id).then((p)=>{ setPost(p); setEnergy(p.energy); }); }, [id]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6">
        {post && (
          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur overflow-hidden">
            {post.image && <img src={post.image} alt={post.title} className="w-full max-h-[60vh] object-cover" />}
            <div className="p-4 space-y-3">
              <div className="text-xl font-semibold">{post.title}</div>
              <div className="text-sm text-muted-foreground">by {post.author}</div>
              <p className="text-sm">{post.body}</p>
              <div className="flex items-center gap-2 text-sm">
                <button className="px-2 h-8 rounded-md border border-white/10">Star Link ⭐</button>
                <button className="px-2 h-8 rounded-md border border-white/10">Toss ↗</button>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={()=>setEnergy((e)=>e+1)} className="px-2 h-8 rounded-md border border-white/10">+ Energy</button>
                  <button onClick={()=>setEnergy((e)=>Math.max(0,e-1))} className="px-2 h-8 rounded-md border border-white/10">- Energy</button>
                  <span className="text-xs">{energy}%</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Whispers</div>
                <div className="space-y-2 mt-2">
                  {comments.map(c => (
                    <div key={c.id} className="p-2 rounded-md border border-white/10 bg-background/60 text-sm">
                      <span className="text-muted-foreground">{c.author}: </span>{c.text}
                    </div>
                  ))}
                </div>
                <form className="mt-3 flex gap-2" onSubmit={(e)=>{e.preventDefault(); const input=(e.currentTarget.elements.namedItem('comment') as HTMLInputElement); const v=input.value.trim(); if(!v) return; setComments(cs=>[...cs,{id:`c-${Date.now()}`,author:'You',text:v}]); input.value='';}}>
                  <input name="comment" placeholder="Add a Whisper" className="flex-1 h-10 px-3 rounded-md bg-background border border-white/10" />
                  <button className="px-3 h-10 rounded-md bg-primary text-primary-foreground">Reply</button>
                </form>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 text-sm text-muted-foreground">Related posts coming soon…</div>
      </section>
      <Navbar />
    </div>
  );
}
