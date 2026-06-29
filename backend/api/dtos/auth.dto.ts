import {z} from 'zod';

export const registerDto = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(1).optional()
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
  password: z.string().min(8)
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
  newPassword: z.string().min(8)
});

export const resendResetCodeDto = z.object({
  email: z.string().email()
});

export type RegisterDto = z.infer<typeof registerDto>;
export type VerifyDto = z.infer<typeof verifyDto>;
export type ResendVerificationDto = z.infer<typeof resendVerificationDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type RefreshDto = z.infer<typeof refreshDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResendResetCodeDto = z.infer<typeof resendResetCodeDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;