import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get list of other users for messenger contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('firstName lastName email headline profilePicture')
      .limit(50)
      .lean();

    const contacts = users.map((user) => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      headline: user.headline || user.email,
      avatar: user.profilePicture || null,
    }));

    res.json({ contacts });
  } catch (err) {
    console.error('Failed to fetch users for messenger:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

export default router;
