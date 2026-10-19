"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const error_1 = require("../utils/error");
const errorCodes_1 = require("../constants/errorCodes");
const env_1 = require("../config/env");
const cookies_1 = require("../constants/cookies");
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env_1.env.COOKIE_SECURE === 'true',
    sameSite: env_1.env.COOKIE_SAMESITE ?? 'lax',
    path: '/'
};
function getSessionMeta(req) {
    return {
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null
    };
}
exports.authController = {
    async me(req, res, next) {
        try {
            if (!req.auth) {
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Not authenticated');
            }
            if (!req.auth.type) {
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
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
            const { accessToken, refreshToken, user, userType } = await auth_service_1.authService.login(req.body.email, req.body.password, getSessionMeta(req));
            const opts = COOKIE_OPTIONS;
            res.cookie(cookies_1.ACCESS_TOKEN_COOKIE, accessToken, {
                ...opts,
                maxAge: 15 * 60 * 1000
            });
            res.cookie(cookies_1.REFRESH_TOKEN_COOKIE, refreshToken, {
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
            const refreshToken = req.cookies?.[cookies_1.REFRESH_TOKEN_COOKIE] ??
                req.body.refreshToken;
            if (!refreshToken) {
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Missing refresh token');
            }
            const result = await auth_service_1.authService.refreshAccessToken(refreshToken, getSessionMeta(req));
            const opts = COOKIE_OPTIONS;
            res.cookie(cookies_1.ACCESS_TOKEN_COOKIE, result.accessToken, {
                ...opts,
                maxAge: 15 * 60 * 1000
            });
            res.cookie(cookies_1.REFRESH_TOKEN_COOKIE, result.refreshToken, {
                ...opts,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({ message: 'Refreshed' });
        }
        catch (error) {
            // Only clear cookies on a definitive auth failure. Transient
            // errors (DB hiccup, 5xx) must keep the refresh cookie so the
            // client can retry instead of being forced to log in.
            if (error instanceof error_1.ApiError && error.statusCode === 401) {
                const opts = COOKIE_OPTIONS;
                res.clearCookie(cookies_1.ACCESS_TOKEN_COOKIE, opts);
                res.clearCookie(cookies_1.REFRESH_TOKEN_COOKIE, opts);
            }
            next(error);
        }
    },
    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.[cookies_1.REFRESH_TOKEN_COOKIE];
            if (refreshToken) {
                await auth_service_1.authService.logout(refreshToken);
            }
            const opts = COOKIE_OPTIONS;
            res.clearCookie(cookies_1.ACCESS_TOKEN_COOKIE, opts);
            res.clearCookie(cookies_1.REFRESH_TOKEN_COOKIE, opts);
            res.status(200).json({ message: 'Logged out' });
        }
        catch (error) {
            next(error);
        }
    },
    async forgotPassword(req, res, next) {
        try {
            await auth_service_1.authService.forgotPassword(req.body.email);
            res
                .status(200)
                .json({ message: 'If that email exists, a reset code has been sent.' });
        }
        catch (error) {
            next(error);
        }
    },
    async verifyResetCode(req, res, next) {
        try {
            await auth_service_1.authService.verifyResetCode(req.body.email, req.body.code);
            res.status(200).json({ message: 'Code verified' });
        }
        catch (error) {
            next(error);
        }
    },
    async resendResetCode(req, res, next) {
        try {
            await auth_service_1.authService.forgotPassword(req.body.email);
            res.status(200).json({ message: 'Reset code resent' });
        }
        catch (error) {
            next(error);
        }
    },
    async resetPassword(req, res, next) {
        try {
            await auth_service_1.authService.resetPassword(req.body.email, req.body.code, req.body.newPassword);
            res.status(200).json({ message: 'Password reset successfully' });
        }
        catch (error) {
            next(error);
        }
    },
    async changePassword(req, res, next) {
        try {
            if (!req.auth) {
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Not authenticated');
            }
            await auth_service_1.authService.changePassword(req.auth.userId, req.auth.type ?? 'user', req.body.currentPassword, req.body.newPassword);
            res.status(200).json({ message: 'Password changed successfully' });
        }
        catch (error) {
            next(error);
        }
    }
};
