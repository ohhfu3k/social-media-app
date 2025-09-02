import { RequestHandler } from "express";
import { verifyToken } from "../utils/auth";

function readCookie(req: any, name: string) {
  const raw = String(req.headers.cookie || "");
  const parts = raw.split(/;\s*/).map((p) => p.split("=", 2)).filter((a) => a.length === 2);
  const map = Object.fromEntries(parts as any);
  return map[name];
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const h = req.headers.authorization || "";
  let token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) token = readCookie(req, "access_token") || "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  const v = verifyToken(token);
  if (!v.valid) return res.status(401).json({ error: "Invalid token" });
  (req as any).auth = v.payload;
  next();
};
