import express from 'express';
import mongoose from 'mongoose';
import PlacementOffer from '../../models/PlacementOffer.js';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/auth.js';
import { verifyAccessToken } from '../../utils/jwtUtils.js';
import {
  isCampusLinkAdmin,
  getPlacementOfficerOrganization,
  getManagedOrganization,
  getOrganizationByIdOrSlug,
  escapeRegex,
  sendCampusLinkNotification,
  getOrganizationOfficerUserIds,
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

    const requestedOrgParam = req.query.organizationId || req.query.idOrSlug || req.query.instituteId;
    const adminAccess = await isCampusLinkAdmin(currentUserId);
    const officerOrganization = await getPlacementOfficerOrganization(currentUserId);
    const managedOrganization =
      requestedOrgParam
        ? await getManagedOrganization(currentUserId, requestedOrgParam)
        : null;

    const authorizedOfficerOrg = officerOrganization || managedOrganization;

    // Platform Admin: can view all offers or filter by institute
    if (adminAccess) {
      let filter = {};
      if (req.query.instituteId || requestedOrgParam) {
        const org = await getOrganizationByIdOrSlug(req.query.instituteId || requestedOrgParam);
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

// POST /api/campuslink/offers - Placement Officer pushes a new placement offer to student
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      driveId,
      studentId,
      profileId,
      companyName,
      companyLogo,
      role,
      ctcLpa,
      offerType,
      acceptanceDeadline,
      joiningDate,
      bondDetails,
      organizationId,
    } = req.body;

    let existingDrive = null;
    if (driveId && mongoose.Types.ObjectId.isValid(driveId)) {
      existingDrive = await PlacementDrive.findById(driveId);
    }

    const resolvedCompanyName = existingDrive?.companyName || companyName?.trim();
    const resolvedCompanyLogo = existingDrive?.companyLogo || companyLogo?.trim() || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png';
    const resolvedRole = existingDrive?.roleTitle || role?.trim();
    const resolvedCtcLpa = Number(ctcLpa) || existingDrive?.ctcLpa;

    if (!resolvedCompanyName || !resolvedRole || !resolvedCtcLpa) {
      return res.status(400).json({ error: 'Please select an existing scheduled recruitment drive with valid role and CTC.' });
    }

    const adminAccess = await isCampusLinkAdmin(req.userId);
    const officerOrg = await getPlacementOfficerOrganization(req.userId);
    let managedOrg = organizationId
      ? await getManagedOrganization(req.userId, organizationId)
      : null;

    if (!managedOrg && organizationId && adminAccess) {
      managedOrg = await getOrganizationByIdOrSlug(organizationId);
    }

    const authorizedOrg = officerOrg || managedOrg;
    if (!authorizedOrg && !adminAccess) {
      return res.status(403).json({ error: 'Only authorized Placement Officers can push placement offers.' });
    }

    // Locate the student user and placement profile
    let studentUser = null;
    let targetProfile = null;

    const lookupId = studentId || profileId;
    if (lookupId && mongoose.Types.ObjectId.isValid(lookupId)) {
      targetProfile = await PlacementProfile.findById(lookupId).populate('userId');
      if (targetProfile?.userId) {
        studentUser = targetProfile.userId;
      } else {
        studentUser = await User.findById(lookupId);
        if (studentUser) {
          targetProfile = await PlacementProfile.findOne({ userId: studentUser._id });
        }
      }
    }

    if (!studentUser) {
      return res.status(404).json({ error: 'Student could not be located in database.' });
    }

    const fullName = [studentUser.firstName, studentUser.lastName].filter(Boolean).join(' ') || studentUser.username;
    const rollNumber = targetProfile?.rollNumber || studentUser.institute?.studentId || 'ARCT-ENROLLED';
    const branch = targetProfile?.branch || studentUser.institute?.department || 'General Engineering';
    const collegeName = authorizedOrg?.name || targetProfile?.collegeName || studentUser.institute?.name || 'Institution';

    // Create the placement offer document
    const newOffer = new PlacementOffer({
      driveId: existingDrive?._id || null,
      studentId: studentUser._id,
      organizationId: authorizedOrg?._id || studentUser.institute?.organizationId,
      studentName: fullName,
      rollNumber,
      collegeName,
      branch,
      companyName: resolvedCompanyName,
      companyLogo: resolvedCompanyLogo,
      role: resolvedRole,
      ctcLpa: Number(resolvedCtcLpa),
      offerType: offerType || 'Full-Time',
      acceptanceDeadline: acceptanceDeadline ? new Date(acceptanceDeadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      bondDetails: bondDetails?.trim() || 'None / No Service Agreement Bond',
      status: 'offered',
      verificationStatus: 'pending',
    });

    await newOffer.save();

    // If linked to an existing drive, update student's status within drive candidates
    if (existingDrive) {
      const candidateIdx = (existingDrive.candidates || []).findIndex(
        (c) =>
          c.userId?.toString() === studentUser._id.toString() ||
          (c.rollNumber && c.rollNumber.toLowerCase() === rollNumber.toLowerCase())
      );
      if (candidateIdx !== -1) {
        existingDrive.candidates[candidateIdx].status = 'selected';
        existingDrive.candidates[candidateIdx].currentStage = 'Offer Extended';
        await existingDrive.save();
      }
    }

    // Update student's placement profile status to 'offer_pushed'
    if (targetProfile) {
      targetProfile.placementStatus = 'offer_pushed';
      await targetProfile.save();
    } else {
      await PlacementProfile.create({
        userId: studentUser._id,
        organizationId: authorizedOrg?._id,
        collegeName,
        placementStatus: 'offer_pushed',
        rollNumber,
        branch,
      });
    }

    // Notify the student immediately
    await sendCampusLinkNotification(studentUser._id, {
      message: `🎉 Placement Offer Extended! You received an official offer from ${companyName.trim()} for the role of ${role.trim()} (CTC: ₹${ctcLpa} LPA). Review and respond in CampusLink Offers.`,
      fromUserId: req.userId,
      type: 'campuslink',
    });

    res.status(201).json({
      message: `Placement offer for ${companyName} successfully pushed to ${fullName}!`,
      offer: newOffer,
    });
  } catch (err) {
    console.error('Failed to push offer:', err);
    res.status(500).json({ error: 'Failed to push placement offer' });
  }
});

// POST /api/campuslink/offers/:id/respond - Student accepts or declines offer
router.post('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' | 'declined'
    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accepted or declined.' });
    }

    const offer = await PlacementOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    // Verify ownership: only the recipient student or placement officer/admin can respond
    const adminAccess = await isCampusLinkAdmin(req.userId);
    const isStudentOwner = offer.studentId?.toString() === req.userId.toString();
    const officerOrg = await getPlacementOfficerOrganization(req.userId);
    const isOfficerOfOrg = officerOrg && offer.organizationId?.toString() === officerOrg._id.toString();

    if (!isStudentOwner && !adminAccess && !isOfficerOfOrg) {
      return res.status(403).json({ error: 'You are not authorized to respond to this offer.' });
    }

    offer.status = action;
    if (action === 'accepted') {
      offer.verificationStatus = 'pending'; // Pending document verification
    }
    await offer.save();

    // Update the student's PlacementProfile
    const profile = await PlacementProfile.findOne({ userId: offer.studentId });
    if (profile) {
      profile.placementStatus = action === 'accepted' ? 'offer_accepted' : 'unplaced';
      await profile.save();
    }

    if (action === 'accepted') {
      // 1. Notify the student about required document uploads
      await sendCampusLinkNotification(offer.studentId, {
        message: `✅ Offer Accepted! You accepted the offer from ${offer.companyName} (${offer.role}). Please upload your required verification documents in the portal to finalize placement.`,
        fromUserId: req.userId,
        type: 'campuslink',
      });

      // 2. Notify placement officers of the student's institute
      if (offer.organizationId) {
        const officerIds = await getOrganizationOfficerUserIds(offer.organizationId);
        await sendCampusLinkNotification(officerIds, {
          message: `🎉 Offer Accepted: Student ${offer.studentName} (${offer.rollNumber}) has ACCEPTED the offer from ${offer.companyName} (₹${offer.ctcLpa} LPA). Awaiting document verification.`,
          fromUserId: req.userId,
          type: 'campuslink',
        });
      }
    } else {
      // Notify student
      await sendCampusLinkNotification(offer.studentId, {
        message: `You declined the offer from ${offer.companyName} (${offer.role}). Your status has returned to active recruitment.`,
        fromUserId: req.userId,
        type: 'campuslink',
      });
    }

    res.json({ message: `Offer successfully ${action}!`, offer });
  } catch (err) {
    console.error('Failed to update offer:', err);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// POST /api/campuslink/offers/:id/documents - Student uploads required verification documents
router.post('/:id/documents', authMiddleware, async (req, res) => {
  try {
    const { name, url, fileType } = req.body;
    if (!name?.trim() || !url?.trim()) {
      return res.status(400).json({ error: 'Document name and document URL are required.' });
    }

    const offer = await PlacementOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Placement offer not found.' });

    // Verify ownership
    const isStudentOwner = offer.studentId?.toString() === req.userId.toString();
    const adminAccess = await isCampusLinkAdmin(req.userId);
    if (!isStudentOwner && !adminAccess) {
      return res.status(403).json({ error: 'Only the offer recipient can upload verification documents.' });
    }

    const newDoc = {
      name: name.trim(),
      url: url.trim(),
      fileType: fileType || 'application/pdf',
      uploadedAt: new Date(),
      status: 'pending',
    };

    offer.documents = offer.documents || [];
    offer.documents.push(newDoc);
    offer.documentUrl = url.trim();
    offer.verificationStatus = 'pending';
    await offer.save();

    // Update student's PlacementProfile to verification_pending
    const profile = await PlacementProfile.findOne({ userId: offer.studentId });
    if (profile) {
      profile.placementStatus = 'verification_pending';
      await profile.save();
    }

    // 1. Notify the student
    await sendCampusLinkNotification(offer.studentId, {
      message: `📄 Document Uploaded: "${name.trim()}" successfully submitted for ${offer.companyName} offer. Our Placement Cell will review and verify.`,
      fromUserId: req.userId,
      type: 'campuslink',
    });

    // 2. Notify placement officers to review and verify
    if (offer.organizationId) {
      const officerIds = await getOrganizationOfficerUserIds(offer.organizationId);
      await sendCampusLinkNotification(officerIds, {
        message: `📋 Document Verification Requested: ${offer.studentName} (${offer.rollNumber}) uploaded "${name.trim()}" for ${offer.companyName}. Please verify to confirm placement.`,
        fromUserId: req.userId,
        type: 'campuslink',
      });
    }

    res.json({
      message: `Document "${name.trim()}" uploaded successfully!`,
      offer,
      documents: offer.documents,
    });
  } catch (err) {
    console.error('Failed to upload document:', err);
    res.status(500).json({ error: 'Failed to upload verification document' });
  }
});

// POST /api/campuslink/offers/:id/verify - Placement Officer verifies or rejects student documents
router.post('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Verification action must be verified or rejected.' });
    }

    const offer = await PlacementOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Placement offer not found.' });

    const adminAccess = await isCampusLinkAdmin(req.userId);
    const officerOrg = await getPlacementOfficerOrganization(req.userId);
    let managedOrg = offer.organizationId
      ? await getManagedOrganization(req.userId, offer.organizationId)
      : null;

    if (!managedOrg && offer.organizationId && adminAccess) {
      managedOrg = await getOrganizationByIdOrSlug(offer.organizationId);
    }

    const authorized = (officerOrg && offer.organizationId?.toString() === officerOrg._id.toString()) || managedOrg || adminAccess;
    if (!authorized) {
      return res.status(403).json({ error: 'Only authorized Placement Officers can verify student documents.' });
    }

    offer.verificationStatus = action;
    offer.verifiedBy = req.userId;
    offer.verifiedAt = new Date();

    if (action === 'verified') {
      offer.status = 'accepted';
      offer.rejectionReason = '';
      if (offer.documents) {
        offer.documents.forEach((d) => {
          if (d.status === 'pending') d.status = 'verified';
        });
      }

      // Update student profile to officially PLACED!
      const profile = await PlacementProfile.findOne({ userId: offer.studentId });
      if (profile) {
        profile.placementStatus = 'placed';
        profile.isAtRisk = false;
        await profile.save();
      }

      // Notify the student
      await sendCampusLinkNotification(offer.studentId, {
        message: `🎊 Verification Approved! Your placement documents for ${offer.companyName} have been verified by your Placement Officer. Your official placement status is now PLACED!`,
        fromUserId: req.userId,
        type: 'campuslink',
      });
    } else {
      offer.rejectionReason = rejectionReason?.trim() || 'Document clarity or compliance issue.';
      if (offer.documents) {
        offer.documents.forEach((d) => {
          if (d.status === 'pending') {
            d.status = 'rejected';
            d.rejectionReason = offer.rejectionReason;
          }
        });
      }

      // Revert status to offer_accepted so student can re-upload
      const profile = await PlacementProfile.findOne({ userId: offer.studentId });
      if (profile) {
        profile.placementStatus = 'offer_accepted';
        await profile.save();
      }

      // Notify the student of rejection and required action
      await sendCampusLinkNotification(offer.studentId, {
        message: `⚠️ Document Verification Update: Verification for ${offer.companyName} was not approved: "${offer.rejectionReason}". Please upload valid documents in the portal.`,
        fromUserId: req.userId,
        type: 'campuslink',
      });
    }

    await offer.save();

    res.json({
      message: action === 'verified' ? 'Offer & documents verified! Student status updated to Placed.' : 'Document rejection recorded.',
      offer,
    });
  } catch (err) {
    console.error('Failed to verify offer documents:', err);
    res.status(500).json({ error: 'Failed to verify offer documents' });
  }
});

export default router;
