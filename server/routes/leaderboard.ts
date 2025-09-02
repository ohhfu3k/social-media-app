import { Router, RequestHandler } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma, dbEnabled, isDbReady } from "../config/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(usersFile); } catch { await fs.writeFile(usersFile, "[]", "utf-8"); } } catch {}
  next();
};

const readUsers = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(usersFile, "utf-8")); } catch { return []; } };

export const leaderboardRouter = Router();
leaderboardRouter.use(ensureData);

// GET /api/leaderboard?by=starlit|linkedStars
leaderboardRouter.get("/", async (req, res) => {
  const by = String(req.query.by || "starlit");

  if (dbEnabled && isDbReady()) {
    try {
      const docs = await prisma.user.findMany({ orderBy: { [by]: "desc" as any }, take: 100 });
      const items = docs.map((u: any) => ({ id: String(u.id), name: u.name || "User", username: u.username || "", avatar: u.avatar || "/placeholder.svg", starlit: Number(u.starlit||0), linkedStars: Number(u.linkedStars||0) }));
      return res.json({ leaderboard: items });
    } catch {}
  }

  const users = await readUsers();
  const items = users
    .map((u) => ({ id: u.id, name: u.name || "User", username: u.username || (u.email?u.email.split("@")[0]:""), avatar: u.avatar || "/placeholder.svg", starlit: Number(u.starlit||0), linkedStars: Number(u.linkedStars||0) }))
    .sort((a,b)=> (by==="linkedStars"?b.linkedStars-a.linkedStars:b.starlit-a.starlit))
    .slice(0, 100);
  return res.json({ leaderboard: items });
});
