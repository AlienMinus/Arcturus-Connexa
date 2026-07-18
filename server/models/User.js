import mongoose from 'mongoose';
import crypto from 'crypto';

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

function generateRandomAlphaNumeric(length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

UserSchema.pre('save', async function () {
  if (
    !this.isModified('firstName') &&
    !this.isModified('middleName') &&
    !this.isModified('lastName') &&
    this.username
  ) {
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
