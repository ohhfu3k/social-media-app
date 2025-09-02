import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "badges.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ catalog: [
    { id: 'b1', name: 'Dragon Rider' },
    { id: 'b2', name: 'Explorer' },
    { id: 'b3', name: 'Whisperer' },
    { id: 'b4', name: 'Nebula Diver' },
    { id: 'b5', name: 'Guardian' },
  ], user: {} }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { catalog: [], user: {} as Record<string,string[]> }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) {
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!t) return null;
    const v = verifyToken(t);
    return v.valid ? String(v.payload.sub) : null;
  } catch { return null; }
}

export const badgesRouter = Router();
badgesRouter.use(ensureData);

// GET /api/badges/catalog
badgesRouter.get("/catalog", async (_req, res) => {
  const all = await readAll();
  return res.json({ badges: all.catalog });
});

// GET /api/badges/me
badgesRouter.get("/me", async (req, res) => {
  const id = uid(req);
  if (!id) return res.json({ badges: [] });
  const all = await readAll();
  const list = Array.isArray((all.user||{})[id]) ? (all.user||{})[id] : [];
  const detailed = all.catalog.filter((b: any) => list.includes(b.id));
  return res.json({ badges: detailed });
});

// POST /api/badges/award { userId, badgeId }
badgesRouter.post("/award", async (req, res) => {
  const { userId, badgeId } = req.body || {};
  if (!userId || !badgeId) return res.status(400).json({ error: "userId and badgeId required" });
  const all = await readAll();
  const set = new Set<string>(Array.isArray((all.user||{})[userId]) ? (all.user||{})[userId] : []);
  set.add(String(badgeId));
  all.user[userId] = Array.from(set);
  await writeAll(all);
  return res.json({ ok: true });
});
