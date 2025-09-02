import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const groupsFile = path.join(dataDir, "groups.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(groupsFile); } catch { await fs.writeFile(groupsFile, "[]", "utf-8"); } } catch {}
  next();
};

const readGroups = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(groupsFile, "utf-8")); } catch { return []; } };
const writeGroups = async (arr: any[]) => fs.writeFile(groupsFile, JSON.stringify(arr, null, 2), "utf-8");

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

export const groupsRouter = Router();

groupsRouter.use(ensureData);

// GET /api/groups
groupsRouter.get("/", async (_req, res) => {
  const groups = await readGroups();
  return res.json({ groups });
});

// POST /api/groups
groupsRouter.post("/", async (req, res) => {
  const userId = uid(req);
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name required" });
  const all = await readGroups();
  const g = { id: newId("g_"), name, ownerId: userId, members: userId ? [userId] : [], createdAt: Date.now() };
  all.push(g);
  await writeGroups(all);
  return res.status(201).json({ group: g });
});

// POST /api/groups/:id/join
groupsRouter.post("/:id/join", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const all = await readGroups();
  const idx = all.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const members: string[] = Array.isArray(all[idx].members) ? all[idx].members : [];
  if (!members.includes(userId)) members.push(userId);
  all[idx].members = members;
  await writeGroups(all);
  return res.json({ ok: true, group: all[idx] });
});

// POST /api/groups/:id/leave
groupsRouter.post("/:id/leave", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const all = await readGroups();
  const idx = all.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  all[idx].members = (Array.isArray(all[idx].members) ? all[idx].members : []).filter((m: string) => m !== userId);
  await writeGroups(all);
  return res.json({ ok: true, group: all[idx] });
});
