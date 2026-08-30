import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
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

const getFullName = (u) => {
  if (!u) return '';
  const parts = [u.firstName, u.middleName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (u.name || u.username || '');
};

const simplifyUser = (user) => ({
  id: user._id,
  username: user.username,
  name: getFullName(user),
  headline: user.headline || user.email,
  avatar: user.profilePicture || null,
});

const includesUser = (users, userId) =>
  users?.some((user) => (user?._id || user)?.toString() === userId) || false;

const buildProfileResponse = (targetUser, profile, currentUser) => {
  const currentUserId = currentUser?._id?.toString();
  const targetId = targetUser._id.toString();

  const isFollowing = currentUser
    ? includesUser(currentUser.following, targetId) || includesUser(targetUser.followers, currentUserId)
    : false;
  const isConnected = currentUser
    ? includesUser(currentUser.connections, targetId) || includesUser(targetUser.connections, currentUserId)
    : false;
  const hasOutgoingConnectionRequest = currentUser
    ? includesUser(currentUser.sentConnectionRequests, targetId) || includesUser(targetUser.pendingConnectionRequests, currentUserId)
    : false;
  const hasIncomingConnectionRequest = currentUser
    ? includesUser(currentUser.pendingConnectionRequests, targetId) || includesUser(targetUser.sentConnectionRequests, currentUserId)
    : false;

  const profileData = profile.toObject();
  const fullName = getFullName(targetUser) || profile.name || '';

  profileData.name = fullName;
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

  const profileViewsCount = targetUser.profileViewsCount || targetUser.profileViews?.length || 0;
  profileData.profileViewers = profileViewsCount;
  profileData.profileViewsCount = profileViewsCount;

  if (targetUser.profilePicture?.url) {
    profileData.avatar = targetUser.profilePicture;
  }

  // Username change rate-limiting info (max 2 changes per 15 rolling days)
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - FIFTEEN_DAYS_MS);
  const recentChanges = (targetUser.usernameChangeHistory || []).filter(
    (entry) => new Date(entry.changedAt) > cutoffDate
  );
  profileData.usernameChangesRemaining = Math.max(0, 2 - recentChanges.length);
  if (recentChanges.length >= 2) {
    const oldestRecent = [...recentChanges].sort(
      (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
    )[0];
    profileData.nextUsernameChangeDate = new Date(
      new Date(oldestRecent.changedAt).getTime() + FIFTEEN_DAYS_MS
    );
  } else {
    profileData.nextUsernameChangeDate = null;
  }

  return profileData;
};

const populateProfileUser = async (userId) =>
  User.findById(userId)
    .select('-password -passwordHistory -passwordResetToken -passwordResetExpires -verificationToken')
    .populate('followers', 'firstName middleName lastName username headline profilePicture')
    .populate('following', 'firstName middleName lastName username headline profilePicture')
    .populate('connections', 'firstName middleName lastName username headline profilePicture')
    .populate('pendingConnectionRequests', 'firstName middleName lastName username headline profilePicture')
    .populate('sentConnectionRequests', 'firstName middleName lastName username headline profilePicture');

const createDefaultProfileForUser = async (user) => {
  const profile = new Profile({
    userId: user._id,
    name: getFullName(user),
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
    const posts = await Post.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName middleName lastName username headline profilePicture')
      .populate('likes.userId', 'firstName middleName lastName username')
      .populate({
        path: 'repostedFrom',
        populate: { path: 'userId', select: 'firstName middleName lastName username headline profilePicture' },
      });

    profileData.posts = await Promise.all(posts.map(async (post) => {
      const userLike = post.likes.find((like) => like.userId?._id?.toString() === req.userId);
      const postAuthorName = getFullName(post.userId) || post.author || 'Anonymous';
      const repostAuthorName = post.repostedFrom?.userId ? getFullName(post.repostedFrom.userId) : (post.repostedFrom?.author || 'Anonymous');

      return {
        id: post._id,
        content: post.content,
        media: post.media,
        image: post.media?.[0]?.url,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        repostsCount: await Post.countDocuments({ repostedFrom: post._id }),
        createdAt: post.createdAt,
        repostedFrom: post.repostedFrom ? {
          id: post.repostedFrom._id,
          authorName: repostAuthorName,
          authorUsername: post.repostedFrom.userId?.username || '',
          authorHeadline: post.repostedFrom.userId?.headline || 'Member',
          authorAvatar: post.repostedFrom.userId?.profilePicture?.url || null,
          content: post.repostedFrom.content || '',
          image: post.repostedFrom.media?.[0]?.url || null,
        } : null,
        authorName: postAuthorName,
        authorUsername: post.userId?.username,
        authorHeadline: post.userId?.headline,
        authorAvatar: post.userId?.profilePicture?.url,
        hasLiked: !!userLike,
        userReactionType: userLike ? userLike.reactionType : null,
        likers: post.likes.map((like) => {
          const liker = like.userId;
          return liker ? getFullName(liker) : '';
        }).filter(Boolean),
      };
    }));

    const userPosts = await Post.find({ userId: req.userId });
    const postImpressions = userPosts.reduce((sum, p) => sum + (p.impressionsCount || p.impressions?.length || 0), 0);
    profileData.postImpressions = postImpressions;
    profileData.postImpressionsCount = postImpressions;

    res.json(profileData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Check username availability & character validation
router.get('/check-username/:username', authMiddleware, async (req, res) => {
  try {
    const rawUsername = (req.params.username || '').trim().toLowerCase();
    const USERNAME_REGEX = /^[a-z0-9@$\-_]{3,30}$/;

    if (!rawUsername) {
      return res.status(400).json({ available: false, message: 'Username cannot be empty.' });
    }

    if (rawUsername.length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters long.' });
    }

    if (rawUsername.length > 30) {
      return res.json({ available: false, message: 'Username cannot exceed 30 characters.' });
    }

    if (!USERNAME_REGEX.test(rawUsername)) {
      return res.json({
        available: false,
        message: 'Only letters, numbers, @, $, -, and _ are allowed.',
      });
    }

    const currentUser = req.userId ? await User.findById(req.userId) : null;
    if (currentUser && currentUser.username === rawUsername) {
      return res.json({
        available: true,
        isCurrent: true,
        message: 'This is your current username.',
      });
    }

    const existingUser = await User.findOne({ username: rawUsername });
    if (existingUser) {
      return res.json({
        available: false,
        message: `Username "${rawUsername}" is already taken.`,
      });
    }

    return res.json({
      available: true,
      message: `Username "${rawUsername}" is available! ✨`,
    });
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).json({ available: false, error: 'Failed to verify username availability' });
  }
});

// Get profile by username
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const targetUser = await User.findOne({ username })
      .select('-password -passwordHistory -passwordResetToken -passwordResetExpires -verificationToken')
      .populate('followers', 'firstName middleName lastName username headline profilePicture')
      .populate('following', 'firstName middleName lastName username headline profilePicture')
      .populate('connections', 'firstName middleName lastName username headline profilePicture')
      .populate('pendingConnectionRequests', 'firstName middleName lastName username headline profilePicture')
      .populate('sentConnectionRequests', 'firstName middleName lastName username headline profilePicture');

    if (!targetUser) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Record view if another user visits
    // Record view and generate notification if another user visits
    if (req.userId && req.userId.toString() !== targetUser._id.toString()) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentView = targetUser.profileViews?.some(
        (v) => v.viewerId?.toString() === req.userId && new Date(v.viewedAt) > tenMinutesAgo
      );

      if (!recentView) {
        targetUser.profileViews = targetUser.profileViews || [];
        targetUser.profileViews.push({ viewerId: req.userId, viewedAt: new Date() });
        targetUser.profileViewsCount = (targetUser.profileViewsCount || 0) + 1;

        // Fetch viewer's name for notification
        const viewer = await User.findById(req.userId).select('firstName middleName lastName name username');
        const viewerName = getFullName(viewer) || viewer?.username || 'Someone';

        targetUser.notifications = targetUser.notifications || [];
        targetUser.notifications.push({
          type: 'profile_view',
          message: `${viewerName} viewed your profile.`,
          fromUserId: req.userId,
          read: false,
          createdAt: new Date(),
        });

        await targetUser.save();

        User.findByIdAndUpdate(req.userId, {
          $push: {
            activities: {
              activityType: 'view',
              createdAt: new Date(),
            }
          }
        }).catch(() => {});
      }
    }

    let profile = await Profile.findOne({ userId: targetUser._id });
    if (!profile) {
      profile = await createDefaultProfileForUser(targetUser);
    }

    const posts = await Post.find({ userId: targetUser._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName middleName lastName username headline profilePicture')
      .populate('likes.userId', 'firstName middleName lastName username')
      .populate({
        path: 'repostedFrom',
        populate: { path: 'userId', select: 'firstName middleName lastName username headline profilePicture' },
      });

    const currentUser = await populateProfileUser(req.userId);
    const profileData = buildProfileResponse(targetUser, profile, currentUser);

    const targetUserPosts = await Post.find({ userId: targetUser._id });
    const postImpressions = targetUserPosts.reduce((sum, p) => sum + (p.impressionsCount || p.impressions?.length || 0), 0);
    profileData.postImpressions = postImpressions;
    profileData.postImpressionsCount = postImpressions;

    const currentUserId = req.userId;
    profileData.posts = await Promise.all(posts.map(async (post) => {
      const userLike = post.likes.find((like) => like.userId?._id?.toString() === currentUserId);
      const postAuthorName = getFullName(post.userId) || post.author || 'Anonymous';
      const repostAuthorName = post.repostedFrom?.userId ? getFullName(post.repostedFrom.userId) : (post.repostedFrom?.author || 'Anonymous');

      return {
        id: post._id,
        content: post.content,
        media: post.media,
        image: post.media?.[0]?.url,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        repostsCount: await Post.countDocuments({ repostedFrom: post._id }),
        createdAt: post.createdAt,
        repostedFrom: post.repostedFrom ? {
          id: post.repostedFrom._id,
          authorName: repostAuthorName,
          authorUsername: post.repostedFrom.userId?.username || '',
          authorHeadline: post.repostedFrom.userId?.headline || 'Member',
          authorAvatar: post.repostedFrom.userId?.profilePicture?.url || null,
          content: post.repostedFrom.content || '',
          image: post.repostedFrom.media?.[0]?.url || null,
        } : null,
        authorName: postAuthorName,
        authorUsername: post.userId?.username,
        authorHeadline: post.userId?.headline,
        authorAvatar: post.userId?.profilePicture?.url,
        hasLiked: !!userLike,
        userReactionType: userLike ? userLike.reactionType : null,
        likers: post.likes.map((like) => {
          const liker = like.userId;
          return liker ? getFullName(liker) : '';
        }).filter(Boolean),
      };
    }));

    res.json(profileData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Dedicated endpoint: Upload profile avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file provided' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await streamUpload(req.file.buffer, { folder: 'arcturus/profile' });
    const profilePicture = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    user.profilePicture = profilePicture;
    await user.save();

    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await createDefaultProfileForUser(user);
    }
    profile.avatar = profilePicture;
    await profile.save();

    const profileData = buildProfileResponse(user, profile, user);
    res.json({
      success: true,
      avatar: profilePicture,
      profile: profileData,
      message: 'Avatar updated successfully',
    });
  } catch (err) {
    console.error('Failed to upload avatar:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Dedicated endpoint: Upload profile cover banner
router.post('/cover', authMiddleware, upload.single('backgroundImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No cover image file provided' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await streamUpload(req.file.buffer, { folder: 'arcturus/profile' });
    const backgroundImage = {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    };

    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await createDefaultProfileForUser(user);
    }
    profile.backgroundImage = backgroundImage;
    await profile.save();

    const profileData = buildProfileResponse(user, profile, user);
    res.json({
      success: true,
      backgroundImage,
      profile: profileData,
      message: 'Cover banner updated successfully',
    });
  } catch (err) {
    console.error('Failed to upload cover banner:', err);
    res.status(500).json({ error: 'Failed to upload cover banner' });
  }
});

// Safe partial profile updates (JSON or multipart text)
const handleProfileUpdate = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      name,
      username,
      firstName,
      middleName,
      lastName,
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

    const updateData = {};

    // Username handling & 15-day rate limit (max 2 changes)
    if (typeof username === 'string' && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      const USERNAME_REGEX = /^[a-z0-9@$\-_]{3,30}$/;

      if (!USERNAME_REGEX.test(cleanUsername)) {
        return res.status(400).json({
          error: 'Username can only contain letters, numbers, @, $, -, and _ (between 3 and 30 characters).',
        });
      }

      if (cleanUsername !== user.username) {
        // Enforce max 2 changes within rolling 15 days
        const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - FIFTEEN_DAYS_MS);
        const recentChanges = (user.usernameChangeHistory || []).filter(
          (entry) => new Date(entry.changedAt) > cutoffDate
        );

        if (recentChanges.length >= 2) {
          const oldestRecent = [...recentChanges].sort(
            (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
          )[0];
          const canChangeAfter = new Date(
            new Date(oldestRecent.changedAt).getTime() + FIFTEEN_DAYS_MS
          );
          const daysRemaining = Math.ceil(
            (canChangeAfter.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
          );

          return res.status(400).json({
            error: `You can only change your username twice within 15 days. Limit reached. Next change available in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} (${canChangeAfter.toLocaleDateString()}).`,
          });
        }

        // Check uniqueness in database
        const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({
            error: `Username "${cleanUsername}" is already taken. Please choose another.`,
          });
        }

        // Record change in history
        user.usernameChangeHistory = user.usernameChangeHistory || [];
        user.usernameChangeHistory.push({
          changedAt: new Date(),
          oldUsername: user.username || '',
          newUsername: cleanUsername,
        });

        user.username = cleanUsername;
        updateData.username = cleanUsername;
      }
    }

    // Name handling
    if (firstName !== undefined) user.firstName = firstName;
    if (middleName !== undefined) user.middleName = middleName;
    if (lastName !== undefined) user.lastName = lastName;

    if (typeof name === 'string' && name.trim()) {
      const trimmedName = name.trim();
      const parts = trimmedName.split(/\s+/);
      if (parts.length === 1) {
        user.firstName = parts[0];
        user.middleName = '';
        user.lastName = '';
      } else if (parts.length === 2) {
        user.firstName = parts[0];
        user.middleName = '';
        user.lastName = parts[1];
      } else {
        user.firstName = parts[0];
        user.middleName = parts.slice(1, -1).join(' ');
        user.lastName = parts[parts.length - 1];
      }
      updateData.name = trimmedName;
    } else if (firstName !== undefined || lastName !== undefined) {
      updateData.name = getFullName(user);
    }

    if (headline !== undefined) {
      user.headline = headline;
      updateData.headline = headline;
    }
    if (location !== undefined) {
      user.location = location;
      updateData.location = location;
    }
    if (summary !== undefined) {
      updateData.summary = summary;
    }

    // Safe partial updates: only parse and set fields that are explicitly provided
    if (featured !== undefined) updateData.featured = parseJSONField(featured) || [];
    if (activity !== undefined) updateData.activity = parseJSONField(activity) || [];
    if (experience !== undefined) updateData.experience = parseJSONField(experience) || [];
    if (education !== undefined) updateData.education = parseJSONField(education) || [];
    if (certifications !== undefined) updateData.certifications = parseJSONField(certifications) || [];
    if (projects !== undefined) updateData.projects = parseJSONField(projects) || [];
    if (skills !== undefined) updateData.skills = parseJSONField(skills) || [];
    if (honors !== undefined) updateData.honors = normalizeHonors(honors) || [];
    if (interests !== undefined) updateData.interests = parseJSONField(interests) || [];

    // Save user document
    await user.save();

    // Update profile document
    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await createDefaultProfileForUser(user);
    }

    Object.assign(profile, updateData);
    await profile.save();

    const profileData = buildProfileResponse(user, profile, user);
    res.json(profileData);
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

router.post('/', authMiddleware, upload.none(), handleProfileUpdate);
router.patch('/', authMiddleware, upload.none(), handleProfileUpdate);

export default router;

