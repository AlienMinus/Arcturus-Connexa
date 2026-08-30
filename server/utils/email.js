import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends an email using the EmailJS REST API (https://www.emailjs.com)
 *
 * Dedicated Template IDs:
 * - EMAILJS_TEMPLATE_RESET_PASSWORD : For Password Reset Emails
 * - EMAILJS_TEMPLATE_OTP            : For OTP Verification Codes
 */
export const sendEmailJS = async ({
  serviceId,
  templateId,
  publicKey,
  privateKey,
  templateParams = {},
}) => {
  const service_id = serviceId || process.env.EMAILJS_SERVICE_ID;
  const template_id = templateId;
  const user_id = publicKey || process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
  const accessToken = privateKey || process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN;

  if (!service_id || !template_id || !user_id) {
    console.log(`\n================= [EMAILJS CONFIGURATION REQUIRED] =================`);
    console.log(`ℹ️ EmailJS requires the following environment variables:`);
    console.log(`  - EMAILJS_SERVICE_ID: ${service_id ? '✓ Configured' : '✗ Missing'}`);
    console.log(`  - Target Template ID: ${template_id ? `✓ ${template_id}` : '✗ Missing (Set specific template variable)'}`);
    console.log(`  - EMAILJS_PUBLIC_KEY: ${user_id ? '✓ Configured' : '✗ Missing'}`);
    console.log(`\nTarget Parameters:`, templateParams);
    console.log(`====================================================================\n`);
    return { success: false, devMode: true, message: 'Missing required EmailJS credentials or template ID' };
  }

  const payload = {
    service_id,
    template_id,
    user_id,
    template_params: templateParams,
  };

  if (accessToken) {
    payload.accessToken = accessToken;
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();

    if (res.ok) {
      console.log(`[EmailJS Success] Template "${template_id}" dispatched to ${templateParams.to_email || templateParams.email} (Status: ${res.status})`);
      return { success: true, response: responseText };
    } else {
      console.error(`[EmailJS Error] Status: ${res.status}, Response:`, responseText);
      return { success: false, error: responseText };
    }
  } catch (err) {
    console.error(`[EmailJS Request Failed]:`, err.message);
    throw err;
  }
};

/**
 * 1. Sends Password Reset Email (Requires EMAILJS_TEMPLATE_RESET_PASSWORD)
 */
export const sendPasswordResetEmail = async ({ to, resetToken, user }) => {
  const templateId = process.env.EMAILJS_TEMPLATE_RESET_PASSWORD;
  const clientUrl = process.env.CLIENT_URL || 'https://arcturus-connexa.vercel.app';
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Member';

  const templateParams = {
    to_email: to,
    email: to,
    to_name: userName,
    user_name: userName,
    reset_link: resetUrl,
    reset_url: resetUrl,
    token: resetToken,
    message: `Reset your password by visiting: ${resetUrl}`,
    app_name: 'Arcturus Connexa',
  };

  return sendEmailJS({
    templateId,
    templateParams,
  });
};

/**
 * 2. Sends OTP Verification Code Email (Requires EMAILJS_TEMPLATE_OTP)
 */
export const sendOtpEmail = async ({ to, otpCode, user, expiresMinutes = 10 }) => {
  const templateId = process.env.EMAILJS_TEMPLATE_OTP;
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Member';

  const templateParams = {
    to_email: to,
    email: to,
    to_name: userName,
    user_name: userName,
    otp_code: otpCode,
    passcode: otpCode,
    expires_in: `${expiresMinutes} minutes`,
    message: `Your one-time verification code is: ${otpCode}. It expires in ${expiresMinutes} minutes.`,
    app_name: 'Arcturus Connexa',
  };

  return sendEmailJS({
    templateId,
    templateParams,
  });
};

/**
 * Generic email sender (Requires explicit templateId)
 */
export const sendEmail = async ({ to, subject, html, text, templateId }) => {
  return sendEmailJS({
    templateId,
    templateParams: {
      to_email: to,
      email: to,
      subject,
      html,
      message: text || html,
    },
  });
};

export default {
  sendEmailJS,
  sendPasswordResetEmail,
  sendOtpEmail,
  sendEmail,
};
