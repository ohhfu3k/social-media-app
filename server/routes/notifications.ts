import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "notifications.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(file); } catch { await fs.writeFile(file, "[]", "utf-8"); }
  } catch {}
  next();
};

const readAll = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return []; } };
const writeAll = async (arr: any[]) => fs.writeFile(file, JSON.stringify(arr, null, 2), "utf-8");

function getUserId(req: any): string | null {
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!t) return null;
    const v = verifyToken(t);
    return v.valid ? String(v.payload.sub) : null;
  } catch { return null; }
}

export const notificationsRouter = Router();
notificationsRouter.use(ensureData);

// GET /api/notifications
notificationsRouter.get("/", async (req, res) => {
  const uid = getUserId(req) || "public";
  const all = await readAll();
  const items = all.filter((n) => (n.userId || "public") === uid).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  return res.json({ notifications: items });
});

// POST /api/notifications/seed — create sample notifications for current user (dev helper)
notificationsRouter.post("/seed", async (req, res) => {
  const uid = getUserId(req) || "public";
  const all = await readAll();
  const base = [
    { kind: "star", text: "Someone starred your post" },
    { kind: "whisper", text: "New whisper message" },
    { kind: "energy", text: "+5 energy bonus" },
  ];
  const time = Date.now();
  for (let i = 0; i < 6; i++) {
    all.push({ id: Math.random().toString(36).slice(2), userId: uid, kind: base[i % base.length].kind, text: base[i % base.length].text, createdAt: time - i*3600_000, read: false });
  }
  await writeAll(all);
  return res.status(201).json({ ok: true });
});

// POST /api/notifications/:id/read
notificationsRouter.post("/:id/read", async (req, res) => {
  const uid = getUserId(req) || "public";
  const { id } = req.params as { id: string };
  const all = await readAll();
  const idx = all.findIndex((n) => n.id === id && (n.userId || "public") === uid);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  all[idx].read = true;
  await writeAll(all);
  return res.json({ ok: true });
});
