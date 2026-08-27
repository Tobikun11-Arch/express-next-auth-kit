import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  COOKIE_SECURE: z.string().optional(),
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional(),
  CORS_ORIGINS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.errors
    .map(e => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = {
  ...parsed.data,
  PORT: parsed.data.PORT ? Number(parsed.data.PORT) : 5000
};