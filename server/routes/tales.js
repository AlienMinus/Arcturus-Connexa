import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import Tale from '../models/Tale.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
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

const getFullName = (u) => {
  if (!u) return 'Anonymous';
  const parts = [u.firstName, u.middleName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (u.name || u.username || 'Anonymous');
};

// GET /api/tales - List active (unexpired) tales grouped by user
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.headers.authorization
      ? (await import('../middleware/auth.js').then(m => {
          try {
            const token = req.headers.authorization.split(' ')[1];
            const jwt = import('jsonwebtoken');
            // We can optionally decode if auth present
            return null;
          } catch {
            return null;
          }
        }))
      : null;

    const activeTales = await Tale.find({
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'firstName middleName lastName name profilePicture username headline')
      .populate('viewers.userId', 'firstName middleName lastName name profilePicture username')
      .sort({ createdAt: 1 });

    // Group tales by user
    const groupsMap = new Map();

    activeTales.forEach((tale) => {
      if (!tale.userId) return;
      const uid = tale.userId._id.toString();

      if (!groupsMap.has(uid)) {
        groupsMap.set(uid, {
          userId: tale.userId._id,
          userName: getFullName(tale.userId),
          userUsername: tale.userId.username || tale.userId.name || '',
          userAvatar: tale.userId.profilePicture?.url || null,
          userHeadline: tale.userId.headline || '',
          tales: [],
          hasUnviewed: false,
          latestTaleTime: tale.createdAt,
        });
      }

      const group = groupsMap.get(uid);
      group.tales.push(tale);
      group.latestTaleTime = tale.createdAt;
    });

    const groupsList = Array.from(groupsMap.values());
    res.json(groupsList);
  } catch (err) {
    console.error('Failed to fetch tales', err);
    res.status(500).json({ error: 'Failed to fetch tales' });
  }
});

// POST /api/tales - Create a new tale (media or text status)
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { text, caption, background, textColor, fontFamily } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let mediaData = null;

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video');
      const result = await streamUpload(req.file.buffer, {
        folder: 'arcturus/tales',
        resource_type: isVideo ? 'video' : 'image',
      });
      mediaData = {
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: isVideo ? 'video' : 'image',
      };
    }

    if (!mediaData && !text?.trim()) {
      return res.status(400).json({ error: 'A Tale must contain text or a media upload.' });
    }

    const tale = new Tale({
      userId,
      media: mediaData,
      text: text?.trim() || '',
      caption: caption?.trim() || '',
      background: background || 'linear-gradient(135deg, #0a66c2, #004182)',
      textColor: textColor || '#ffffff',
      fontFamily: fontFamily || 'system-ui',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await tale.save();

    const populated = await tale.populate('userId', 'firstName middleName lastName name profilePicture username headline');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Failed to create tale', err);
    res.status(500).json({ error: 'Failed to create tale' });
  }
});

// POST /api/tales/:id/view - Mark tale as viewed
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const tale = await Tale.findById(req.params.id);
    if (!tale) {
      return res.status(404).json({ error: 'Tale not found' });
    }

    const userId = req.userId;
    const alreadyViewed = tale.viewers.some((v) => v.userId.toString() === userId.toString());

    if (!alreadyViewed && tale.userId.toString() !== userId.toString()) {
      tale.viewers.push({ userId, viewedAt: new Date() });
      await tale.save();
    }

    res.json({ success: true, viewersCount: tale.viewers.length });
  } catch (err) {
    console.error('Failed to mark tale as viewed', err);
    res.status(500).json({ error: 'Failed to mark viewed' });
  }
});

// POST /api/tales/:id/react - React to a tale
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { reaction } = req.body;
    if (!reaction) {
      return res.status(400).json({ error: 'Reaction is required' });
    }

    const tale = await Tale.findById(req.params.id);
    if (!tale) {
      return res.status(404).json({ error: 'Tale not found' });
    }

    const userId = req.userId;
    tale.reactions = tale.reactions.filter((r) => r.userId.toString() !== userId.toString());
    tale.reactions.push({ userId, reaction, createdAt: new Date() });
    await tale.save();

    res.json({ success: true, reactions: tale.reactions });
  } catch (err) {
    console.error('Failed to react to tale', err);
    res.status(500).json({ error: 'Failed to react to tale' });
  }
});

// POST /api/tales/:id/reply - Reply to a tale via Direct Message
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const tale = await Tale.findById(req.params.id).populate('userId', 'firstName lastName name username');
    if (!tale) {
      return res.status(404).json({ error: 'Tale not found' });
    }

    const senderId = req.userId;
    const recipientId = tale.userId._id;

    if (senderId.toString() === recipientId.toString()) {
      return res.status(400).json({ error: 'Cannot reply to your own tale' });
    }

    const sender = await User.findById(senderId);
    const replyContent = `[Replied to Tale: "${tale.text || tale.caption || 'Media story'}"]\n${message.trim()}`;

    const newMsg = new Message({
      sender: senderId,
      recipient: recipientId,
      content: replyContent,
      read: false,
    });

    await newMsg.save();

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (err) {
    console.error('Failed to reply to tale', err);
    res.status(500).json({ error: 'Failed to reply to tale' });
  }
});

// DELETE /api/tales/:id - Delete own tale
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const tale = await Tale.findById(req.params.id);
    if (!tale) {
      return res.status(404).json({ error: 'Tale not found' });
    }

    if (tale.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this tale' });
    }

    await Tale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tale deleted' });
  } catch (err) {
    console.error('Failed to delete tale', err);
    res.status(500).json({ error: 'Failed to delete tale' });
  }
});

export default router;

