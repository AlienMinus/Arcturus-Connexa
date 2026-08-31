import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String },
    documentType: {
      type: String,
      enum: [
        'Certificate of Incorporation',
        'Business License',
        'Tax ID / Registration',
        'GST / VAT Certificate',
        'Utility / Proof of Address',
        'Other Verification Document'
      ],
      default: 'Certificate of Incorporation',
    },
    originalName: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      required: true,
      default: 'Software Development',
    },
    organizationSize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '11-50',
    },
    organizationType: {
      type: String,
      enum: [
        'Privately Held',
        'Public Company',
        'Startup',
        'Government Agency',
        'Nonprofit',
        'Sole Proprietorship',
        'Partnership'
      ],
      default: 'Privately Held',
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
      default: '',
    },
    logo: {
      url: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      },
      public_id: {
        type: String,
        default: '',
      },
    },
    documents: [DocumentSchema],
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['Admin', 'Recruiter', 'Member'], default: 'Admin' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Organization = mongoose.model('Organization', OrganizationSchema);

export default Organization;

