import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const streamUpload = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

const parseJSONField = (value) => {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
};

const normalizeHonors = (value) => {
  const parsed = parseJSONField(value);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return parsed.map((item) => {
      if (typeof item === 'string') {
        return { title: item };
      }
      return item;
    });
  }

  if (typeof parsed === 'string') {
    return parsed.split(',').map((item) => ({ title: item.trim() })).filter((item) => item.title);
  }

  return [];
};

// Get authenticated user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = await Profile.findOne({ userId: req.userId });

    if (!profile) {
      // Create default profile for new user
      profile = new Profile({
        userId: req.userId,
        name: `${user.firstName} ${user.lastName}`,
        headline: '',
        location: user.location || '',
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
    }

    // Merge user data with profile
    const profileData = profile.toObject();
    profileData.name = `${user.firstName} ${user.lastName}`;
    profileData.email = user.email;
    profileData.username = user.username;
    profileData.phoneNumber = user.phoneNumber;
    profileData.dateOfBirth = user.dateOfBirth;
    // Only include avatar if user has one
    if (user.profilePicture?.url) {
      profileData.avatar = user.profilePicture;
    }

    res.json(profileData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get profile by username
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        headline: '',
        location: user.location || '',
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
    }

    const profileData = profile.toObject();
    profileData.name = `${user.firstName} ${user.lastName}`;
    profileData.email = user.email;
    profileData.username = user.username;
    profileData.phoneNumber = user.phoneNumber;
    profileData.dateOfBirth = user.dateOfBirth;
    if (user.profilePicture?.url) {
      profileData.avatar = user.profilePicture;
    }

    res.json(profileData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update authenticated user's profile
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'backgroundImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        headline,
        location,
        summary,
        featured,
        activity,
        experience,
        education,
        certifications,
        projects,
        skills,
        honors,
        interests,
      } = req.body;

      const updateData = {
        headline: headline || user.headline || '',
        location: location || user.location || '',
        summary: summary || '',
      };

      // Handle avatar upload to Cloudinary
      if (req.files?.avatar?.[0]) {
        const result = await streamUpload(req.files.avatar[0].buffer, { folder: 'arcturus/profile' });
        user.profilePicture = {
          url: result.secure_url,
          public_id: result.public_id,
        };
        await user.save();
      }

      // Handle background image
      if (req.files?.backgroundImage?.[0]) {
        const result = await streamUpload(req.files.backgroundImage[0].buffer, {
          folder: 'arcturus/profile',
        });
        updateData.backgroundImage = {
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        };
      }

      const parsed = {
        featured: parseJSONField(featured) || [],
        activity: parseJSONField(activity) || [],
        experience: parseJSONField(experience) || [],
        education: parseJSONField(education) || [],
        certifications: parseJSONField(certifications) || [],
        projects: parseJSONField(projects) || [],
        skills: parseJSONField(skills) || [],
        honors: normalizeHonors(honors) || [],
        interests: parseJSONField(interests) || [],
      };

      Object.assign(updateData, parsed);

      let profile = await Profile.findOne({ userId: req.userId });
      if (!profile) {
        profile = new Profile({
          userId: req.userId,
          name: `${user.firstName} ${user.lastName}`,
          ...updateData,
        });
      } else {
        Object.assign(profile, updateData);
      }

      await profile.save();

      // Return merged profile data
      const profileData = profile.toObject();
      profileData.name = `${user.firstName} ${user.lastName}`;
      profileData.email = user.email;
      if (user.profilePicture?.url) {
        profileData.avatar = user.profilePicture;
      }

      res.json(profileData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }
);

export default router;
