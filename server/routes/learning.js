import express from 'express';
import crypto from 'crypto';
import Course from '../models/Course.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_COURSES = [
  {
    title: 'The Art of Communication: Vocal Mastery, Influence & Stage Presence',
    slug: 'vinh-giang-vocal-mastery-communication',
    description: 'Master the core foundations of human voice, conversational subtext, storytelling frameworks, and high-pressure speaking with world-acclaimed keynote speaker and communication coach Vinh Giang.',
    category: 'Communication',
    level: 'All Levels',
    duration: '1h 22m',
    rating: 4.98,
    reviewsCount: 14820,
    learnersCount: 48900,
    thumbnail: 'https://img.youtube.com/vi/FsxorSNJBaA/hqdefault.jpg',
    instructor: {
      name: 'Vinh Giang',
      role: 'International Keynote Speaker, Magician & Masterclass Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: [
      'Vocal Melody & Pitch',
      'The Power of the Pause',
      'Rate of Speech',
      'Storytelling Frameworks',
      'Executive Presence',
      'Subtext Listening',
      'High-Pressure Questioning',
    ],
    modules: [
      {
        title: 'Module 1: Foundations of Vocal Mastery',
        lessons: [
          {
            title: 'How to Speak Better Than 99% of People (Complete Framework)',
            duration: '27m',
            videoUrl: 'FsxorSNJBaA',
            summary: 'Learn the primary difference between rookie and pro-level communicators: controlling your rate of speech, expanding vocal pitch melody, using intentional pauses, and projecting with authentic warmth.',
          },
          {
            title: 'How to Explain Anything To Anyone (The CLEAR Framework)',
            duration: '18m',
            videoUrl: 'J_QpM-k-lW8',
            summary: 'Demystify complex technical or abstract concepts using Vinh Giang’s CLEAR framework, analogies, and cognitive chunking so any audience can grasp your ideas effortlessly.',
          },
        ],
      },
      {
        title: 'Module 2: High-Pressure Presence & Conversation Mastery',
        lessons: [
          {
            title: 'How to Speak When All Eyes Are On You (3-Stage Blueprint)',
            duration: '22m',
            videoUrl: 'HYNXzKU92Qs',
            summary: 'Overcome stage fright, imposter syndrome, and sudden nervousness when all eyes are focused on you. Follow the Before, During, and Beyond stages to command the room.',
          },
          {
            title: 'How to Answer ANY Question (Even When You Don’t Know The Answer)',
            duration: '15m',
            videoUrl: 'Bhn71mwOjsA',
            summary: 'Handle unexpected, high-stakes interview questions and executive boardroom pushback with calm poise, structured pauses, and credibility.',
          },
        ],
      },
    ],
  },
];

// Helper to seed initial courses and enforce only communication course
const ensureSeedCourses = async () => {
  const existingVinh = await Course.findOne({ slug: 'vinh-giang-vocal-mastery-communication' });
  if (!existingVinh) {
    await Course.deleteMany({});
    await Course.insertMany(DEFAULT_COURSES);
  } else {
    // Clean up any non-communication courses if present
    await Course.deleteMany({ slug: { $ne: 'vinh-giang-vocal-mastery-communication' } });
  }
};

// GET /api/learning/courses - List courses with filters
router.get('/courses', async (req, res) => {
  try {
    await ensureSeedCourses();
    const { category, search, level } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (level && level !== 'All') {
      filter.level = level;
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { skills: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const courses = await Course.find(filter).sort({ rating: -1, learnersCount: -1 }).lean();
    res.json({ courses });
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    res.status(500).json({ error: 'Failed to retrieve learning courses' });
  }
});

// GET /api/learning/my - User enrolled courses and completed certificates
router.get('/my', authMiddleware, async (req, res) => {
  try {
    await ensureSeedCourses();
    const courses = await Course.find({ 'enrolledUsers.userId': req.userId }).lean();

    const enrolledList = courses.map((course) => {
      const enrollment = course.enrolledUsers.find((e) => String(e.userId) === String(req.userId));
      return {
        _id: course._id,
        title: course.title,
        category: course.category,
        thumbnail: course.thumbnail,
        duration: course.duration,
        instructor: course.instructor,
        progress: enrollment?.progress || 0,
        completedLessons: enrollment?.completedLessons || [],
        enrolledAt: enrollment?.enrolledAt,
        completedAt: enrollment?.completedAt,
        certificateId: enrollment?.certificateId || null,
      };
    });

    const completedCertificates = enrolledList
      .filter((c) => c.certificateId && c.progress >= 100)
      .map((c) => ({
        certificateId: c.certificateId,
        courseId: c._id,
        courseTitle: c.title,
        instructorName: c.instructor?.name || 'Arcturus Learning',
        completedAt: c.completedAt || new Date(),
        verificationHash: crypto.createHash('sha256').update(c.certificateId).digest('hex').substring(0, 16),
      }));

    res.json({
      enrolled: enrolledList,
      certificates: completedCertificates,
    });
  } catch (err) {
    console.error('Failed to fetch user learning:', err);
    res.status(500).json({ error: 'Failed to retrieve personal learning records' });
  }
});

// POST /api/learning/enroll/:id - Enroll in a course
router.post('/enroll/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const alreadyEnrolled = course.enrolledUsers.some(
      (e) => String(e.userId) === String(req.userId)
    );

    if (!alreadyEnrolled) {
      course.enrolledUsers.push({
        userId: req.userId,
        progress: 15, // starts with immediate kickoff progress
        completedLessons: [],
        enrolledAt: new Date(),
      });
      course.learnersCount += 1;
      await course.save();
    }

    res.json({ message: 'Successfully enrolled in course!', courseId: course._id });
  } catch (err) {
    console.error('Failed to enroll in course:', err);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

// POST /api/learning/progress/:id - Complete a lesson or pass the quiz
router.post('/progress/:id', authMiddleware, async (req, res) => {
  try {
    const { lessonTitle, progressOverride, isExamPassed } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    let enrollment = course.enrolledUsers.find(
      (e) => String(e.userId) === String(req.userId)
    );

    if (!enrollment) {
      // Auto-enroll if not enrolled yet
      enrollment = {
        userId: req.userId,
        progress: 0,
        completedLessons: [],
        enrolledAt: new Date(),
      };
      course.enrolledUsers.push(enrollment);
      course.learnersCount += 1;
    }

    if (lessonTitle && !enrollment.completedLessons.includes(lessonTitle)) {
      enrollment.completedLessons.push(lessonTitle);
      // bump progress
      enrollment.progress = Math.min(100, (enrollment.progress || 0) + 35);
    }

    if (progressOverride !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, Number(progressOverride)));
    }

    if (isExamPassed || enrollment.progress >= 100) {
      enrollment.progress = 100;
      if (!enrollment.certificateId) {
        enrollment.certificateId = `ARC-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        enrollment.completedAt = new Date();
      }
    }

    await course.save();

    res.json({
      message: 'Progress updated successfully',
      progress: enrollment.progress,
      certificateId: enrollment.certificateId || null,
      completedAt: enrollment.completedAt || null,
    });
  } catch (err) {
    console.error('Failed to update learning progress:', err);
    res.status(500).json({ error: 'Failed to update course progress' });
  }
});

// GET /api/learning/certificate/:certId - Verify certificate
router.get('/certificate/:certId', async (req, res) => {
  try {
    const course = await Course.findOne({
      'enrolledUsers.certificateId': req.params.certId,
    }).populate('enrolledUsers.userId', 'name email');

    if (!course) {
      return res.status(404).json({ valid: false, error: 'Certificate not found or invalid' });
    }

    const enrollment = course.enrolledUsers.find(
      (e) => e.certificateId === req.params.certId
    );

    res.json({
      valid: true,
      certificateId: req.params.certId,
      courseTitle: course.title,
      category: course.category,
      instructor: course.instructor?.name,
      issueDate: enrollment?.completedAt || course.updatedAt,
      recipientName: enrollment?.userId?.name || 'Verified Arcturus Professional',
      issuer: 'Arcturus Learning Certification Authority',
    });
  } catch (err) {
    console.error('Failed to verify certificate:', err);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

export default router;

