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

const getFullName = (u) => {
  if (!u) return '';
  const parts = [u.firstName, u.middleName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (u.name || u.username || '');
};

const notifyUsers = async (userIds, notification) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  await User.updateMany(
    { _id: { $in: userIds } },
    { $push: { notifications: notification } }
  );
};

const normalizePostResponse = (post) => {
  const result = post.toObject ? post.toObject() : post;
  result.authorUsername = result.userId?.username || result.userId?.name || result.authorUsername || '';
  result.authorName = getFullName(result.userId) || result.author || 'Anonymous';
  if (result.repostedFrom) {
    result.repostedFrom.authorUsername = result.repostedFrom.userId?.username || result.repostedFrom.userId?.name || result.repostedFrom.authorUsername || '';
    result.repostedFrom.authorName = getFullName(result.repostedFrom.userId) || result.repostedFrom.author || 'Anonymous';
  }
  return result;
};

const withRepostCount = async (post) => {
  const result = normalizePostResponse(post);
  result.repostsCount = await Post.countDocuments({ repostedFrom: result._id });
  return result;
};

// Create post (requires authentication)
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        content,
        audience = 'Anyone',
        poll,
        event,
        celebration,
        hiring,
        scheduledAt,
        isScheduled,
      } = req.body;
      const userId = req.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const media = [];
      let documentData = null;

      // Handle media file upload
      if (req.files?.media?.[0]) {
        const mediaFile = req.files.media[0];
        const result = await streamUpload(mediaFile.buffer, {
          folder: 'arcturus/posts',
          resource_type: 'auto',
        });
        media.push({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
        });
      }

      // Handle document file upload
      if (req.files?.document?.[0]) {
        const docFile = req.files.document[0];
        const result = await streamUpload(docFile.buffer, {
          folder: 'arcturus/documents',
          resource_type: 'auto',
        });
        documentData = {
          url: result.secure_url,
          name: docFile.originalname,
          size: docFile.size,
          public_id: result.public_id,
        };
      }

      // Parse JSON sub-objects if passed as JSON string
      let parsedPoll = null;
      if (poll) {
        try {
          parsedPoll = typeof poll === 'string' ? JSON.parse(poll) : poll;
          if (parsedPoll?.options && Array.isArray(parsedPoll.options)) {
            parsedPoll.options = parsedPoll.options.map((opt) =>
              typeof opt === 'string' ? { text: opt, votes: [] } : opt
            );
          }
        } catch {
          parsedPoll = null;
        }
      }

      let parsedEvent = null;
      if (event) {
        try {
          parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;
        } catch {
          parsedEvent = null;
        }
      }

      let parsedCelebration = null;
      if (celebration) {
        try {
          parsedCelebration = typeof celebration === 'string' ? JSON.parse(celebration) : celebration;
        } catch {
          parsedCelebration = null;
        }
      }

      let parsedHiring = null;
      if (hiring) {
        try {
          parsedHiring = typeof hiring === 'string' ? JSON.parse(hiring) : hiring;
        } catch {
          parsedHiring = null;
        }
      }

      const post = new Post({
        userId,
        author: getFullName(user) || 'Anonymous',
        content,
        audience,
        media,
        document: documentData,
        poll: parsedPoll,
        event: parsedEvent,
        celebration: parsedCelebration,
        hiring: parsedHiring,
        isScheduled: Boolean(isScheduled === true || isScheduled === 'true'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      await post.save();

      // Update the user's post list
      await User.findByIdAndUpdate(
        userId,
        { $push: { posts: post._id } },
        { new: true }
      );

      // Notify followers and connections about the new post
      const author = await User.findById(userId).select('followers connections firstName middleName lastName');
      const recipientIds = [
        ...(author.followers || []),
        ...(author.connections || []),
      ]
        .map((id) => id.toString())
        .filter((id, index, arr) => id !== userId && arr.indexOf(id) === index);

      await notifyUsers(recipientIds, {
        type: 'post',
        message: `${getFullName(author)} shared a new post.`,
        fromUserId: author._id,
        postId: post._id,
        read: false,
      });

      // Populate user data for response
      const postWithUser = await post.populate('userId', 'firstName middleName lastName name profilePicture username headline');
      res.status(201).json(normalizePostResponse(postWithUser));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// Vote on a poll inside a post
router.post('/:id/poll/vote', authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.userId;

    const post = await Post.findById(req.params.id);
    if (!post || !post.poll || !post.poll.options) {
      return res.status(404).json({ error: 'Poll not found on this post' });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({ error: 'Invalid poll option index' });
    }

    // Remove existing vote from this user across all options
    post.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== userId.toString());
    });

    // Add vote to the chosen option
    post.poll.options[optionIndex].votes.push(userId);
    await post.save();

    const populated = await post.populate('userId', 'firstName middleName lastName name profilePicture username headline');
    res.json(normalizePostResponse(populated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to vote on poll' });
  }
});

// List posts (with user data)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'firstName middleName lastName name profilePicture username headline')
      .populate('likes.userId', 'firstName middleName lastName name username')
      .populate({
        path: 'repostedFrom',
        populate: {
          path: 'userId',
          select: 'firstName middleName lastName name profilePicture username headline'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Track impressions for returned posts
    if (posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      Post.updateMany({ _id: { $in: postIds } }, { $inc: { impressionsCount: 1 } }).catch(() => {});
    }

    res.json(await Promise.all(posts.map(withRepostCount)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Record batch post impressions
router.post('/impressions', async (req, res) => {
  try {
    const { postIds } = req.body || {};
    if (Array.isArray(postIds) && postIds.length > 0) {
      await Post.updateMany(
        { _id: { $in: postIds } },
        { $inc: { impressionsCount: 1 } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record impressions' });
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'firstName middleName lastName name profilePicture username headline')
      .populate('likes.userId', 'firstName middleName lastName name username')
      .populate({
        path: 'repostedFrom',
        populate: {
          path: 'userId',
          select: 'firstName middleName lastName name profilePicture username headline',
        },
      })
      .populate({
        path: 'comments.userId',
        select: 'firstName middleName lastName name profilePicture username headline',
      });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment impressions for single view
    Post.updateOne({ _id: post._id }, { $inc: { impressionsCount: 1 } }).catch(() => {});

    res.json(await withRepostCount(post));
  } catch (err) {
    console.error(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts/:id/like - Toggle like on
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { reactionType = 'Like' } = req.body || {};
    const postId = req.params.id;
    const userId = req.userId;

    // Try to update an existing reaction for this user
    const result = await Post.updateOne(
      { _id: postId, 'likes.userId': userId },
      { $set: { 'likes.$.reactionType': reactionType } }
    );

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (result.matchedCount === 0) {
      // Add new like
      await Post.updateOne(
        { _id: postId },
        { $addToSet: { likes: { userId, reactionType } } }
      );
    }

    const currentUser = await User.findById(userId).select('firstName middleName lastName');
    const postOwner = await User.findById(post.userId).select('firstName middleName lastName');

    if (postOwner && postOwner._id.toString() !== userId) {
      await notifyUsers([postOwner._id], {
        type: 'reaction',
        message: `${getFullName(currentUser)} reacted to your post.`,
        fromUserId: currentUser._id,
        postId,
        read: false,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Like failed' });
  }
});

// DELETE /api/posts/:id/like - Toggle like off
router.delete('/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    await Post.updateOne(
      { _id: postId },
      { $pull: { likes: { userId: userId } } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unlike failed' });
  }
});

// GET /api/posts/:id/comments - Retrieve comments for a post
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.userId', 'firstName middleName lastName name username profilePicture');
    const comments = (post?.comments || []).map(c => ({
      _id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      authorName: getFullName(c.userId) || 'Anonymous',
      authorAvatar: c.userId?.profilePicture
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
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ userId: req.userId, content: req.body.content });
    await post.save();
    
    // Return the newly added comment populated
    const populatedPost = await Post.findById(req.params.id).populate('comments.userId', 'firstName middleName lastName name username profilePicture');
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.status(201).json({ comment: {
      _id: newComment._id,
      content: newComment.content,
      createdAt: newComment.createdAt,
      authorName: getFullName(newComment.userId) || 'Anonymous',
      authorAvatar: newComment.userId?.profilePicture
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
      repostedFrom: req.params.id,
    });
    await repost.save();

    const repostingUser = await User.findById(req.userId).select('followers connections firstName middleName lastName');
    const recipientIds = [
      ...(repostingUser.followers || []),
      ...(repostingUser.connections || []),
    ]
      .map((id) => id.toString())
      .filter((id, index, arr) => id !== req.userId && arr.indexOf(id) === index);

    await notifyUsers(recipientIds, {
      type: 'repost',
      message: `${getFullName(repostingUser)} reposted a post.`,
      fromUserId: repostingUser._id,
      postId: repost._id,
      read: false,
    });

    if (originalPost.userId && originalPost.userId.toString() !== req.userId) {
      await notifyUsers([originalPost.userId], {
        type: 'post',
        message: `${getFullName(repostingUser)} reposted your post.`,
        fromUserId: repostingUser._id,
        postId: repost._id,
        read: false,
      });
    }

    res.status(201).json({ post: normalizePostResponse(repost) });
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
