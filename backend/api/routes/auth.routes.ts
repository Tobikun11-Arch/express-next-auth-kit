import {Router} from 'express';
import {authController} from '../controllers/auth.controller';
import {validate} from '../middleware/validation';
import {
  registerDto,
  resendVerificationDto,
  verifyDto,
  loginDto,
  refreshDto,
  forgotPasswordDto,
  resetPasswordDto,
  resendResetCodeDto,
  changePasswordDto
} from '../dtos/auth.dto';
import {
  authLimiter,
  authActionLimiter,
  authReadLimiter
} from '../middleware/rateLimit';
import {requireAuth} from '../middleware/auth';
import {issueCsrfToken} from '../middleware/csrf';

const router = Router();

// sensitive write operations — strict limit
router.post(
  '/register',
  authLimiter,
  validate(registerDto),
  authController.register
);
router.post('/verify', authLimiter, validate(verifyDto), authController.verify);
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationDto),
  authController.resendVerification
);
router.post('/login', authLimiter, validate(loginDto), authController.login);

// password reset — strict limit
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordDto),
  authController.forgotPassword
);
router.post(
  '/verify-reset-code',
  authLimiter,
  validate(verifyDto),
  authController.verifyResetCode
);
router.post(
  '/resend-reset-code',
  authLimiter,
  validate(resendResetCodeDto),
  authController.resendResetCode
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordDto),
  authController.resetPassword
);

// authenticated actions — moderate limit
router.post(
  '/refresh',
  authActionLimiter,
  validate(refreshDto),
  authController.refresh
);
router.post('/logout', authActionLimiter, authController.logout);
router.put(
  '/password',
  authActionLimiter,
  requireAuth,
  validate(changePasswordDto),
  authController.changePassword
);
router.get('/csrf', authActionLimiter, issueCsrfToken);

// read-only — lenient limit
router.get('/me', authReadLimiter, requireAuth, authController.me);

export default router;
