import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {randomUUID} from 'crypto';
import {env} from '../config/env';
import {userRepository} from '../repositories/user.repository';
import {adminRepository} from '../repositories/admin.repository';
import {refreshSessionRepository} from '../repositories/refreshSession.repository';
import {ApiError} from '../utils/error';
import {emailService} from './email.service';
import {ErrorCodes} from '../constants/errorCodes';
import {verificationCodeEmailTemplate} from '../templates/verificationCodeEmail';
import {resetPasswordEmailTemplate} from '../templates/resetPasswordEmail';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getVerificationExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROTATION_GRACE_MS = 60 * 1000;

type RefreshTokenPayload = {
  userId: string;
  type: 'user' | 'admin';
  jti?: string;
  fid?: string;
};

type SessionMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

function signAccessToken(userId: string, type: 'user' | 'admin') {
  return jwt.sign({userId, type}, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
}

function signRefreshToken(
  userId: string,
  type: 'user' | 'admin',
  jti: string,
  familyId: string
) {
  return jwt.sign({userId, type, jti, fid: familyId}, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL
  });
}

async function createSessionAndIssueTokens(
  account: {id: string},
  type: 'user' | 'admin',
  opts: {familyId?: string; meta?: SessionMeta} = {}
) {
  const jti = randomUUID();
  const familyId = opts.familyId ?? randomUUID();

  await refreshSessionRepository.create({
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

function isWithinGraceWindow(rotatedAt: Date) {
  return Date.now() - rotatedAt.getTime() <= ROTATION_GRACE_MS;
}

export const authService = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username: string;
  }) {
    const [existingEmail] = await Promise.all([
      userRepository.findByEmail(data.email)
    ]);

    if (existingEmail) {
          throw new ApiError(409, ErrorCodes.EMAIL_EXISTS, 'Email already exists');
    }

    try {
      const passwordHash = await bcrypt.hash(data.password, 10);
      const verificationCode = generateVerificationCode();
      const verificationExpiry = getVerificationExpiry(10);

      const user = await userRepository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        username: data.username,
        verificationCode,
        verificationExpiry,
        isVerified: false
      });

      const emailTpl = verificationCodeEmailTemplate({
        code: verificationCode,
        expiresMinutes: 10,
        recipientName: data.firstName
      });

      await emailService.sendEmail({
        to: data.email,
        subject: emailTpl.subject,
        text: emailTpl.text,
        html: emailTpl.html
      });

      return {id: user.id, email: user.email};
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as {code: number}).code === 11000
      ) {
        const keyValue = (err as {keyValue?: Record<string, string>}).keyValue;

        if (keyValue?.username) {
          throw new ApiError(409, ErrorCodes.USERNAME_EXISTS, 'username already exists');
        }

        if (keyValue?.email) {
      throw new ApiError(409, ErrorCodes.EMAIL_EXISTS, 'Email already exists');

        }

        throw new ApiError(409, ErrorCodes.ACCOUNT_EXISTS, 'Account already exists');
      }

      throw err;
    }
  },

  async verify(email: string, code: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.verificationCode || !user.verificationExpiry) {
      throw new ApiError(400, ErrorCodes.INVALID_CODE, 'Invalid verification code');
    }

    const codeMatches = user.verificationCode === code;
    const notExpired = user.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(
        400,
        ErrorCodes.EXPIRED_CODE,
        'Verification code expired or invalid'
      );
    }

    await userRepository.markVerified(email);
  },

  async resendVerification(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.isVerified) {
      return;
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry(10);

    await userRepository.setVerificationCode(
      email,
      verificationCode,
      verificationExpiry
    );

    const emailTpl = verificationCodeEmailTemplate({
      code: verificationCode,
      expiresMinutes: 10,
      recipientName: user.firstName
    });

    await emailService.sendEmail({
      to: email,
      subject: emailTpl.subject,
      text: emailTpl.text,
      html: emailTpl.html
    });
  },

  async sendResetPasswordCodeEmail(params: {
    email: string;
    code: string;
    recipientName?: string;
  }) {
    const emailTpl = resetPasswordEmailTemplate({
      code: params.code,
      expiresMinutes: 10,
      recipientName: params.recipientName
    });

    await emailService.sendEmail({
      to: params.email,
      subject: emailTpl.subject,
      text: emailTpl.text,
      html: emailTpl.html
    });
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.isVerified) return;

    const resetCode = generateVerificationCode();
    const resetExpiry = getVerificationExpiry(10);

    await userRepository.setResetCode(email, resetCode, resetExpiry);

    await authService.sendResetPasswordCodeEmail({
      email,
      code: resetCode,
      recipientName: user.firstName
    });
  },

  async verifyResetCode(email: string, code: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.resetCode || !user.resetExpiry) {
      throw new ApiError(400, ErrorCodes.INVALID_CODE, 'Invalid or expired reset code');
    }

    const codeMatches = user.resetCode === code;
    const notExpired = user.resetExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(400, ErrorCodes.EXPIRED_CODE, 'Reset code expired or invalid');
    }
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.resetCode || !user.resetExpiry) {
      throw new ApiError(400, ErrorCodes.INVALID_CODE, 'Invalid or expired reset code');
    }

    const codeMatches = user.resetCode === code;
    const notExpired = user.resetExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(400, ErrorCodes.EXPIRED_CODE, 'Reset code expired or invalid');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.clearResetCode(email);
  },

  async changePassword(
    userId: string,
    type: 'user' | 'admin',
    currentPassword: string,
    newPassword: string
  ) {
    const repository = type === 'user' ? userRepository : adminRepository;
    const account = await repository.findById(userId);

    if (!account) {
      throw new ApiError(404, ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const matches = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!matches) {
      throw new ApiError(
        401,
        ErrorCodes.INVALID_CREDENTIALS,
        'Current password is incorrect'
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await repository.updatePassword(userId, passwordHash);
  },

  async login(
    email: string,
    password: string,
    meta: SessionMeta = {}
  ) {
    const identifier = email;
    const [user, admin] = await Promise.all([
      userRepository.findByEmail(identifier),
      adminRepository.findByEmailOrUsername(identifier)
    ]);

    const account = user || admin;
    const userType = user ? 'user' : admin ? 'admin' : null;

    if (!account || !userType) {
      throw new ApiError(
        401,
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    if (!account.isVerified) {
      throw new ApiError(403, ErrorCodes.NOT_VERIFIED, 'Email not verified');
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      throw new ApiError(
        401,
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    const {accessToken, refreshToken} = await createSessionAndIssueTokens(
      {id: account.id},
      userType,
      {meta}
    );

    return {accessToken, refreshToken, user: account, userType};
  },

  async refreshAccessToken(refreshToken: string, meta: SessionMeta = {}) {
    let payload: RefreshTokenPayload;

    try {
      payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET
      ) as RefreshTokenPayload;
    } catch {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    if (!payload.userId || !payload.type) {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    const account = await (payload.type === 'user'
      ? userRepository.findById(payload.userId)
      : adminRepository.findById(payload.userId));

    if (!account) {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    if (!account.isVerified) {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    if (!payload.jti) {
      return createSessionAndIssueTokens({id: account.id}, payload.type, {
        meta
      });
    }

    const session = await refreshSessionRepository.findByJti(payload.jti);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
    }

    if (session.rotatedAt) {
      if (!isWithinGraceWindow(session.rotatedAt)) {
        await refreshSessionRepository.revokeFamily(session.familyId);
        throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
      }

      return createSessionAndIssueTokens({id: account.id}, payload.type, {
        familyId: session.familyId,
        meta
      });
    }

    const newJti = randomUUID();
    const rotated = await refreshSessionRepository.rotate(
      payload.jti,
      newJti
    );

    if (!rotated) {
      const current = await refreshSessionRepository.findByJti(payload.jti);

      if (
        !current ||
        current.revokedAt ||
        !current.rotatedAt ||
        !isWithinGraceWindow(current.rotatedAt)
      ) {
        if (current && !current.revokedAt) {
          await refreshSessionRepository.revokeFamily(current.familyId);
        }
        throw new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid token');
      }

      return createSessionAndIssueTokens({id: account.id}, payload.type, {
        familyId: current.familyId,
        meta
      });
    }

    await refreshSessionRepository.create({
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
      refreshToken: signRefreshToken(
        account.id,
        payload.type,
        newJti,
        session.familyId
      )
    };
  },

  async logout(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET
      ) as RefreshTokenPayload;

      if (!payload.jti) return;

      const session = await refreshSessionRepository.findByJti(payload.jti);
      if (session) {
        await refreshSessionRepository.revokeFamily(session.familyId);
      }
    } catch {}
  }
};
