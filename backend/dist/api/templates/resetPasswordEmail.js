"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordEmailTemplate = resetPasswordEmailTemplate;
function resetPasswordEmailTemplate({ appName = 'your app name', code, expiresMinutes, recipientName }) {
    const safeRecipient = recipientName?.trim();
    const title = `Reset your ${appName} password`;
    const text = `${safeRecipient ? `Hi ${safeRecipient},` : 'Hi,'}\n\n` +
        `We received a request to reset your ${appName} account password. Use the code below to proceed:\n\n` +
        `Reset Code: ${code}\n\n` +
        `This code will expire in ${expiresMinutes} minutes. If you didn’t request a password reset, please ignore this email — your account is still secure.\n\n` +
        `Stay safe,\n` +
        `The ${appName} Team`;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border-radius:14px;padding:24px;border:1px solid #e7eaf2;">
        <div style="font-size:18px;font-weight:700;color:#111827;">${appName}</div>
        <div style="margin-top:12px;font-size:14px;color:#374151;line-height:1.5;">
          ${safeRecipient ? `Hi ${safeRecipient},` : 'Hi,'}
        </div>
        <div style="margin-top:10px;font-size:14px;color:#374151;line-height:1.5;">
          We received a request to reset your ${appName} account password. Use the code below to proceed:
        </div>

        <div style="margin:18px 0;padding:18px;border-radius:12px;background:#f9fafb;border:1px dashed #d1d5db;text-align:center;">
          <div style="letter-spacing:8px;font-size:26px;font-weight:800;color:#111827;">${code}</div>
          <div style="margin-top:10px;font-size:12px;color:#6b7280;">Expires in ${expiresMinutes} minutes</div>
        </div>

        <div style="font-size:13px;color:#6b7280;line-height:1.5;">
          This code will expire in ${expiresMinutes} minutes. If you didn’t request a password reset, please ignore this email — your account is still secure.
        </div>

        <div style="margin-top:14px;font-size:13px;color:#6b7280;line-height:1.5;">
          Stay safe,<br />
          The ${appName} Team
        </div>
      </div>
      <div style="margin-top:14px;text-align:center;font-size:12px;color:#9ca3af;">
        © ${new Date().getFullYear()} ${appName}
      </div>
    </div>
  </body>
</html>`;
    return { subject: title, text, html };
}
