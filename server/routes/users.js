import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

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

const buildRelationshipState = (currentUser, targetUser) => {
  const targetId = targetUser._id.toString();
  return {
    id: targetUser._id,
    username: targetUser.username,
    name: getFullName(targetUser),
    headline: targetUser.headline || targetUser.email,
    avatar: targetUser.profilePicture || null,
    isFollowing: currentUser?.following?.some((id) => id.toString() === targetId) || false,
    isConnected: currentUser?.connections?.some((id) => id.toString() === targetId) || false,
    hasPendingRequest: currentUser?.sentConnectionRequests?.some((id) => id.toString() === targetId) || false,
    hasIncomingRequest: currentUser?.pendingConnectionRequests?.some((id) => id.toString() === targetId) || false,
  };
};

const includesUserId = (users, userId) =>
  users?.some((user) => (user?._id || user)?.toString() === userId) || false;

const sendNotificationToUsers = async (userIds, notification) => {
  if (!userIds || userIds.length === 0) return;
  await User.updateMany(
    { _id: { $in: userIds } },
    { $push: { notifications: notification } }
  );
};

// Get list of other users for messenger contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('firstName middleName lastName username email headline profilePicture')
      .limit(50)
      .lean();

    const contacts = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: req.userId, receiverId: user._id },
          { senderId: user._id, receiverId: req.userId }
        ]
      }).sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        senderId: user._id,
        receiverId: req.userId,
        read: false
      });

      return {
        id: user._id,
        username: user.username,
        name: getFullName(user) || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
        headline: user.headline || user.email,
        avatar: user.profilePicture || null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageTimestamp: lastMessage ? lastMessage.createdAt : null,
        unreadCount
      };
    }));

    // Sort contacts: Most recent messages at the top, then alphabetically for remaining
    contacts.sort((a, b) => {
      if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
        return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
      }
      if (a.lastMessageTimestamp) return -1;
      if (b.lastMessageTimestamp) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({ contacts });
  } catch (err) {
    console.error('Failed to fetch users for messenger:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Fetch network users, profile viewers, and relationship state
router.get('/network', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
      .select('following followers connections pendingConnectionRequests sentConnectionRequests profileViews profileViewsCount')
      .populate('profileViews.viewerId', 'firstName middleName lastName username headline profilePicture')
      .lean();

    const users = await User.find({ _id: { $ne: req.userId } })
      .select('firstName middleName lastName email username headline profilePicture')
      .lean();

    const network = users.map((user) => buildRelationshipState(currentUser, user));

    // Process profile viewers (most recent first, deduplicated by viewer)
    const rawViews = (currentUser?.profileViews || []).slice().reverse();
    const seenViewers = new Set();
    const profileViewers = [];

    for (const v of rawViews) {
      const viewer = v.viewerId;
      if (!viewer || !viewer._id) continue;
      const vId = viewer._id.toString();
      if (seenViewers.has(vId) || vId === req.userId.toString()) continue;
      seenViewers.add(vId);

      const relationship = buildRelationshipState(currentUser, viewer);
      profileViewers.push({
        ...relationship,
        viewedAt: v.viewedAt,
      });
    }

    res.json({
      network,
      profileViewers,
      profileViewsCount: currentUser?.profileViewsCount || profileViewers.length,
    });
  } catch (err) {
    console.error('Failed to fetch network users:', err);
    res.status(500).json({ error: 'Failed to fetch network users' });
  }
});

// Follow another user
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.userId } }),
    ]);

    if (currentUser && currentUser._id.toString() !== targetId) {
      await sendNotificationToUsers([targetId], {
        type: 'follow',
        message: `${currentUser.firstName} ${currentUser.lastName} started following you.`,
        fromUserId: currentUser._id,
        read: false,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Follow failed:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow another user
router.delete('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $pull: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { followers: req.userId } }),
    ]);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unfollow failed:', err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Send connection request
router.post('/:id/connect/request', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (includesUserId(currentUser.connections, targetId) || includesUserId(targetUser.connections, req.userId)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    if (includesUserId(currentUser.sentConnectionRequests, targetId) || includesUserId(targetUser.pendingConnectionRequests, req.userId)) {
      return res.status(400).json({ error: 'Connection request already sent' });
    }

    const targetAlreadyHasFollower = includesUserId(targetUser.followers, req.userId);
    const currentAlreadyFollowsTarget = includesUserId(currentUser.following, targetId);

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $addToSet: { sentConnectionRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { pendingConnectionRequests: req.userId } }),
      User.findByIdAndUpdate(req.userId, { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.userId } }),
    ]);

    if (!currentAlreadyFollowsTarget && !targetAlreadyHasFollower) {
      await sendNotificationToUsers([targetId], {
        type: 'follow',
        message: `${currentUser.firstName} ${currentUser.lastName} started following you.`,
        fromUserId: currentUser._id,
        read: false,
      });
    }

    await sendNotificationToUsers([targetId], {
      type: 'request',
      message: `${currentUser.firstName} ${currentUser.lastName} sent you a connection request.`,
      fromUserId: currentUser._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      isFollowing: true,
      followersCount: (targetUser.followers?.length || 0) + (targetAlreadyHasFollower ? 0 : 1),
    });
  } catch (err) {
    console.error('Connection request failed:', err);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// Accept connection request
router.post('/:id/connect/accept', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot accept connection with yourself' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.pendingConnectionRequests?.some((id) => id.toString() === targetId)) {
      return res.status(400).json({ error: 'No pending connection request from this user' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, {
        $pull: { pendingConnectionRequests: targetId },
        $addToSet: { connections: targetId },
      }),
      User.findByIdAndUpdate(targetId, {
        $pull: { sentConnectionRequests: req.userId },
        $addToSet: { connections: req.userId },
      }),
    ]);

    await sendNotificationToUsers([targetId], {
      type: 'connection',
      message: `${currentUser.firstName} ${currentUser.lastName} accepted your connection request.`,
      fromUserId: currentUser._id,
      read: false,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Accept connection failed:', err);
    res.status(500).json({ error: 'Failed to accept connection request' });
  }
});

// Decline connection request
router.post('/:id/connect/decline', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot decline connection with yourself' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $pull: { pendingConnectionRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { sentConnectionRequests: req.userId } }),
    ]);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Decline connection failed:', err);
    res.status(500).json({ error: 'Failed to decline connection request' });
  }
});

// Track user activity
router.post('/activity', authMiddleware, async (req, res) => {
  try {
    const { activityType, postId } = req.body;
    if (!activityType || !postId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await User.findByIdAndUpdate(req.userId, {
      $push: { activities: { activityType, postId } }
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to track activity:', err);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

const formatPostItem = async (post, currentUserId) => {
  if (!post) return null;
  const rawPost = post.toObject ? post.toObject() : post;
  const userLike = rawPost.likes?.find((like) => {
    const likerId = like.userId?._id || like.userId;
    return likerId?.toString() === currentUserId?.toString();
  });

  const repostsCount = await Post.countDocuments({ repostedFrom: rawPost._id });

  return {
    id: rawPost._id,
    _id: rawPost._id,
    content: rawPost.content || '',
    media: rawPost.media || [],
    image: rawPost.media?.[0]?.url || null,
    likesCount: rawPost.likes?.length || 0,
    commentsCount: rawPost.comments?.length || 0,
    repostsCount,
    createdAt: rawPost.createdAt,
    time: rawPost.createdAt ? new Date(rawPost.createdAt).toLocaleDateString() : '',
    repostedFrom: rawPost.repostedFrom ? {
      id: rawPost.repostedFrom._id,
      _id: rawPost.repostedFrom._id,
      authorName: rawPost.repostedFrom.userId?.firstName
        ? `${rawPost.repostedFrom.userId.firstName} ${rawPost.repostedFrom.userId.lastName}`
        : rawPost.repostedFrom.author || 'Anonymous',
      authorUsername: rawPost.repostedFrom.userId?.username || '',
      authorHeadline: rawPost.repostedFrom.userId?.headline || 'Member',
      authorAvatar: rawPost.repostedFrom.userId?.profilePicture?.url || null,
      content: rawPost.repostedFrom.content || '',
      image: rawPost.repostedFrom.media?.[0]?.url || null,
    } : null,
    authorName: rawPost.userId?.firstName
      ? `${rawPost.userId.firstName} ${rawPost.userId.lastName}`
      : rawPost.author || 'Anonymous',
    authorUsername: rawPost.userId?.username || '',
    authorHeadline: rawPost.userId?.headline || 'Member',
    authorAvatar: rawPost.userId?.profilePicture?.url || null,
    hasLiked: !!userLike,
    userReactionType: userLike ? userLike.reactionType : null,
    likers: (rawPost.likes || []).map((like) => {
      const liker = like.userId;
      return liker?.firstName ? `${liker.firstName} ${liker.lastName}` : (liker?.username || '');
    }).filter(Boolean),
  };
};

const getUserActivityData = async (user, currentUserId) => {
  const posts = await Post.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate('userId', 'firstName lastName profilePicture username headline')
    .populate('likes.userId', 'firstName lastName username')
    .populate({
      path: 'repostedFrom',
      populate: { path: 'userId', select: 'firstName lastName username headline profilePicture' },
    });

  const formattedPosts = (await Promise.all(posts.map((p) => formatPostItem(p, currentUserId)))).filter(Boolean);

  const rawActivities = [...(user.activities || [])].reverse();
  const formattedActivities = (await Promise.all(
    rawActivities.map(async (act) => {
      if (!act.postId) return null;
      const formattedPost = await formatPostItem(act.postId, currentUserId);
      if (!formattedPost) return null;
      return {
        activityType: act.activityType || 'reaction',
        createdAt: act.createdAt,
        postId: formattedPost,
      };
    })
  )).filter(Boolean);

  return {
    user: {
      id: user._id,
      name: getFullName(user),
      username: user.username,
      headline: user.headline || user.email,
      avatar: user.profilePicture?.url || null,
      location: user.location || '',
    },
    activities: formattedActivities,
    posts: formattedPosts,
  };
};

// Get authenticated user's activity
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'activities.postId',
        populate: [
          { path: 'userId', select: 'firstName lastName profilePicture username headline' },
          { path: 'likes.userId', select: 'firstName lastName username' },
          { path: 'repostedFrom', populate: { path: 'userId', select: 'firstName lastName username headline profilePicture' } }
        ]
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = await getUserActivityData(user, req.userId);
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch user activity:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get user activity by username
router.get('/activity/:username', authMiddleware, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username })
      .populate({
        path: 'activities.postId',
        populate: [
          { path: 'userId', select: 'firstName lastName profilePicture username headline' },
          { path: 'likes.userId', select: 'firstName lastName username' },
          { path: 'repostedFrom', populate: { path: 'userId', select: 'firstName lastName username headline profilePicture' } }
        ]
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = await getUserActivityData(user, req.userId);
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch activity:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Search for users
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: req.userId }, // Exclude current user from results
    }).limit(10);

    res.json(users.map(user => ({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      headline: user.headline,
      profilePicture: user.profilePicture
    })));
  } catch (err) {
    console.error('User search failed:', err);
    res.status(500).json({ error: 'Failed to search for users' });
  }
});

// Get current user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const defaultSettings = {
      profileViewingMode: 'public',
      showEmailToConnections: true,
      shareProfileUpdates: true,
      twoFactorAuth: false,
      rememberSessions: true,
      emailNotifications: true,
      pushNotifications: true,
      soundEffects: true,
      autoplayVideos: true,
      theme: 'light',
      language: 'en',
    };

    const userSettings = { ...defaultSettings, ...(user.settings ? user.settings.toObject?.() || user.settings : {}) };
    res.json({ settings: userSettings });
  } catch (err) {
    console.error('Failed to get settings:', err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Update user settings
router.patch('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.settings) {
      user.settings = {};
    }

    Object.assign(user.settings, req.body);
    await user.save();

    res.json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (err) {
    console.error('Failed to update settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
