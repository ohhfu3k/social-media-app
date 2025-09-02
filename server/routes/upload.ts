import { Router, RequestHandler } from "express";
import { requireAuth } from "../middlewares/auth";
import { getStorage } from "firebase-admin/storage";

const ALLOWED = new Set([
  "image/png","image/jpeg","image/webp","image/gif","image/avif",
  "audio/mpeg","audio/mp3","audio/wav","audio/ogg",
  "video/mp4","video/webm","video/ogg"
]);

export const uploadRouter = Router();

const schema = (b: any) => ({ mime: String(b?.mime||""), filename: String(b?.filename||"") });

uploadRouter.post("/signed-url", requireAuth, (async (req, res) => {
  const { mime, filename } = schema(req.body || {});
  if (!mime || !filename) return res.status(400).json({ error: "mime and filename required" });
  if (!ALLOWED.has(mime)) return res.status(400).json({ error: "mime not allowed" });
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.GCS_BUCKET || "";
  if (!bucketName) return res.status(503).json({ error: "Storage not configured" });
  const userId = String((req as any).auth?.sub || "anon");
  const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const objectName = `uploads/${userId}/${Date.now()}-${safeName}`;
  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectName);
    const [url] = await file.getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + 15*60*1000, contentType: mime });
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectName)}`;
    return res.json({ uploadUrl: url, publicUrl, path: objectName, contentType: mime });
  } catch (e) {
    return res.status(500).json({ error: "Failed to create signed URL" });
  }
}) as RequestHandler);
