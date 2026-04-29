import nodemailer from 'nodemailer';
import {env} from '../config/env';
import {ApiError} from '../utils/error';

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getSmtpConfig() {
  const host = env.SMTP_HOST;
  const portRaw = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM;

  if (!host || !portRaw || !user || !pass || !from) {
    throw new ApiError(
      500,
      'SMTP_NOT_CONFIGURED',
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in environment variables.'
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new ApiError(
      500,
      'SMTP_BAD_PORT',
      'SMTP_PORT must be a valid number'
    );
  }

  return {host, port, user, pass, from};
}

export const emailService = {
  async sendEmail({to, subject, text, html}: SendEmailParams) {
    const {host, port, user, pass, from} = getSmtpConfig();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
  }
};