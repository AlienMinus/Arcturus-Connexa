import express from 'express';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Job from '../models/Job.js';

const router = express.Router();

// GET /api/search?q=...&type=...
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || !q.trim()) {
      return res.json({
        query: '',
        users: [],
        organizations: [],
        jobs: [],
        total: 0,
      });
    }

    const trimmed = q.trim();
    const safeRegex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const searchUsers = type === 'all' || type === 'users';
    const searchOrgs = type === 'all' || type === 'organizations';
    const searchJobs = type === 'all' || type === 'jobs';

    const [rawUsers, rawOrgs, rawJobs] = await Promise.all([
      // 1. Search Users
      searchUsers
        ? User.find({
            $or: [
              { firstName: safeRegex },
              { lastName: safeRegex },
              { username: safeRegex },
              { headline: safeRegex },
            ],
          })
            .select('firstName lastName username headline location profilePicture role isVerified institute')
            .populate('institute.organizationId', 'name slug logo')
            .limit(15)
            .lean()
        : Promise.resolve([]),

      // 2. Search Organizations (Approved or pending)
      searchOrgs
        ? Organization.find({
            status: { $in: ['approved', 'pending'] },
            $or: [
              { name: safeRegex },
              { tagline: safeRegex },
              { industry: safeRegex },
              { location: safeRegex },
            ],
          })
            .select('name slug logo tagline industry location organizationSize status members')
            .sort({ status: 1, createdAt: -1 }) // approved first
            .limit(15)
            .lean()
        : Promise.resolve([]),

      // 3. Search Jobs
      searchJobs
        ? Job.find({
            isActive: true,
            $or: [
              { title: safeRegex },
              { companyName: safeRegex },
              { location: safeRegex },
              { skills: safeRegex },
            ],
          })
            .select('title companyName location type salaryRange organizationId createdAt')
            .populate('organizationId', 'name logo slug')
            .limit(10)
            .lean()
        : Promise.resolve([]),
    ]);

    // Attach active jobs count to organizations
    const organizations = await Promise.all(
      rawOrgs.map(async (org) => {
        const activeJobsCount = await Job.countDocuments({
          organizationId: org._id,
          isActive: true,
        });
        return {
          ...org,
          activeJobsCount,
        };
      })
    );

    const users = rawUsers.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      headline: u.headline,
      location: u.location,
      profilePicture: u.profilePicture,
      isVerified: u.isVerified,
      institute: u.institute,
    }));

    const jobs = rawJobs.map((j) => ({
      _id: j._id,
      title: j.title,
      companyName: j.companyName || j.organizationId?.name || '',
      location: j.location,
      type: j.type,
      salaryRange: j.salaryRange,
      organization: j.organizationId,
      createdAt: j.createdAt,
    }));

    res.json({
      query: trimmed,
      users,
      organizations,
      jobs,
      total: users.length + organizations.length + jobs.length,
    });
  } catch (err) {
    console.error('Unified search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;

