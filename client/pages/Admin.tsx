import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";
import { ShieldCheck } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
        <div className="rounded-xl border border-white/10 bg-card/70 p-4 text-sm">
          Manage reports, blocks, and system settings. (Mock)
        </div>
      </section>
      <Navbar />
    </div>
  );
}
