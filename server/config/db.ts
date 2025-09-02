import mongoose from "mongoose";
import { env } from "./env";

export let prisma: any = null;
const sqlEnabled = !!env.DATABASE_URL;
let prismaReady = false;

export const dbEnabled = sqlEnabled || !!env.MONGODB_URI;
export const isDbReady = () => {
  if (sqlEnabled) return prismaReady;
  return mongoose.connection.readyState === 1;
};

export async function connectDB() {
  // Connect Prisma (Postgres/Neon) lazily to avoid importing in Vite config context
  if (sqlEnabled && !prismaReady) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      prisma = new PrismaClient({
        log: env.PRISMA_LOG_LEVEL === "debug" ? ["query", "info", "warn", "error"]
          : env.PRISMA_LOG_LEVEL === "info" ? ["info", "warn", "error"]
          : ["warn", "error"],
      });
      await prisma.$connect();
      prismaReady = true;
      console.log("[db] prisma connected");
    } catch (e) {
      console.error("[db] prisma connection error", e);
    }
  }

  // Optionally connect MongoDB if provided (backward compatibility)
  const uri = env.MONGODB_URI;
  if (uri) {
    if (mongoose.connection.readyState < 1) {
      try {
        await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined } as any);
        console.log("[db] mongoose connected");
      } catch (e) {
        console.warn("[db] mongoose connection failed");
      }
    }
  } else if (!sqlEnabled) {
    console.warn("[db] No DATABASE_URL or MONGODB_URI provided; using file-based store");
  }
}
