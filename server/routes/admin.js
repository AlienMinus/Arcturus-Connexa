import express from 'express';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Post from '../models/Post.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// Apply authMiddleware and adminMiddleware to all /api/admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats - High level KPI metrics for the Admin Dashboard
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrganizations,
      pendingOrganizations,
      approvedOrganizations,
      rejectedOrganizations,
      totalJobs,
      activeJobs,
      totalPosts,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ status: 'approved' }),
      Organization.countDocuments({ status: 'rejected' }),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Post.countDocuments(),
    ]);

    // Aggregate total applications across all jobs
    const jobsWithApplicants = await Job.find().select('applicants').lean();
    const totalApplications = jobsWithApplicants.reduce(
      (acc, job) => acc + (job.applicants?.length || 0),
      0
    );

    res.json({
      metrics: {
        totalUsers,
        totalOrganizations,
        pendingOrganizations,
        approvedOrganizations,
        rejectedOrganizations,
        totalJobs,
        activeJobs,
        totalPosts,
        totalApplications,
      },
    });
  } catch (err) {
    console.error('Failed to load admin stats:', err);
    res.status(500).json({ error: 'Failed to retrieve platform analytics' });
  }
});

// GET /api/admin/organizations - List organizations with status filter and search
router.get('/organizations', async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { location: { $regex: q.trim(), $options: 'i' } },
        { industry: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const organizations = await Organization.find(filter)
      .sort({ createdAt: -1 })
      .populate('adminId', 'firstName lastName email username profilePicture headline')
      .lean();

    res.json({ organizations });
  } catch (err) {
    console.error('Failed to fetch admin organizations:', err);
    res.status(500).json({ error: 'Failed to retrieve organizations list' });
  }
});

// POST /api/admin/organizations/:id/approve - Approve an organization
router.post('/organizations/:id/approve', async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    organization.status = 'approved';
    organization.rejectionReason = '';
    organization.reviewedAt = new Date();
    organization.reviewedBy = req.userId;
    await organization.save();

    // Send congratulatory notification to the owner
    if (organization.adminId) {
      await User.findByIdAndUpdate(organization.adminId, {
        $push: {
          notifications: {
            type: 'other',
            message: `🎉 Congratulations! Your Organization "${organization.name}" has been approved by Arcturus Admin. You can now post jobs on the Job Portal.`,
            read: false,
            createdAt: new Date(),
          },
        },
      });
    }

    res.json({
      message: `Organization "${organization.name}" has been approved successfully! 🎉`,
      organization,
    });
  } catch (err) {
    console.error('Failed to approve organization:', err);
    res.status(500).json({ error: 'Failed to approve organization' });
  }
});

// POST /api/admin/organizations/:id/reject - Reject an organization with custom reason
router.post('/organizations/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    organization.status = 'rejected';
    organization.rejectionReason = reason || 'Submitted documentation could not be verified.';
    organization.reviewedAt = new Date();
    organization.reviewedBy = req.userId;
    await organization.save();

    // Send rejection notification with feedback to the owner
    if (organization.adminId) {
      await User.findByIdAndUpdate(organization.adminId, {
        $push: {
          notifications: {
            type: 'other',
            message: `⚠️ Your Organization registration for "${organization.name}" was not approved: ${organization.rejectionReason}. You may re-submit with updated documents.`,
            read: false,
            createdAt: new Date(),
          },
        },
      });
    }

    res.json({
      message: `Organization "${organization.name}" status updated to rejected.`,
      organization,
    });
  } catch (err) {
    console.error('Failed to reject organization:', err);
    res.status(500).json({ error: 'Failed to reject organization' });
  }
});

// GET /api/admin/jobs - List all jobs across the platform for moderation
router.get('/jobs', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { company: { $regex: q.trim(), $options: 'i' } },
        { location: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name logo slug status')
      .populate('recruiterId', 'firstName lastName email profilePicture')
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error('Failed to fetch admin jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve job listings' });
  }
});

// DELETE /api/admin/jobs/:id - Delete / Close any job listing (Admin override)
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job listing deleted successfully by Admin' });
  } catch (err) {
    console.error('Failed to delete job:', err);
    res.status(500).json({ error: 'Failed to delete job listing' });
  }
});

// GET /api/admin/users - List users for platform moderation
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};

    if (q && q.trim()) {
      filter.$or = [
        { firstName: { $regex: q.trim(), $options: 'i' } },
        { lastName: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { username: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('firstName middleName lastName email username role isAdmin isVerified profilePicture headline createdAt organizations')
      .populate('organizations', 'name status logo')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ users });
  } catch (err) {
    console.error('Failed to fetch users list:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// POST /api/admin/users/:id/toggle-verify - Toggle user verification badge
router.post('/users/:id/toggle-verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      message: `User verification status updated to ${user.isVerified ? 'Verified' : 'Unverified'}`,
      isVerified: user.isVerified,
    });
  } catch (err) {
    console.error('Failed to toggle verification:', err);
    res.status(500).json({ error: 'Failed to update user verification' });
  }
});

export default router;

