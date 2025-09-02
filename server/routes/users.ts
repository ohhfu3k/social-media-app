import { Router, RequestHandler } from "express";
import { z } from "zod";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { requireAuth } from "../middlewares/auth";

export const usersRouter = Router();

// GET /api/users?search=&limit=&cursor=
usersRouter.get("/", (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const search = String(req.query.search || "").trim();
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const cursor = String(req.query.cursor || "");
  const where = search ? {
    OR: [
      { username: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ]
  } : {};
  const args: any = { where, take: limit + 1, orderBy: { id: 'asc' } };
  if (cursor) args.cursor = { id: cursor }, args.skip = 1;
  const rows = await prisma.user.findMany(args);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((u: any) => ({ id: u.id, username: u.username, name: u.name, avatarUrl: u.avatar, bio: u.bio }));
  return res.json({ items, nextCursor: hasMore ? rows[limit].id : null });
}) as RequestHandler);

// GET /api/users/:username
usersRouter.get("/:username", (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const username = String(req.params.username || "");
  const user = await prisma.user.findFirst({ where: { username: username.toLowerCase() } });
  if (!user) return res.status(404).json({ error: "Not found" });
  const [followers, following, posts] = await Promise.all([
    prisma.follower.count({ where: { followingId: user.id } }),
    prisma.follower.count({ where: { followerId: user.id } }),
    prisma.post.count({ where: { authorId: user.id } }),
  ]);
  return res.json({ user: { id: user.id, username: user.username, name: user.name, bio: user.bio, avatarUrl: user.avatar, isPrivate: user.isPrivate, stats: { followers, following, posts } } });
}) as RequestHandler);

// PATCH /api/users/me
const updateMeSchema = z.object({ name: z.string().min(1).max(60).optional(), bio: z.string().max(500).optional(), avatarUrl: z.string().url().optional(), isPrivate: z.boolean().optional() });
usersRouter.patch("/me", requireAuth, (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const parse = updateMeSchema.safeParse(req.body || {});
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const auth = (req as any).auth;
  const data: any = {};
  if (parse.data.name !== undefined) data.name = parse.data.name;
  if (parse.data.bio !== undefined) data.bio = parse.data.bio;
  if (parse.data.avatarUrl !== undefined) data.avatar = parse.data.avatarUrl;
  if (parse.data.isPrivate !== undefined) data.isPrivate = parse.data.isPrivate;
  const user = await prisma.user.update({ where: { id: String(auth.sub) }, data });
  return res.json({ user: { id: user.id, name: user.name, bio: user.bio, avatarUrl: user.avatar, isPrivate: user.isPrivate } });
}) as RequestHandler);

// Follow/unfollow
usersRouter.post("/:id/follow", requireAuth, (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const targetId = String(req.params.id);
  const me = String((req as any).auth.sub);
  if (me === targetId) return res.status(400).json({ error: "Cannot follow yourself" });
  try {
    await prisma.follower.create({ data: { followerId: me, followingId: targetId } });
  } catch {}
  return res.json({ following: true });
}) as RequestHandler);

usersRouter.delete("/:id/follow", requireAuth, (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const targetId = String(req.params.id);
  const me = String((req as any).auth.sub);
  try { await prisma.follower.deleteMany({ where: { followerId: me, followingId: targetId } }); } catch {}
  return res.json({ following: false });
}) as RequestHandler);
