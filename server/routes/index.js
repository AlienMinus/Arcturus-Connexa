import express from 'express';
import posts from './posts.js';
import profile from './profile.js';
import auth from './auth.js';
import users from './users.js';
import messages from './messages.js';
import notifications from './notifications.js';
import news from './news.js';
import games from './games.js';
import jobs from './jobs.js';
import organizations from './organizations.js';
import admin from './admin.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API 🫱🏻‍🫲🏻' });
});

router.use('/posts', posts);
router.use('/profile', profile);
router.use('/auth', auth);
router.use('/users', users);
router.use('/messages', messages);
router.use('/notifications', notifications);
router.use('/news', news);
router.use('/games', games);
router.use('/jobs', jobs);
router.use('/organizations', organizations);
router.use('/admin', admin);

export default router;