"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const user_repository_1 = require("../repositories/user.repository");
const admin_repository_1 = require("../repositories/admin.repository");
const error_1 = require("../utils/error");
const email_service_1 = require("./email.service");
const blocklist_service_1 = require("./blocklist.service");
const verificationCodeEmail_1 = require("../templates/verificationCodeEmail");
const resetPasswordEmail_1 = require("../templates/resetPasswordEmail");
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function getVerificationExpiry(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
exports.authService = {
    async register(data) {
        const [existingEmail] = await Promise.all([
            user_repository_1.userRepository.findByEmail(data.email)
        ]);
        if (existingEmail) {
            throw new error_1.ApiError(409, 'EMAIL_EXISTS', 'Email already exists');
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
                    throw new error_1.ApiError(409, 'USERNAME_EXISTS', 'username already exists');
                }
                if (keyValue?.email) {
                    throw new error_1.ApiError(409, 'EMAIL_EXISTS', 'Email already exists');
                }
                throw new error_1.ApiError(409, 'ACCOUNT_EXISTS', 'Account already exists');
            }
            throw err;
        }
    },
    async verify(email, code) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.verificationCode || !user.verificationExpiry) {
            throw new error_1.ApiError(400, 'INVALID_CODE', 'Invalid verification code');
        }
        const codeMatches = user.verificationCode === code;
        const notExpired = user.verificationExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, 'EXPIRED_CODE', 'Verification code expired or invalid');
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
            throw new error_1.ApiError(400, 'INVALID_CODE', 'Invalid or expired reset code');
        }
        const codeMatches = user.resetCode === code;
        const notExpired = user.resetExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, 'EXPIRED_CODE', 'Reset code expired or invalid');
        }
    },
    async resetPassword(email, code, newPassword) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.resetCode || !user.resetExpiry) {
            throw new error_1.ApiError(400, 'INVALID_CODE', 'Invalid or expired reset code');
        }
        const codeMatches = user.resetCode === code;
        const notExpired = user.resetExpiry > new Date();
        if (!codeMatches || !notExpired) {
            throw new error_1.ApiError(400, 'EXPIRED_CODE', 'Reset code expired or invalid');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
        await user_repository_1.userRepository.updatePassword(user.id, passwordHash);
        await user_repository_1.userRepository.clearResetCode(email);
    },
    async login(email, password) {
        const identifier = email;
        const [user, admin] = await Promise.all([
            user_repository_1.userRepository.findByEmail(identifier),
            admin_repository_1.adminRepository.findByEmailOrUsername(identifier)
        ]);
        const account = user || admin;
        const userType = user ? 'user' : admin ? 'admin' : null;
        if (!account || !userType) {
            throw new error_1.ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        if (!account.isVerified) {
            throw new error_1.ApiError(403, 'NOT_VERIFIED', 'Email not verified');
        }
        const match = await bcrypt_1.default.compare(password, account.passwordHash);
        if (!match) {
            throw new error_1.ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: account.id, type: userType }, env_1.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: account.id, type: userType }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return { accessToken, refreshToken, user: account, userType };
    },
    async refreshAccessToken(refreshToken) {
        try {
            if (blocklist_service_1.blocklistService.isRevoked(refreshToken)) {
                throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Token revoked');
            }
            const payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            const account = await (payload.type === 'user'
                ? user_repository_1.userRepository.findById(payload.userId)
                : admin_repository_1.adminRepository.findById(payload.userId));
            if (!account) {
                throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Invalid token');
            }
            if (!account.isVerified) {
                throw new error_1.ApiError(403, 'NOT_VERIFIED', 'Email not verified');
            }
            blocklist_service_1.blocklistService.revoke(refreshToken);
            const accessToken = jsonwebtoken_1.default.sign({ userId: account.id, type: payload.type }, env_1.env.JWT_SECRET, { expiresIn: '15m' });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: account.id, type: payload.type }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
            return { accessToken, refreshToken: newRefreshToken };
        }
        catch {
            throw new error_1.ApiError(401, 'UNAUTHORIZED', 'Invalid token');
        }
    },
    logout(refreshToken) {
        blocklist_service_1.blocklistService.revoke(refreshToken);
    }
};
