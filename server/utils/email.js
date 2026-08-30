import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates the Nodemailer transporter using environment variables or a fallback logger.
 */
const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_SERVICE,
    EMAIL_USER,
    EMAIL_PASS,
  } = process.env;

  // Custom SMTP configuration
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  // Pre-configured service (e.g. Gmail, SendGrid, Mailgun)
  if (EMAIL_SERVICE && EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  // Generic Email user/pass configuration
  if (EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  // Fallback dev transporter (logs to console)
  return null;
};

const transporter = createTransporter();

/**
 * Base Send Email function
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@arcturus.dev';
  const mailOptions = {
    from: `"Arcturus Connexa" <${fromAddress}>`,
    to,
    subject,
    text: text || '',
    html: html || text || '',
  };

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Sent] Message sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // In development when no SMTP credentials are configured in .env
      console.log(`\n================= [DEV EMAIL DISPATCH] =================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${mailOptions.from}`);
      console.log(`Body:\n${text || html}`);
      console.log(`========================================================\n`);
      return { success: true, devMode: true };
    }
  } catch (err) {
    console.error(`[Email Error] Failed to send email to ${to}:`, err);
    throw err;
  }
};

/**
 * Sends a password reset email with formatted HTML template and link.
 */
export const sendPasswordResetEmail = async ({ to, resetToken, user }) => {
  const clientUrl = process.env.CLIENT_URL || 'https://arcturus-connexa.vercel.app';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
  const userName = user?.firstName || 'Valued Member';

  const subject = '🔐 Reset Your Arcturus Password';
  const text = `Hi ${userName},\n\nYou recently requested to reset the password for your Arcturus account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis reset link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest,\nThe Arcturus Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 30px; color: #f8fafc; }
        .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
        .logo { font-size: 24px; font-weight: 800; color: #60a5fa; margin-bottom: 20px; letter-spacing: -0.5px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
        p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
        .btn-container { margin: 28px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 30px; text-align: center; }
        .link-box { word-break: break-all; font-size: 12px; color: #94a3b8; background: #0f172a; padding: 12px; border-radius: 8px; margin-top: 20px; border: 1px solid #334155; }
        .footer { font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ Arcturus</div>
        <h1>Password Reset Request</h1>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>We received a request to reset your password for your Arcturus account. Click the button below to choose a new password:</p>
        <div class="btn-container">
          <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
        </div>
        <p>This password reset link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email.</p>
        <div class="link-box">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #60a5fa;">${resetUrl}</a>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Arcturus Connexa Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, text });
};

/**
 * Sends a welcome email upon successful user registration.
 */
export const sendWelcomeEmail = async ({ to, user }) => {
  const userName = user?.firstName || 'Member';
  const subject = '🚀 Welcome to Arcturus!';
  const text = `Hi ${userName},\n\nWelcome to Arcturus! We are thrilled to have you in our professional network.\n\nStart exploring posts, connecting with peers, and discovering job opportunities today.\n\nBest,\nThe Arcturus Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 30px; color: #f8fafc; }
        .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; }
        .logo { font-size: 24px; font-weight: 800; color: #60a5fa; margin-bottom: 20px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; }
        p { font-size: 15px; line-height: 1.6; color: #cbd5e1; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 30px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ Arcturus</div>
        <h1>Welcome to Arcturus, ${userName}! 🎉</h1>
        <p>Thank you for joining our community of builders, designers, and innovators.</p>
        <p>You can now build your professional profile, share updates, explore curated jobs, and connect with peers.</p>
        <a href="${process.env.CLIENT_URL || 'https://arcturus-connexa.vercel.app'}" target="_blank" class="btn">Go to Feed</a>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html, text });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};

