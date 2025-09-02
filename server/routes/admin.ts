import { Router, RequestHandler } from "express";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { firebaseEnabled, firestore } from "../services/firebase";

const adminRouter = Router();

const requireSecret: RequestHandler = (req, res, next) => {
  const secret = process.env.MIGRATION_SECRET || "";
  const provided = String(req.headers["x-migration-secret"] || "");
  if (!secret || provided !== secret) return res.status(401).json({ error: "Unauthorized" });
  next();
};

adminRouter.post("/migrate-firestore", requireSecret, async (_req, res) => {
  if (!firebaseEnabled) return res.status(503).json({ error: "Firebase not configured" });
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  let usersMigrated = 0; let profilesMigrated = 0;
  try {
    const users = await prisma.user.findMany();
    for (const u of users) {
      const id = String(u.id);
      await firestore.collection("users").doc(id).set({
        name: u.name || "",
        email: u.email || undefined,
        phone: u.phone || undefined,
        username: (u.username || "").toLowerCase() || undefined,
        bio: u.bio || "",
        entranceStyle: u.entranceStyle || "Comet Trail",
        location: u.location || "",
        timezone: u.timezone || "",
        gender: u.gender || "Prefer not to say",
        pronouns: u.pronouns || "Prefer not to say",
        theme: u.theme || "dark",
        isPrivate: !!u.isPrivate,
        isActive: !!u.isActive,
        avatar: u.avatar || "/placeholder.svg",
        linkedStars: Number(u.linkedStars || 0),
        starlit: Number(u.starlit || 0),
        created_at: u.createdAt || new Date(),
        updated_at: u.updatedAt || new Date(),
      }, { merge: true });
      usersMigrated++;
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed migrating users" });
  }

  try {
    const profiles = await prisma.profile.findMany();
    for (const p of profiles) {
      await firestore.collection("profiles").doc(String(p.userId)).set({
        userId: String(p.userId),
        username: p.username || "",
        handle: p.handle || "",
        title: p.title || "",
        bio: p.bio || "",
        profilePic: p.profilePic || "/placeholder.svg",
        linkedStars: Number((p as any).linkedStars || 0),
        starlit: Number((p as any).starlit || 0),
        posts: Array.isArray((p as any).postsJson) ? (p as any).postsJson : [],
        highlights: Array.isArray((p as any).highlightsJson) ? (p as any).highlightsJson : [],
        achievements: Array.isArray((p as any).achievementsJson) ? (p as any).achievementsJson : [],
        connections: Array.isArray((p as any).connectionsJson) ? (p as any).connectionsJson : [],
        createdAt: (p as any).createdAt || new Date(),
        updatedAt: (p as any).updatedAt || new Date(),
      }, { merge: true });
      profilesMigrated++;
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed migrating profiles", usersMigrated });
  }

  return res.json({ ok: true, usersMigrated, profilesMigrated });
});

// Star of month cron
adminRouter.post("/cron/star-of-month", async (_req, res) => {
  if (!(dbEnabled && isDbReady())) return res.status(503).json({ error: "Database not connected" });
  try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const posts = await prisma.post.findMany({ where: { createdAt: { gte: monthStart } }, include: { _count: { select: { likes: true } } } });
    const byUser: Record<string, any[]> = {};
    for (const p of posts) {
      const arr = byUser[p.authorId] || (byUser[p.authorId] = []);
      arr.push(p);
    }
    for (const [userId, arr] of Object.entries(byUser)) {
      arr.sort((a:any,b:any)=> (b as any)._count.likes - (a as any)._count.likes);
      const top = arr[0];
      if (top) await prisma.post.update({ where: { id: top.id }, data: { isStarOfMonth: true } });
    }
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export { adminRouter };
