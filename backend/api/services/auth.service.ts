import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';
import {customerRepository} from '../repositories/customer.repository';
import {adminRepository} from '../repositories/admin.repository';
import {ApiError} from '../utils/error';
import {emailService} from './email.service';
import {verificationCodeEmailTemplate} from '../templates/verificationCodeEmail
import {resetPasswordEmailTemplate} from '../templates/resetPasswordEmail';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getVerificationExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export const authService = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    username: string;
  }) {
    const [existingEmail, existingPhone] = await Promise.all([
      customerRepository.findByEmail(data.email),
    ]);

    if (existingEmail) {
      throw new ApiError(409, 'EMAIL_EXISTS', 'Email already exists');
    }

    if (existingPhone) {
      throw new ApiError(409, 'PHONE_EXISTS', 'Phone number already exists');
    }

    try {
      const passwordHash = await bcrypt.hash(data.password, 10);
      const verificationCode = generateVerificationCode();
      const verificationExpiry = getVerificationExpiry(10);

      const customer = await customerRepository.create({
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

      return {id: customer.id, email: customer.email};
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
          throw new ApiError(
            409,
            'PHONE_EXISTS',
            'Phone number already exists'
          );
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
    const customer = await customerRepository.findByEmail(email);

    if (
      !customer ||
      !customer.verificationCode ||
      !customer.verificationExpiry
    ) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid verification code');
    }

    const codeMatches = customer.verificationCode === code;
    const notExpired = customer.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(
        400,
        'EXPIRED_CODE',
        'Verification code expired or invalid'
      );
    }

    await customerRepository.markVerified(email);
  },

  async resendVerification(email: string) {
    const customer = await customerRepository.findByEmail(email);
    if (!customer) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (customer.isVerified) {
      throw new ApiError(400, 'ALREADY_VERIFIED', 'Email already verified');
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry(10);

    await customerRepository.setVerificationCode(
      email,
      verificationCode,
      verificationExpiry
    );

    const emailTpl = verificationCodeEmailTemplate({
      code: verificationCode,
      expiresMinutes: 10,
      recipientName: customer.firstName
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
    const customer = await customerRepository.findByEmail(email);

    if (!customer || !customer.isVerified) return;

    const resetCode = generateVerificationCode();
    const resetExpiry = getVerificationExpiry(10);

    await customerRepository.setVerificationCode(email, resetCode, resetExpiry);

    await authService.sendResetPasswordCodeEmail({
      email,
      code: resetCode,
      recipientName: customer.firstName
    });
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const customer = await customerRepository.findByEmail(email);

    if (
      !customer ||
      !customer.verificationCode ||
      !customer.verificationExpiry
    ) {
      throw new ApiError(400, 'INVALID_CODE', 'Invalid or expired reset code');
    }

    const codeMatches = customer.verificationCode === code;
    const notExpired = customer.verificationExpiry > new Date();

    if (!codeMatches || !notExpired) {
      throw new ApiError(400, 'EXPIRED_CODE', 'Reset code expired or invalid');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Clear the code then update the password
    await customerRepository.clearVerificationCode(email);
    await customerRepository.updateProfile(customer.id, {passwordHash} as any);
  },

  async login(email: string, password: string) {
    const identifier = email;
    const [customer, admin] = await Promise.all([
      adminRepository.findByEmailOrUsername(identifier)
    ]);

    const user = customer || admin;
    const userType = customer
      ? 'customer'
      : admin
          ? 'admin'
          : null;

    if (!user || !userType) {
      throw new ApiError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    if (!user.isVerified) {
      throw new ApiError(403, 'NOT_VERIFIED', 'Email not verified');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new ApiError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    const accessToken: string = jwt.sign(
      {userId: user.id, type: userType},
      env.JWT_SECRET,
      {expiresIn: '15m'}
    );

    const refreshToken = jwt.sign(
      {userId: user.id, type: userType},
      env.JWT_REFRESH_SECRET,
      {expiresIn: '7d'}
    );

    return {accessToken, refreshToken, user, userType};
  },

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        type?: 'customer' | 'admin';
      };

      const tokenType = payload.type;

      let userType: 'customer' | 'admin' | null = null;
      let user: any = null;

      if (tokenType) {
        userType = tokenType;
        user = await (tokenType === 'customer'
          ? customerRepository.findById(payload.userId)
          : tokenType === 'admin'
            ? adminRepository.findById(payload.userId)
            : null);
      } else {
        const [customer, admin] = await Promise.all([
          customerRepository.findById(payload.userId),
          adminRepository.findById(payload.userId)
        ]);

        user = customer || admin;
        userType = customer
          ? 'customer'
          : admin
            ? 'admin'
            : admin
              ? 'admin'
              : null;
      }

      if (!user || !userType) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token');
      }

      if (!user.isVerified) {
        throw new ApiError(403, 'NOT_VERIFIED', 'Email not verified');
      }

      const accessToken = jwt.sign(
        {userId: user.id, type: userType},
        env.JWT_SECRET,
        {expiresIn: '15m'}
      );

      return {accessToken};
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token');
    }
  }
};