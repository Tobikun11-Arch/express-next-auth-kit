"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const error_1 = require("../utils/error");
const errorCodes_1 = require("../constants/errorCodes");
function getSmtpConfig() {
    const host = env_1.env.SMTP_HOST;
    const portRaw = env_1.env.SMTP_PORT;
    const user = env_1.env.SMTP_USER;
    const pass = env_1.env.SMTP_PASS;
    const from = env_1.env.SMTP_FROM;
    if (!host || !portRaw || !user || !pass || !from) {
        throw new error_1.ApiError(500, errorCodes_1.ErrorCodes.SMTP_NOT_CONFIGURED, 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in environment variables.');
    }
    const port = Number(portRaw);
    if (!Number.isFinite(port) || port <= 0) {
        throw new error_1.ApiError(500, errorCodes_1.ErrorCodes.SMTP_BAD_PORT, 'SMTP_PORT must be a valid number');
    }
    return { host, port, user, pass, from };
}
let transporter = null;
function getTransporter() {
    if (!transporter) {
        const { host, port, user, pass } = getSmtpConfig();
        transporter = nodemailer_1.default.createTransport({
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
exports.emailService = {
    async sendEmail({ to, subject, text, html }) {
        const { from } = getSmtpConfig();
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
