import mongoose from 'mongoose';

const VerificationRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Student / Scholar',
        'Academic / Researcher',
        'Software Engineer / Tech',
        'Creator / Thought Leader',
        'Executive / Business Leader',
        'Organization Representative',
        'Public Figure'
      ],
      default: 'Student / Scholar',
    },
    affiliation: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    evidenceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const VerificationRequest = mongoose.model('VerificationRequest', VerificationRequestSchema);

export default VerificationRequest;

