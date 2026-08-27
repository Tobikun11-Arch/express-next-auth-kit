import {Router} from 'express';
import {authController} from '../controllers/auth.controller';
import {validate} from '../middleware/validation';
import {
  registerDto,
  resendVerificationDto,
  verifyDto,
  loginDto,
  refreshDto,
  forgotPasswordDto, // add
  resetPasswordDto, // add
  resendResetCodeDto // add
} from '../dtos/auth.dto';
import {authLimiter} from '../middleware/rateLimit';
import {requireAuth} from '../middleware/auth';
import {issueCsrfToken} from '../middleware/csrf';

const router = Router();

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
router.post(
  '/refresh',
  authLimiter,
  validate(refreshDto),
  authController.refresh
);
router.post('/logout', authLimiter, authController.logout);
router.get('/me', authLimiter, requireAuth, authController.me);

// password reset
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

router.get('/csrf', issueCsrfToken);

export default router;
