import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "events.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ events: [], participants: {} }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { events: [], participants: {} as Record<string,string[]> }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) {
  try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = t?require("../utils/auth"):null; } catch {}
  try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = require("../utils/auth"); } catch {}
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    const v = verifyToken(t);
    return v.valid ? String(v.payload.sub) : null;
  } catch { return null; }
}

function newId(prefix: string) { return prefix + Math.random().toString(36).slice(2); }

export const eventsRouter = Router();
eventsRouter.use(ensureData);

// GET /api/events
// returns upcoming sample events (and saved custom events)
eventsRouter.get("/", async (_req, res) => {
  const all = await readAll();
  if (all.events.length === 0) {
    const base = Array.from({ length: 8 }).map((_, i) => ({ id: `e_${i+1}`, title: `Watch party #${i+1}`, at: Date.now() + (i+1)*86400_000 }));
    all.events = base;
    await writeAll(all);
  }
  return res.json({ events: all.events });
});

// POST /api/events — create event
eventsRouter.post("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const title = String(req.body?.title || "").trim();
  const at = Number(req.body?.at || Date.now() + 3600_000);
  if (!title) return res.status(400).json({ error: "title required" });
  const all = await readAll();
  const ev = { id: newId("e_"), title, at, createdBy: userId };
  all.events.push(ev);
  await writeAll(all);
  return res.status(201).json({ event: ev });
});

// POST /api/events/:id/join
eventsRouter.post("/:id/join", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const all = await readAll();
  const ev = all.events.find((e:any) => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: "Not found" });
  const arr: string[] = Array.isArray(all.participants[ev.id]) ? all.participants[ev.id] : [];
  if (!arr.includes(userId)) arr.push(userId);
  all.participants[ev.id] = arr;
  await writeAll(all);
  return res.json({ ok: true, participants: arr.length });
});
