import express from 'express';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/unread - Get total unread messages
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiverId: req.userId,
      read: false
    });
    res.status(200).json({ unread: unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// POST /api/messages - Send a new message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;

    if (!receiverId || !content) {
      return res.status(400).json({ error: "Receiver ID and content are required" });
    }

    const newMessage = new Message({ senderId, receiverId, content });
    const savedMessage = await newMessage.save();
    
    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/:contactId - Get conversation with a specific user
router.get('/:contactId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { contactId } = req.params;

    // Mark messages from this contact as read
    await Message.updateMany(
      { senderId: contactId, receiverId: currentUserId, read: false },
      { $set: { read: true } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: contactId },
        { senderId: contactId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 }); // Sort by chronological order

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;