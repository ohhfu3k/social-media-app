import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const profilesFile = path.join(dataDir, "profiles.json");

const ensureData: RequestHandler = async (_req, _res, next) => { try { await fs.mkdir(dataDir, { recursive: true }); } catch {}; next(); };

const readProfiles = async () => { try { return JSON.parse(await fs.readFile(profilesFile, "utf-8")); } catch { return []; } };

export const exploreRouter = Router();
exploreRouter.use(ensureData);

// GET /api/explore - trending posts by likes
exploreRouter.get("/", async (_req, res) => {
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      const posts = await (prisma as any).post.findMany({ take: 50, orderBy: [{ isStarOfMonth: 'desc' }, { likes: { _count: 'desc' } } as any, { createdAt: 'desc' }], include: { author: true, _count: { select: { likes: true } } } });
      return res.json({ posts: posts.map((p:any)=>({ id: p.id, author: { id: p.authorId, username: p.author?.username, name: p.author?.name, avatarUrl: p.author?.avatar }, type: p.type, text: p.text, mediaUrl: p.mediaUrl, thumbUrl: p.thumbUrl, energyCount: p._count.likes, createdAt: p.createdAt })) });
    }
  } catch {}
  // fallback to tag trending
  const profiles = await readProfiles();
  const tags: Record<string, number> = {};
  for (const p of profiles) for (const po of (Array.isArray(p.posts)?p.posts:[])) {
    const m = String(po.caption||"").match(/#\w+/g) || [];
    for (const t of m) tags[t.toLowerCase()] = (tags[t.toLowerCase()]||0) + 1;
  }
  const trending = Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
  return res.json({ trending });
});

// GET /api/explore/trending
exploreRouter.get("/trending", async (_req, res) => {
  const profiles = await readProfiles();
  const tags: Record<string, number> = {};
  for (const p of profiles) for (const po of (Array.isArray(p.posts)?p.posts:[])) {
    const m = String(po.caption||"").match(/#\w+/g) || [];
    for (const t of m) tags[t.toLowerCase()] = (tags[t.toLowerCase()]||0) + 1;
  }
  const trending = Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
  return res.json({ trending });
});

// GET /api/explore/suggestions
exploreRouter.get("/suggestions", async (_req, res) => {
  const profiles = await readProfiles();
  const users = profiles.map((p:any)=> ({ id: p.userId, username: p.username, avatar: p.profilePic||"/placeholder.svg" }));
  return res.json({ users: users.slice(0, 20) });
});
