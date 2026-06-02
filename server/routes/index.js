import express from 'express';
import posts from './posts.js';
import profile from './profile.js';
import auth from './auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API 🫱🏻‍🫲🏻' });
});

router.use('/posts', posts);
router.use('/profile', profile);
router.use('/auth', auth);

export default router;