import express from 'express';
import PlacementOffer from '../../models/PlacementOffer.js';
import PlacementProfile from '../../models/PlacementProfile.js';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/auth.js';
import { verifyAccessToken } from '../../utils/jwtUtils.js';
import {
  isCampusLinkAdmin,
  getPlacementOfficerOrganization,
  getManagedOrganization,
  escapeRegex,
} from './helpers.js';

const router = express.Router();

// GET /api/campuslink/offers - List placement offers (Scoped by role & institute)
router.get('/', async (req, res) => {
  try {
    let currentUserId = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyAccessToken(token);
        currentUserId = decoded?.userId;
      } catch (e) {
        // invalid token
      }
    }

    if (!currentUserId) {
      return res.json({ offers: [] });
    }

    const adminAccess = await isCampusLinkAdmin(currentUserId);
    const officerOrganization = adminAccess ? null : await getPlacementOfficerOrganization(currentUserId);
    const managedOrganization =
      !adminAccess && !officerOrganization && req.query.organizationId
        ? await getManagedOrganization(currentUserId, req.query.organizationId)
        : null;

    const authorizedOfficerOrg = officerOrganization || managedOrganization;

    // Platform Admin: can view all offers or filter by institute
    if (adminAccess) {
      let filter = {};
      if (req.query.instituteId) {
        const org = await Organization.findById(req.query.instituteId).lean();
        if (org) {
          const studentUsers = await User.find({
            $or: [
              { 'institute.organizationId': org._id },
              { 'institute.name': { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
            ],
          }).distinct('_id');
          const studentProfiles = await PlacementProfile.find({
            $or: [
              { organizationId: org._id },
              { collegeName: { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
              ...(studentUsers.length > 0 ? [{ userId: { $in: studentUsers } }] : []),
            ],
          })
            .select('userId rollNumber')
            .lean();
          const userIds = studentProfiles.map((p) => p.userId).filter(Boolean);
          const rollNums = studentProfiles.map((p) => p.rollNumber).filter(Boolean);
          filter = {
            $or: [
              { organizationId: org._id },
              { collegeName: { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
              ...(userIds.length > 0 ? [{ studentId: { $in: userIds } }] : []),
              ...(rollNums.length > 0 ? [{ rollNumber: { $in: rollNums } }] : []),
            ],
          };
        }
      }
      const offers = await PlacementOffer.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ offers });
    }

    // Institute Placement Officer: ONLY offers for students of this institute
    if (authorizedOfficerOrg) {
      const org = authorizedOfficerOrg;
      const studentUsers = await User.find({
        $or: [
          { 'institute.organizationId': org._id },
          { 'institute.name': { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
        ],
      }).distinct('_id');

      const studentProfiles = await PlacementProfile.find({
        $or: [
          { organizationId: org._id },
          { collegeName: { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
          ...(studentUsers.length > 0 ? [{ userId: { $in: studentUsers } }] : []),
        ],
      })
        .select('userId rollNumber')
        .lean();

      const userIds = studentProfiles.map((p) => p.userId).filter(Boolean);
      const rollNums = studentProfiles.map((p) => p.rollNumber).filter(Boolean);

      const filter = {
        $or: [
          { organizationId: org._id },
          { collegeName: { $regex: new RegExp(`^${escapeRegex(org.name)}$`, 'i') } },
          ...(userIds.length > 0 ? [{ studentId: { $in: userIds } }] : []),
          ...(rollNums.length > 0 ? [{ rollNumber: { $in: rollNums } }] : []),
        ],
      };

      const offers = await PlacementOffer.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ offers });
    }

    // Regular student: STRICTLY only their own offers
    const offers = await PlacementOffer.find({ studentId: currentUserId }).sort({ createdAt: -1 }).lean();
    return res.json({ offers });
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
