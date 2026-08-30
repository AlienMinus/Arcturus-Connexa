import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset', 'login'],
      default: 'registration',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Document automatically removed after 10 minutes (TTL index)
    },
  },
  { timestamps: true }
);

export default mongoose.model('Otp', otpSchema);

