import mongoose from 'mongoose';
import Course from '../server/models/Course.js';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Course.deleteMany({});

  const vinhCourse = await Course.create({
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
  });

  const count = await Course.countDocuments();
  console.log('Successfully seeded! Total courses in database:', count, '| Title:', vinhCourse.title);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
