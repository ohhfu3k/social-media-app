import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "stories.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, "[]", "utf-8"); } } catch {}
  next();
};

const readAll = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return []; } };
const writeAll = async (arr: any[]) => fs.writeFile(file, JSON.stringify(arr, null, 2), "utf-8");

function uid(req: any) {
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!t) return null;
    const v = verifyToken(t);
    return v.valid ? String(v.payload.sub) : null;
  } catch { return null; }
}

function newId(prefix: string) { return prefix + Math.random().toString(36).slice(2); }

export const storiesRouter = Router();
storiesRouter.use(ensureData);

// GET /api/stories — all current stories (not expired)
storiesRouter.get("/", async (_req, res) => {
  const now = new Date();
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const items = await (prisma as any).story.findMany({ where: { expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' } });
      return res.json({ stories: items });
    }
  } catch {}
  const all = await readAll();
  const items = all.filter((s) => Date.now() - Number(s.createdAt) < Number(s.lifespanMs||24*3600_000));
  return res.json({ stories: items });
});

// GET /api/stories/:userId
storiesRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const now = new Date();
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const items = await (prisma as any).story.findMany({ where: { authorId: userId, expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' } });
      return res.json({ stories: items });
    }
  } catch {}
  const all = await readAll();
  const items = all.filter((s) => s.userId === userId && (Date.now() - Number(s.createdAt) < Number(s.lifespanMs||24*3600_000)));
  return res.json({ stories: items });
});

// POST /api/stories — create story for current user
storiesRouter.post("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const src = String(req.body?.mediaUrl || req.body?.src || "");
  const thumbUrl = req.body?.thumbUrl ? String(req.body?.thumbUrl) : null;
  if (!src) return res.status(400).json({ error: "mediaUrl required" });
  const expiresAt = new Date(Date.now() + 24*3600*1000);
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const story = await (prisma as any).story.create({ data: { authorId: userId, mediaUrl: src, thumbUrl, expiresAt } });
      return res.status(201).json({ story });
    }
  } catch {}
  const item = { id: newId("s_"), userId, type: 'image', src, createdAt: Date.now(), lifespanMs: 24*3600_000 };
  const all = await readAll();
  all.push(item);
  await writeAll(all);
  return res.status(201).json({ story: item });
});

// PATCH /api/stories/:id/highlight — toggle highlight
storiesRouter.patch("/:id/highlight", async (req, res) => {
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const id = String(req.params.id);
      const s = await (prisma as any).story.findUnique({ where: { id } });
      if (!s) return res.status(404).json({ error: "Not found" });
      const out = await (prisma as any).story.update({ where: { id }, data: { isHighlight: !s.isHighlight } });
      return res.json({ story: out });
    }
  } catch {}
  return res.status(503).json({ error: "Database not connected" });
});
