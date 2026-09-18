import mongoose from 'mongoose';

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, default: '15m' },
  videoUrl: { type: String, default: '' },
  summary: { type: String, default: '' }
}, { _id: true });

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [LessonSchema]
}, { _id: true });

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Cloud & DevOps',
        'AI & Machine Learning',
        'Full Stack Development',
        'System Design',
        'Leadership & Management',
        'Data Engineering',
      ],
      default: 'Cloud & DevOps',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    duration: {
      type: String,
      default: '4h 15m',
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 1240,
    },
    learnersCount: {
      type: Number,
      default: 8400,
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    },
    instructor: {
      name: { type: String, default: 'Dr. Sarah Lin' },
      role: { type: String, default: 'Distinguished Cloud Architect & Author' },
      avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    },
    skills: [String],
    modules: [ModuleSchema],
    enrolledUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        progress: { type: Number, default: 0 }, // 0 - 100%
        completedLessons: [String],
        enrolledAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        certificateId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', CourseSchema);

export default Course;

