import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const simplifyUser = (user) => ({
  id: user._id,
  username: user.username,
  name: `${user.firstName} ${user.lastName}`,
  headline: user.headline || user.email,
  avatar: user.profilePicture || null,
});

const buildRelationshipState = (currentUser, targetUser) => {
  const targetId = targetUser._id.toString();
  return {
    id: targetUser._id,
    username: targetUser.username,
    name: `${targetUser.firstName} ${targetUser.lastName}`,
    headline: targetUser.headline || targetUser.email,
    avatar: targetUser.profilePicture || null,
    isFollowing: currentUser?.following?.some((id) => id.toString() === targetId) || false,
    isConnected: currentUser?.connections?.some((id) => id.toString() === targetId) || false,
    hasPendingRequest: currentUser?.sentConnectionRequests?.some((id) => id.toString() === targetId) || false,
    hasIncomingRequest: currentUser?.pendingConnectionRequests?.some((id) => id.toString() === targetId) || false,
  };
};

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
      .select('firstName lastName email headline profilePicture')
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
        name: `${user.firstName} ${user.lastName}`,
        headline: user.headline || user.email,
        avatar: user.profilePicture || null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageTimestamp: lastMessage ? lastMessage.createdAt : null,
        unreadCount
      };
    }));

    res.json({ contacts });
  } catch (err) {
    console.error('Failed to fetch users for messenger:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Fetch network users and relationship state
router.get('/network', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
      .select('following followers connections pendingConnectionRequests sentConnectionRequests')
      .lean();

    const users = await User.find({ _id: { $ne: req.userId } })
      .select('firstName lastName email username headline profilePicture')
      .lean();

    const network = users.map((user) => buildRelationshipState(currentUser, user));
    res.json({ network });
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

    if (currentUser.connections?.some((id) => id.toString() === targetId)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    if (currentUser.sentConnectionRequests?.some((id) => id.toString() === targetId)) {
      return res.status(400).json({ error: 'Connection request already sent' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.userId, { $addToSet: { sentConnectionRequests: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { pendingConnectionRequests: req.userId } }),
    ]);

    await sendNotificationToUsers([targetId], {
      type: 'request',
      message: `${currentUser.firstName} ${currentUser.lastName} sent you a connection request.`,
      fromUserId: currentUser._id,
      read: false,
    });

    res.status(200).json({ success: true });
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

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);

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

// Get user activity
router.get('/activity/:username', authMiddleware, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ username })
      .populate({
        path: 'activities.postId',
        populate: { path: 'userId', select: 'firstName lastName profilePicture username headline' }
      })
      .populate({
        path: 'posts',
        populate: { path: 'userId', select: 'firstName lastName profilePicture username headline' }
      })
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      activities: user.activities || [],
      posts: user.posts || []
    });
  } catch (err) {
    console.error('Failed to fetch activity:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
