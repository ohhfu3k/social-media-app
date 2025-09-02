import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function Error500() {
  return (
    <div className="min-h-screen bg-galaxy text-foreground grid grid-rows-[auto_1fr_auto]">
      <TopBar />
      <main className="grid place-items-center">
        <div className="text-center space-y-2">
          <div className="text-5xl font-extrabold">500</div>
          <div className="text-sm text-muted-foreground">A black hole ate this page. Try again later.</div>
        </div>
      </main>
      <Navbar />
    </div>
  );
}
