import { useState } from "react";
import TopBar from "@/components/galaxy/TopBar";
import Navbar from "@/components/galaxy/Navbar";

export default function IdentityVerify() {
  const [idFile, setIdFile] = useState<File|null>(null);
  const [selfie, setSelfie] = useState<File|null>(null);
  const [msg, setMsg] = useState("");

  const upload = async (file: File) => {
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    try { const t = localStorage.getItem("galaxy-token"); if (t) headers["Authorization"] = `Bearer ${t}`; } catch {}
    const r1 = await fetch("/api/upload/signed-url", { method: "POST", headers, body: JSON.stringify({ mime: file.type, filename: file.name }) });
    const d1 = await r1.json(); if (!r1.ok) throw new Error(d1.error || "Failed to get signed URL");
    const put = await fetch(d1.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!put.ok) throw new Error("Upload failed");
    return d1.publicUrl as string;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    try {
      if (!idFile || !selfie) throw new Error("Select both files");
      const idUrl = await upload(idFile);
      const selfieUrl = await upload(selfie);
      setMsg(`Submitted. ID: ${idUrl}\nSelfie: ${selfieUrl}`);
    } catch (e: any) { setMsg(e?.message || "Failed"); }
  };

  return (
    <div className="min-h-screen bg-galaxy text-foreground">
      <TopBar />
      <section className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-4">
          <div className="text-lg font-semibold">Verify your identity</div>
          <input type="file" accept="image/*" onChange={(e)=>setIdFile(e.target.files?.[0]||null)} />
          <input type="file" accept="image/*" onChange={(e)=>setSelfie(e.target.files?.[0]||null)} />
          <button className="w-full h-11 rounded-md bg-primary text-primary-foreground">Submit</button>
          {msg && <pre className="text-xs whitespace-pre-wrap mt-2">{msg}</pre>}
        </form>
      </section>
      <Navbar />
    </div>
  );
}
