"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.issueCsrfToken = issueCsrfToken;
exports.csrfProtection = csrfProtection;
const crypto_1 = require("crypto");
const error_1 = require("../utils/error");
const env_1 = require("../config/env");
const errorCodes_1 = require("../constants/errorCodes");
const cookies_1 = require("../constants/cookies");
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function generateCsrfToken() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
function getCsrfCookieOptions() {
    return {
        httpOnly: true,
        secure: env_1.env.COOKIE_SECURE === 'true',
        sameSite: env_1.env.COOKIE_SAMESITE ?? 'lax',
        path: '/'
    };
}
function issueCsrfToken(_req, res) {
    const token = generateCsrfToken();
    res.cookie(cookies_1.CSRF_COOKIE, token, getCsrfCookieOptions());
    res.status(200).json({ csrfToken: token });
}
function csrfProtection(req, _res, next) {
    if (!UNSAFE_METHODS.has(req.method)) {
        return next();
    }
    const cookieToken = req.cookies?.[cookies_1.CSRF_COOKIE];
    const headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next(new error_1.ApiError(403, errorCodes_1.ErrorCodes.CSRF_TOKEN_INVALID, 'Invalid CSRF token'));
    }
    return next();
}
