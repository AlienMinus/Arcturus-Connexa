import mongoose from 'mongoose';

const PasswordHistorySchema = new mongoose.Schema(
  {
    hash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    password: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    profilePicture: {
      url: { type: String },
      public_id: { type: String },
    },
    phoneNumber: { type: String, default: '' },
    location: { type: String, default: '' },
    headline: { type: String, default: '' },
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    activities: [{
      activityType: { type: String, enum: ['reaction', 'view'] },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      createdAt: { type: Date, default: Date.now }
    }],
    passwordHistory: [PasswordHistorySchema],
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    lastLogin: { type: Date },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingConnectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentConnectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifications: [
      {
        type: {
          type: String,
          enum: ['post', 'repost', 'reaction', 'follow', 'connection', 'request', 'other'],
          default: 'other',
        },
        message: { type: String, required: true },
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

export default User;
