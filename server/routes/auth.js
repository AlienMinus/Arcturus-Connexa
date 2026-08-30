import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Otp from '../models/Otp.js';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/passwordUtils.js';
import { generateAccessToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwtUtils.js';
import { sendPasswordResetEmail, sendOtpEmail } from '../utils/email.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Send Registration OTP
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered. Please sign in.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous OTP for this email
    await Otp.deleteMany({ email: normalizedEmail, purpose: 'registration' });

    // Store new OTP
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      purpose: 'registration',
    });

    // Send OTP via EmailJS
    try {
      await sendOtpEmail({
        to: normalizedEmail,
        otpCode,
        user: { firstName: firstName || 'Member' },
        expiresMinutes: 10,
      });
    } catch (emailErr) {
      console.warn('Failed to send OTP email:', emailErr.message);
    }

    res.status(200).json({
      message: `Verification code sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, dateOfBirth, phoneNumber, location, otp } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !dateOfBirth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    if (!otp) {
      return res.status(400).json({ error: 'Verification code (OTP) is required' });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'registration',
      otp: otp.toString().trim(),
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const baseUsername = email.toLowerCase().split('@')[0].replace(/[^a-z0-9]+/g, '');
    let username = baseUsername || `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
    let usernameCandidate = username;
    let usernameCounter = 1;
    while (await User.findOne({ username: usernameCandidate })) {
      usernameCandidate = `${username}${usernameCounter++}`;
    }
    username = usernameCandidate;

    // Create user
    const user = new User({
      firstName,
      middleName: middleName || '',
      lastName,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      dateOfBirth,
      phoneNumber: phoneNumber || '',
      location: location || '',
      passwordHistory: [
        {
          hash: hashedPassword,
          createdAt: new Date(),
        },
      ],
    });

    await user.save();

    // Create profile for new user
    const profile = new Profile({
      userId: user._id,
      name: `${firstName} ${lastName}`,
      headline: '',
      location: location || '',
      summary: '',
      featured: [],
      activity: [],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      skills: [],
      honors: [],
      interests: [],
    });
    await profile.save();

    // Generate token
    const token = generateAccessToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateAccessToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        headline: user.headline,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user._id);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail({ to: user.email, resetToken, user });
    } catch (emailErr) {
      console.warn('Could not dispatch password reset email:', emailErr.message);
    }

    res.status(200).json({
      message: 'Password reset link has been dispatched to your email address.',
      resetToken, // Retained for immediate testing convenience
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Failed to process forgot password' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyPasswordResetToken(resetToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.passwordResetToken || user.passwordResetToken !== resetToken) {
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    if (new Date() > user.passwordResetExpires) {
      return res.status(401).json({ error: 'Reset token has expired' });
    }

    // Check if new password is different from old passwords
    const isPreviousPassword = await Promise.all(
      user.passwordHistory.map((ph) => comparePassword(newPassword, ph.hash))
    );

    if (isPreviousPassword.some((result) => result)) {
      return res.status(400).json({ error: 'Cannot reuse previous passwords' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password history
    user.passwordHistory.push({
      hash: hashedPassword,
      createdAt: new Date(),
    });

    // Keep only last 5 passwords
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift();
    }

    // Update password and clear reset tokens
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

// Change password (protected route)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push({ hash: hashedPassword, createdAt: new Date() });
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift();
    }
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Failed to update password' });
  }
});

// Get current user (protected route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -passwordHistory');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

export default router;
