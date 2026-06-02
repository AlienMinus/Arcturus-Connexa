import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import Post from '../models/Post.js';
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

// Create post (requires authentication)
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const media = [];

    if (req.file) {
      const result = await streamUpload(req.file.buffer, { folder: 'arcturus' });
      media.push({
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
      });
    }

    const post = new Post({
      userId,
      author: `${user.firstName} ${user.lastName}`,
      content,
      media,
    });
    await post.save();

    // Populate user data for response
    const postWithUser = await post.populate('userId', 'firstName lastName profilePicture username headline');

    res.status(201).json(postWithUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// List posts (with user data)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'firstName lastName profilePicture username headline')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

export default router;
