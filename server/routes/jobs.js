import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
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
      .populate('recruiterId', 'firstName lastName email profilePicture')
      .lean();

    res.json({ jobs });
  } catch (err) {
    console.error('Failed to fetch jobs:', err);
    res.status(500).json({ error: 'Failed to retrieve jobs' });
  }
});

// GET /api/jobs/my-listings - Get jobs posted by the authenticated recruiter
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.userId })
      .sort({ createdAt: -1 })
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

// POST /api/jobs - Post a new job (Authenticated Recruiter)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      company,
      companyLogo,
      location,
      workplaceType,
      employmentType,
      salary,
      skills,
      description,
    } = req.body;

    if (!title || !company || !location || !description) {
      return res.status(400).json({ error: 'Title, company, location, and description are required' });
    }

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newJob = await Job.create({
      title,
      company,
      companyLogo: companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      location,
      workplaceType: workplaceType || 'Hybrid',
      employmentType: employmentType || 'Full-time',
      salary: salary || '',
      skills: parsedSkills,
      description,
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

