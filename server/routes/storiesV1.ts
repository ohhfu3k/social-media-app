import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../utils/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const entriesFile = path.join(dataDir, "stories_v1_entries.json");
const viewsFile = path.join(dataDir, "stories_v1_views.json");
const reactionsFile = path.join(dataDir, "stories_v1_reactions.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    for (const f of [entriesFile, viewsFile, reactionsFile]) {
      try { await fs.access(f); } catch { await fs.writeFile(f, "[]", "utf-8"); }
    }
  } catch {}
  next();
};
const readJson = async <T=any>(f: string): Promise<T[]> => { try { return JSON.parse(await fs.readFile(f, "utf-8")); } catch { return []; } };
const writeJson = async (f: string, v: any) => fs.writeFile(f, JSON.stringify(v, null, 2), "utf-8");
const newid = (p: string) => p + Math.random().toString(36).slice(2);

function uid(req: any) {
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!t) return null;
    const v = verifyToken(t);
    return v.valid ? String(v.payload.sub) : null;
  } catch { return null; }
}

export const storiesV1Router = Router();
storiesV1Router.use(ensureData);

// POST /api/v1/stories/hooks — return a mock upload URL (client may bypass and send data URLs)
storiesV1Router.post("/hooks", async (_req, res) => {
  const story_item_id = newid("si_");
  const upload_url = `data-url-direct:${story_item_id}`;
  res.json({ upload_url, story_item_id, direct_data_url: true });
});

// POST /api/v1/stories/compose — create multi-item story entry
// body: { items:[{type:"image|video|audio", src, duration_seconds?}], meta?, expires_in_seconds? }
storiesV1Router.post("/compose", async (req, res) => {
  const userId = uid(req) || "dev_user"; // allow dev
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "items required" });
  const meta = req.body?.meta || {};
  const createdAt = Date.now();
  const expiresIn = Math.max(1, Number(req.body?.expires_in_seconds || 24*3600));
  const entry = { id: newid("st_"), userId, items, meta, createdAt, expiresAt: createdAt + expiresIn*1000 };

  // If Prisma is connected, persist there (tables not present in starter, so safe-guard)
  try {
    const { prisma, dbEnabled, isDbReady } = await import("../config/db");
    if (dbEnabled && isDbReady()) {
      // Expect a Story + StoryItem model; if not present, fall back to file
      try {
        const story = await (prisma as any).story.create({ data: { authorId: userId, expiresAt: new Date(entry.expiresAt), meta } });
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          await (prisma as any).storyItem.create({ data: { storyId: story.id, mediaUrl: it.src, type: it.type, orderIndex: i, durationSeconds: Number(it.duration_seconds||0) } });
        }
        return res.status(201).json({ ok: true, storyId: story.id });
      } catch {}
    }
  } catch {}

  const arr = await readJson(entriesFile);
  arr.unshift(entry);
  await writeJson(entriesFile, arr);
  res.status(201).json({ ok: true, entry });
});

// GET /api/v1/stories/viewer-feed — returns users with segments matching the web UI types
storiesV1Router.get("/viewer-feed", async (req, res) => {
  const anonymous = String(req.query.anonymous || "0") === "1";
  const entries = await readJson(entriesFile);
  const now = Date.now();
  const valid = entries.filter((e: any) => now < Number(e.expiresAt|| (e.createdAt + 24*3600_000)));
  const byUser = new Map<string, any[]>();
  for (const e of valid) {
    if (!byUser.has(e.userId)) byUser.set(e.userId, []);
    byUser.get(e.userId)!.push(e);
  }
  const users: any[] = [];
  for (const [userId, list] of byUser.entries()) {
    const segments = list.flatMap((e) => (e.items||[]).map((it: any, idx: number) => ({
      id: `${e.id}-${idx}`,
      type: it.type,
      src: it.src,
      createdAt: e.createdAt,
      lifespanMs: Number(e.expiresAt ? e.expiresAt - e.createdAt : 24*3600_000),
      meta: { authorName: anonymous ? undefined : (e.meta?.authorName || "User"), authorAvatar: anonymous ? undefined : (e.meta?.authorAvatar || "/placeholder.svg") },
    })));
    users.push({ id: userId, name: anonymous ? undefined : (segments[0]?.meta?.authorName || "User"), avatar: anonymous ? undefined : (segments[0]?.meta?.authorAvatar || "/placeholder.svg"), kind: anonymous ? "anonymous" : "cosmic", segments });
  }
  res.json({ users });
});

// POST /api/v1/stories/:story_item_id/view — idempotent
storiesV1Router.post("/:story_item_id/view", async (req, res) => {
  const story_item_id = String(req.params.story_item_id);
  const viewerId = uid(req) || (req.ip || "anon");
  const views = await readJson(viewsFile) as any[];
  const key = `${story_item_id}:${viewerId}`;
  if (!views.find((v) => v.key === key)) {
    views.push({ key, story_item_id, viewerId, viewed_at: Date.now() });
    await writeJson(viewsFile, views);
  }
  res.json({ ok: true });
});

// POST /api/v1/stories/:story_item_id/react — quick emoji reactions
storiesV1Router.post("/:story_item_id/react", async (req, res) => {
  const story_item_id = String(req.params.story_item_id);
  const reactorId = uid(req) || (req.ip || "anon");
  const emoji = String(req.body?.emoji || "").slice(0, 8);
  if (!emoji) return res.status(400).json({ error: "emoji required" });
  const reactions = await readJson(reactionsFile) as any[];
  reactions.push({ story_item_id, reactorId, emoji, reacted_at: Date.now() });
  await writeJson(reactionsFile, reactions);
  res.status(201).json({ ok: true });
});

// GET /api/v1/stories/:user_id/viewers — owner only
storiesV1Router.get("/:user_id/viewers", async (req, res) => {
  const userId = String(req.params.user_id);
  const me = uid(req) || "";
  if (me && me !== userId) return res.status(403).json({ error: "Forbidden" });
  const views = await readJson(viewsFile) as any[];
  const entries = await readJson(entriesFile) as any[];
  const itemIds = new Set<string>();
  entries.filter((e) => e.userId === userId).forEach((e) => (e.items||[]).forEach((_it: any, idx: number) => itemIds.add(`${e.id}-${idx}`)));
  const viewers = views.filter((v) => itemIds.has(v.story_item_id)).map((v) => ({ viewer_id: v.viewerId, viewed_at: v.viewed_at }));
  res.json({ viewers });
});

export default storiesV1Router;
