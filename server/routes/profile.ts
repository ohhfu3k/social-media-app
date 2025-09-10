import { Router, RequestHandler } from "express";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { requireAuth } from "../middlewares/auth";
import { verifyToken } from "../utils/auth";
import { firestore, firebaseEnabled, serverTimestamp, arrayUnion } from "../services/firebase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");
const profilesFile = path.join(dataDir, "profiles.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(usersFile); } catch { await fs.writeFile(usersFile, "[]", "utf-8"); }
    try { await fs.access(profilesFile); } catch { await fs.writeFile(profilesFile, "[]", "utf-8"); }
  } catch {}
  next();
};

const readUsers = async (): Promise<any[]> => {
  try { return JSON.parse(await fs.readFile(usersFile, "utf-8")); } catch { return []; }
};
const writeUsers = async (arr: any[]) => fs.writeFile(usersFile, JSON.stringify(arr, null, 2), "utf-8");
const readProfiles = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(profilesFile, "utf-8")); } catch { return []; } };
const writeProfiles = async (arr: any[]) => fs.writeFile(profilesFile, JSON.stringify(arr, null, 2), "utf-8");

const saveSchema = z.object({
  displayName: z.string().min(1),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_.]+$/i),
  bio: z.string().max(500).optional().default(""),
  entrance: z.enum(["Comet Trail","Warp Jump","Starlight"]),
  location: z.string().max(200).optional().default(""),
  timezone: z.string().max(100).optional().default(""),
  gender: z.string().max(50).optional().default("Prefer not to say"),
  pronoun: z.string().max(50).optional().default("Prefer not to say"),
  theme: z.enum(["dark","dragon","nebula"]).default("dark"),
  isPrivate: z.boolean().default(false),
  emailVerified: z.boolean().optional(),
  avatarDataUrl: z.string().url().or(z.string().startsWith("data:")).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  accountType: z.enum(["personal","creator","business"]).optional(),
});

export const profileRouter = Router();
profileRouter.use(ensureData);

// Attach auth payload if Authorization header present (optional auth)
profileRouter.use(((req, _res, next) => {
  try {
    const h = String(req.headers.authorization || "");
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (t) {
      const v = verifyToken(t);
      if (v.valid) (req as any).auth = v.payload;
    }
  } catch {}
  next();
}) as RequestHandler);

// Get my profile (Firebase preferred). If unauthenticated, can query by username
profileRouter.get("/me", async (req, res) => {
  const auth = (req as any).auth;
  const qUsername = String(req.query.username || "").toLowerCase();

  if (firebaseEnabled) {
    try {
      let data: any | null = null;
      if (auth?.sub) {
        const snap = await firestore.collection("users").doc(String(auth.sub)).get();
        data = snap.exists ? snap.data() : null;
      } else if (qUsername) {
        const q = await firestore.collection("users").where("username","==", qUsername).limit(1).get();
        data = q.empty ? null : q.docs[0].data();
      }
      if (!data) return res.json({ profile: null });
      return res.json({
        profile: {
          displayName: data.name || "",
          username: data.username || "",
          bio: data.bio || "",
          entrance: data.entranceStyle || "Comet Trail",
          location: data.location || "",
          timezone: data.timezone || "",
          gender: data.gender || "Prefer not to say",
          pronoun: data.pronouns || "Prefer not to say",
          theme: data.theme || "dark",
          isPrivate: !!data.isPrivate,
          emailVerified: !!data.isActive,
          avatarUrl: data.avatar || "/placeholder.svg",
          linkedStars: Number(data.linkedStars || 0),
          starlit: Number(data.starlit || 0),
        }
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  if (dbEnabled && isDbReady()) {
    try {
      let user: any = null;
      if (auth?.sub) {
        user = await prisma.user.findUnique({ where: { id: String(auth.sub) } });
      } else if (qUsername) {
        user = await prisma.user.findFirst({ where: { username: qUsername } });
      }
      if (!user) return res.json({ profile: null });
      return res.json({
        profile: {
          displayName: user.name || "",
          username: user.username || "",
          bio: user.bio || "",
          entrance: user.entranceStyle || "Comet Trail",
          location: user.location || "",
          timezone: user.timezone || "",
          gender: user.gender || "Prefer not to say",
          pronoun: user.pronouns || "Prefer not to say",
          theme: user.theme || "dark",
          isPrivate: !!user.isPrivate,
          emailVerified: !!user.isActive,
          avatarUrl: user.avatar || "/placeholder.svg",
          linkedStars: Number(user.linkedStars || 0),
          starlit: Number(user.starlit || 0),
        }
      });
    } catch {
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  return res.status(503).json({ error: "Database not connected" });
});

// Save my profile (Firebase preferred)
profileRouter.post("/save", async (req, res) => {
  const parse = saveSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const data = parse.data;
  const auth = (req as any).auth;
  if (!auth?.sub) return res.status(401).json({ error: "Unauthorized" });
  const uname = data.username.toLowerCase();

  if (firebaseEnabled) {
    try {
      const takenQ = await firestore.collection("users").where("username","==", uname).get();
      const conflict = takenQ.docs.find((d) => d.id !== String(auth.sub));
      if (conflict) return res.status(409).json({ error: "Username already taken" });
      const ref = firestore.collection("users").doc(String(auth.sub));
      await ref.set({
        name: data.displayName,
        username: uname,
        bio: data.bio,
        entranceStyle: data.entrance,
        location: data.location,
        timezone: data.timezone,
        gender: data.gender,
        pronouns: data.pronoun,
        theme: data.theme,
        isPrivate: data.isPrivate,
        isActive: typeof data.emailVerified === 'boolean' ? data.emailVerified : undefined,
        avatar: data.avatarDataUrl || "/placeholder.svg",
        dob: data.dob || undefined,
        accountType: data.accountType || undefined,
        linkedStars: 0,
        starlit: 0,
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
      }, { merge: true });
      const snap = await ref.get();
      const u = snap.data() || {};
      return res.json({ ok: true, profile: {
        displayName: u.name || "",
        username: u.username || "",
        bio: u.bio || "",
        entrance: u.entranceStyle || "Comet Trail",
        location: u.location || "",
        timezone: u.timezone || "",
        gender: u.gender || "Prefer not to say",
        pronoun: u.pronouns || "Prefer not to say",
        theme: u.theme || "dark",
        isPrivate: !!u.isPrivate,
        emailVerified: !!u.isActive,
        avatarUrl: u.avatar || "/placeholder.svg",
        linkedStars: Number(u.linkedStars || 0),
        starlit: Number(u.starlit || 0),
      }});
    } catch (e) {
      return res.status(500).json({ error: "Failed to save profile" });
    }
  }

  if (dbEnabled && isDbReady()) {
    try {
      const taken = await prisma.user.findFirst({ where: { username: uname } });
      if (taken && String(taken.id) !== String(auth.sub)) {
        return res.status(409).json({ error: "Username already taken" });
      }
      const updated = await prisma.user.upsert({
        where: { id: String(auth.sub) },
        update: {
          name: data.displayName,
          username: uname,
          bio: data.bio,
          entranceStyle: data.entrance,
          location: data.location,
          timezone: data.timezone,
          gender: data.gender,
          pronouns: data.pronoun,
          theme: data.theme,
          isPrivate: data.isPrivate,
          isActive: typeof data.emailVerified === 'boolean' ? data.emailVerified : undefined,
          avatar: data.avatarDataUrl || undefined,
          dob: data.dob || undefined,
          accountType: data.accountType || undefined,
        },
        create: {
          id: String(auth.sub),
          name: data.displayName,
          username: uname,
          bio: data.bio,
          entranceStyle: data.entrance,
          location: data.location,
          timezone: data.timezone,
          gender: data.gender,
          pronouns: data.pronoun,
          theme: data.theme,
          isPrivate: data.isPrivate,
          isActive: typeof data.emailVerified === 'boolean' ? data.emailVerified : false,
          avatar: data.avatarDataUrl || "/placeholder.svg",
          dob: data.dob || undefined,
          accountType: data.accountType || undefined,
        }
      });
      return res.json({ ok: true, profile: {
        displayName: updated.name || "",
        username: updated.username || "",
        bio: updated.bio || "",
        entrance: updated.entranceStyle || "Comet Trail",
        location: updated.location || "",
        timezone: updated.timezone || "",
        gender: updated.gender || "Prefer not to say",
        pronoun: updated.pronouns || "Prefer not to say",
        theme: updated.theme || "dark",
        isPrivate: !!updated.isPrivate,
        emailVerified: !!updated.isActive,
        avatarUrl: updated.avatar || "/placeholder.svg",
        linkedStars: Number(updated.linkedStars || 0),
        starlit: Number(updated.starlit || 0),
      } });
    } catch (e) {
      return res.status(500).json({ error: "Failed to save profile" });
    }
  }

  return res.status(503).json({ error: "Database not connected" });
});

// Helper to find user by id or username
async function resolveUser(userParam: string): Promise<{ userId: string; username: string; avatar?: string } | null> {
  const id = String(userParam || "");
  if (dbEnabled && isDbReady()) {
    try {
      let u = await prisma.user.findUnique({ where: { id } });
      if (!u) {
        u = await prisma.user.findFirst({ where: { username: id.toLowerCase() } });
      }
      if (u) return { userId: String(u.id), username: u.username || id.toLowerCase(), avatar: u.avatar || undefined };
    } catch {}
  }
  // File fallback
  const users = await readUsers();
  const byId = users.find((x) => String(x.id) === id);
  if (byId) return { userId: String(byId.id), username: (byId.username||"").toLowerCase(), avatar: byId.avatar };
  const byUsername = users.find((x) => String(x.username||"").toLowerCase() === id.toLowerCase());
  if (byUsername) return { userId: String(byUsername.id), username: (byUsername.username||"").toLowerCase(), avatar: byUsername.avatar };
  // default
  return { userId: id, username: id.toLowerCase() };
}

function newId(prefix: string) { return prefix + Math.random().toString(36).slice(2); }

// GET /api/profile/:userId — full profile
profileRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.json({ profile: null });

  if (firebaseEnabled) {
    try {
      let userDoc = await firestore.collection("users").doc(String(resolved.userId)).get();
      if (!userDoc.exists) {
        const q = await firestore.collection("users").where("username","==", resolved.username).limit(1).get();
        if (!q.empty) userDoc = q.docs[0];
      }
      const u = userDoc.exists ? userDoc.data() : null;
      let doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      if (!doc) {
        return res.json({ profile: {
          userId: resolved.userId,
          username: resolved.username,
          handle: resolved.username,
          title: "",
          bio: u?.bio || "",
          profilePic: (u?.avatar || "/placeholder.svg"),
          linkedStars: Number(u?.linkedStars || 0),
          starlit: Number(u?.starlit || 0),
          posts: [], highlights: [], achievements: [], connections: []
        }});
      }
      return res.json({ profile: { userId: doc.userId, username: doc.username, handle: doc.handle, title: doc.title, bio: doc.bio || u?.bio || "", profilePic: (u?.avatar || doc.profilePic || "/placeholder.svg"), linkedStars: Number((u?.linkedStars ?? doc.linkedStars) ?? 0), starlit: Number((u?.starlit ?? doc.starlit) ?? 0), posts: (doc as any).postsJson || [], highlights: (doc as any).highlightsJson || [], achievements: (doc as any).achievementsJson || [], connections: (doc as any).connectionsJson || [] } });
    } catch {}
  }

  if (dbEnabled && isDbReady()) {
    try {
      const u = await prisma.user.findUnique({ where: { id: resolved.userId } });
      let doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      if (!doc) {
        return res.json({ profile: {
          userId: resolved.userId,
          username: resolved.username,
          handle: resolved.username,
          title: "",
          bio: u?.bio || "",
          profilePic: (u?.avatar || "/placeholder.svg"),
          linkedStars: Number(u?.linkedStars || 0),
          starlit: Number(u?.starlit || 0),
          posts: [], highlights: [], achievements: [], connections: []
        }});
      }
      return res.json({ profile: { userId: doc.userId, username: doc.username, handle: doc.handle, title: doc.title, bio: doc.bio || u?.bio || "", profilePic: (u?.avatar || doc.profilePic || "/placeholder.svg"), linkedStars: Number((u?.linkedStars ?? doc.linkedStars) ?? 0), starlit: Number((u?.starlit ?? doc.starlit) ?? 0), posts: (doc as any).postsJson || [], highlights: (doc as any).highlightsJson || [], achievements: (doc as any).achievementsJson || [], connections: (doc as any).connectionsJson || [] } });
    } catch {}
  }
  // file fallback
  const arr = await readProfiles();
  let doc = arr.find((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  if (!doc) doc = { userId: resolved.userId, username: resolved.username, handle: resolved.username, title: "", bio: "", profilePic: "/placeholder.svg", linkedStars: 0, starlit: 0, posts: [], highlights: [], achievements: [], connections: [] };
  return res.json({ profile: doc });
});

// PUT /api/profile/:userId — update profile info
profileRouter.put("/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.status(404).json({ error: "Not found" });

  if (dbEnabled && isDbReady()) {
    try {
      const allowed = ["username","handle","title","bio","profilePic","linkedStars","starlit"] as const;
      const update: any = { userId: resolved.userId, username: resolved.username };
      for (const k of allowed) if ((req.body as any)[k] !== undefined) update[k] = (req.body as any)[k];
      const doc = await prisma.profile.upsert({ where: { userId: resolved.userId }, update, create: update });
      return res.json({ profile: { userId: doc.userId, username: doc.username, handle: doc.handle, title: doc.title, bio: doc.bio, profilePic: doc.profilePic, linkedStars: doc.linkedStars, starlit: doc.starlit, posts: (doc as any).postsJson || [], highlights: (doc as any).highlightsJson || [], achievements: (doc as any).achievementsJson || [], connections: (doc as any).connectionsJson || [] } });
    } catch (e) {
      console.warn("[profile.put] DB error, falling back to file store");
    }
  }
  const arr = await readProfiles();
  let idx = arr.findIndex((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  if (idx === -1) { arr.push({ userId: resolved.userId, username: resolved.username, handle: resolved.username, title: "Dragon Rider", bio: "", profilePic: resolved.avatar || "", linkedStars: 0, starlit: 0, posts: [], highlights: [], achievements: [], connections: [] }); idx = arr.length - 1; }
  const allowed = ["username","handle","title","bio","profilePic","linkedStars","starlit"] as const;
  for (const k of allowed) if (k in req.body) (arr[idx] as any)[k] = req.body[k];
  await writeProfiles(arr);
  return res.json({ profile: arr[idx] });
});

// GET posts
profileRouter.get("/:userId/posts", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.json({ posts: [] });
  if (firebaseEnabled) {
    try {
      const snap = await firestore.collection("profiles").doc(String(resolved.userId)).get();
      return res.json({ posts: (snap.exists ? (snap.data()?.posts || []) : []) });
    } catch {}
  }
  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      return res.json({ posts: (doc as any)?.postsJson || [] });
    } catch {}
  }
  const arr = await readProfiles();
  const doc = arr.find((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  return res.json({ posts: doc?.posts || [] });
});

// POST new post
profileRouter.post("/:userId/posts", requireAuth, async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.status(404).json({ error: "Not found" });
  const post = {
    postId: newId("p_"),
    contentType: req.body?.contentType || "text",
    contentUrl: req.body?.contentUrl || "",
    caption: req.body?.caption || "",
    likes: Number(req.body?.likes || 0),
    comments: [],
    createdAt: new Date(),
  };
  if (firebaseEnabled) {
    try {
      const ref = firestore.collection("profiles").doc(String(resolved.userId));
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({ userId: resolved.userId, username: resolved.username, posts: [post], highlights: [], achievements: [], connections: [], createdAt: new Date(), updatedAt: new Date() }, { merge: true });
        const newSnap = await ref.get();
        return res.json({ post, posts: (newSnap.data()?.posts || []) });
      }
      const data = snap.data() || {};
      const posts = Array.isArray(data.posts) ? [...data.posts, post] : [post];
      await ref.set({ posts, updatedAt: new Date() }, { merge: true });
      const newSnap = await ref.get();
      return res.json({ post, posts: (newSnap.data()?.posts || []) });
    } catch {}
  }
  if (dbEnabled && isDbReady()) {
    try {
      const existing = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      const arr = Array.isArray((existing as any)?.postsJson) ? (existing as any).postsJson : [];
      const next = [...arr, { ...post, createdAt: new Date().toISOString() }];
      const doc = await prisma.profile.upsert({ where: { userId: resolved.userId }, update: { postsJson: next, username: resolved.username }, create: { userId: resolved.userId, username: resolved.username, postsJson: next } });
      return res.json({ post, posts: (doc as any).postsJson || [] });
    } catch {}
  }
  const arr = await readProfiles();
  let idx = arr.findIndex((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  if (idx === -1) { arr.push({ userId: resolved.userId, username: resolved.username, handle: resolved.username, title: "", bio: "", profilePic: "", linkedStars: 0, starlit: 0, posts: [], highlights: [], achievements: [], connections: [] }); idx = arr.length - 1; }
  arr[idx].posts.push({ ...post, createdAt: new Date().toISOString() });
  await writeProfiles(arr);
  return res.json({ post, posts: arr[idx].posts });
});

// Highlights
profileRouter.get("/:userId/highlights", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.json({ highlights: [] });
  if (firebaseEnabled) {
    try {
      const snap = await firestore.collection("profiles").doc(String(resolved.userId)).get();
      return res.json({ highlights: (snap.exists ? (snap.data()?.highlights || []) : []) });
    } catch {}
  }
  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      return res.json({ highlights: (doc as any)?.highlightsJson || [] });
    } catch {}
  }
  const arr = await readProfiles();
  const doc = arr.find((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  return res.json({ highlights: doc?.highlights || [] });
});

// Achievements
profileRouter.get("/:userId/achievements", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.json({ achievements: [] });
  if (firebaseEnabled) {
    try {
      const snap = await firestore.collection("profiles").doc(String(resolved.userId)).get();
      return res.json({ achievements: (snap.exists ? (snap.data()?.achievements || []) : []) });
    } catch {}
  }
  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      return res.json({ achievements: (doc as any)?.achievementsJson || [] });
    } catch {}
  }
  const arr = await readProfiles();
  const doc = arr.find((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  return res.json({ achievements: doc?.achievements || [] });
});

// Connections
profileRouter.get("/:userId/connections", async (req, res) => {
  const { userId } = req.params as { userId: string };
  const resolved = await resolveUser(userId);
  if (!resolved) return res.json({ connections: [] });
  if (firebaseEnabled) {
    try {
      const snap = await firestore.collection("profiles").doc(String(resolved.userId)).get();
      return res.json({ connections: (snap.exists ? (snap.data()?.connections || []) : []) });
    } catch {}
  }
  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.profile.findUnique({ where: { userId: resolved.userId } });
      return res.json({ connections: (doc as any)?.connectionsJson || [] });
    } catch {}
  }
  const arr = await readProfiles();
  const doc = arr.find((x) => String(x.userId) === String(resolved.userId) || String(x.username||"").toLowerCase() === resolved.username);
  return res.json({ connections: doc?.connections || [] });
});
