import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { fetchPost, Post } from "@shared/mockApi";

export default function PostPDetails() {
  const { postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => { if(postId) fetchPost(postId).then(setPost); }, [postId]);
  if (!post) return (
    <div className="min-h-screen bg-galaxy text-foreground"><TopBar /><section className="max-w-4xl mx-auto px-4 py-6">Loading…</section><Navbar /></div>
  );
  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur overflow-hidden">
          {post.image && <img src={post.image} alt={post.title} className="w-full max-h-[60vh] object-cover" />}
          <div className="p-4 space-y-3">
            <div className="text-xl font-semibold">{post.title}</div>
            <div className="text-sm text-muted-foreground">by {post.author}</div>
            <p className="text-sm">{post.body}</p>
          </div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
