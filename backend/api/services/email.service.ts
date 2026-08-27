import nodemailer from 'nodemailer';
import type {Transporter} from 'nodemailer';
import {env} from '../config/env';
import {ApiError} from '../utils/error';
import {ErrorCodes} from '../constants/errorCodes';

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
      ErrorCodes.SMTP_NOT_CONFIGURED,
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in environment variables.'
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new ApiError(
      500,
      ErrorCodes.SMTP_BAD_PORT,
      'SMTP_PORT must be a valid number'
    );
  }

  return {host, port, user, pass, from};
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const {host, port, user, pass} = getSmtpConfig();
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }
  return transporter;
}

export const emailService = {
  async sendEmail({to, subject, text, html}: SendEmailParams) {
    const {from} = getSmtpConfig();
    const mailer = getTransporter();

    await mailer.sendMail({
      from,
      to,
      subject,
      text,
      html
    });
  }
};