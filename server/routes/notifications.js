import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sortedNotifications = (user.notifications || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Populate the author (fromUserId) of each notification so the frontend
    // can render avatars and names.
    const fromUserIds = [
      ...new Set(
        sortedNotifications
          .map((notification) => notification.fromUserId)
          .filter(Boolean)
      ),
    ];

    const authors = await User.find({ _id: { $in: fromUserIds } })
      .select('firstName lastName username headline profilePicture')
      .lean();

    const authorMap = new Map(
      authors.map((author) => [
        author._id.toString(),
        {
          id: author._id,
          name: `${author.firstName} ${author.lastName}`,
          username: author.username,
          headline: author.headline || '',
          avatar: author.profilePicture || null,
        },
      ])
    );

    const notifications = sortedNotifications.map((notification) => {
      const n = notification.toObject
        ? notification.toObject()
        : { ...notification, _id: notification._id };
      n.author = notification.fromUserId
        ? authorMap.get(notification.fromUserId.toString()) || null
        : null;
      return n;
    });

    res.status(200).json({ notifications });
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const unread = (user.notifications || []).filter((notification) => !notification.read).length;
    res.status(200).json({ unread });
  } catch (err) {
    console.error('Failed to fetch unread count:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.userId, 'notifications._id': req.params.notificationId },
      { $set: { 'notifications.$.read': true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification state' });
  }
});

export default router;
