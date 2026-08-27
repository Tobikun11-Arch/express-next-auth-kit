import rateLimit from 'express-rate-limit';
import type {RequestHandler} from 'express';

const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
const noop: RequestHandler = (_req, _res, next) => next();

function makeLimiter(opts: Parameters<typeof rateLimit>[0]): RequestHandler {
  return enabled ? (rateLimit(opts) as RequestHandler) : noop;
}

const rateLimitHandler: RequestHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.'
  });
};

export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const authActionLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const authReadLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const uploadLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

export const defaultLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});
