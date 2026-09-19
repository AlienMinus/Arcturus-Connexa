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
    duration: '1h 37m',
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
        title: 'Module 1: Vocal Instrument & Speech Clarity',
        lessons: [
          {
            title: 'How to Speak Better Than 99% of People (Complete Framework)',
            duration: '27m',
            videoUrl: 'FsxorSNJBaA',
            summary: 'Learn the primary difference between rookie and pro-level communicators: controlling your rate of speech, expanding vocal pitch melody, using intentional pauses, and projecting with authentic warmth.',
          },
          {
            title: 'Speak 10X Clearer: Do These 3 Vocal Exercises Daily!',
            duration: '18m',
            videoUrl: 'hIFCxzdSGfU',
            summary: 'Three non-negotiable daily vocal drills to loosen articulators, eliminate mumbling, project from your diaphragm, and sharpen your phonetic pronunciation.',
          },
          {
            title: '3 Steps To Improve Your Speech Clarity',
            duration: '15m',
            videoUrl: '3B5gmNKFqSY',
            summary: 'Identify subconscious speech bottlenecks, eliminate trailing consonants, and anchor your tone so listeners never ask you to repeat yourself.',
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
  {
    title: 'Effortless Conversation & Subtext Listening Masterclass',
    slug: 'vinh-giang-effortless-conversation-listening',
    description: 'Learn how to make every conversation feel natural, break awkward silences, read emotional subtext, and connect authentically with anyone using Vinh Giang\'s proven conversational tools.',
    category: 'Communication',
    level: 'Beginner to Intermediate',
    duration: '1h 15m',
    rating: 4.96,
    reviewsCount: 9420,
    learnersCount: 31200,
    thumbnail: 'https://img.youtube.com/vi/nomDXFOCSdg/hqdefault.jpg',
    instructor: {
      name: 'Vinh Giang',
      role: 'International Keynote Speaker, Magician & Masterclass Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: [
      'Subtext Listening',
      'Effortless Conversations',
      'Breaking Awkward Silence',
      'Active Empathy',
      'Conversational Agility',
      'Quick Wit & Banter',
    ],
    modules: [
      {
        title: 'Module 1: Initiating & Deepening Everyday Conversations',
        lessons: [
          {
            title: 'How to Make Every Conversation Feel Effortless',
            duration: '20m',
            videoUrl: 'nomDXFOCSdg',
            summary: 'Shift from self-conscious speaking to subtext listening. Understand emotional cues, body posture, and micro-expressions to guide interactions smoothly.',
          },
          {
            title: 'How to Enter Conversations (Even If You Have Nothing To Say!)',
            duration: '16m',
            videoUrl: '-X13GINFYOY',
            summary: 'Master the subtle art of joining groups, entering networking circles gracefully, and contributing valuable insights without feeling awkward or intrusive.',
          },
          {
            title: 'Conversations Are Awkward Until You Ask These Questions!',
            duration: '18m',
            videoUrl: 'LQaEv6P4ooM',
            summary: 'Replace boring small talk questions with thought-provoking conversational catalysts that get people talking about their true passions.',
          },
        ],
      },
      {
        title: 'Module 2: Conversational Agility & Quick Wit',
        lessons: [
          {
            title: 'How To Be Quick Witted In Any Conversation (Without Overthinking It)',
            duration: '21m',
            videoUrl: 'W-E6fqoKUrY',
            summary: 'Techniques to think on your feet, react with humor, and stay mentally agile without freezing or replaying the conversation hours later.',
          },
        ],
      },
    ],
  },
  {
    title: 'Executive Influence, Likability & Difficult Conversations',
    slug: 'vinh-giang-executive-influence-difficult-conversations',
    description: 'Command executive respect without arrogance. Master the delicate balance between likeability and authority, navigate confrontation gracefully, and communicate with maximum persuasion.',
    category: 'Communication',
    level: 'Intermediate to Advanced',
    duration: '1h 28m',
    rating: 4.99,
    reviewsCount: 18230,
    learnersCount: 54100,
    thumbnail: 'https://img.youtube.com/vi/sbNc5eL7xNA/hqdefault.jpg',
    instructor: {
      name: 'Vinh Giang',
      role: 'International Keynote Speaker, Magician & Masterclass Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: [
      'Executive Presence',
      'Difficult Conversations',
      'Likeability & Respect',
      'Conflict De-escalation',
      'Strategic Speaking',
      'Influence Without Authority',
    ],
    modules: [
      {
        title: 'Module 1: The Dual Dynamics of Influence & Likability',
        lessons: [
          {
            title: 'How to Be Likeable AND Respected (The Master Balance)',
            duration: '24m',
            videoUrl: 'sbNc5eL7xNA',
            summary: 'Why people often choose between being liked or respected, and how master communicators wield warmth and strength simultaneously to earn deep trust.',
          },
          {
            title: 'How to Talk Less & Influence More (3 Secrets)',
            duration: '19m',
            videoUrl: 'lqdBbTDf1r8',
            summary: 'Harness the power of silence, concise articulation, and question-driven influence to command respect in any leadership setting.',
          },
        ],
      },
      {
        title: 'Module 2: Navigating Confrontation & Strategic Thinking',
        lessons: [
          {
            title: 'How to Have Difficult Conversations (Even If It\'s Confronting)',
            duration: '22m',
            videoUrl: '1REMKR646bk',
            summary: 'A step-by-step roadmap to addressing uncomfortable feedback, boundary violations, and performance issues without triggering defensive reactions.',
          },
          {
            title: 'How to Think 10 Steps Ahead In Any High Stakes Conversation',
            duration: '23m',
            videoUrl: '8LNYkTVk9BU',
            summary: 'Anticipate objections, understand the stakeholder chess board, and structure your proposals so agreement is the natural conclusion.',
          },
        ],
      },
    ],
  },
  {
    title: 'The CLEAR Explaining Framework & Complex Storytelling',
    slug: 'vinh-giang-clear-explaining-confidence',
    description: 'Demystify complex technical concepts, eliminate bad speaking habits, and inspire confidence using the CLEAR framework, powerful analogies, and audience-first communication.',
    category: 'Communication',
    level: 'All Levels',
    duration: '1h 22m',
    rating: 4.97,
    reviewsCount: 11200,
    learnersCount: 39800,
    thumbnail: 'https://img.youtube.com/vi/Sqh6rt1hN2A/hqdefault.jpg',
    instructor: {
      name: 'Vinh Giang',
      role: 'International Keynote Speaker, Magician & Masterclass Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: [
      'The CLEAR Framework',
      'Analogies & Metaphors',
      'Confidence Building',
      'Overcoming Shyness',
      'Speech Habits Correction',
      'Storytelling for Engineers',
    ],
    modules: [
      {
        title: 'Module 1: Explaining the Complex Simply',
        lessons: [
          {
            title: 'How to Explain Anything To Anyone (The CLEAR Framework)',
            duration: '22m',
            videoUrl: 'Sqh6rt1hN2A',
            summary: 'Demystify complex technical or abstract concepts using Vinh Giang’s CLEAR framework (Calibrate, Link, Envision, Abstract, Repeat) so any audience can grasp your ideas effortlessly.',
          },
          {
            title: 'Understand This, And Your Communication Changes (Forever)',
            duration: '19m',
            videoUrl: 'jv7CHnxEFTk',
            summary: 'A paradigm shift in how human beings perceive spoken words, tone, and intentional vulnerability in communication.',
          },
        ],
      },
      {
        title: 'Module 2: Eliminating Blindspots & Overcoming Shyness',
        lessons: [
          {
            title: 'This Speaking Habit Makes Conversations Harder Than They Should Be',
            duration: '18m',
            videoUrl: 'XbtxooSGPFA',
            summary: 'Identify the common conversational pitfalls and filler crutches that inadvertently alienate listeners or weaken persuasive power.',
          },
          {
            title: 'You\'re Naturally Shy... So Here\'s How to Actually Be Confident',
            duration: '23m',
            videoUrl: 'vb8WJgRAKUU',
            summary: 'Transform natural introversion into quiet authority. Build sustainable confidence based on preparation and self-trust rather than loud extroversion.',
          },
        ],
      },
    ],
  },
];

// Helper to seed initial courses and enforce communication masterclasses
const ensureSeedCourses = async () => {
  try {
    for (const c of DEFAULT_COURSES) {
      await Course.findOneAndUpdate(
        { slug: c.slug },
        { $set: c },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  } catch (err) {
    console.error('ensureSeedCourses error:', err?.message || err);
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

    const totalLessons = course.modules?.reduce(
      (sum, m) => sum + (m.lessons?.length || 0),
      0
    ) || 1;

    if (lessonTitle && !enrollment.completedLessons.includes(lessonTitle)) {
      enrollment.completedLessons.push(lessonTitle);
    }

    const calculatedProgress = Math.min(
      100,
      Math.round((enrollment.completedLessons.length / totalLessons) * 100)
    );
    enrollment.progress = Math.max(enrollment.progress || 0, calculatedProgress);

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

