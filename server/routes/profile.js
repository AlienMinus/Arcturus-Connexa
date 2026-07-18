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

const simplifyUser = (user) => ({
  id: user._id,
  username: user.username,
  name: `${user.firstName} ${user.lastName}`,
  headline: user.headline || user.email,
  avatar: user.profilePicture || null,
});

const buildProfileResponse = (targetUser, profile, currentUser) => {
  const currentUserId = currentUser?._id?.toString();
  const targetId = targetUser._id.toString();

  const isFollowing = currentUser
    ? currentUser.following?.some((id) => id.toString() === targetId)
    : false;
  const isConnected = currentUser
    ? currentUser.connections?.some((id) => id.toString() === targetId)
    : false;
  const hasOutgoingConnectionRequest = currentUser
    ? currentUser.sentConnectionRequests?.some((id) => id.toString() === targetId)
    : false;
  const hasIncomingConnectionRequest = currentUser
    ? currentUser.pendingConnectionRequests?.some((id) => id.toString() === targetId)
    : false;

  const profileData = profile.toObject();

  profileData.name = `${targetUser.firstName} ${targetUser.lastName}`;
  profileData.email = targetUser.email;
  profileData.username = targetUser.username;
  profileData.phoneNumber = targetUser.phoneNumber;
  profileData.dateOfBirth = targetUser.dateOfBirth;
  profileData.followersCount = targetUser.followers?.length || 0;
  profileData.followingCount = targetUser.following?.length || 0;
  profileData.connectionsCount = targetUser.connections?.length || 0;
  profileData.followers = (targetUser.followers || []).map(simplifyUser);
  profileData.following = (targetUser.following || []).map(simplifyUser);
  profileData.connections = (targetUser.connections || []).map(simplifyUser);
  profileData.isFollowing = isFollowing;
  profileData.isConnected = isConnected;
  profileData.hasOutgoingConnectionRequest = hasOutgoingConnectionRequest;
  profileData.hasIncomingConnectionRequest = hasIncomingConnectionRequest;
  profileData.userId = targetUser._id;

  if (targetUser.profilePicture?.url) {
    profileData.avatar = targetUser.profilePicture;
  }

  return profileData;
};

const populateProfileUser = async (userId) =>
  User.findById(userId)
    .select('-password -passwordHistory -passwordResetToken -passwordResetExpires -verificationToken')
    .populate('followers', 'firstName lastName username headline profilePicture')
    .populate('following', 'firstName lastName username headline profilePicture')
    .populate('connections', 'firstName lastName username headline profilePicture')
    .populate('pendingConnectionRequests', 'firstName lastName username headline profilePicture')
    .populate('sentConnectionRequests', 'firstName lastName username headline profilePicture');

const createDefaultProfileForUser = async (user) => {
  const profile = new Profile({
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
  return profile;
};

// Get authenticated user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const targetUser = await populateProfileUser(req.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await createDefaultProfileForUser(targetUser);
    }

    const profileData = buildProfileResponse(targetUser, profile, targetUser);
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
    const targetUser = await User.findOne({ username })
      .select('-password -passwordHistory -passwordResetToken -passwordResetExpires -verificationToken')
      .populate('followers', 'firstName lastName username headline profilePicture')
      .populate('following', 'firstName lastName username headline profilePicture')
      .populate('connections', 'firstName lastName username headline profilePicture');

    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let profile = await Profile.findOne({ userId: targetUser._id });
    if (!profile) {
      profile = await createDefaultProfileForUser(targetUser);
    }

    const currentUser = await populateProfileUser(req.userId);
    const profileData = buildProfileResponse(targetUser, profile, currentUser);

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

      const profileData = buildProfileResponse(user, profile, user);
      res.json(profileData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save profile' });
    }
  }
);

export default router;
