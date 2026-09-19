import express from 'express';
import Campaign from '../models/Campaign.js';
import Organization from '../models/Organization.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/ads/my - Current user's campaigns and stats
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    const summary = campaigns.reduce(
      (acc, c) => {
        acc.totalImpressions += c.metrics?.impressions || 0;
        acc.totalClicks += c.metrics?.clicks || 0;
        acc.totalSpend += c.metrics?.spend || 0;
        if (c.status === 'active') acc.activeCampaigns += 1;
        return acc;
      },
      { totalImpressions: 0, totalClicks: 0, totalSpend: 0, activeCampaigns: 0 }
    );

    summary.avgCtr =
      summary.totalImpressions > 0
        ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)
        : '0.00';
    summary.totalSpend = Number(summary.totalSpend.toFixed(2));

    res.json({ campaigns, summary });
  } catch (err) {
    console.error('Failed to load user campaigns:', err);
    res.status(500).json({ error: 'Failed to retrieve advertising campaigns' });
  }
});

// POST /api/ads - Create new campaign
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      organizationId,
      organizationName,
      organizationLogo,
      objective,
      targetIndustry,
      targetLocation,
      placement,
      headline,
      description,
      mediaUrl,
      callToAction,
      destinationUrl,
      dailyBudget,
      totalBudget,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign name is required.' });
    }
    if (!headline || !headline.trim()) {
      return res.status(400).json({ error: 'Ad headline is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Ad description / copy is required.' });
    }

    const newCampaign = await Campaign.create({
      name: name.trim(),
      organizationId: organizationId || null,
      organizationName: organizationName || 'Arcturus Connexa',
      organizationLogo:
        organizationLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      userId: req.userId,
      objective: objective || 'brand_awareness',
      targetIndustry: targetIndustry || 'Technology & Software',
      targetLocation: targetLocation || 'Worldwide',
      placement: placement || 'both',
      headline: headline.trim(),
      description: description.trim(),
      mediaUrl: mediaUrl || '',
      callToAction: callToAction || 'Learn More',
      destinationUrl: destinationUrl || '',
      dailyBudget: Number(dailyBudget) || 25,
      totalBudget: Number(totalBudget) || 250,
      status: 'active',
      metrics: {
        impressions: 12,
        clicks: 1,
        spend: 0.45,
      },
    });

    res.status(201).json({
      message: 'Ad campaign created and launched successfully!',
      campaign: newCampaign,
    });
  } catch (err) {
    console.error('Failed to create campaign:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PATCH /api/ads/:id/status - Toggle active/paused
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid campaign status.' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized.' });
    }

    res.json({ message: `Campaign status updated to ${status}`, campaign });
  } catch (err) {
    console.error('Failed to update campaign status:', err);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// DELETE /api/ads/:id - Delete campaign
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found or unauthorized.' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('Failed to delete campaign:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// GET /api/ads/active - Active ads to display on Feed and Right Sidebar
router.get('/active', async (req, res) => {
  try {
    const { placement, limit = 5 } = req.query;
    const filter = { status: 'active' };

    if (placement) {
      filter.$or = [{ placement }, { placement: 'both' }];
    }

    const ads = await Campaign.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .lean();

    // Increment impressions in background (fire-and-forget)
    if (ads.length > 0) {
      const ids = ads.map((a) => a._id);
      Campaign.updateMany(
        { _id: { $in: ids } },
        { $inc: { 'metrics.impressions': 1 } }
      ).catch(() => {});
    }

    res.json({ ads });
  } catch (err) {
    console.error('Failed to load active ads:', err);
    res.status(500).json({ error: 'Failed to retrieve active ads' });
  }
});

// POST /api/ads/:id/click - Track click on ad
router.post('/:id/click', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          'metrics.clicks': 1,
          'metrics.spend': 0.45,
        },
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ success: true, clicks: campaign.metrics.clicks });
  } catch (err) {
    console.error('Failed to record ad click:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

export default router;

