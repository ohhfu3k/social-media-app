import { Router, RequestHandler } from "express";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { requireAuth } from "../middlewares/auth";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const profilesFile = path.join(dataDir, "profiles.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(profilesFile); } catch { await fs.writeFile(profilesFile, "[]", "utf-8"); }
  } catch {}
  next();
};

const readProfiles = async () => { try { return JSON.parse(await fs.readFile(profilesFile, "utf-8")); } catch { return []; } };
const writeProfiles = async (arr: any[]) => fs.writeFile(profilesFile, JSON.stringify(arr, null, 2), "utf-8");

function newId(prefix: string) { return prefix + Math.random().toString(36).slice(2); }

export const postsRouter = Router();
postsRouter.use(ensureData);

// GET /api/posts - latest posts across users (fallback to Profile JSON if no SQL)
postsRouter.get("/", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));

  if (dbEnabled && isDbReady()) {
    try {
      let where: any = {};
      const isAnon = String(req.query.anonymous || "") === "1" || String(req.query.universe || "").toUpperCase() === "ANONYMOUS";
      try {
        const { verifyToken } = await import("../utils/auth");
        const h = String(req.headers.authorization || "");
        const bearer = h.startsWith("Bearer ") ? h.slice(7) : "";
        const cookie = String(req.headers.cookie || "");
        const token = bearer || (cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1] ? decodeURIComponent(cookie.match(/(?:^|;\s*)access_token=([^;]+)/)![1]) : "");
        if (token) {
          const v = verifyToken(token);
          if (v.valid) {
            const me = String(v.payload.sub);
            const followIds = await prisma.follower.findMany({ where: { followerId: me }, select: { followingId: true } });
            const ids = [me, ...followIds.map((x:any)=>x.followingId)];
            where = { authorId: { in: ids } };
          }
        }
      } catch {}
      // Enforce universe filter
      if (isAnon) where = { universe: 'ANONYMOUS' };
      else where = { ...where, universe: 'NORMAL' };
      const rows = await prisma.post.findMany({ where, take: limit, orderBy: { createdAt: 'desc' }, include: { author: true, _count: { select: { likes: true } } } });
      const postIds = rows.map((p: any) => p.id);
      const sums = await prisma.energy.groupBy({ by: ['postId'], _sum: { value: true }, where: { postId: { in: postIds } } }).catch(() => []);
      const totalsMap: Record<string, number> = Object.fromEntries((sums as any[]).map((s: any) => [s.postId, s._sum?.value || 0]));
      // Determine current user for myEnergy
      let meId: string | null = null;
      try {
        const { verifyToken } = await import("../utils/auth");
        const h2 = String(req.headers.authorization || "");
        const bearer2 = h2.startsWith("Bearer ") ? h2.slice(7) : "";
        const cookie2 = String(req.headers.cookie || "");
        const token2 = bearer2 || (cookie2.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1] ? decodeURIComponent(cookie2.match(/(?:^|;\s*)access_token=([^;]+)/)![1]) : "");
        if (token2) {
          const v2 = verifyToken(token2);
          if (v2.valid) meId = String(v2.payload.sub);
        }
      } catch {}
      let myMap: Record<string, number> = {};
      if (meId && postIds.length) {
        try {
          const arr = await prisma.energy.findMany({ where: { userId: meId, postId: { in: postIds } } });
          myMap = Object.fromEntries(arr.map((e: any) => [e.postId, e.value]));
        } catch {}
      }
      return res.json({ posts: rows.map((p: any) => ({ id: p.id, author: { id: p.authorId, username: p.author?.username, name: p.author?.name, avatarUrl: p.author?.avatar }, type: p.type, text: p.text, mediaUrl: p.mediaUrl, thumbUrl: p.thumbUrl, durationSec: p.durationSec, isStarOfMonth: p.isStarOfMonth, energyCount: p._count.likes, energyTotal: totalsMap[p.id] || 0, myEnergy: myMap[p.id] || 0, createdAt: p.createdAt })) });
    } catch {}
  }

  // file fallback
  const arr = await readProfiles();
  const posts = arr.flatMap((p: any) => (p.posts || []).map((pp: any) => ({ ...pp, userId: p.userId, username: p.username })));
  posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ posts: posts.slice(0, limit) });
});

// POST /api/posts - create post for current user
postsRouter.post("/", requireAuth, async (req, res) => {
  const auth = (req as any).auth || {};
  if (dbEnabled && isDbReady()) {
    try {
      const type = String(req.body?.type || 'TEXT');
      const universe = String(req.body?.universe || 'NORMAL').toUpperCase() === 'ANONYMOUS' ? 'ANONYMOUS' : 'NORMAL';
      const text = req.body?.text ?? null;
      const mediaUrl = req.body?.mediaUrl ?? null;
      const thumbUrl = req.body?.thumbUrl ?? null;
      const durationSec = req.body?.durationSec ?? null;
      const post = await prisma.post.create({ data: { authorId: String(auth.sub), type, universe, text, mediaUrl, thumbUrl, durationSec } });
      return res.status(201).json({ post });
    } catch (e) {}
  }
  // file fallback legacy
  const post = {
    postId: newId("p_"),
    contentType: req.body?.contentType || "text",
    contentUrl: req.body?.contentUrl || "",
    caption: req.body?.caption || "",
    likes: 0,
    comments: [],
    createdAt: new Date(),
  } as any;
  const arr = await readProfiles();
  let idx = arr.findIndex((x: any) => String(x.userId) === String(auth.sub));
  if (idx === -1) { arr.push({ userId: String(auth.sub), username: String(auth.name||""), posts: [], highlights: [], achievements: [], connections: [] }); idx = arr.length - 1; }
  arr[idx].posts.push({ ...post, createdAt: new Date().toISOString() });
  await writeProfiles(arr);
  return res.status(201).json({ post });
});

// GET /api/posts/:id
postsRouter.get("/:id", async (req, res) => {
  if (dbEnabled && isDbReady()) {
    try {
      const id = String(req.params.id);
      const p = await prisma.post.findUnique({ where: { id }, include: { author: true, _count: { select: { likes: true } } } });
      if (!p) return res.status(404).json({ error: "Not found" });
      return res.json({ post: { ...p, energyCount: (p as any)._count.likes } });
    } catch {}
  }
  return res.status(404).json({ error: "Not found" });
});

// PATCH /api/posts/:id
postsRouter.patch("/:id", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const p = await prisma.post.findUnique({ where: { id } });
  if (!p || p.authorId !== me) return res.status(403).json({ error: "Forbidden" });
  const data: any = {};
  if (req.body?.text !== undefined) data.text = req.body.text;
  if (req.body?.isStarOfMonth !== undefined) data.isStarOfMonth = !!req.body.isStarOfMonth;
  const out = await prisma.post.update({ where: { id }, data });
  res.json({ post: out });
});

// DELETE /api/posts/:id
postsRouter.delete("/:id", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const p = await prisma.post.findUnique({ where: { id } });
  if (!p || p.authorId !== me) return res.status(403).json({ error: "Forbidden" });
  await prisma.post.delete({ where: { id } });
  res.json({ ok: true });
});

// POST /api/posts/:id/like (toggle)
postsRouter.post("/:id/like", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const ex = await prisma.like.findFirst({ where: { postId: id, userId: me } });
  let liked = false;
  if (ex) { await prisma.like.delete({ where: { id: ex.id } }); liked = false; } else { await prisma.like.create({ data: { postId: id, userId: me } }); liked = true; }
  const energyCount = await prisma.like.count({ where: { postId: id } });
  res.json({ liked, energyCount });
});

// POST /api/posts/:id/bookmark (toggle)
postsRouter.post("/:id/bookmark", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const ex = await prisma.bookmark.findFirst({ where: { postId: id, userId: me } });
  let bookmarked = false;
  if (ex) { await prisma.bookmark.delete({ where: { id: ex.id } }); bookmarked = false; } else { await prisma.bookmark.create({ data: { postId: id, userId: me } }); bookmarked = true; }
  res.json({ bookmarked });
});

// Energy endpoints
postsRouter.get("/:id/energy", async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  let meId: string | null = null;
  try {
    const { verifyToken } = await import("../utils/auth");
    const h = String(req.headers.authorization || "");
    const bearer = h.startsWith("Bearer ") ? h.slice(7) : "";
    const cookie = String(req.headers.cookie || "");
    const token = bearer || (cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1] ? decodeURIComponent(cookie.match(/(?:^|;\s*)access_token=([^;]+)/)![1]) : "");
    if (token) { const v = verifyToken(token); if (v.valid) meId = String(v.payload.sub); }
  } catch {}
  const agg = await prisma.energy.aggregate({ where: { postId: id }, _sum: { value: true } });
  let myEnergy = 0;
  if (meId) {
    try {
      const rec = await prisma.energy.findUnique({ where: { postId_userId: { postId: id, userId: meId } } as any });
      myEnergy = rec?.value || 0;
    } catch {}
  }
  res.json({ energyTotal: agg._sum.value || 0, myEnergy });
});

postsRouter.put("/:id/energy", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const raw = Number((req.body?.value ?? 0));
  const value = Math.max(0, Math.min(3, isNaN(raw) ? 0 : raw));
  if (value === 0) {
    try { await prisma.energy.delete({ where: { postId_userId: { postId: id, userId: me } } as any }); } catch {}
  } else {
    await prisma.energy.upsert({ where: { postId_userId: { postId: id, userId: me } } as any, update: { value }, create: { postId: id, userId: me, value } });
  }
  const agg = await prisma.energy.aggregate({ where: { postId: id }, _sum: { value: true } });
  res.json({ myEnergy: value, energyTotal: agg._sum.value || 0 });
});

// Comments
postsRouter.get("/:id/comments", async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const cursor = String(req.query.cursor || "");
  const args: any = { where: { postId: id }, take: limit + 1, orderBy: { createdAt: 'desc' } };
  if (cursor) args.cursor = { id: cursor }, args.skip = 1;
  const rows = await prisma.comment.findMany(args);
  const hasMore = rows.length > limit;
  res.json({ items: rows.slice(0, limit), nextCursor: hasMore ? rows[limit].id : null });
});

postsRouter.post("/:id/comments", requireAuth, async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const id = String(req.params.id);
  const me = String((req as any).auth.sub);
  const body = String(req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "body required" });
  const c = await prisma.comment.create({ data: { postId: id, authorId: me, body } });
  res.status(201).json({ comment: c });
});
