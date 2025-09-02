import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 8080),
  MONGODB_URI: process.env.MONGODB_URI || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  PRISMA_LOG_LEVEL: process.env.PRISMA_LOG_LEVEL || "warn",
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret_change_me",
};

export function requireEnv(name: keyof typeof env) {
  const v = env[name];
  if (!v) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing ${name}. Set it via env variable or DevServerControl`);
  }
  return v;
}
