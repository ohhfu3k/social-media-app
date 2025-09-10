import { Router, RequestHandler } from "express";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword, verifyPassword, signToken, verifyToken, hashPasswordBcrypt, verifyPasswordAny } from "../utils/auth";
import { prisma, dbEnabled, isDbReady } from "../config/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

const ensureData: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(usersFile); } catch { await fs.writeFile(usersFile, "[]", "utf-8"); }
  } catch {}
  next();
};

const readUsers = async (): Promise<any[]> => {
  try {
    const raw = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeUsers = async (arr: any[]) => {
  await fs.writeFile(usersFile, JSON.stringify(arr, null, 2), "utf-8");
};

const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(6),
}).refine((v) => !!v.email || !!v.phone, { message: 'email or phone required' });

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const otpsFile = path.join(dataDir, "otps.json");
const refreshFile = path.join(dataDir, "refresh-tokens.json");

const ensureOtpStore: RequestHandler = async (_req, _res, next) => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    try { await fs.access(otpsFile); } catch { await fs.writeFile(otpsFile, "[]", "utf-8"); }
    try { await fs.access(refreshFile); } catch { await fs.writeFile(refreshFile, "[]", "utf-8"); }
  } catch {}
  next();
};

const readOtps = async (): Promise<any[]> => {
  try { return JSON.parse(await fs.readFile(otpsFile, "utf-8")); } catch { return []; }
};
const writeOtps = async (arr: any[]) => fs.writeFile(otpsFile, JSON.stringify(arr, null, 2), "utf-8");
const readRefresh = async (): Promise<any[]> => { try { return JSON.parse(await fs.readFile(refreshFile, "utf-8")); } catch { return []; } };
const writeRefresh = async (arr: any[]) => fs.writeFile(refreshFile, JSON.stringify(arr, null, 2), "utf-8");

function normalizeChannelAndId(channel: "email"|"phone", identifier: string) {
  if (channel === "email") return { channel, id: identifier.trim().toLowerCase() };
  const digits = identifier.replace(/\D/g, "");
  return { channel, id: digits };
}

const allowDevOtp = (process.env.NODE_ENV !== 'production') || process.env.EXPOSE_OTP === '1';

const authRouter = Router();

authRouter.use(ensureData, ensureOtpStore);

authRouter.post("/signup", (async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { email, phone, password } = parse.data as any;
  const channel: 'email' | 'phone' = email ? 'email' : 'phone';
  const rawId = email || phone;
  const { id } = normalizeChannelAndId(channel, rawId);

  if (dbEnabled && isDbReady()) {
    try {
      const exist = await prisma.user.findFirst({ where: channel === 'email' ? { email: id } : { phone: id } });
      if (exist) return res.status(409).json({ error: `${channel} already in use` });
      const name = channel === 'email' ? id.split('@')[0] : `User${id.slice(-4)}`;
      await prisma.user.create({ data: { name, email: channel==='email'?id:undefined, phone: channel==='phone'?id:undefined, passwordHash: hashPasswordBcrypt(password), avatar: channel==='email'?`https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`:undefined, isActive: false } });
    } catch (e) {
      console.warn('[auth] DB (Prisma) unavailable, falling back to file store');
    }
  }

  // Always ensure a record in file fallback as well for local dev
  try {
    const users = await readUsers();
    const idx = users.findIndex((u) => (channel==='email' ? (u.email||'').toLowerCase() === id : (u.phone||'').replace(/\D/g,'') === id));
    if (idx >= 0) return res.status(409).json({ error: `${channel} already in use` });
    const name = channel === 'email' ? id.split('@')[0] : `User${id.slice(-4)}`;
    users.push({ id: 'u_' + Math.random().toString(36).slice(2), name, email: channel==='email'?id:undefined, phone: channel==='phone'?id:undefined, pass: hashPasswordBcrypt(password), createdAt: Date.now(), avatar: channel==='email'?`https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`:undefined, isActive: false });
    await writeUsers(users);
  } catch {}

  // Create OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const all = await readOtps();
  const filtered = all.filter((o) => !(o.id === id && o.channel === channel));
  filtered.push({ id, channel, code, expiresAt, createdAt: Date.now(), purpose: 'signup' });
  await writeOtps(filtered);
  const masked = channel === 'email' ? rawId.replace(/(.).+(@.+)/, "$1***$2") : rawId.replace(/.(?=.{2})/g, "*");
  const devHint = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_OTP === '1' ? code : undefined;
  res.status(201).json({ ok: true, to: masked, devHint, expiresInSec: 300 });
}) as RequestHandler);

authRouter.post("/login", (async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { identifier, password } = parse.data as any;
  const isEmail = /@/.test(identifier);
  const isPhone = /^\+?\d{6,}$/.test(identifier);
  const norm = isEmail ? identifier.trim().toLowerCase() : isPhone ? identifier.replace(/\D/g, "") : String(identifier).trim().toLowerCase();

  const setCookie = (token: string) => {
    const maxAgeMs = (() => {
      const v = process.env.JWT_EXPIRES_IN || "15m";
      const m = /^([0-9]+)([smhd])$/.exec(v);
      if (!m) return 15 * 60 * 1000;
      const n = Number(m[1]);
      const unit = m[2];
      return unit === 's' ? n*1000 : unit==='m' ? n*60*1000 : unit==='h' ? n*3600*1000 : n*24*3600*1000;
    })();
    res.cookie?.("access_token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === 'production', maxAge: maxAgeMs, path: "/" } as any);
  };

  // DB path
  if (dbEnabled && isDbReady()) {
    try {
      const user = await prisma.user.findFirst({ where: isEmail ? { email: norm } : isPhone ? { phone: norm } : { username: norm } });
      if (user && user.passwordHash && verifyPasswordAny(password, user.passwordHash)) {
        if (user.isActive === false) return res.status(403).json({ error: "Account not verified" });
        const token = signToken({ sub: String(user.id), email: user.email, phone: user.phone, name: user.name });
        setCookie(token);
        const refreshToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        try { await prisma.refreshToken.create({ data: { userId: String(user.id), token: refreshToken, expiresAt } }); } catch {}
        return res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
      }
    } catch {}
  }

  // File fallback
  const users = await readUsers();
  const user = users.find((u) => (isEmail ? (u.email||'').toLowerCase() === norm : isPhone ? (u.phone||'').replace(/\D/g,'') === norm : String(u.username||'').toLowerCase() === norm));
  if (!user || !verifyPasswordAny(password, user.pass)) return res.status(401).json({ error: "Invalid credentials" });
  if (user.isActive === false) return res.status(403).json({ error: "Account not verified" });
  const token = signToken({ sub: user.id, email: user.email, phone: user.phone, name: user.name });
  setCookie(token);
  const refreshToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  try {
    const arr = await readRefresh();
    arr.push({ userId: user.id, token: refreshToken, expiresAt: Date.now() + 30*24*60*60*1000, createdAt: Date.now() });
    await writeRefresh(arr);
  } catch {}
  res.json({ token, refreshToken, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar } });
}) as RequestHandler);

const requireAuth: RequestHandler = (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Missing token" });
  const v = verifyToken(token);
  if (!v.valid) return res.status(401).json({ error: "Invalid token" });
  (req as any).auth = v.payload;
  next();
};

authRouter.get("/me", requireAuth, (req, res) => {
  const auth = (req as any).auth || {};
  res.json({ user: { id: auth.sub, name: auth.name, email: auth.email } });
});

// Request OTP (email or phone)
const requestOtpSchema = z.object({ channel: z.enum(["email","phone"]), identifier: z.string().min(3), honey: z.string().optional() });
authRouter.post("/request-otp", (async (req, res) => {
  const parse = requestOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier, honey } = parse.data as any;
  if (honey && honey.trim()) return res.status(400).json({ error: "Bot detected" });
  const { id } = normalizeChannelAndId(channel, identifier);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const all = await readOtps();
  const filtered = all.filter((o) => !(o.id === id && o.channel === channel));
  filtered.push({ id, channel, code, expiresAt, createdAt: Date.now() });
  await writeOtps(filtered);
  const masked = channel === 'email' ? identifier.replace(/(.).+(@.+)/, "$1***$2") : identifier.replace(/.(?=.{2})/g, "*");
  const devHint = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_OTP === '1' ? code : undefined;
  console.log(`[OTP:${channel}]`, id, code);
  res.json({ ok: true, to: masked, expiresInSec: 300, devHint });
}) as RequestHandler);

// Verify OTP (generic) - kept for compatibility
const verifyOtpSchema = z.object({ channel: z.enum(["email","phone"]), identifier: z.string().min(3), code: z.string().length(6) });
authRouter.post("/verify-otp", (async (req, res) => {
  const parse = verifyOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier, code } = parse.data;
  const { id } = normalizeChannelAndId(channel, identifier);
  const all = await readOtps();
  const found = all.find((o) => o.id === id && o.channel === channel);
  if (!found) return res.status(400).json({ error: "No OTP requested" });
  if (Date.now() > found.expiresAt) return res.status(400).json({ error: "OTP expired" });
  if (found.code !== code && !(allowDevOtp && code === '000000')) return res.status(400).json({ error: "Invalid code" });
  const rest = all.filter((o) => !(o.id === id && o.channel === channel));
  await writeOtps(rest);
  res.json({ ok: true });
}) as RequestHandler);

// Verify API -> activate account
authRouter.post("/verify", (async (req, res) => {
  const parse = verifyOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier, code } = parse.data;
  const { id } = normalizeChannelAndId(channel, identifier);
  const all = await readOtps();
  const found = all.find((o) => o.id === id && o.channel === channel);
  if (!found) return res.status(400).json({ error: "No OTP requested" });
  if (Date.now() > found.expiresAt) return res.status(400).json({ error: "OTP expired" });
  if (found.code !== code && !(allowDevOtp && code === '000000')) return res.status(400).json({ error: "Invalid code" });
  const rest = all.filter((o) => !(o.id === id && o.channel === channel));
  await writeOtps(rest);
  if (dbEnabled && isDbReady()) {
    try {
      await prisma.user.updateMany({ where: channel==='email'?{ email: id }:{ phone: id }, data: { isActive: true } });
    } catch {}
  }
  // file fallback
  try {
    const users = await readUsers();
    const idx = users.findIndex((u) => (channel==='email' ? (u.email||'').toLowerCase() === id : (u.phone||'').replace(/\D/g,'') === id));
    if (idx >= 0) users[idx].isActive = true;
    await writeUsers(users);
  } catch {}
  res.json({ ok: true });
}) as RequestHandler);

// Forgot Password -> generate OTP
const forgotSchema = z.object({ channel: z.enum(["email","phone"]), identifier: z.string().min(3) });
authRouter.post("/forgot", (async (req, res) => {
  const parse = forgotSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier } = parse.data;
  const { id } = normalizeChannelAndId(channel, identifier);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const all = await readOtps();
  const filtered = all.filter((o) => !(o.id === id && o.channel === channel));
  filtered.push({ id, channel, code, expiresAt, createdAt: Date.now(), purpose: 'reset' });
  await writeOtps(filtered);
  const masked = channel === 'email' ? identifier.replace(/(.).+(@.+)/, "$1***$2") : identifier.replace(/.(?=.{2})/g, "*");
  const devHint = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_OTP === '1' ? code : undefined;
  res.json({ ok: true, to: masked, devHint, expiresInSec: 300 });
}) as RequestHandler);

// Reset Password with OTP
const resetSchema = z.object({ channel: z.enum(["email","phone"]), identifier: z.string().min(3), code: z.string().length(6), password: z.string().min(6) });
authRouter.post("/reset-password", (async (req, res) => {
  const parse = resetSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier, code, password } = parse.data;
  const { id } = normalizeChannelAndId(channel, identifier);
  const all = await readOtps();
  const found = all.find((o) => o.id === id && o.channel === channel);
  if (!found) return res.status(400).json({ error: "No OTP requested" });
  if (Date.now() > found.expiresAt) return res.status(400).json({ error: "OTP expired" });
  if (found.code !== code && !(allowDevOtp && code === '000000')) return res.status(400).json({ error: "Invalid code" });
  const rest = all.filter((o) => !(o.id === id && o.channel === channel));
  await writeOtps(rest);

  if (dbEnabled && isDbReady()) {
    try {
      const query: any = channel==='email'?{ email: id }:{ phone: id };
      await prisma.user.updateMany({ where: query, data: { passwordHash: hashPasswordBcrypt(password) } });
    } catch {}
  }
  try {
    const users = await readUsers();
    const idx = users.findIndex((u) => (channel==='email' ? (u.email||'').toLowerCase() === id : (u.phone||'').replace(/\D/g,'') === id));
    if (idx >= 0) users[idx].pass = hashPasswordBcrypt(password);
    await writeUsers(users);
  } catch {}
  res.json({ ok: true });
}) as RequestHandler);

// Set password after signup verification
const setPasswordSchema = z.object({ channel: z.enum(["email","phone"]), identifier: z.string().min(3), password: z.string().min(6) });
authRouter.post("/set-password", (async (req, res) => {
  const parse = setPasswordSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { channel, identifier, password } = parse.data;
  const { id } = normalizeChannelAndId(channel, identifier);

  if (dbEnabled && isDbReady()) {
    try {
      const query: any = channel === 'email' ? { email: id } : { phone: id };
      let user = await prisma.user.findFirst({ where: query });
      const name = channel === 'email' ? id.split('@')[0] : `User${id.slice(-4)}`;
      if (!user) {
        user = await prisma.user.create({ data: { ...query, name, avatar: channel === 'email' ? `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}` : undefined } });
      }
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPasswordBcrypt(password), isActive: true } });
      return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } catch (e) {
      console.warn('[auth] DB (Prisma) unavailable, falling back to file store');
    }
  }

  try {
    const users = await readUsers();
    const idx = users.findIndex((u) => (channel === 'email' ? (u.email || '').toLowerCase() === id : (u.phone || '').replace(/\D/g,'') === id));
    const name = channel === 'email' ? id.split('@')[0] : `User${id.slice(-4)}`;
    if (idx >= 0) {
      users[idx].name = users[idx].name || name;
      users[idx].pass = hashPasswordBcrypt(password);
      users[idx].isActive = true;
      if (channel === 'email') users[idx].email = id; else users[idx].phone = id;
    } else {
      users.push({ id: 'u_' + Math.random().toString(36).slice(2), name, email: channel==='email'?id:undefined, phone: channel==='phone'?id:undefined, pass: hashPasswordBcrypt(password), createdAt: Date.now(), avatar: channel==='email' ? `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}` : undefined, isActive: true });
    }
    await writeUsers(users);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Could not persist user' });
  }
}) as RequestHandler);

// Username availability
const usernameSchema = z.object({ username: z.string().min(3).max(20).regex(/^[a-z0-9_\.]+$/i) });
authRouter.get("/check-username", (async (req, res) => {
  const q = { username: String(req.query.username || "") };
  const parse = usernameSchema.safeParse(q);
  if (!parse.success) return res.status(400).json({ error: "Invalid username" });
  const uname = parse.data.username.toLowerCase();
  // DB first
  if (dbEnabled && isDbReady()) {
    try {
      const u = await prisma.user.findFirst({ where: { username: uname } });
      if (u) return res.json({ available: false });
    } catch {}
  }
  // file fallback
  try {
    const users = await readUsers();
    const exists = users.some((u) => String(u.username || "").toLowerCase() === uname);
    return res.json({ available: !exists });
  } catch {
    return res.json({ available: true });
  }
}) as RequestHandler);

// Aliases for spec compatibility
authRouter.post("/create-account", (req, res, next) => (authRouter as any).handle({ ...req, url: "/set-password", method: "POST" }, res, next));
authRouter.post("/forgot-password", (req, res, next) => (authRouter as any).handle({ ...req, url: "/forgot", method: "POST" }, res, next));
authRouter.post("/signup", (req, res, next) => (authRouter as any).handle({ ...req, url: "/request-otp", method: "POST" }, res, next));

// Refresh endpoint
authRouter.post("/refresh", (async (req, res) => {
  const rt = String(req.body?.refreshToken || "");
  if (!rt) return res.status(400).json({ error: "Missing refreshToken" });
  const now = Date.now();
  if (dbEnabled && isDbReady()) {
    try {
      const doc = await prisma.refreshToken.findUnique({ where: { token: rt } });
      if (!doc || (doc.expiresAt && now > new Date(doc.expiresAt).getTime())) return res.status(401).json({ error: "Invalid refresh token" });
      const user = doc.userId ? await prisma.user.findUnique({ where: { id: doc.userId } }) : null;
      if (!user) return res.status(404).json({ error: "User not found" });
      const token = signToken({ sub: String(user.id), email: user.email, phone: user.phone, name: user.name });
      return res.json({ token });
    } catch {}
  }
  try {
    const arr = await readRefresh();
    const item = arr.find((x) => x.token === rt);
    if (!item || now > Number(item.expiresAt)) return res.status(401).json({ error: "Invalid refresh token" });
    const users = await readUsers();
    const u = users.find((x) => x.id === item.userId);
    if (!u) return res.status(404).json({ error: "User not found" });
    const token = signToken({ sub: u.id, email: u.email, phone: u.phone, name: u.name });
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}) as RequestHandler);

// New endpoints for Echostars spec
import { sendEmail } from "../services/email";
import crypto from "crypto";

function randomToken() { return crypto.randomBytes(24).toString("hex"); }

const registerSchema = z.object({ email: z.string().email(), username: z.string().min(3).max(20).regex(/^[a-z0-9_\.]+$/i), name: z.string().min(1).max(60).optional(), password: z.string().min(6) });

authRouter.post("/register", (async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { email, username, name, password } = parse.data;
  if (dbEnabled && isDbReady()) {
    try {
      const exist = await prisma.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] } });
      if (exist) return res.status(409).json({ error: "Email or username already in use" });
      const user = await prisma.user.create({ data: { email: email.toLowerCase(), username: username.toLowerCase(), name: name || username, passwordHash: hashPasswordBcrypt(password), isActive: false, emailVerified: false, avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}` } });
      const token = randomToken();
      try { await prisma.otp.create({ data: { channel: 'email', identifier: email.toLowerCase(), code: token, expiresAt: new Date(Date.now() + 24*3600*1000), purpose: 'signup' } as any }); } catch {}
      const verifyUrl = `${process.env.APP_URL || ''}/api/auth/verify?token=${encodeURIComponent(token)}`;
      await sendEmail(email, "Verify your Echostars account", `<p>Hi ${user.name || username},</p><p>Please verify your account by clicking <a href="${verifyUrl}">this link</a>.</p>`);
      return res.status(201).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to register" });
    }
  }
  return res.status(503).json({ error: "Database not connected" });
}) as RequestHandler);

// Email verification
authRouter.get("/verify", (async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) return res.status(400).json({ error: "Missing token" });
  if (dbEnabled && isDbReady()) {
    try {
      const rec = await prisma.otp.findFirst({ where: { code: token, purpose: 'signup' as any } });
      if (!rec) return res.status(400).json({ error: "Invalid token" });
      await prisma.user.updateMany({ where: { email: rec.identifier }, data: { isActive: true, emailVerified: true } });
      await prisma.otp.delete({ where: { id: rec.id } });
      return res.json({ ok: true });
    } catch {}
  }
  return res.status(500).json({ error: "Server error" });
}) as RequestHandler);

// Logout clears cookie
authRouter.post("/logout", ((req, res) => {
  res.cookie?.("access_token", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV==='production', maxAge: 0, path: "/" } as any);
  return res.json({ ok: true });
}) as RequestHandler);

// Forgot password (email)
const forgotEmailSchema = z.object({ email: z.string().email() });
authRouter.post("/forgot", (async (req, res) => {
  const parse = forgotEmailSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { email } = parse.data;
  if (dbEnabled && isDbReady()) {
    try {
      const user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
      if (!user) return res.json({ ok: true });
      const token = randomToken();
      await prisma.otp.create({ data: { channel: 'email', identifier: email.toLowerCase(), code: token, expiresAt: new Date(Date.now() + 2*3600*1000), purpose: 'reset' } as any });
      const resetUrl = `${process.env.APP_URL || ''}/reset?token=${encodeURIComponent(token)}`;
      await sendEmail(email, "Reset your Echostars password", `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`);
      return res.json({ ok: true });
    } catch {}
  }
  return res.status(500).json({ error: "Server error" });
}) as RequestHandler);

const resetByTokenSchema = z.object({ token: z.string().min(10), password: z.string().min(6) });
authRouter.post("/reset", (async (req, res) => {
  const parse = resetByTokenSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { token, password } = parse.data;
  if (dbEnabled && isDbReady()) {
    try {
      const rec = await prisma.otp.findFirst({ where: { code: token, purpose: 'reset' as any } });
      if (!rec || new Date(rec.expiresAt).getTime() < Date.now()) return res.status(400).json({ error: "Invalid token" });
      await prisma.user.updateMany({ where: { email: rec.identifier }, data: { passwordHash: hashPasswordBcrypt(password) } });
      await prisma.otp.delete({ where: { id: rec.id } });
      return res.json({ ok: true });
    } catch {}
  }
  return res.status(500).json({ error: "Server error" });
}) as RequestHandler);

// OAuth start (PKCE) — Google supported if env set
import crypto from "crypto";
function b64url(input: Buffer) { return input.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
authRouter.get("/oauth/:provider", (async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  if (provider !== 'google') return res.status(501).json({ error: 'Provider not supported yet' });
  const cid = process.env.GOOGLE_CLIENT_ID || '';
  const redirect = process.env.GOOGLE_REDIRECT_URI || '';
  if (!cid || !redirect) return res.status(503).json({ error: 'OAuth not configured' });
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', cid);
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  res.cookie?.('pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV==='production', maxAge: 10*60*1000, path: '/' } as any);
  res.cookie?.('oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV==='production', maxAge: 10*60*1000, path: '/' } as any);
  return res.json({ url: url.toString() });
}) as RequestHandler);

export { authRouter };
