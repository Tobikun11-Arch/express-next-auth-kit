import {z} from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const registerDto = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  username: z.string().min(1)
});

export const verifyDto = z.object({
  email: z.string().email(),
  code: z.string().length(6) // always 6 digits from generateVerificationCode()
});

export const resendVerificationDto = z.object({
  email: z.string().email()
});

export const loginDto = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

export const refreshDto = z.object({
  refreshToken: z.string().min(1).optional()
});

export const forgotPasswordDto = z.object({
  email: z.string().email()
});

export const resetPasswordDto = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: passwordSchema
});

export const resendResetCodeDto = z.object({
  email: z.string().email()
});

export const changePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
});

export type RegisterDto = z.infer<typeof registerDto>;
export type VerifyDto = z.infer<typeof verifyDto>;
export type ResendVerificationDto = z.infer<typeof resendVerificationDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type RefreshDto = z.infer<typeof refreshDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResendResetCodeDto = z.infer<typeof resendResetCodeDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;