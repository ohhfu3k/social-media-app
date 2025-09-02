import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "analytics.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ users: {} }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { users: {} as Record<string, any> }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) { try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = verifyToken(t); return v.valid?String(v.payload.sub):null; } catch { return null; } }

export const analyticsRouter = Router();
analyticsRouter.use(ensureData);

// GET /api/analytics/me — my aggregated stats
analyticsRouter.get("/me", async (req, res) => {
  const id = uid(req);
  if (!id) return res.json({ stats: { profileViews: 0, postViews: 0, messages: 0 } });
  const all = await readAll();
  const stats = (all.users||{})[id] || { profileViews: 0, postViews: 0, messages: 0 };
  return res.json({ stats });
});

// POST /api/analytics/incr { type: 'profileViews'|'postViews'|'messages' }
analyticsRouter.post("/incr", async (req, res) => {
  const id = uid(req);
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const kind = String(req.body?.type || "");
  if (!['profileViews','postViews','messages'].includes(kind)) return res.status(400).json({ error: "invalid type" });
  const all = await readAll();
  all.users[id] = all.users[id] || { profileViews: 0, postViews: 0, messages: 0 };
  all.users[id][kind] = Number(all.users[id][kind]||0) + 1;
  await writeAll(all);
  return res.json({ ok: true, stats: all.users[id] });
});
