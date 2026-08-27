import rateLimit from 'express-rate-limit';
import type {RequestHandler} from 'express';

const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
const noop: RequestHandler = (_req, _res, next) => next();

function makeLimiter(opts: Parameters<typeof rateLimit>[0]): RequestHandler {
  return enabled ? (rateLimit(opts) as RequestHandler) : noop;
}

export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

export const uploadLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

export const defaultLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
