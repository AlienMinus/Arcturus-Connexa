import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import Post from '../models/Post.js';
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
    const postWithUser = await post.populate('userId', 'firstName lastName name profilePicture username headline');

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
      .populate('userId', 'firstName lastName name profilePicture username headline')
      .populate('likes.userId', 'firstName lastName name username')
      .populate({
        path: 'repostedFrom',
        populate: {
          path: 'userId',
          select: 'firstName lastName name profilePicture username headline'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/posts/:id/like - Toggle like on
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { reactionType = 'Like' } = req.body || {};
    const post = await Post.findById(req.params.id);
    
    // Remove existing reaction if any so we can toggle/change reaction types easily
    post.likes = post.likes.filter(like => String(like.userId?._id || like.userId || like) !== String(req.userId));
    
    post.likes.push({ userId: req.userId, reactionType });
    await post.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Like failed' });
  }
});

// DELETE /api/posts/:id/like - Toggle like off
router.delete('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.likes = post.likes.filter(like => String(like.userId?._id || like.userId || like) !== String(req.userId));
    await post.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unlike failed' });
  }
});

// GET /api/posts/:id/comments - Retrieve comments for a post
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.userId', 'firstName lastName name username profilePicture');
    const comments = post.comments.map(c => ({
      _id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      authorName: c.userId.firstName ? `${c.userId.firstName} ${c.userId.lastName}` : (c.userId.name || c.userId.username || 'Anonymous'),
      authorAvatar: c.userId.profilePicture
    }));
    res.status(200).json({ comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// POST /api/posts/:id/comments - Add a comment to a post
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ userId: req.userId, content: req.body.content });
    await post.save();
    
    // Return the newly added comment populated
    const populatedPost = await Post.findById(req.params.id).populate('comments.userId', 'firstName lastName name username profilePicture');
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.status(201).json({ comment: {
      _id: newComment._id,
      content: newComment.content,
      createdAt: newComment.createdAt,
      authorName: newComment.userId.firstName ? `${newComment.userId.firstName} ${newComment.userId.lastName}` : (newComment.userId.name || newComment.userId.username || 'Anonymous'),
      authorAvatar: newComment.userId.profilePicture
    } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// POST /api/posts/:id/repost - Repost an existing post
router.post('/:id/repost', authMiddleware, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ error: 'Post not found' });
    
    const repost = new Post({
      userId: req.userId,
      repostedFrom: req.params.id
    });
    await repost.save();
    res.status(201).json({ post: repost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to repost' });
  }
});

// POST /api/posts/share - Support for "Send" via Messenger
router.post('/share', authMiddleware, async (req, res) => {
  try {
    const { receiverId, postId } = req.body;
    const newMessage = new Message({
      senderId: req.userId,
      receiverId,
      content: `I thought you might find this interesting: /post/${postId}`
    });
    await newMessage.save();
    res.status(201).json({ message: newMessage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to share post' });
  }
});

export default router;
