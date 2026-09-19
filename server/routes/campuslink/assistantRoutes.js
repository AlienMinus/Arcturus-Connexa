import express from 'express';
import jwt from 'jsonwebtoken';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import { detectDriveConflicts } from '../../utils/conflictDetector.js';
import { generateGemmaChatReply } from '../../services/gemmaService.js';
import { getFullCandidateProfile } from './helpers.js';

const router = express.Router();

// POST /api/campuslink/ai-assistant - Conversational Placement Assistant Powered by Gemma-2
router.post('/', async (req, res) => {
  try {
    const { prompt, profileId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Fetch active drives for real context
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).limit(6).lean();
    const conflicts = detectDriveConflicts(activeDrives);

    // Optional profile if token or profileId is provided
    let profile = null;
    let candidateData = null;
    if (profileId) {
      profile = await PlacementProfile.findById(profileId).lean();
      if (profile?.userId) {
        candidateData = await getFullCandidateProfile(profile.userId);
      }
    } else if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded?.userId) {
          profile = await PlacementProfile.findOne({ userId: decoded.userId }).lean();
          candidateData = await getFullCandidateProfile(decoded.userId);
        }
      } catch (e) {
        // Token decode ignored if invalid
      }
    }

    const mergedProfile = candidateData ? { ...(profile || {}), ...candidateData } : profile;

    const reply = await generateGemmaChatReply({
      prompt,
      profile: mergedProfile,
      drives: activeDrives,
      conflicts,
    });

    res.json({
      reply,
      engine: 'Hugging Face Gemma-2-2B-IT',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('CampusLink AI Assistant error:', err);
    res.status(500).json({ error: 'AI Assistant error' });
  }
});

export default router;

