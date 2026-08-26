import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';
import {userRepository} from '../repositories/user.repository';
import {adminRepository} from '../repositories/admin.repository';
import {ApiError} from '../utils/error';
import {emailService} from './email.service';
import {verificationCodeEmailTemplate} from '../templates/verificationCodeEmail';
import {resetPasswordEmailTemplate} from '../templates/resetPasswordEmail';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getVerificationExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

type RefreshTokenPayload = {
  userId: string;
  type?: 'user' | 'admin';
};

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
      throw new ApiError(409, 'EMAIL_EXISTS', 'Email already exists');
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
    } catch (err: any) {
      const code = err?.code;
      const rawMessage = String(err?.message ?? '');
      const keyPattern = err?.keyPattern;

      if (
        code === 11000 ||
        rawMessage.toLowerCase().includes('e11000') ||
        rawMessage.toLowerCase().includes('duplicate key')
      ) {
        const isUsername = !!(
          keyPattern &&
          typeof keyPattern === 'object' &&
          'username' in keyPattern
        );

        const isEmail = !!(
          keyPattern &&
          typeof keyPattern === 'object' &&
          'email' in keyPattern
        );

        if (isUsername || rawMessage.toLowerCase().includes('username')) {
          throw new ApiError(409, 'USERNAME_EXISTS', 'username already exists');
        }

        if (isEmail || rawMessage.toLowerCase().includes('email')) {
          throw new ApiError(409, 'EMAIL_EXISTS', 'Email already exists');
        }

        throw new ApiError(409, 'ACCOUNT_EXISTS', 'Account already exists');
      }

      throw err;
    }
  },

  async verify(email: string, code: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.verificationCode || !user.verificationExpiry) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid verification code');
    }

    const codeMatches = user.verificationCode === code;
    const notExpired = user.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(
        400,
        'EXPIRED_CODE',
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

    await userRepository.setVerificationCode(email, resetCode, resetExpiry);

    await authService.sendResetPasswordCodeEmail({
      email,
      code: resetCode,
      recipientName: user.firstName
    });
  },

  async verifyResetCode(email: string, code: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.verificationCode || !user.verificationExpiry) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid or expired reset code');
    }

    const codeMatches = user.verificationCode === code;
    const notExpired = user.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(400, 'EXPIRED_CODE', 'Reset code expired or invalid');
    }
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.verificationCode || !user.verificationExpiry) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid or expired reset code');
    }

    const codeMatches = user.verificationCode === code;
    const notExpired = user.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(400, 'EXPIRED_CODE', 'Reset code expired or invalid');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await userRepository.clearVerificationCode(email);
    await userRepository.updateProfile(user.id, {passwordHash} as any);
  },

  async login(email: string, password: string) {
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
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    if (!account.isVerified) {
      throw new ApiError(403, 'NOT_VERIFIED', 'Email not verified');
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      throw new ApiError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    const accessToken: string = jwt.sign(
      {userId: account.id, type: userType},
      env.JWT_SECRET,
      {expiresIn: '15m'}
    );

    const refreshToken = jwt.sign(
      {userId: account.id, type: userType},
      env.JWT_REFRESH_SECRET,
      {expiresIn: '7d'}
    );

    return {accessToken, refreshToken, user: account, userType};
  },

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET
      ) as RefreshTokenPayload;

      const tokenType = payload.type;

      let userType: 'user' | 'admin' | null = null;
      let account: any = null;

      if (tokenType) {
        userType = tokenType;
        account = await (tokenType === 'user'
          ? userRepository.findById(payload.userId)
          : tokenType === 'admin'
            ? adminRepository.findById(payload.userId)
            : null);
      } else {
        const [user, admin] = await Promise.all([
          userRepository.findById(payload.userId),
          adminRepository.findById(payload.userId)
        ]);

        account = user || admin;
        userType = user ? 'user' : admin ? 'admin' : null;
      }

      if (!account || !userType) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token');
      }

      if (!account.isVerified) {
        throw new ApiError(403, 'NOT_VERIFIED', 'Email not verified');
      }

      const accessToken = jwt.sign(
        {userId: account.id, type: userType},
        env.JWT_SECRET,
        {expiresIn: '15m'}
      );

      return {accessToken};
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token');
    }
  }
};
