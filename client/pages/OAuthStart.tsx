import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { useParams, Link } from "react-router-dom";

export default function OAuthStart() {
  const { provider } = useParams();
  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-xl px-4 py-12 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6">
          <div className="text-lg font-semibold">Continue with {provider}</div>
          <p className="text-sm text-muted-foreground mt-2">OAuth is not configured in this project yet. Connect your auth provider credentials on the server, then return here to continue.</p>
          <div className="mt-4 text-sm">Alternatively, <Link to="/login" className="text-cyan-300 hover:underline">sign in with email/phone</Link>.</div>
        </div>
      </section>
      <Navbar />
    </div>
  );
}
