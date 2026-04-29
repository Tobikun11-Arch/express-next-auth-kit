"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordDto = exports.forgotPasswordDto = exports.refreshDto = exports.loginDto = exports.resendVerificationDto = exports.verifyDto = exports.registerDto = void 0;
const zod_1 = require("zod");
exports.registerDto = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    username: zod_1.z.string().min(1).optional()
});
exports.verifyDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6) // always 6 digits from generateVerificationCode()
});
exports.resendVerificationDto = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.loginDto = zod_1.z.object({
    email: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8)
});
exports.refreshDto = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1).optional()
});
exports.forgotPasswordDto = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.resetPasswordDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6),
    newPassword: zod_1.z.string().min(8)
});
