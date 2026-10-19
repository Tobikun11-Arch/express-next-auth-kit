"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const user_repository_1 = require("../repositories/user.repository");
const admin_repository_1 = require("../repositories/admin.repository");
const refreshSession_repository_1 = require("../repositories/refreshSession.repository");
const error_1 = require("../utils/error");
const email_service_1 = require("./email.service");
const errorCodes_1 = require("../constants/errorCodes");
const verificationCodeEmail_1 = require("../templates/verificationCodeEmail");
const resetPasswordEmail_1 = require("../templates/resetPasswordEmail");
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function getVerificationExpiry(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Rotated tokens within this window are treated as tab races / network
// retries (another instance may have rotated first) instead of reuse.
const ROTATION_GRACE_MS = 60 * 1000;
function signAccessToken(userId, type) {
    return jsonwebtoken_1.default.sign({ userId, type }, env_1.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_TTL
    });
}
function signRefreshToken(userId, type, jti, familyId) {
    return jsonwebtoken_1.default.sign({ userId, type, jti, fid: familyId }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_TTL
    });
}
async function createSessionAndIssueTokens(account, type, opts = {}) {
    const jti = (0, crypto_1.randomUUID)();
    const familyId = opts.familyId ?? (0, crypto_1.randomUUID)();
    await refreshSession_repository_1.refreshSessionRepository.create({
        jti,
        userId: account.id,
        type,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        userAgent: opts.meta?.userAgent ?? null,
        ip: opts.meta?.ip ?? null
    });
    return {
        accessToken: signAccessToken(account.id, type),
        refreshToken: signRefreshToken(account.id, type, jti, familyId)
    };
}
function isWithinGraceWindow(rotatedAt) {
    return Date.now() - rotatedAt.getTime() <= ROTATION_GRACE_MS;
}
exports.authService = {
    async register(data) {
        const [existingEmail] = await Promise.all([
            user_repository_1.userRepository.findByEmail(data.email)
        ]);
        if (existingEmail) {
            throw new error_1.ApiError(409, errorCodes_1.ErrorCodes.EMAIL_EXISTS, 'Email already exists');
        }
        try {
            const passwordHash = await bcrypt_1.default.hash(data.password, 10);
            const verificationCode = generateVerificationCode();
            const verificationExpiry = getVerificationExpiry(10);
            const user = await user_repository_1.userRepository.create({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                passwordHash,
                username: data.username,
                verificationCode,
                verificationExpiry,
                isVerified: false
            });
            const emailTpl = (0, verificationCodeEmail_1.verificationCodeEmailTemplate)({
                code: verificationCode,
                expiresMinutes: 10,
                recipientName: data.firstName
            });
            await email_service_1.emailService.sendEmail({
                to: data.email,
                subject: emailTpl.subject,
                text: emailTpl.text,
                html: emailTpl.html
            });
            return { id: user.id, email: user.email };
        }
        catch (err) {
            if (err instanceof Error &&
                'code' in err &&
                err.code === 11000) {
                const keyValue = err.keyValue;
                if (keyValue?.username) {
                    throw new error_1.ApiError(409, errorCodes_1.ErrorCodes.USERNAME_EXISTS, 'username already exists');
                }
                if (keyValue?.email) {
                    throw new error_1.ApiError(409, errorCodes_1.ErrorCodes.EMAIL_EXISTS, 'Email already exists');
                }
                throw new error_1.ApiError(409, errorCodes_1.ErrorCodes.ACCOUNT_EXISTS, 'Account already exists');
            }
            throw err;
        }
    },
    async verify(email, code) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.verificationCode || !user.verificationExpiry) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.INVALID_CODE, 'Invalid verification code');
        }
        const codeMatches = user.verificationCode === code;
        const notExpired = user.verificationExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.EXPIRED_CODE, 'Verification code expired or invalid');
        }
        await user_repository_1.userRepository.markVerified(email);
    },
    async resendVerification(email) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || user.isVerified) {
            return;
        }
        const verificationCode = generateVerificationCode();
        const verificationExpiry = getVerificationExpiry(10);
        await user_repository_1.userRepository.setVerificationCode(email, verificationCode, verificationExpiry);
        const emailTpl = (0, verificationCodeEmail_1.verificationCodeEmailTemplate)({
            code: verificationCode,
            expiresMinutes: 10,
            recipientName: user.firstName
        });
        await email_service_1.emailService.sendEmail({
            to: email,
            subject: emailTpl.subject,
            text: emailTpl.text,
            html: emailTpl.html
        });
    },
    async sendResetPasswordCodeEmail(params) {
        const emailTpl = (0, resetPasswordEmail_1.resetPasswordEmailTemplate)({
            code: params.code,
            expiresMinutes: 10,
            recipientName: params.recipientName
        });
        await email_service_1.emailService.sendEmail({
            to: params.email,
            subject: emailTpl.subject,
            text: emailTpl.text,
            html: emailTpl.html
        });
    },
    async forgotPassword(email) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.isVerified)
            return;
        const resetCode = generateVerificationCode();
        const resetExpiry = getVerificationExpiry(10);
        await user_repository_1.userRepository.setResetCode(email, resetCode, resetExpiry);
        await exports.authService.sendResetPasswordCodeEmail({
            email,
            code: resetCode,
            recipientName: user.firstName
        });
    },
    async verifyResetCode(email, code) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.resetCode || !user.resetExpiry) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.INVALID_CODE, 'Invalid or expired reset code');
        }
        const codeMatches = user.resetCode === code;
        const notExpired = user.resetExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.EXPIRED_CODE, 'Reset code expired or invalid');
        }
    },
    async resetPassword(email, code, newPassword) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.resetCode || !user.resetExpiry) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.INVALID_CODE, 'Invalid or expired reset code');
        }
        const codeMatches = user.resetCode === code;
        const notExpired = user.resetExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, errorCodes_1.ErrorCodes.EXPIRED_CODE, 'Reset code expired or invalid');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await user_repository_1.userRepository.updatePassword(user.id, passwordHash);
        await user_repository_1.userRepository.clearResetCode(email);
    },
    async changePassword(userId, type, currentPassword, newPassword) {
        const repository = type === 'user' ? user_repository_1.userRepository : admin_repository_1.adminRepository;
        const account = await repository.findById(userId);
        if (!account) {
            throw new error_1.ApiError(404, errorCodes_1.ErrorCodes.USER_NOT_FOUND, 'User not found');
        }
        const matches = await bcrypt_1.default.compare(currentPassword, account.passwordHash);
        if (!matches) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.INVALID_CREDENTIALS, 'Current password is incorrect');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await repository.updatePassword(userId, passwordHash);
    },
    async login(email, password, meta = {}) {
        const identifier = email;
        const [user, admin] = await Promise.all([
            user_repository_1.userRepository.findByEmail(identifier),
            admin_repository_1.adminRepository.findByEmailOrUsername(identifier)
        ]);
        const account = user || admin;
        const userType = user ? 'user' : admin ? 'admin' : null;
        if (!account || !userType) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
        }
        if (!account.isVerified) {
            throw new error_1.ApiError(403, errorCodes_1.ErrorCodes.NOT_VERIFIED, 'Email not verified');
        }
        const match = await bcrypt_1.default.compare(password, account.passwordHash);
        if (!match) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password');
        }
        const { accessToken, refreshToken } = await createSessionAndIssueTokens({ id: account.id }, userType, { meta });
        return { accessToken, refreshToken, user: account, userType };
    },
    async refreshAccessToken(refreshToken, meta = {}) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        }
        catch {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
        }
        if (!payload.userId || !payload.type) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
        }
        const account = await (payload.type === 'user'
            ? user_repository_1.userRepository.findById(payload.userId)
            : admin_repository_1.adminRepository.findById(payload.userId));
        if (!account) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
        }
        if (!account.isVerified) {
            // 401 (not 403) so clients treat it as a dead session and stop
            // retrying refresh in a loop.
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
        }
        // Legacy refresh tokens issued before session tracking carry no jti.
        // Accept them once and create a session on first use so existing
        // users are not forced to re-login after this deploy.
        if (!payload.jti) {
            return createSessionAndIssueTokens({ id: account.id }, payload.type, {
                meta
            });
        }
        const session = await refreshSession_repository_1.refreshSessionRepository.findByJti(payload.jti);
        if (!session || session.revokedAt || session.expiresAt <= new Date()) {
            throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
        }
        if (session.rotatedAt) {
            if (!isWithinGraceWindow(session.rotatedAt)) {
                // Reuse of a token rotated beyond the grace window: assume
                // compromise or a stale copy and revoke the whole family.
                await refreshSession_repository_1.refreshSessionRepository.revokeFamily(session.familyId);
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
            }
            // Tab race or network retry: another instance/tab already rotated
            // this token. Issue a fresh valid pair in the same family instead
            // of failing so the loser still stays signed in.
            return createSessionAndIssueTokens({ id: account.id }, payload.type, {
                familyId: session.familyId,
                meta
            });
        }
        // Atomic rotation: only one concurrent caller can win this update.
        const newJti = (0, crypto_1.randomUUID)();
        const rotated = await refreshSession_repository_1.refreshSessionRepository.rotate(payload.jti, newJti);
        if (!rotated) {
            const current = await refreshSession_repository_1.refreshSessionRepository.findByJti(payload.jti);
            if (!current ||
                current.revokedAt ||
                !current.rotatedAt ||
                !isWithinGraceWindow(current.rotatedAt)) {
                if (current && !current.revokedAt) {
                    await refreshSession_repository_1.refreshSessionRepository.revokeFamily(current.familyId);
                }
                throw new error_1.ApiError(401, errorCodes_1.ErrorCodes.UNAUTHORIZED, 'Invalid token');
            }
            return createSessionAndIssueTokens({ id: account.id }, payload.type, {
                familyId: current.familyId,
                meta
            });
        }
        await refreshSession_repository_1.refreshSessionRepository.create({
            jti: newJti,
            userId: account.id,
            type: payload.type,
            familyId: session.familyId,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
            userAgent: meta.userAgent ?? null,
            ip: meta.ip ?? null
        });
        return {
            accessToken: signAccessToken(account.id, payload.type),
            refreshToken: signRefreshToken(account.id, payload.type, newJti, session.familyId)
        };
    },
    async logout(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            if (!payload.jti)
                return;
            const session = await refreshSession_repository_1.refreshSessionRepository.findByJti(payload.jti);
            if (session) {
                // Revoke the whole family so grace-window duplicates die too.
                await refreshSession_repository_1.refreshSessionRepository.revokeFamily(session.familyId);
            }
        }
        catch {
            // Invalid or expired token — nothing to revoke.
        }
    }
};
