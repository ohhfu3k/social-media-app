import { RequestHandler } from "express";

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(opts: { windowMs: number; max: number }): RequestHandler {
  const { windowMs, max } = opts;
  return (req, res, next) => {
    const key = (req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown') + ':' + (req.path || '');
    const now = Date.now();
    let b = buckets.get(key);
    if (!b) { b = { tokens: max, last: now }; buckets.set(key, b); }
    const elapsed = now - b.last;
    const refill = Math.floor(elapsed / windowMs) * max;
    if (refill > 0) { b.tokens = Math.min(max, b.tokens + refill); b.last = now; }
    if (b.tokens <= 0) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }
    b.tokens -= 1;
    next();
  };
}
