import express from 'express';
import analyticsRoutes from './analyticsRoutes.js';
import drivesRoutes from './drivesRoutes.js';
import profileRoutes from './profileRoutes.js';
import offersRoutes from './offersRoutes.js';
import assistantRoutes from './assistantRoutes.js';

const router = express.Router();

// Mount modular sub-routers
router.use('/analytics', analyticsRoutes);
router.use('/drives', drivesRoutes);
router.use('/profile', profileRoutes);
router.use('/offers', offersRoutes);
router.use('/ai-assistant', assistantRoutes);

export default router;

