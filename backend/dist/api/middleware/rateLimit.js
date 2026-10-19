"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLimiter = exports.uploadLimiter = exports.authReadLimiter = exports.authActionLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
const noop = (_req, _res, next) => next();
function makeLimiter(opts) {
    return enabled ? (0, express_rate_limit_1.default)(opts) : noop;
}
const rateLimitHandler = (_req, res) => {
    res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
    });
};
exports.authLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});
exports.authActionLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});
exports.authReadLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});
exports.uploadLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});
exports.defaultLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});
