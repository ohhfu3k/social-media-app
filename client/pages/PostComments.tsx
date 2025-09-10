import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function PostComments() {
  const { postId } = useParams();
  const [comments, setComments] = useState<{id:string;author:string;text:string}[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/posts/${encodeURIComponent(postId || "")}/comments`);
        const d = await r.json();
        if (Array.isArray(d?.comments)) setComments(d.comments);
      } catch {}
    })();
  }, [postId]);

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-4">
          <div className="text-lg font-semibold mb-2">Comments</div>
          <div className="space-y-2">
            {comments.map(c => (
              <div key={c.id} className="p-2 rounded-md border border-white/10 bg-background/60 text-sm">
                <span className="text-muted-foreground">{c.author}: </span>{c.text}
              </div>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={async (e)=>{e.preventDefault(); const input=(e.currentTarget.elements.namedItem('comment') as HTMLInputElement); const v=input.value.trim(); if(!v||!postId) return; try{const r=await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:v})}); const d=await r.json(); if(d?.comment) setComments(cs=>[...cs,d.comment]); else setComments(cs=>[...cs,{id:`c-${Date.now()}`,author:'You',text:v}]);}catch{setComments(cs=>[...cs,{id:`c-${Date.now()}`,author:'You',text:v}]);} input.value='';}}>
            <input name="comment" placeholder="Write a comment" className="flex-1 h-10 px-3 rounded-md bg-background border border-white/10" />
            <button className="px-3 h-10 rounded-md bg-primary text-primary-foreground">Post</button>
          </form>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
