import serverless from "serverless-http";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server/index";

// Create the Express app once per cold start
const app = createServer();

const handler = serverless(app);

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  return handler(req as any, res as any);
}
