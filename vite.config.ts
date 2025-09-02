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
  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
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
