import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String },
  resource_type: { type: String },
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
    media: [MediaSchema],
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
