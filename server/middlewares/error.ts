import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  const status = (err as any).status || 500;
  res.status(status).json({ error: (err as any).message || "Internal Server Error" });
};
