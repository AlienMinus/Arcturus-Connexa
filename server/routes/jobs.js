import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const SEED_JOBS = [
  {
    title: 'Senior Full Stack Engineer',
    company: 'Arcturus Labs',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Bengaluru, India',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '₹24,00,000 - ₹35,00,000 / yr',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'GraphQL'],
    description: 'We are looking for a Senior Full Stack Engineer to build high-scale web experiences for the Arcturus developer platform. You will lead system architecture, collaborate with cross-functional engineering teams, and deliver robust cloud features.',
    isActive: true,
  },
  {
    title: 'Frontend Developer (React / Next.js)',
    company: 'Aerial.Vue Global',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
    location: 'Remote, India',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    salary: '₹14,00,000 - ₹20,00,000 / yr',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux', 'Web Vitals'],
    description: 'Join our product frontend team to create sleek, modern user interfaces with responsive animations, accessible components, and high Core Web Vitals performance benchmarks.',
    isActive: true,
  },
  {
    title: 'AI / ML Solutions Architect',
    company: 'DeepMind Innovations',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/8637/8637105.png',
    location: 'Hyderabad, India',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '₹30,00,000 - ₹45,00,000 / yr',
    skills: ['Python', 'PyTorch', 'LLMs', 'FastAPI', 'Docker'],
    description: 'Design and deploy state-of-the-art multimodal AI workflows, vector embeddings, and agentic assistants across enterprise platforms.',
    isActive: true,
  },
  {
    title: 'Product Designer (UI/UX)',
    company: 'Starlight Studio',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: 'Mumbai, India',
    workplaceType: 'On-site',
    employmentType: 'Full-time',
    salary: '₹12,00,000 - ₹18,00,000 / yr',
    skills: ['Figma', 'Prototyping', 'Design Systems', 'User Research'],
    description: 'We are seeking a talented UI/UX designer to craft intuitive user journeys, interactive design components, and pixel-perfect design systems.',
    isActive: true,
  },
  {
    title: 'DevOps & Cloud Engineer',
    company: 'Nexlify Cloud',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png',
    location: 'Pune, India',
    workplaceType: 'Remote',
    employmentType: 'Full-time',
    salary: '₹18,00,000 - ₹26,00,000 / yr',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker'],
    description: 'Maintain high availability infrastructure, automated CI/CD pipelines, container orchestration, and multi-region cloud security policies.',
    isActive: true,
  },
];

// Helper to seed initial jobs if empty
const seedJobsIfEmpty = async () => {
  try {
    const count = await Job.countDocuments();
    if (count === 0) {
      await Job.insertMany(SEED_JOBS);
    }
  } catch (err) {
    console.error('Failed to seed initial jobs:', err);
  }
};

// GET /api/jobs - List all active jobs with search & filter
router.get('/', async (req, res) => {
  try {
    await seedJobsIfEmpty();

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

