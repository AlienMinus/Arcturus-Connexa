import express from 'express';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Post from '../models/Post.js';
import Course from '../models/Course.js';
import VerificationRequest from '../models/VerificationRequest.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { DEFAULT_COURSES } from './learning.js';

const router = express.Router();

// Apply authMiddleware and adminMiddleware to all /api/admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/stats - High level KPI metrics for the Admin Dashboard
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalOrganizations,
      pendingOrganizations,
      approvedOrganizations,
      rejectedOrganizations,
      pendingVerifications,
      pendingPlacementOfficers,
      totalVerifications,
      totalJobs,
      activeJobs,
      totalPosts,
      totalCourses,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ status: 'approved' }),
      Organization.countDocuments({ status: 'rejected' }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ 'placementOfficer.status': 'pending' }),
      VerificationRequest.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Post.countDocuments(),
      Course.countDocuments(),
    ]);

    // Aggregate total applications across all jobs
    const jobsWithApplicants = await Job.find().select('applicants').lean();
    const totalApplications = jobsWithApplicants.reduce(
      (acc, job) => acc + (job.applicants?.length || 0),
      0
    );

    // Aggregate total learners across all courses
    const coursesWithLearners = await Course.find().select('learnersCount enrolledUsers').lean();
    const totalLearners = coursesWithLearners.reduce(
      (acc, c) => acc + (c.learnersCount || c.enrolledUsers?.length || 0),
      0
    );

    res.json({
      metrics: {
        totalUsers,
        verifiedUsers,
        totalOrganizations,
        pendingOrganizations,
        approvedOrganizations,
        rejectedOrganizations,
        pendingVerifications,
        pendingPlacementOfficers,
        totalVerifications,
        totalJobs,
        activeJobs,
        totalPosts,
        totalApplications,
        totalCourses,
        totalLearners,
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

// ==========================================
// COURSE MANAGEMENT ROUTES (ADMIN)
// ==========================================

// GET /api/admin/courses - List courses with filters and curriculum counts
router.get('/courses', async (req, res) => {
  try {
    const { category, level, q } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (level && level !== 'all') {
      filter.level = level;
    }

    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { 'instructor.name': { $regex: q.trim(), $options: 'i' } },
        { skills: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const formatted = courses.map((course) => {
      const modulesCount = course.modules?.length || 0;
      const lessonsCount = course.modules?.reduce(
        (sum, m) => sum + (m.lessons?.length || 0),
        0
      ) || 0;
      const enrolledCount = course.enrolledUsers?.length || 0;
      const completedCount = course.enrolledUsers?.filter(
        (e) => (e.progress || 0) >= 100 || e.certificateId
      ).length || 0;

      return {
        ...course,
        modulesCount,
        lessonsCount,
        enrolledCount,
        completedCount,
      };
    });

    res.json({ courses: formatted });
  } catch (err) {
    console.error('Failed to fetch admin courses:', err);
    res.status(500).json({ error: 'Failed to retrieve courses list' });
  }
});

// GET /api/admin/courses/:id - Get full course details
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ course });
  } catch (err) {
    console.error('Failed to fetch course details:', err);
    res.status(500).json({ error: 'Failed to retrieve course details' });
  }
});

// POST /api/admin/courses - Create new course
router.post('/courses', async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      category,
      level,
      duration,
      thumbnail,
      instructor,
      skills,
      modules,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Course description is required' });
    }

    // Auto-generate unique slug
    let baseSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let generatedSlug = baseSlug || 'course';
    let counter = 1;
    while (await Course.findOne({ slug: generatedSlug })) {
      generatedSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    // Sanitize modules and lessons
    const sanitizedModules = (modules || []).map((m, mIdx) => ({
      title: m.title?.trim() || `Module ${mIdx + 1}`,
      lessons: (m.lessons || []).map((l, lIdx) => ({
        title: l.title?.trim() || `Lesson ${lIdx + 1}`,
        duration: l.duration?.trim() || '15m',
        videoUrl: l.videoUrl?.trim() || '',
        summary: l.summary?.trim() || '',
      })),
    }));

    // Auto calculate duration if not specified
    let courseDuration = duration?.trim();
    if (!courseDuration) {
      const totalLessons = sanitizedModules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
      );
      courseDuration = totalLessons > 0 ? `${Math.ceil((totalLessons * 18) / 60)}h ${totalLessons * 18 % 60}m` : '1h';
    }

    const newCourse = new Course({
      title: title.trim(),
      slug: generatedSlug,
      description: description.trim(),
      category: category || 'Communication',
      level: level || 'All Levels',
      duration: courseDuration,
      thumbnail: thumbnail?.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      instructor: {
        name: instructor?.name?.trim() || 'Arcturus Masterclass Coach',
        role: instructor?.role?.trim() || 'Senior Industry Specialist',
        avatar: instructor?.avatar?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      skills: Array.isArray(skills)
        ? skills.filter(Boolean).map((s) => s.trim())
        : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      modules: sanitizedModules,
      rating: 4.9,
      reviewsCount: 1,
      learnersCount: 0,
      enrolledUsers: [],
    });

    await newCourse.save();

    res.status(201).json({
      message: `Course "${newCourse.title}" created successfully! 🎉`,
      course: newCourse,
    });
  } catch (err) {
    console.error('Failed to create course:', err);
    res.status(500).json({ error: err.message || 'Failed to create course' });
  }
});

// PUT /api/admin/courses/:id - Update an existing course
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const {
      title,
      slug,
      description,
      category,
      level,
      duration,
      thumbnail,
      instructor,
      skills,
      modules,
    } = req.body;

    if (title && title.trim()) course.title = title.trim();
    if (description && description.trim()) course.description = description.trim();
    if (category) course.category = category;
    if (level) course.level = level;
    if (duration) course.duration = duration.trim();
    if (thumbnail) course.thumbnail = thumbnail.trim();

    if (slug && slug.trim() && slug !== course.slug) {
      const sanitizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const existing = await Course.findOne({ slug: sanitizedSlug, _id: { $ne: course._id } });
      if (existing) {
        return res.status(400).json({ error: `Slug "${sanitizedSlug}" is already in use by another course.` });
      }
      course.slug = sanitizedSlug;
    }

    if (instructor) {
      course.instructor = {
        name: instructor.name?.trim() || course.instructor.name,
        role: instructor.role?.trim() || course.instructor.role,
        avatar: instructor.avatar?.trim() || course.instructor.avatar,
      };
    }

    if (skills !== undefined) {
      course.skills = Array.isArray(skills)
        ? skills.filter(Boolean).map((s) => s.trim())
        : typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (modules && Array.isArray(modules)) {
      course.modules = modules.map((m, mIdx) => ({
        title: m.title?.trim() || `Module ${mIdx + 1}`,
        lessons: (m.lessons || []).map((l, lIdx) => ({
          title: l.title?.trim() || `Lesson ${lIdx + 1}`,
          duration: l.duration?.trim() || '15m',
          videoUrl: l.videoUrl?.trim() || '',
          summary: l.summary?.trim() || '',
        })),
      }));
    }

    await course.save();

    res.json({
      message: `Course "${course.title}" updated successfully!`,
      course,
    });
  } catch (err) {
    console.error('Failed to update course:', err);
    res.status(500).json({ error: err.message || 'Failed to update course' });
  }
});

// DELETE /api/admin/courses/:id - Delete a course permanently
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: `Course "${course.title}" has been deleted successfully.`,
      deletedId: req.params.id,
    });
  } catch (err) {
    console.error('Failed to delete course:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// POST /api/admin/courses/seed-defaults - Re-seed official default masterclasses
router.post('/courses/seed-defaults', async (req, res) => {
  try {
    let seededCount = 0;
    for (const courseData of DEFAULT_COURSES) {
      const existing = await Course.findOne({ slug: courseData.slug });
      if (!existing) {
        await Course.create(courseData);
        seededCount += 1;
      }
    }

    res.json({
      message: seededCount > 0
        ? `Successfully seeded ${seededCount} official masterclass(es)!`
        : 'All official masterclasses already exist in the catalog.',
      seededCount,
    });
  } catch (err) {
    console.error('Failed to seed masterclasses:', err);
    res.status(500).json({ error: 'Failed to seed masterclasses' });
  }
});

export default router;

