import express from 'express';
import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import authMiddleware from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/admin.js';

const router = express.Router();

router.get('/my-status', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select('placementOfficer').lean();
  res.json({ application: user?.placementOfficer || { status: 'none' } });
});

router.post('/apply', authMiddleware, async (req, res) => {
  const { organizationId, statement } = req.body;
  const organization = await Organization.findOne({
    _id: organizationId,
    status: 'approved',
    $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
  });
  if (!organization) return res.status(400).json({ error: 'Select an approved organization you are linked to.' });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.placementOfficer?.status === 'approved') return res.status(400).json({ error: 'You are already an approved Placement Officer.' });

  user.placementOfficer = {
    status: 'pending',
    organizationId: organization._id,
    statement: String(statement || '').trim(),
    rejectionReason: '',
  };
  await user.save();
  res.status(201).json({ message: 'Placement Officer application submitted for Arcturus Admin review.', application: user.placementOfficer });
});

router.get('/admin/applications', authMiddleware, adminMiddleware, async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter['placementOfficer.status'] = req.query.status;
  const users = await User.find(filter)
    .select('firstName middleName lastName email username profilePicture placementOfficer institute')
    .populate('placementOfficer.organizationId', 'name slug logo status')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ applications: users.filter((user) => user.placementOfficer?.status && user.placementOfficer.status !== 'none') });
});

router.post('/admin/applications/:userId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user?.placementOfficer?.organizationId) return res.status(404).json({ error: 'Placement Officer application not found' });
  const organization = await Organization.findOne({ _id: user.placementOfficer.organizationId, status: 'approved' });
  if (!organization) return res.status(400).json({ error: 'The linked organization is not approved.' });

  user.placementOfficer.status = 'approved';
  user.placementOfficer.reviewedAt = new Date();
  user.placementOfficer.reviewedBy = req.userId;
  user.placementOfficer.rejectionReason = '';
  user.accountType = 'placement_officer';
  await user.save();

  const existingMember = organization.members.find((member) => member.userId?.toString() === user._id.toString());
  if (existingMember) existingMember.role = 'Placement Officer';
  else organization.members.push({ userId: user._id, role: 'Placement Officer' });
  await organization.save();

  user.notifications.push({ type: 'other', message: `Your Placement Officer application for ${organization.name} was approved by Arcturus Admin.`, read: false });
  await user.save();
  res.json({ message: 'Placement Officer approved.', application: user.placementOfficer });
});

router.post('/admin/applications/:userId/reject', authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user?.placementOfficer) return res.status(404).json({ error: 'Placement Officer application not found' });
  user.placementOfficer.status = 'rejected';
  user.placementOfficer.reviewedAt = new Date();
  user.placementOfficer.reviewedBy = req.userId;
  user.placementOfficer.rejectionReason = String(req.body.reason || 'Application criteria were not confirmed.');
  await user.save();
  res.json({ message: 'Placement Officer application rejected.' });
});

export default router;
