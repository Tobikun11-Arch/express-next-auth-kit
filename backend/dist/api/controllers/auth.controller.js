"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const error_1 = require("../utils/error");
const ACCESS_COOKIE = 'dc_access_token';
const REFRESH_COOKIE = 'dc_refresh_token';
function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAMESITE,
        path: '/'
    };
}
exports.authController = {
    async me(req, res, next) {
        try {
            if (!req.auth) {
                throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Not authenticated');
            }
            if (!req.auth.type) {
                throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Invalid token');
            }
            res.status(200).json({
                user: {
                    id: req.auth.userId,
                    type: req.auth.type
                }
            });
        }
        catch (error) {
            next(error);
        }
    },
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async verify(req, res, next) {
        try {
            await auth_service_1.authService.verify(req.body.email, req.body.code);
            res.status(200).json({ message: 'Verified' });
        }
        catch (error) {
            next(error);
        }
    },
    async resendVerification(req, res, next) {
        try {
            await auth_service_1.authService.resendVerification(req.body.email);
            res.status(200).json({ message: 'Verification code resent' });
        }
        catch (error) {
            next(error);
        }
    },
    async login(req, res, next) {
        try {
            const { accessToken, refreshToken, user, userType } = await auth_service_1.authService.login(req.body.email, req.body.password);
            const opts = getCookieOptions();
            res.cookie(ACCESS_COOKIE, accessToken, {
                ...opts,
                maxAge: 15 * 60 * 1000
            });
            res.cookie(REFRESH_COOKIE, refreshToken, {
                ...opts,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    type: userType
                }
            });
        }
        catch (error) {
            next(error);
        }
    },
    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.[REFRESH_COOKIE] ??
                req.body.refreshToken;
            if (!refreshToken) {
                throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Missing refresh token');
            }
            const result = await auth_service_1.authService.refreshAccessToken(refreshToken);
            const opts = getCookieOptions();
            res.cookie(ACCESS_COOKIE, result.accessToken, {
                ...opts,
                maxAge: 15 * 60 * 1000
            });
            res.status(200).json({ message: 'Refreshed' });
        }
        catch (error) {
            const opts = getCookieOptions();
            res.clearCookie(ACCESS_COOKIE, opts);
            res.clearCookie(REFRESH_COOKIE, opts);
            next(error);
        }
    },
    async logout(_req, res, next) {
        try {
            const opts = getCookieOptions();
            res.clearCookie(ACCESS_COOKIE, opts);
            res.clearCookie(REFRESH_COOKIE, opts);
            res.status(200).json({ message: 'Logged out' });
        }
        catch (error) {
            next(error);
        }
    }
};
