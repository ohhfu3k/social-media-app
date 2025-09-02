import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "marketplace.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ items: [
    { id: 'm1', name: 'Music Pack Alpha', kind: 'music', price: 499 },
    { id: 'm2', name: 'Theme: Orion', kind: 'theme', price: 999 },
    { id: 'm3', name: 'Sticker Set: Nebula', kind: 'sticker', price: 299 },
  ], purchases: {} }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { items: [], purchases: {} as Record<string,string[]> }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) { try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = verifyToken(t); return v.valid?String(v.payload.sub):null; } catch { return null; } }

export const marketplaceRouter = Router();
marketplaceRouter.use(ensureData);

// GET /api/marketplace
marketplaceRouter.get("/", async (_req, res) => {
  const all = await readAll();
  return res.json({ items: all.items });
});

// POST /api/marketplace/purchase { itemId }
marketplaceRouter.post("/purchase", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const itemId = String(req.body?.itemId || "");
  const all = await readAll();
  const exists = (all.items || []).some((i:any) => i.id === itemId);
  if (!exists) return res.status(404).json({ error: "Item not found" });
  const set = new Set<string>(Array.isArray(all.purchases[userId]) ? all.purchases[userId] : []);
  set.add(itemId);
  all.purchases[userId] = Array.from(set);
  await writeAll(all);
  return res.json({ ok: true, purchases: all.purchases[userId] });
});
