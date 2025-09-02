import { Router, RequestHandler } from "express";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { requireAuth } from "../middlewares/auth";

export const bookmarksRouter = Router();

bookmarksRouter.get("/", requireAuth, (async (req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const cursor = String(req.query.cursor || "");
  const me = String((req as any).auth.sub);
  const args: any = { where: { userId: me }, take: limit + 1, orderBy: { id: 'asc' }, include: { post: true } };
  if (cursor) args.cursor = { id: cursor }, args.skip = 1;
  const rows = await prisma.bookmark.findMany(args);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((b: any) => ({ id: b.id, post: b.post }));
  res.json({ items, nextCursor: hasMore ? rows[limit].id : null });
}) as RequestHandler);
