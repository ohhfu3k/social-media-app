import { AnyZodObject } from "zod";
import { RequestHandler } from "express";

export function validateBody(schema: AnyZodObject): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    (req as any).parsed = parsed.data;
    next();
  };
}
