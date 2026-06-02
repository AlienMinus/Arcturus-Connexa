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
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', PostSchema);

export default Post;
