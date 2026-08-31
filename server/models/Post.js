import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String },
  resource_type: { type: String },
});

const PollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const PollSchema = new mongoose.Schema({
  question: { type: String },
  options: [PollOptionSchema],
  duration: { type: String, default: '1 week' },
  expiresAt: { type: Date },
});

const EventSchema = new mongoose.Schema({
  title: { type: String },
  date: { type: String },
  time: { type: String },
  isOnline: { type: Boolean, default: true },
  location: { type: String },
});

const CelebrationSchema = new mongoose.Schema({
  type: { type: String, default: 'kudos' },
  recipientName: { type: String },
  message: { type: String },
});

const HiringSchema = new mongoose.Schema({
  role: { type: String },
  company: { type: String },
  location: { type: String },
  applyUrl: { type: String },
});

const DocumentSchema = new mongoose.Schema({
  url: { type: String },
  name: { type: String },
  size: { type: Number },
  public_id: { type: String },
});

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    author: { type: String, default: 'Anonymous' },
    content: { type: String, default: '' },
    audience: {
      type: String,
      enum: ['Anyone', 'Connections only', 'Group', 'Only me'],
      default: 'Anyone',
    },
    media: [MediaSchema],
    poll: PollSchema,
    event: EventSchema,
    celebration: CelebrationSchema,
    hiring: HiringSchema,
    document: DocumentSchema,
    isScheduled: { type: Boolean, default: false },
    scheduledAt: { type: Date },
    likes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reactionType: { type: String, default: 'Like' }
    }],
    comments: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      createdAt: { type: Date, default: Date.now }
    }],
    impressions: [{
      viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }],
    impressionsCount: { type: Number, default: 0 },
    repostedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', PostSchema);

export default Post;
