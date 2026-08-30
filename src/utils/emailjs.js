import emailjs from '@emailjs/browser';

/**
 * Initializes EmailJS with your Public Key
 */
export const initEmailJS = (publicKey) => {
  const key = publicKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (key) {
    emailjs.init(key);
  }
};

/**
 * Sends an email template using @emailjs/browser
 */
export const sendClientEmail = async ({
  serviceId,
  templateId,
  templateParams,
  publicKey,
}) => {
  const service_id = serviceId || import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const template_id = templateId || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const public_key = publicKey || import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!service_id || !template_id || !public_key) {
    console.warn('[EmailJS Frontend] Missing VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, or VITE_EMAILJS_PUBLIC_KEY');
    return null;
  }

  try {
    const result = await emailjs.send(service_id, template_id, templateParams, public_key);
    console.log('[EmailJS Frontend Success]', result.text);
    return result;
  } catch (error) {
    console.error('[EmailJS Frontend Error]', error);
    throw error;
  }
};

export default {
  initEmailJS,
  sendClientEmail,
};

