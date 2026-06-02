import { v2 as cloudinary } from 'cloudinary';

// Support both explicit env vars or a single CLOUDINARY_URL
const rawUrl = process.env.CLOUDINARY_URL?.trim();
const rawName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const rawKey = process.env.CLOUDINARY_API_KEY?.trim();
const rawSecret = process.env.CLOUDINARY_API_SECRET?.trim();

const config = {};

if (rawUrl) {
  try {
    const url = new URL(rawUrl);
    config.cloud_name = url.hostname;
    config.api_key = url.username;
    config.api_secret = url.password;
  } catch (err) {
    console.warn('Invalid CLOUDINARY_URL format, falling back to individual env vars');
  }
}

if (!config.api_key || !config.api_secret || !config.cloud_name) {
  config.cloud_name = config.cloud_name || rawName;
  config.api_key = config.api_key || rawKey;
  config.api_secret = config.api_secret || rawSecret;
}

cloudinary.config({
  ...config,
  secure: true,
});

if (!config.api_key || !config.api_secret || !config.cloud_name) {
  console.warn('Cloudinary config incomplete:', {
    cloud_name: Boolean(config.cloud_name),
    api_key: Boolean(config.api_key),
    api_secret: Boolean(config.api_secret),
  });
}

export default cloudinary;
