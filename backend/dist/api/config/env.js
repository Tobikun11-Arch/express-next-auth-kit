"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().optional(),
    PORT: zod_1.z.string().optional(),
    MONGO_URI: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(1),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
    COOKIE_SECURE: zod_1.z.string().optional(),
    COOKIE_SAMESITE: zod_1.z.enum(['strict', 'lax', 'none']).optional(),
    CORS_ORIGINS: zod_1.z.string().optional()
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const message = parsed.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
    throw new Error(`Invalid environment configuration: ${message}`);
}
exports.env = {
    ...parsed.data,
    PORT: parsed.data.PORT ? Number(parsed.data.PORT) : 5000
};
