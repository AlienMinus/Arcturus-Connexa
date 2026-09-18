import express from 'express';
import crypto from 'crypto';
import Course from '../models/Course.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const DEFAULT_COURSES = [
  {
    title: 'Cloud Architecture & Distributed Microservices at Scale',
    slug: 'cloud-architecture-distributed-microservices',
    description: 'Master high-throughput event-driven microservices, Kubernetes orchestration, service meshes, and resilient cloud architectures on AWS & GCP.',
    category: 'Cloud & DevOps',
    level: 'Advanced',
    duration: '5h 45m',
    rating: 4.9,
    reviewsCount: 3840,
    learnersCount: 16200,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Alexander Vance',
      role: 'Principal Distributed Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['Kubernetes', 'Docker', 'gRPC', 'Event-Driven Architecture', 'Cloud Resilience'],
    modules: [
      {
        title: 'Core Fundamentals of Distributed Systems',
        lessons: [
          { title: 'Decomposing Monoliths: Domain Driven Design Patterns', duration: '18m', summary: 'Explore bounded contexts and microservice boundaries.' },
          { title: 'Designing Resilient RPC & Asynchronous Messaging', duration: '22m', summary: 'Implement circuit breakers, retries, and backoff with Kafka.' },
        ],
      },
      {
        title: 'Cloud Deployment & Observability',
        lessons: [
          { title: 'Zero-Downtime Deployments with Kubernetes & Istio', duration: '25m', summary: 'Blue-green and canary rollouts orchestrated with GitOps.' },
          { title: 'Distributed Tracing & Distributed Latency Profiling', duration: '20m', summary: 'OpenTelemetry, Jaeger, and metric aggregation.' },
        ],
      },
    ],
  },
  {
    title: 'Generative AI & LLM Systems Engineering with LangChain',
    slug: 'generative-ai-llm-systems-engineering',
    description: 'Build enterprise-grade Retrieval-Augmented Generation (RAG) pipelines, vector database search, fine-tuned agent workflows, and prompt engineering.',
    category: 'AI & Machine Learning',
    level: 'Intermediate',
    duration: '4h 30m',
    rating: 4.95,
    reviewsCount: 4210,
    learnersCount: 22800,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Dr. Priya Sharma',
      role: 'Head of Applied AI Research',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['Generative AI', 'Vector DBs (Pinecone/Milvus)', 'RAG Pipelines', 'LangChain', 'Prompt Optimization'],
    modules: [
      {
        title: 'Foundations of Modern Large Language Models',
        lessons: [
          { title: 'Transformer Architecture & Attention Mechanisms', duration: '24m', summary: 'Deep dive into self-attention and positional embeddings.' },
          { title: 'RAG Architecture: Chunking, Embeddings, & Hybrid Search', duration: '30m', summary: 'Vector indexing and dense-sparse retrieval techniques.' },
        ],
      },
      {
        title: 'Autonomous Multi-Agent Orchestration',
        lessons: [
          { title: 'Building Tool-Calling Agent Loops & Memory Stores', duration: '28m', summary: 'Orchestrating autonomous agents with dynamic execution.' },
          { title: 'Guardrails, Evaluation Benchmarks, & Production Safety', duration: '20m', summary: 'Hallucination mitigation and safety filters.' },
        ],
      },
    ],
  },
  {
    title: 'Modern Full-Stack React 19, TypeScript & Node.js Production Mastery',
    slug: 'modern-fullstack-react-typescript-node',
    description: 'Learn modern React Server Components, high-performance concurrency, typed API contracts, WebSockets, and production deployment pipelines.',
    category: 'Full Stack Development',
    level: 'Beginner',
    duration: '6h 15m',
    rating: 4.85,
    reviewsCount: 2980,
    learnersCount: 18450,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Marcus Brody',
      role: 'Staff Frontend Architect & Core Maintainer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'REST & GraphQL'],
    modules: [
      {
        title: 'React 19 Architecture & State Modeling',
        lessons: [
          { title: 'Concurrent Rendering, Transitions, and Action Hooks', duration: '22m', summary: 'Understanding modern state primitives.' },
          { title: 'End-to-End Type Safety with Zod and TypeScript', duration: '19m', summary: 'Strict typing for client-server contracts.' },
        ],
      },
    ],
  },
  {
    title: 'Large-Scale System Design & Database Sharding for Tech Interviews',
    slug: 'system-design-database-sharding-interview',
    description: 'Crack senior engineering and architect interviews. Master CAP theorem, consistent hashing, distributed caching, database indexing, and replication.',
    category: 'System Design',
    level: 'Advanced',
    duration: '5h 10m',
    rating: 4.92,
    reviewsCount: 3120,
    learnersCount: 14700,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Elena Rostova',
      role: 'Ex-FAANG VP of Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['System Design', 'Consistent Hashing', 'Database Sharding', 'Redis Caching', 'High Availability'],
    modules: [
      {
        title: 'Distributed Storage Strategies',
        lessons: [
          { title: 'Designing High-QPS Feed & Timeline Generation Services', duration: '28m', summary: 'Fan-out write vs fan-out read architectural tradeoffs.' },
          { title: 'Database Sharding, Partitions, and Consensus Protocols', duration: '32m', summary: 'Raft, Paxos, and distributed transactions.' },
        ],
      },
    ],
  },
  {
    title: 'Engineering Leadership: Mentoring, Architecture Strategy & Executive Influence',
    slug: 'engineering-leadership-strategy-executive-influence',
    description: 'Transition from Senior/Lead to Engineering Manager, Director, or Principal. Master technical strategy, 1-on-1 coaching, cross-org alignment, and metrics.',
    category: 'Leadership & Management',
    level: 'Intermediate',
    duration: '3h 50m',
    rating: 4.88,
    reviewsCount: 1650,
    learnersCount: 9200,
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'David Chen',
      role: 'CTO & Tech Leadership Advisor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['Engineering Management', 'Technical Roadmapping', 'Team Mentorship', 'Conflict Resolution', 'Executive Communication'],
    modules: [
      {
        title: 'Strategic Leadership & Team Scaling',
        lessons: [
          { title: 'Building High-Performance Engineering Cultures', duration: '20m', summary: 'Psychological safety, accountability, and code velocity.' },
          { title: 'Driving Cross-Functional Alignment with Product and Execs', duration: '25m', summary: 'Communicating technical ROI to stakeholders.' },
        ],
      },
    ],
  },
  {
    title: 'Data Engineering Pipelines with Apache Spark, Kafka & Delta Lake',
    slug: 'data-engineering-spark-kafka-delta-lake',
    description: 'Architect scalable real-time streaming and batch pipelines. Process petabyte-scale data lakes with ACID transactions, schema enforcement, and PySpark.',
    category: 'Data Engineering',
    level: 'Advanced',
    duration: '6h 00m',
    rating: 4.89,
    reviewsCount: 2100,
    learnersCount: 11300,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Sofia Al-Mansoor',
      role: 'Lead Data Platform Architect',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    },
    skills: ['Apache Spark', 'Kafka Streaming', 'Delta Lake', 'PySpark', 'ETL Architecture'],
    modules: [
      {
        title: 'Modern Lakehouse Architecture',
        lessons: [
          { title: 'Streaming Ingestion with Apache Kafka & Structured Streaming', duration: '30m', summary: 'Real-time telemetry and exactly-once processing.' },
          { title: 'Medallion Architecture (Bronze, Silver, Gold) on Delta Lake', duration: '26m', summary: 'Schema evolution and time-travel querying.' },
        ],
      },
    ],
  },
];

// Helper to seed initial courses if collection is empty
const ensureSeedCourses = async () => {
  const count = await Course.countDocuments();
  if (count === 0) {
    await Course.insertMany(DEFAULT_COURSES);
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

