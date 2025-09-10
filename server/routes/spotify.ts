import { Router, type RequestHandler } from "express";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const spotifyRouter = Router();

const dataDir = path.resolve(process.cwd(), "server/data");
const tokensFile = path.join(dataDir, "spotify_tokens.json");
async function ensureData() { try { await fs.mkdir(dataDir, { recursive: true }); try { await fs.access(tokensFile); } catch { await fs.writeFile(tokensFile, "{}", "utf-8"); } } catch {} }

function b64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sha256(verifier: string) { return b64url(crypto.createHash("sha256").update(verifier).digest()); }

function getClient() {
  const client_id = process.env.SPOTIFY_CLIENT_ID || "";
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI || "";
  if (!client_id || !redirect_uri) throw new Error("Spotify client not configured");
  return { client_id, redirect_uri } as const;
}

async function readTokens(): Promise<Record<string, any>> { try { return JSON.parse(await fs.readFile(tokensFile, "utf-8")); } catch { return {}; } }
async function writeTokens(obj: Record<string, any>) { await fs.writeFile(tokensFile, JSON.stringify(obj, null, 2), "utf-8"); }

function uid(req: any) { return String(req?.auth?.sub || "dev_user"); }

spotifyRouter.get("/login", (async (req, res) => {
  try {
    await ensureData();
    const { client_id, redirect_uri } = getClient();
    const state = b64url(crypto.randomBytes(16));
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = sha256(verifier);
    res.cookie?.("spotify_state", state, { httpOnly: true, sameSite: "lax", path: "/" } as any);
    res.cookie?.("spotify_verifier", verifier, { httpOnly: true, sameSite: "lax", path: "/" } as any);
    const scope = ["user-read-email","user-read-private"].join(" ");
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.set("client_id", client_id);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirect_uri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("code_challenge", challenge);
    res.redirect(authUrl.toString());
  } catch (e: any) {
    res.status(503).json({ error: e?.message || "Spotify not configured" });
  }
}) as RequestHandler);

spotifyRouter.get("/callback", (async (req, res) => {
  try {
    await ensureData();
    const { client_id, redirect_uri } = getClient();
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    const cookieState = (req as any).cookies?.spotify_state || "";
    const verifier = (req as any).cookies?.spotify_verifier || "";
    if (!code || !state || state !== cookieState || !verifier) return res.status(400).send("Invalid state");
    const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri, client_id, code_verifier: verifier });
    const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) return res.status(r.status).json(d);
    const access_token = d.access_token; const refresh_token = d.refresh_token; const expires_in = Number(d.expires_in||3600);
    const byUser = await readTokens();
    const key = uid(req);
    byUser[key] = { access_token, refresh_token, expires_at: Date.now() + expires_in*1000 - 60000 };
    await writeTokens(byUser);
    res.redirect("/");
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "spotify callback failed" });
  }
}) as RequestHandler);

async function getUserToken(req: any): Promise<string> {
  const { client_id } = getClient();
  const byUser = await readTokens();
  const key = uid(req);
  const item = byUser[key];
  if (!item) throw new Error("Not connected");
  if (Date.now() < Number(item.expires_at || 0)) return item.access_token;
  // refresh
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: item.refresh_token, client_id });
  const r = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error("refresh failed");
  item.access_token = d.access_token; item.expires_at = Date.now() + Number(d.expires_in||3600)*1000 - 60000;
  await writeTokens(byUser);
  return item.access_token;
}

const searchHandler: RequestHandler = async (req, res) => {
  try {
    await ensureData();
    const token = await getUserToken(req as any);
    const q = String(req.query.q || "");
    const limit = Math.max(1, Math.min(25, Number(req.query.limit || 25)));
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("type", "track"); url.searchParams.set("q", q||"*"); url.searchParams.set("limit", String(limit));
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e: any) {
    res.status(401).json({ error: e?.message || "not connected" });
  }
};

spotifyRouter.get("/search", searchHandler);
spotifyRouter.get("/top-tracks", (async (req, res) => {
  try {
    await ensureData();
    const token = await getUserToken(req as any);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 5)));
    const time_range = String(req.query.time_range || "long_term");
    const endpoint = `https://api.spotify.com/v1/me/top/tracks?time_range=${encodeURIComponent(time_range)}&limit=${limit}`;
    const r = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json(data);
    return res.json({ items: Array.isArray(data?.items) ? data.items : [] });
  } catch (e: any) {
    return res.status(503).json({ error: e?.message || "Spotify unavailable" });
  }
}) as RequestHandler);
