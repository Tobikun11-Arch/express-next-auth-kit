"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendResetCodeDto = exports.resetPasswordDto = exports.forgotPasswordDto = exports.refreshDto = exports.loginDto = exports.resendVerificationDto = exports.verifyDto = exports.registerDto = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
exports.registerDto = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: passwordSchema,
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
    password: passwordSchema
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
    newPassword: passwordSchema
});
exports.resendResetCodeDto = zod_1.z.object({
    email: zod_1.z.string().email()
});
