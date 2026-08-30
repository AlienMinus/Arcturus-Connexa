import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends an email using the EmailJS REST API (https://www.emailjs.com)
 *
 * Required Environment Variables in Render or .env:
 * - EMAILJS_SERVICE_ID  (e.g., service_xxxxxxx)
 * - EMAILJS_TEMPLATE_ID (e.g., template_xxxxxxx)
 * - EMAILJS_PUBLIC_KEY  (e.g., your public key / user_id)
 * - EMAILJS_PRIVATE_KEY (optional: your private API key / accessToken)
 */
export const sendEmailJS = async ({
  serviceId,
  templateId,
  publicKey,
  privateKey,
  templateParams = {},
}) => {
  const service_id = serviceId || process.env.EMAILJS_SERVICE_ID;
  const template_id = templateId || process.env.EMAILJS_TEMPLATE_ID;
  const user_id = publicKey || process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
  const accessToken = privateKey || process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN;

  if (!service_id || !template_id || !user_id) {
    console.log(`\n================= [EMAILJS CONFIGURATION REQUIRED] =================`);
    console.log(`ℹ️ EmailJS requires 3 environment variables in your Render Dashboard:`);
    console.log(`  1. EMAILJS_SERVICE_ID  (Your EmailJS Service ID)`);
    console.log(`  2. EMAILJS_TEMPLATE_ID (Your EmailJS Template ID)`);
    console.log(`  3. EMAILJS_PUBLIC_KEY  (Your EmailJS Public Key / User ID)`);
    console.log(`  4. EMAILJS_PRIVATE_KEY (Optional: If private key authentication is enabled)`);
    console.log(`\nDispatched Parameters:`, templateParams);
    console.log(`====================================================================\n`);
    return { success: false, devMode: true, message: 'EmailJS credentials not set' };
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
      console.log(`[EmailJS Success] Email dispatched successfully to ${templateParams.to_email || templateParams.email || 'recipient'} (Status: ${res.status})`);
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
 * Sends Password Reset Email via EmailJS
 */
export const sendPasswordResetEmail = async ({ to, resetToken, user }) => {
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
    message: `You requested to reset your password. Click here to reset: ${resetUrl}`,
    app_name: 'Arcturus Connexa',
  };

  return sendEmailJS({
    templateParams,
  });
};

/**
 * Sends Welcome Email via EmailJS
 */
export const sendWelcomeEmail = async ({ to, user }) => {
  const userName = user?.firstName || 'Member';
  const clientUrl = process.env.CLIENT_URL || 'https://arcturus-connexa.vercel.app';

  const templateParams = {
    to_email: to,
    email: to,
    to_name: userName,
    user_name: userName,
    app_url: clientUrl,
    message: `Welcome to Arcturus! We are excited to have you join our professional community.`,
    app_name: 'Arcturus Connexa',
  };

  return sendEmailJS({
    templateParams,
  });
};

/**
 * Generic email sender
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  return sendEmailJS({
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
  sendWelcomeEmail,
  sendEmail,
};
