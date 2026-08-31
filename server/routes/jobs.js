import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/jobs - List all active jobs with search & filter
router.get('/', async (req, res) => {
  try {
    const { q, location, type } = req.query;
    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (type && type !== 'All') {
      filter.employmentType = type;
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name logo slug industry location status')
      .populate('recruiterId', 'firstName lastName email profilePicture')
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error('Failed to fetch jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
});

// GET /api/jobs/my-listings - Get jobs posted by the authenticated recruiter / organization
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    // Find user's organizations
    const userOrgs = await Organization.find({
      $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
    }).select('_id');
    const orgIds = userOrgs.map((o) => o._id);

    const jobs = await Job.find({
      $or: [{ recruiterId: req.userId }, { organizationId: { $in: orgIds } }],
    })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name logo slug status')
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error('Failed to fetch recruiter jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve job listings' });
  }
});

// GET /api/jobs/:id - Get specific job details
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('organizationId', 'name logo slug industry location description website status')
      .populate('recruiterId', 'firstName lastName email profilePicture headline')
      .lean();

    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    res.json({ job });
  } catch (err) {
    console.error('Failed to fetch job details:', err);
    res.status(500).json({ error: 'Failed to retrieve job details' });
  }
});

// POST /api/jobs - Post a new job (Requires Approved Organization)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      company,
      companyLogo,
      organizationId,
      location,
      workplaceType,
      employmentType,
      salary,
      skills,
      description,
    } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({ error: 'Title, location, and description are required' });
    }

    // 1. Verify Organization Requirement & Approval Status
    let targetOrg = null;
    if (organizationId) {
      targetOrg = await Organization.findOne({
        _id: organizationId,
        $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
      });
    } else {
      // Find user's primary approved organization
      targetOrg = await Organization.findOne({
        status: 'approved',
        $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
      });

      // If no approved org, check if user has any pending org
      if (!targetOrg) {
        const pendingOrg = await Organization.findOne({
          $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
        });

        if (pendingOrg) {
          if (pendingOrg.status === 'pending') {
            return res.status(403).json({
              error: `Your organization "${pendingOrg.name}" is currently under review by Arcturus Admin. Job posting will be enabled once your documents are approved.`,
            });
          }
          if (pendingOrg.status === 'rejected') {
            return res.status(403).json({
              error: `Your organization registration for "${pendingOrg.name}" was not approved (${pendingOrg.rejectionReason || 'Verification failed'}). Please submit updated documents.`,
            });
          }
        }

        return res.status(403).json({
          error: 'Organization account required. Only verified organizations can publish job postings. Please register your company page and submit verification documents first.',
        });
      }
    }

    if (!targetOrg) {
      return res.status(403).json({
        error: 'Organization account required. Please register your company page and submit verification documents to post jobs.',
      });
    }

    if (targetOrg.status !== 'approved') {
      return res.status(403).json({
        error: `Organization "${targetOrg.name}" verification is ${targetOrg.status}. You need an approved organization account to publish job listings.`,
      });
    }

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const finalCompanyName = targetOrg.name || company;
    const finalCompanyLogo = targetOrg.logo?.url || companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png';

    const newJob = await Job.create({
      title: title.trim(),
      company: finalCompanyName,
      companyLogo: finalCompanyLogo,
      organizationId: targetOrg._id,
      location: location.trim(),
      workplaceType: workplaceType || 'Hybrid',
      employmentType: employmentType || 'Full-time',
      salary: salary ? salary.trim() : '',
      skills: parsedSkills,
      description: description.trim(),
      recruiterId: req.userId,
      isActive: true,
      applicants: [],
    });

    res.status(201).json({ message: 'Job posted successfully!', job: newJob });
  } catch (err) {
    console.error('Failed to create job posting:', err);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// POST /api/jobs/:id/apply - Apply to a job posting (Authenticated Candidate)
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    const alreadyApplied = job.applicants.some(
      (a) => a.applicantId?.toString() === req.userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied to this position' });
    }

    const candidate = await User.findById(req.userId).select('firstName lastName email headline');

    job.applicants.push({
      applicantId: req.userId,
      name: `${candidate?.firstName || ''} ${candidate?.lastName || ''}`.trim() || 'Candidate',
      email: candidate?.email || '',
      headline: candidate?.headline || 'Arcturus Member',
      appliedAt: new Date(),
      status: 'Applied',
    });

    await job.save();

    res.json({ message: 'Application submitted successfully! 🎉', job });
  } catch (err) {
    console.error('Failed to apply for job:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// DELETE /api/jobs/:id - Delete / Close a job posting (Recruiter only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.recruiterId && job.recruiterId.toString() !== req.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this listing' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job listing closed and deleted successfully' });
  } catch (err) {
    console.error('Failed to delete job posting:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;

