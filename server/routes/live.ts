import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "live.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ streams: [] }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { streams: [] as any[] }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) { try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = verifyToken(t); return v.valid?String(v.payload.sub):null; } catch { return null; } }

export const liveRouter = Router();
liveRouter.use(ensureData);

// GET /api/live — list active streams
liveRouter.get("/", async (_req, res) => {
  const all = await readAll();
  const now = Date.now();
  const streams = (all.streams || []).filter((s:any) => !s.endedAt).sort((a:any,b:any)=> b.startedAt-a.startedAt);
  return res.json({ streams: streams.map((s:any)=>({ id: s.id, userId: s.userId, title: s.title, startedAt: s.startedAt, viewers: Math.floor((now - s.startedAt)/60000) + 1 })) });
});

// POST /api/live/start { title }
liveRouter.post("/start", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const title = String(req.body?.title || "Live Stream");
  const all = await readAll();
  const id = "lv_" + Math.random().toString(36).slice(2);
  const s = { id, userId, title, startedAt: Date.now(), endedAt: 0 };
  all.streams.push(s);
  await writeAll(all);
  return res.status(201).json({ stream: s });
});

// POST /api/live/:id/stop
liveRouter.post("/:id/stop", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const all = await readAll();
  const idx = (all.streams||[]).findIndex((s:any) => s.id === req.params.id && s.userId === userId && !s.endedAt);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  all.streams[idx].endedAt = Date.now();
  await writeAll(all);
  return res.json({ ok: true });
});
