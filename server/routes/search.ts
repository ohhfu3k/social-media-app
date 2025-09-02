import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");
const profilesFile = path.join(dataDir, "profiles.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); } catch {}
  next();
};

const readUsers = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(usersFile, "utf-8")); } catch { return []; } };
const readProfiles = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(profilesFile, "utf-8")); } catch { return []; } };

export const searchRouter = Router();
searchRouter.use(ensureData);

// GET /api/search/users?q=&limit=20
searchRouter.get("/users", async (req, res) => {
  const q = String(req.query.q || "").trim();
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const rows = await (prisma as any).user.findMany({ where: q ? { OR: [ { username: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } } ] } : {}, take: 20, orderBy: { username: 'asc' } });
      return res.json({ items: rows.map((u: any) => ({ id: u.id, username: u.username, name: u.name, avatar: u.avatar, bio: u.bio })) });
    }
  } catch {}
  const users = await readUsers();
  const items = users.filter((u) => !q || (String(u.name||"").toLowerCase().includes(q.toLowerCase()) || String(u.username||"").toLowerCase().includes(q.toLowerCase()))).slice(0,20).map((u)=>({ id: u.id, username: u.username, name: u.name, avatar: u.avatar, bio: u.bio }));
  return res.json({ items });
});

// GET /api/search?q=&page=
searchRouter.get("/", async (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const page = Math.max(0, Number(req.query.page || 0));
  const users = await readUsers();
  const profiles = await readProfiles();

  const userResults = users
    .filter((u) => !q || (String(u.name||"").toLowerCase().includes(q) || String(u.username||"").toLowerCase().includes(q)))
    .slice(page * 10, page * 10 + 10)
    .map((u) => ({ type: "user", id: u.id, name: u.name || "User", username: u.username || (u.email ? u.email.split("@")[0] : ""), avatar: u.avatar || "/placeholder.svg", energy: Math.floor(Math.random()*100) }));

  const postResults = profiles
    .flatMap((p) => (Array.isArray(p.posts)?p.posts:[]).map((po:any)=>({ ...po, username: p.username||"" })))
    .filter((p) => !q || String(p.caption||"").toLowerCase().includes(q))
    .slice(page * 10, page * 10 + 10)
    .map((p) => ({ type: "post", id: p.postId, title: p.caption || "", image: p.contentType === 'image' ? p.contentUrl : "https://picsum.photos/seed/"+encodeURIComponent(String(p.postId||""))+"/600/400" }));

  const tags: Record<string, number> = {};
  for (const p of profiles) {
    for (const po of (Array.isArray(p.posts)?p.posts:[])) {
      const matches = String(po.caption||"").match(/#\w+/g) || [];
      for (const t of matches) tags[t.toLowerCase()] = (tags[t.toLowerCase()]||0) + 1;
    }
  }
  const tagResults = Object.entries(tags)
    .filter(([t]) => !q || t.includes(q))
    .sort((a,b)=> b[1]-a[1])
    .slice(page*10, page*10+10)
    .map(([tag,count]) => ({ type: "hashtag", tag, count }));

  return res.json({ results: [...userResults, ...postResults, ...tagResults] });
});
