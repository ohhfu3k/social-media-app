import crypto from "crypto";

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

const getSecret = () => (process.env.JWT_SECRET || "dev_secret_change_me");

export function signToken(payload: Record<string, unknown>, opts?: { expiresInSec?: number }) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (opts?.expiresInSec ?? 60 * 60 * 24 * 7);
  const pl = { ...payload, iat: now, exp } as Record<string, unknown>;
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(pl));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const encSig = base64url(sig);
  return `${data}.${encSig}`;
}

export function verifyToken(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    const [encHeader, encPayload, encSig] = parts;
    const data = `${encHeader}.${encPayload}`;
    const expected = base64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
    if (!crypto.timingSafeEqual(Buffer.from(encSig), Buffer.from(expected))) return { valid: false };
    const payload = JSON.parse(Buffer.from(encPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return { valid: false };
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${base64url(salt)}.${base64url(hash)}`;
}

export function verifyPassword(password: string, stored: string) {
  const [saltB64, hashB64] = stored.split(".");
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const hash = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hashB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (hash.length !== expected.length) return false;
  return crypto.timingSafeEqual(hash, expected);
}

// bcrypt helpers
import bcrypt from "bcryptjs";
export function hashPasswordBcrypt(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}
export function verifyPasswordAny(password: string, stored: string) {
  if (!stored) return false;
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    try { return bcrypt.compareSync(password, stored); } catch { return false; }
  }
  return verifyPassword(password, stored);
}
