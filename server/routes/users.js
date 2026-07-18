import express from 'express';
import User from '../models/User.js';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

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
