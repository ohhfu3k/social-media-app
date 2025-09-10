import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { connectDB } from "./config/db";
import "./config/env";
import apiRoutes from "./routes";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  // Basic security headers and simple rate limiting
  import('./middlewares/security').then(({ securityHeaders }) => app.use(securityHeaders));
  import('./middlewares/rateLimit').then(({ rateLimit }) => app.use(rateLimit({ windowMs: 1000, max: 20 })));

  // DB
  connectDB().catch((e) => console.error("[db] connection error", e));

  // Health and API routes
  app.use("/api", apiRoutes);

  // Legacy example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // Auth routes (existing)
  import("./routes/auth").then(({ authRouter }) => {
    app.use("/api/auth", authRouter);
  });

  // Profile routes
  import("./routes/profile").then(({ profileRouter }) => {
    app.use("/api/profile", profileRouter);
  });

  // Users routes (search/profile/follow)
  import("./routes/users").then(({ usersRouter }) => {
    app.use("/api/users", usersRouter);
  });

  // Admin routes
  import("./routes/admin").then(({ adminRouter }) => {
    app.use("/api/admin", adminRouter);
  });

  // Posts routes
  import("./routes/posts").then(({ postsRouter }) => {
    app.use("/api/posts", postsRouter);
  });

  // Messages routes
  import("./routes/messages").then(({ messagesRouter }) => {
    app.use("/api/messages", messagesRouter);
  });

  // Notifications routes
  import("./routes/notifications").then(({ notificationsRouter }) => {
    app.use("/api/notifications", notificationsRouter);
  });

  // Search routes
  import("./routes/search").then(({ searchRouter }) => {
    app.use("/api/search", searchRouter);
  });

  // Groups routes
  import("./routes/groups").then(({ groupsRouter }) => {
    app.use("/api/groups", groupsRouter);
  });

  // Badges routes
  import("./routes/badges").then(({ badgesRouter }) => {
    app.use("/api/badges", badgesRouter);
  });

  // Bookmarks routes
  import("./routes/bookmarks").then(({ bookmarksRouter }) => {
    app.use("/api/bookmarks", bookmarksRouter);
  });

  // Leaderboard routes
  import("./routes/leaderboard").then(({ leaderboardRouter }) => {
    app.use("/api/leaderboard", leaderboardRouter);
  });

  // Stories routes
  import("./routes/stories").then(({ storiesRouter }) => {
    app.use("/api/stories", storiesRouter);
  });

  // v1 Stories API (versioned)
  import("./routes/storiesV1").then((mod: any) => {
    const r = mod.storiesV1Router || mod.default;
    if (r) app.use("/api/v1/stories", r);
  });

  // Upload routes
  import("./routes/upload").then(({ uploadRouter }) => {
    app.use("/api/upload", uploadRouter);
  });

  // Integrations routes
  import("./routes/integrations").then(({ integrationsRouter }) => {
    app.use("/api/integrations", integrationsRouter);
  });

  // Events routes
  import("./routes/events").then(({ eventsRouter }) => {
    app.use("/api/events", eventsRouter);
  });

  // Marketplace routes
  import("./routes/marketplace").then(({ marketplaceRouter }) => {
    app.use("/api/marketplace", marketplaceRouter);
  });

  // Live routes
  import("./routes/live").then(({ liveRouter }) => {
    app.use("/api/live", liveRouter);
  });

  // Spotify route (proxy)
  import("./routes/spotify").then(({ spotifyRouter }) => {
    app.use("/api/spotify", spotifyRouter);
  });

  // Support routes
  import("./routes/support").then(({ supportRouter }) => {
    app.use("/api/support", supportRouter);
  });

  // Explore routes
  import("./routes/explore").then(({ exploreRouter }) => {
    app.use("/api/explore", exploreRouter);
  });

  // Analytics routes
  import("./routes/analytics").then(({ analyticsRouter }) => {
    app.use("/api/analytics", analyticsRouter);
  });

  return app;
}
