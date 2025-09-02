import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const file = path.join(dataDir, "support.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(file); } catch { await fs.writeFile(file, JSON.stringify({ tickets: [] }, null, 2), "utf-8"); } } catch {}
  next();
};

const readAll = async () => { try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return { tickets: [] as any[] }; } };
const writeAll = async (obj: any) => fs.writeFile(file, JSON.stringify(obj, null, 2), "utf-8");

function uid(req: any) { try { const h = String(req.headers.authorization||""); const t = h.startsWith("Bearer ")?h.slice(7):""; const v = verifyToken(t); return v.valid?String(v.payload.sub):null; } catch { return null; } }
function newId(prefix: string) { return prefix + Math.random().toString(36).slice(2); }

export const supportRouter = Router();
supportRouter.use(ensureData);

// POST /api/support — create ticket
supportRouter.post("/", async (req, res) => {
  const userId = uid(req) || "anon";
  const subject = String(req.body?.subject || "").trim();
  const message = String(req.body?.message || "").trim();
  if (!subject || !message) return res.status(400).json({ error: "subject and message required" });
  const all = await readAll();
  const t = { id: newId("t_"), userId, subject, message, status: "open", createdAt: Date.now() };
  all.tickets.push(t);
  await writeAll(all);
  return res.status(201).json({ ticket: t });
});

// GET /api/support — my tickets
supportRouter.get("/", async (req, res) => {
  const userId = uid(req) || "anon";
  const all = await readAll();
  return res.json({ tickets: (all.tickets||[]).filter((t:any)=> t.userId===userId).sort((a:any,b:any)=> b.createdAt-a.createdAt) });
});
