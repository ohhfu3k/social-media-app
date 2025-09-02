import { Router, RequestHandler } from "express";
import { prisma, dbEnabled, isDbReady } from "../config/db";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const messagesFile = path.join(dataDir, "messages.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(messagesFile); } catch { await fs.writeFile(messagesFile, "[]", "utf-8"); }
  } catch {}
  next();
};

const readMessages = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(messagesFile, "utf-8")); } catch { return []; } };
const writeMessages = async (arr: any[]) => fs.writeFile(messagesFile, JSON.stringify(arr, null, 2), "utf-8");

function toTimeString(d: Date | string | number) {
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const messagesRouter = Router();
messagesRouter.use(ensureData);

// GET /api/messages/conversations
messagesRouter.get("/conversations", async (_req, res) => {
  if (dbEnabled && isDbReady()) {
    try {
      const latest = await prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
      const seen = new Set<string>();
      const convos = [] as any[];
      for (const m of latest) {
        if (seen.has(m.convoId)) continue;
        seen.add(m.convoId);
        const parts = Array.isArray(m.participants) ? m.participants : [];
        convos.push({
          id: m.convoId,
          name: parts[0] || `User ${convos.length + 1}`,
          participants: parts,
          avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(parts[0] || m.convoId)}`,
          online: Math.random() > 0.5,
        });
        if (convos.length >= 50) break;
      }
      return res.json({ conversations: convos });
    } catch {}
  }
  // file fallback
  const all = await readMessages();
  const map = new Map<string, any>();
  for (const m of all.sort((a, b) => b.createdAt - a.createdAt)) {
    if (!map.has(m.convoId)) map.set(m.convoId, m);
  }
  const convos = Array.from(map.values()).slice(0, 50).map((m, i) => ({
    id: m.convoId,
    name: (m.participants?.[0]) || `User ${i + 1}`,
    participants: m.participants || [],
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent((m.participants?.[0]) || m.convoId)}`,
    online: Math.random() > 0.5,
  }));
  return res.json({ conversations: convos });
});

// GET /api/messages/:convoId
messagesRouter.get("/:convoId", async (req, res) => {
  const { convoId } = req.params as { convoId: string };
  if (dbEnabled && isDbReady()) {
    try {
      const docs = await prisma.message.findMany({ where: { convoId }, orderBy: { createdAt: "asc" } });
      const items = docs.map((d) => ({ id: String(d.id), author: d.authorId, text: d.text, time: toTimeString(d.createdAt) }));
      return res.json({ messages: items });
    } catch {}
  }
  const all = await readMessages();
  const items = all.filter((x) => x.convoId === convoId).sort((a, b) => a.createdAt - b.createdAt).map((d) => ({ id: d.id, author: d.authorId, text: d.text, time: toTimeString(d.createdAt) }));
  return res.json({ messages: items });
});

// POST /api/messages/:convoId
messagesRouter.post("/:convoId", async (req, res) => {
  const { convoId } = req.params as { convoId: string };
  const text = String(req.body?.text || "").slice(0, 2000);
  if (!text) return res.status(400).json({ error: "Missing text" });
  const authorId = (req as any).auth?.sub || "You";
  const participants = [authorId, String(req.body?.to || "Nova")];

  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.message.create({ data: { convoId, participants, authorId, text } });
      return res.status(201).json({ message: { id: String(doc.id), author: authorId, text, time: toTimeString(doc.createdAt) } });
    } catch {}
  }
  const all = await readMessages();
  const item = { id: Math.random().toString(36).slice(2), convoId, participants, authorId, text, createdAt: Date.now() };
  all.push(item);
  await writeMessages(all);
  return res.status(201).json({ message: { id: item.id, author: authorId, text, time: toTimeString(item.createdAt) } });
});
