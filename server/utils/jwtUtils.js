import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const RESET_TOKEN_SECRET = process.env.JWT_RESET_SECRET || 'reset-secret-key-change-in-production';

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' });
};

export const generatePasswordResetToken = (userId) => {
  return jwt.sign({ userId }, RESET_TOKEN_SECRET, { expiresIn: '1h' });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const verifyPasswordResetToken = (token) => {
  try {
    return jwt.verify(token, RESET_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
};
