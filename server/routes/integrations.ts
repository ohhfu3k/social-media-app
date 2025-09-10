import { Router, RequestHandler } from "express";
import { dbEnabled, isDbReady } from "../config/db";
import { firebaseEnabled } from "../services/firebase";

const integrationsRouter = Router();

integrationsRouter.get("/status", (async (_req, res) => {
  const bucketEnv = process.env.FIREBASE_STORAGE_BUCKET || process.env.GCS_BUCKET || "";
  const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || "";
  const sentryDsn = process.env.SENTRY_DSN || "";
  const netlifyHook = process.env.NETLIFY_BUILD_HOOK_URL || "";

  res.json({
    storage: { configured: !!bucketEnv && firebaseEnabled, bucket: bucketEnv },
    database: { configured: !!databaseUrl || (dbEnabled && isDbReady()), urlPresent: !!databaseUrl, ready: isDbReady() },
    sentry: { configured: !!sentryDsn },
    netlify: { configured: !!netlifyHook },
  });
}) as RequestHandler);

integrationsRouter.post("/netlify/deploy", (async (_req, res) => {
  const url = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!url) return res.status(400).json({ error: "NETLIFY_BUILD_HOOK_URL not set" });
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (!r.ok) return res.status(502).json({ error: `Hook failed: ${r.status}` });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to call Netlify hook" });
  }
}) as RequestHandler);

export { integrationsRouter };
