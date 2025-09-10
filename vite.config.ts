import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { promises as fs } from "fs";
import fspath from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), devApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function devApiPlugin() {
  const dataDir = fspath.resolve(__dirname, "server/data");
  const profilesFile = fspath.join(dataDir, "profiles.json");
  const storiesEntriesFile = fspath.join(dataDir, "stories_v1_entries.json");
  const storiesViewsFile = fspath.join(dataDir, "stories_v1_views.json");
  const storiesReactionsFile = fspath.join(dataDir, "stories_v1_reactions.json");
  const otpsFile = fspath.join(dataDir, "otps.json");
  return {
    name: "dev-api",
    apply: "serve" as const,
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        // Dev handlers for Stories V1
        if (req.url.startsWith("/api/v1/stories/")) {
          try { await fs.mkdir(dataDir, { recursive: true }); } catch {}
        }
        // GET /api/v1/stories/viewer-feed
        if (req.method === "GET" && req.url.startsWith("/api/v1/stories/viewer-feed")) {
          try {
            try { await fs.access(storiesEntriesFile); } catch { await fs.writeFile(storiesEntriesFile, "[]", "utf-8"); }
            const u = new URL(req.url, "http://localhost");
            const anonymous = u.searchParams.get("anonymous") === "1";
            const raw = await fs.readFile(storiesEntriesFile, "utf-8");
            const entries = JSON.parse(raw || "[]");
            const now = Date.now();
            const valid = entries.filter((e: any) => now < Number(e.expiresAt || (e.createdAt + 24*3600_000)));
            const byUser = new Map<string, any[]>();
            for (const e of valid) {
              const uid = e.userId || "dev_user";
              if (!byUser.has(uid)) byUser.set(uid, []);
              byUser.get(uid)!.push(e);
            }
            const users: any[] = [];
            for (const [userId, list] of byUser.entries()) {
              const segments = list.flatMap((e: any) => (e.items||[]).map((it: any, idx: number) => ({
                id: `${e.id}-${idx}`,
                type: it.type,
                src: it.src,
                createdAt: e.createdAt,
                lifespanMs: Number(e.expiresAt ? e.expiresAt - e.createdAt : 24*3600_000),
                meta: { authorName: anonymous ? undefined : (e.meta?.authorName || "User"), authorAvatar: anonymous ? undefined : (e.meta?.authorAvatar || "/placeholder.svg") },
              })));
              users.push({ id: userId, name: anonymous ? undefined : (segments[0]?.meta?.authorName || "User"), avatar: anonymous ? undefined : (segments[0]?.meta?.authorAvatar || "/placeholder.svg"), kind: anonymous ? "anonymous" : "cosmic", segments });
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ users }));
            return;
          } catch { /* fallthrough */ }
        }
        // POST /api/v1/stories/compose
        if (req.method === "POST" && req.url.startsWith("/api/v1/stories/compose")) {
          try {
            try { await fs.access(storiesEntriesFile); } catch { await fs.writeFile(storiesEntriesFile, "[]", "utf-8"); }
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const items = Array.isArray(body.items) ? body.items : [];
                if (!items.length) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ error: "items required" }));
                  return;
                }
                const meta = body.meta || {};
                const createdAt = Date.now();
                const expiresIn = Math.max(1, Number(body.expires_in_seconds || 24*3600));
                const entry = { id: "st_" + Math.random().toString(36).slice(2), userId: "dev_user", items, meta, createdAt, expiresAt: createdAt + expiresIn*1000 };
                const raw = await fs.readFile(storiesEntriesFile, "utf-8");
                const arr = JSON.parse(raw || "[]");
                arr.unshift(entry);
                await fs.writeFile(storiesEntriesFile, JSON.stringify(arr, null, 2), "utf-8");
                res.statusCode = 201;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, entry }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }
        // POST /api/v1/stories/:id/view
        if (req.method === "POST" && req.url.startsWith("/api/v1/stories/") && req.url.endsWith("/view")) {
          try {
            try { await fs.access(storiesViewsFile); } catch { await fs.writeFile(storiesViewsFile, "[]", "utf-8"); }
            const id = req.url.split("/api/v1/stories/")[1].replace(/\/?view$/, "");
            const viewerId = (req.socket?.remoteAddress || "anon");
            const raw = await fs.readFile(storiesViewsFile, "utf-8");
            const arr = JSON.parse(raw || "[]");
            const key = `${id}:${viewerId}`;
            if (!arr.find((v: any)=> v.key === key)) { arr.push({ key, story_item_id: id, viewerId, viewed_at: Date.now() }); await fs.writeFile(storiesViewsFile, JSON.stringify(arr, null, 2), "utf-8"); }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          } catch { /* fallthrough */ }
        }
        // POST /api/v1/stories/:id/react
        if (req.method === "POST" && req.url.startsWith("/api/v1/stories/") && req.url.endsWith("/react")) {
          try {
            try { await fs.access(storiesReactionsFile); } catch { await fs.writeFile(storiesReactionsFile, "[]", "utf-8"); }
            const id = req.url.split("/api/v1/stories/")[1].replace(/\/?react$/, "");
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const emoji = String(body.emoji || "").slice(0, 8);
                if (!emoji) { res.statusCode = 400; res.end(JSON.stringify({ error: "emoji required" })); return; }
                const raw = await fs.readFile(storiesReactionsFile, "utf-8");
                const arr = JSON.parse(raw || "[]");
                arr.push({ story_item_id: id, reactorId: (req.socket?.remoteAddress || "anon"), emoji, reacted_at: Date.now() });
                await fs.writeFile(storiesReactionsFile, JSON.stringify(arr, null, 2), "utf-8");
                res.statusCode = 201;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }
        // Dev OTP: POST /api/auth/request-otp
        if (req.method === "POST" && req.url.startsWith("/api/auth/request-otp")) {
          try {
            await fs.mkdir(dataDir, { recursive: true });
            try { await fs.access(otpsFile); } catch { await fs.writeFile(otpsFile, "[]", "utf-8"); }
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const channel = body.channel === 'phone' ? 'phone' : 'email';
                const identifier = String(body.identifier || "");
                const id = channel === 'email' ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");
                if (!id) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "Invalid input" })); return; }
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = Date.now() + 5 * 60 * 1000;
                const raw = await fs.readFile(otpsFile, "utf-8");
                const all = JSON.parse(raw || "[]");
                const filtered = all.filter((o: any) => !(o.id === id && o.channel === channel));
                filtered.push({ id, channel, code, expiresAt, createdAt: Date.now() });
                await fs.writeFile(otpsFile, JSON.stringify(filtered, null, 2), "utf-8");
                const masked = channel === 'email' ? identifier.replace(/(.).+(@.+)/, "$1***$2") : identifier.replace(/.(?=.{2})/g, "*");
                res.statusCode = 200;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ ok: true, to: masked, expiresInSec: 300, devHint: code }));
              } catch {
                res.statusCode = 400;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }
        // Dev OTP: POST /api/auth/verify-otp and /api/auth/verify
        if (req.method === "POST" && (req.url.startsWith("/api/auth/verify-otp") || req.url.startsWith("/api/auth/verify"))) {
          try {
            await fs.mkdir(dataDir, { recursive: true });
            try { await fs.access(otpsFile); } catch { await fs.writeFile(otpsFile, "[]", "utf-8"); }
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const channel = body.channel === 'phone' ? 'phone' : 'email';
                const identifier = String(body.identifier || "");
                const code = String(body.code || "");
                const id = channel === 'email' ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");
                const raw = await fs.readFile(otpsFile, "utf-8");
                const all = JSON.parse(raw || "[]");
                const found = all.find((o: any) => o.id === id && o.channel === channel);
                if (!found) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "No OTP requested" })); return; }
                if (Date.now() > Number(found.expiresAt)) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "OTP expired" })); return; }
                if (!(found.code === code || code === '000000')) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "Invalid code" })); return; }
                const rest = all.filter((o: any) => !(o.id === id && o.channel === channel));
                await fs.writeFile(otpsFile, JSON.stringify(rest, null, 2), "utf-8");
                res.statusCode = 200;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 400;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }

        // Dev auth: POST /api/auth/set-password
        if (req.method === "POST" && req.url.startsWith("/api/auth/set-password")) {
          try {
            await fs.mkdir(dataDir, { recursive: true });
            const usersFile = fspath.join(dataDir, "users.json");
            try { await fs.access(usersFile); } catch { await fs.writeFile(usersFile, "[]", "utf-8"); }
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const channel = body.channel === 'phone' ? 'phone' : 'email';
                const identifier = String(body.identifier || "");
                const password = String(body.password || "");
                if (!identifier || password.length < 6) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "Invalid input" })); return; }
                const id = channel === 'email' ? identifier.trim().toLowerCase() : identifier.replace(/\D/g, "");
                const raw = await fs.readFile(usersFile, "utf-8");
                const users = JSON.parse(raw || "[]");
                const idx = users.findIndex((u: any) => (channel==='email' ? (u.email||'').toLowerCase() === id : (u.phone||'').replace(/\D/g,'') === id));
                const name = channel === 'email' ? id.split('@')[0] : `User${id.slice(-4)}`;
                if (idx >= 0) {
                  users[idx].name = users[idx].name || name;
                  users[idx].pass = password;
                  users[idx].isActive = true;
                  if (channel === 'email') users[idx].email = id; else users[idx].phone = id;
                } else {
                  users.push({ id: 'u_' + Math.random().toString(36).slice(2), name, email: channel==='email'?id:undefined, phone: channel==='phone'?id:undefined, pass: password, createdAt: Date.now(), avatar: channel==='email' ? `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}` : undefined, isActive: true });
                }
                await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
                res.statusCode = 200;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 400;
                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }

        // Dev auth: POST /api/auth/login
        if (req.method === "POST" && req.url.startsWith("/api/auth/login")) {
          const chunks: any[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
              const identifier = String(body.identifier || "");
              const password = String(body.password || "");
              if (!identifier || !password) { res.statusCode = 400; res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({ error: "Invalid input" })); return; }
              const email = /@/.test(identifier) ? identifier.toLowerCase() : undefined;
              const token = "devtoken_" + Math.random().toString(36).slice(2);
              const refreshToken = "devrefresh_" + Math.random().toString(36).slice(2);
              res.statusCode = 200;
              res.setHeader("Content-Type","application/json");
              res.end(JSON.stringify({ token, refreshToken, user: { id: "dev_user", name: email?email.split("@")[0]:identifier, email } }));
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type","application/json");
              res.end(JSON.stringify({ error: "invalid json" }));
            }
          });
          return;
        }
        // Dev auth: POST /api/auth/logout
        if (req.method === "POST" && req.url.startsWith("/api/auth/logout")) {
          res.statusCode = 200;
          res.setHeader("Content-Type","application/json");
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        if (req.method === "GET" && req.url.startsWith("/api/profile/me")) {
          try {
            await fs.mkdir(dataDir, { recursive: true });
            try { await fs.access(profilesFile); } catch { await fs.writeFile(profilesFile, "[]", "utf-8"); }
            const raw = await fs.readFile(profilesFile, "utf-8");
            const arr = JSON.parse(raw || "[]");
            const me = arr[0] || null;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ profile: me ? {
              displayName: me.title || "",
              username: me.username || "",
              bio: me.bio || "",
              entrance: "Comet Trail",
              location: "",
              timezone: "",
              gender: "Prefer not to say",
              pronoun: me.pronoun || "Prefer not to say",
              theme: "dark",
              isPrivate: false,
              emailVerified: true,
              avatarUrl: me.profilePic || "/placeholder.svg",
              linkedStars: 0,
              starlit: 0,
            } : null }));
            return;
          } catch { /* fallthrough */ }
        }
        if (req.method === "POST" && req.url.startsWith("/api/profile/save")) {
          try {
            await fs.mkdir(dataDir, { recursive: true });
            try { await fs.access(profilesFile); } catch { await fs.writeFile(profilesFile, "[]", "utf-8"); }
            const chunks: any[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", async () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
                const raw = await fs.readFile(profilesFile, "utf-8");
                const arr = JSON.parse(raw || "[]");
                const item = {
                  userId: arr[0]?.userId || "dev_user",
                  username: body.username || arr[0]?.username || "",
                  handle: body.username || "",
                  title: body.displayName || "",
                  bio: body.bio || "",
                  profilePic: body.avatarDataUrl || arr[0]?.profilePic || "/placeholder.svg",
                  linkedStars: 0,
                  starlit: 0,
                  posts: arr[0]?.posts || [],
                  highlights: arr[0]?.highlights || [],
                  achievements: arr[0]?.achievements || [],
                  connections: arr[0]?.connections || [],
                };
                await fs.writeFile(profilesFile, JSON.stringify([item], null, 2), "utf-8");
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "invalid json" }));
              }
            });
            return;
          } catch { /* fallthrough */ }
        }
        next();
      });
    },
  };
}
