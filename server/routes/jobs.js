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

    const jobs = await Job.find({ organizationId: { $in: orgIds } })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name logo slug status')
      .populate({
        path: 'applicants.applicantId',
        select: 'firstName lastName username headline profilePicture location institute isVerified',
        populate: { path: 'institute.organizationId', select: 'name logo slug' },
      })
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error('Failed to fetch recruiter jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve job listings' });
  }
});

// GET /api/jobs/my-applications - Get applications submitted by authenticated candidate
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [
        { 'applicants.applicantId': req.userId },
        { 'applicants.userId': req.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name logo slug industry location status')
      .lean();

    const applications = [];

    for (const job of jobs) {
      const myApp = job.applicants?.find(
        (a) =>
          a.applicantId?.toString() === req.userId ||
          a.userId?.toString() === req.userId ||
          a._id?.toString() === req.userId
      );

      if (myApp) {
        applications.push({
          applicationId: myApp._id,
          jobId: job._id,
          title: job.title,
          company: job.company,
          companyLogo: job.organizationId?.logo?.url || job.companyLogo,
          organizationId: job.organizationId?._id || null,
          organizationSlug: job.organizationId?.slug || null,
          location: job.location,
          workplaceType: job.workplaceType || 'Hybrid',
          employmentType: job.employmentType || 'Full-time',
          salary: job.salary || '',
          skills: job.skills || [],
          description: job.description || '',
          isActive: job.isActive,
          appliedAt: myApp.appliedAt || job.createdAt,
          status: myApp.status || 'Applied',
          candidateName: myApp.name || '',
          candidateHeadline: myApp.headline || '',
        });
      }
    }

    // Sort by appliedAt descending
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({ applications, total: applications.length });
  } catch (err) {
    console.error('Failed to fetch user applications:', err);
    res.status(500).json({ error: 'Failed to retrieve job applications' });
  }
});

// DELETE /api/jobs/:id/withdraw - Withdraw candidate application
router.delete('/:id/withdraw', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    const applicationIndex = job.applicants.findIndex(
      (a) =>
        a.applicantId?.toString() === req.userId ||
        a.userId?.toString() === req.userId
    );

    if (applicationIndex === -1) {
      return res.status(400).json({ error: 'No active application found for this job opening' });
    }

    job.applicants.splice(applicationIndex, 1);
    await job.save();

    res.json({ message: 'Application withdrawn successfully! 📋', jobId: job._id });
  } catch (err) {
    console.error('Failed to withdraw application:', err);
    res.status(500).json({ error: 'Failed to withdraw job application' });
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

    const userOrgs = await Organization.find({
      $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
    }).select('_id');
    const orgIds = userOrgs.map((organization) => organization._id.toString());

    if (!job.organizationId || !orgIds.includes(job.organizationId.toString())) {
      return res.status(403).json({ error: 'You do not have permission to delete this listing' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job listing closed and deleted successfully' });
  } catch (err) {
    console.error('Failed to delete job posting:', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// PATCH /api/jobs/:id/applicants/:applicantId/status - Update candidate application status (Recruiter only)
router.patch('/:id/applicants/:applicantId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Applied', 'In Review', 'Shortlisted', 'Rejected', 'Hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    // Check recruiter authorization
    const userOrgs = await Organization.find({
      $or: [{ adminId: req.userId }, { 'members.userId': req.userId }],
    }).select('_id');
    const orgIds = userOrgs.map((o) => o._id.toString());

    const isAuthorized = job.organizationId && orgIds.includes(job.organizationId.toString());

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to manage candidates for this job listing.' });
    }

    const applicant = job.applicants.find(
      (a) => a._id?.toString() === req.params.applicantId || a.applicantId?.toString() === req.params.applicantId
    );

    if (!applicant) {
      return res.status(404).json({ error: 'Candidate application record not found' });
    }

    applicant.status = status;
    await job.save();

    // Push notification to applicant
    if (applicant.applicantId) {
      await User.findByIdAndUpdate(applicant.applicantId, {
        $push: {
          notifications: {
            type: 'other',
            message: `💼 Application Status Update: Your application for "${job.title}" at ${job.company} has been updated to "${status}".`,
            read: false,
            createdAt: new Date(),
          },
        },
      });
    }

    res.json({ message: `Applicant status updated to ${status}!`, job });
  } catch (err) {
    console.error('Failed to update candidate status:', err);
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
});

export default router;

