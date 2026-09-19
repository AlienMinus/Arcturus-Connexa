import express from 'express';
import VerificationRequest from '../models/VerificationRequest.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// POST /api/verification/request - Submit a new Blue Tick verification request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { fullName, category, affiliation, organizationId, evidenceUrl, reason } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full legal name is required.' });
    }
    if (!affiliation || !affiliation.trim()) {
      return res.status(400).json({ error: 'Primary affiliation (university / company) is required.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for requesting verification is required.' });
    }

    // Check if user already has a pending request
    const existingPending = await VerificationRequest.findOne({
      userId: req.userId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        error: 'You already have a pending verification request currently under review by Arcturus Admin.',
      });
    }

    let linkedOrgId = null;
    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (org) {
        linkedOrgId = org._id;
      }
    }

    const newRequest = await VerificationRequest.create({
      userId: req.userId,
      fullName: fullName.trim(),
      category: category || 'Student / Scholar',
      affiliation: affiliation.trim(),
      organizationId: linkedOrgId,
      evidenceUrl: evidenceUrl ? evidenceUrl.trim() : '',
      reason: reason.trim(),
      status: 'pending',
    });

    res.status(201).json({
      message: 'Verification request submitted successfully! It is now pending review by Arcturus Admin.',
      request: newRequest,
    });
  } catch (err) {
    console.error('Failed to submit verification request:', err);
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
});

// GET /api/verification/my-status - Get current user's verification status and history
router.get('/my-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('isVerified institute role accountType')
      .populate('institute.organizationId', 'name slug logo');

    const latestRequest = await VerificationRequest.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name slug logo')
      .lean();

    res.json({
      isVerified: !!user?.isVerified,
      institute: user?.institute || null,
      request: latestRequest || null,
    });
  } catch (err) {
    console.error('Failed to fetch verification status:', err);
    res.status(500).json({ error: 'Failed to retrieve verification status' });
  }
});

// Admin-only endpoints below
router.use('/admin', authMiddleware, adminMiddleware);

// GET /api/verification/admin/list - List all verification requests
router.get('/admin/list', async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q && q.trim()) {
      filter.$or = [
        { fullName: { $regex: q.trim(), $options: 'i' } },
        { affiliation: { $regex: q.trim(), $options: 'i' } },
        { reason: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const requests = await VerificationRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email username profilePicture headline isVerified institute')
      .populate('organizationId', 'name slug logo industry status')
      .lean();

    res.json({ requests });
  } catch (err) {
    console.error('Failed to fetch admin verification requests:', err);
    res.status(500).json({ error: 'Failed to retrieve verification requests' });
  }
});

// POST /api/verification/admin/:id/approve - Approve verification & award Blue Tick
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    request.status = 'approved';
    request.reviewedBy = req.userId;
    request.reviewedAt = new Date();
    await request.save();

    // Update user document
    const user = await User.findById(request.userId);
    if (user) {
      user.isVerified = true;

      // If an organization was linked in the request or user is a student, configure institute
      if (request.organizationId) {
        user.institute = user.institute || {};
        user.institute.organizationId = request.organizationId;
        user.institute.name = request.affiliation || user.institute.name;
        user.institute.verified = true;
      } else if (user.institute?.organizationId) {
        user.institute.verified = true;
      }

      // Add notification to applicant
      user.notifications.push({
        type: 'other',
        message: '🎉 Congratulations! Your Arcturus Blue Tick verification has been approved by the Admin. Your verified badge is now active!',
        read: false,
        createdAt: new Date(),
      });

      await user.save();
    }

    res.json({
      message: `Blue Tick verification approved for ${request.fullName}!`,
      request,
    });
  } catch (err) {
    console.error('Failed to approve verification request:', err);
    res.status(500).json({ error: 'Failed to approve verification request' });
  }
});

// POST /api/verification/admin/:id/reject - Reject verification request
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const { reason = 'Verification criteria could not be validated.' } = req.body;
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    request.status = 'rejected';
    request.adminNotes = reason;
    request.reviewedBy = req.userId;
    request.reviewedAt = new Date();
    await request.save();

    // Send notification to applicant
    await User.findByIdAndUpdate(request.userId, {
      $push: {
        notifications: {
          type: 'other',
          message: `⚠️ Notice regarding your verification request: ${reason}`,
          read: false,
          createdAt: new Date(),
        },
      },
    });

    res.json({
      message: `Verification request for ${request.fullName} rejected.`,
      request,
    });
  } catch (err) {
    console.error('Failed to reject verification request:', err);
    res.status(500).json({ error: 'Failed to reject verification request' });
  }
});

// POST /api/verification/admin/:id/revoke - Revoke Blue Tick
router.post('/admin/:id/revoke', async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (request) {
      request.status = 'rejected';
      request.adminNotes = 'Verification revoked by Arcturus Admin.';
      await request.save();
      await User.findByIdAndUpdate(request.userId, { isVerified: false });
    }

    res.json({ message: 'Verification revoked successfully' });
  } catch (err) {
    console.error('Failed to revoke verification:', err);
    res.status(500).json({ error: 'Failed to revoke verification' });
  }
});

export default router;

