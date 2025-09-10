export function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string } {
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1] || "application/octet-stream";
  const base64 = m[2] === ";base64";
  const data = m[3] || "";
  let bytes: Uint8Array;
  if (base64) {
    const bin = atob(data);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(data));
  }
  const blob = new Blob([bytes.buffer as unknown as ArrayBuffer], { type: mime });
  const ext = mime.split("/")[1] || "bin";
  return { blob, mime, ext };
}

export async function uploadDataUrl(dataUrl: string, filenameBase: string): Promise<string | null> {
  try {
    const { blob, mime, ext } = dataUrlToBlob(dataUrl);
    const filename = `${filenameBase}.${ext}`.replace(/[^a-zA-Z0-9_.-]/g, "_");

    // Ask server for a signed URL (requires auth cookie/token)
    const r = await fetch("/api/upload/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mime, filename }),
      credentials: "include",
    });
    if (!r.ok) return null; // storage not configured or unauthorized
    const info = await r.json().catch(() => ({}));
    if (!info?.uploadUrl || !info?.publicUrl) return null;

    const put = await fetch(info.uploadUrl, { method: "PUT", headers: { "Content-Type": mime, "x-goog-content-length-range": "0,104857600" }, body: blob });
    if (!put.ok) return null;
    return String(info.publicUrl);
  } catch {
    return null;
  }
}
