import express from 'express';
import posts from './posts.js';
import profile from './profile.js';
import auth from './auth.js';
import users from './users.js';
import messages from './messages.js';
import notifications from './notifications.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API 🫱🏻‍🫲🏻' });
});

router.use('/posts', posts);
router.use('/profile', profile);
router.use('/auth', auth);
router.use('/users', users);
router.use('/messages', messages);

export default router;