import mongoose from 'mongoose';
import crypto from 'crypto';

const PasswordHistorySchema = new mongoose.Schema(
  {
    hash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UsernameChangeSchema = new mongoose.Schema(
  {
    changedAt: { type: Date, default: Date.now },
    oldUsername: { type: String },
    newUsername: { type: String },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String, default: '' },
    lastName: { type: String, default: '' },
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
    usernameChangeHistory: [UsernameChangeSchema],
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
      activityType: { type: String, default: 'reaction' },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      createdAt: { type: Date, default: Date.now }
    }],
    profileViews: [{
      viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }],
    profileViewsCount: { type: Number, default: 0 },
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
          enum: ['post', 'repost', 'reaction', 'follow', 'connection', 'request', 'profile_view', 'view', 'other'],
          default: 'other',
        },
        message: { type: String, required: true },
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      profileViewingMode: { type: String, enum: ['public', 'semi', 'private'], default: 'public' },
      showEmailToConnections: { type: Boolean, default: true },
      shareProfileUpdates: { type: Boolean, default: true },
      twoFactorAuth: { type: Boolean, default: false },
      rememberSessions: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      soundEffects: { type: Boolean, default: true },
      autoplayVideos: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

function generateRandomAlphaNumeric(length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

UserSchema.pre('save', async function () {
  if (this.username) {
    return;
  }

  try {
    let baseUsername = this.firstName.toLowerCase();
    if (this.middleName) {
      baseUsername += `_${this.middleName.toLowerCase()}`;
    }
    baseUsername += `_${this.lastName.toLowerCase()}`;

    baseUsername = baseUsername
      .replace(/[^a-z0-9_]+/g, '')
      .replace(/_{2,}/g, '_');

    let username = baseUsername;
    let userWithUsername = await mongoose.models.User.findOne({ username });

    while (
      userWithUsername &&
      userWithUsername._id.toString() !== this._id.toString()
    ) {
      const randomSuffix = generateRandomAlphaNumeric(4);
      username = `${baseUsername}_${randomSuffix}`;
      userWithUsername = await mongoose.models.User.findOne({ username });
    }

    this.username = username;
  } catch (error) {
    throw error;
  }
});

const User = mongoose.model('User', UserSchema);

export default User;
