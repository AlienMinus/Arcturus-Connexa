import mongoose from 'mongoose';

const TaleViewerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const TaleReactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reaction: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TaleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      url: { type: String },
      public_id: { type: String },
      resource_type: { type: String, default: 'image' },
    },
    text: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    background: {
      type: String,
      default: 'linear-gradient(135deg, #0a66c2, #004182)',
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
    fontFamily: {
      type: String,
      default: 'system-ui',
    },
    viewers: [TaleViewerSchema],
    reactions: [TaleReactionSchema],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
      index: { expires: 0 }, // MongoDB automatic TTL index
    },
  },
  { timestamps: true }
);

const Tale = mongoose.model('Tale', TaleSchema);

export default Tale;

