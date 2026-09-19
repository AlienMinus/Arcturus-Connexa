import express from 'express';
import PlacementOffer from '../../models/PlacementOffer.js';
import authMiddleware from '../../middleware/auth.js';

const router = express.Router();

// GET /api/campuslink/offers - List all placement offers
router.get('/', async (req, res) => {
  try {
    const offers = await PlacementOffer.find().sort({ createdAt: -1 }).lean();
    res.json({ offers });
  } catch (err) {
    console.error('Failed to load offers:', err);
    res.status(500).json({ error: 'Failed to retrieve offers' });
  }
});

// POST /api/campuslink/offers/:id/respond - Accept or Decline offer
router.post('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' | 'declined'
    const offer = await PlacementOffer.findByIdAndUpdate(
      req.params.id,
      { $set: { status: action, verificationStatus: 'verified' } },
      { new: true }
    );

    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    res.json({ message: `Offer successfully ${action}!`, offer });
  } catch (err) {
    console.error('Failed to update offer:', err);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

export default router;

