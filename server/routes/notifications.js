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

    res.status(200).json({ notifications: sortedNotifications });
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
