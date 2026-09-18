import mongoose from 'mongoose';
import crypto from 'crypto';

const PlacementOfferSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    branch: { type: String, required: true },
    companyName: { type: String, required: true },
    companyLogo: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    },
    role: { type: String, required: true },
    ctcLpa: { type: Number, required: true },
    packageTier: {
      type: String,
      enum: ['Standard (< 6 LPA)', 'Dream (6 - 12 LPA)', 'Super Dream (> 12 LPA)'],
      default: 'Dream (6 - 12 LPA)',
    },
    offerType: {
      type: String,
      enum: ['Full-Time', 'Internship + PPO', 'Internship Only'],
      default: 'Full-Time',
    },
    offerDate: { type: Date, default: Date.now },
    acceptanceDeadline: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    joiningDate: {
      type: Date,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // ~6 months
    },
    status: {
      type: String,
      enum: ['offered', 'accepted', 'deferred', 'declined'],
      default: 'offered',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
    },
    documentUrl: { type: String, default: '' },
    verificationHash: { type: String },
    bondDetails: { type: String, default: 'None / No Service Agreement Bond' },
  },
  { timestamps: true }
);

PlacementOfferSchema.pre('save', function () {
  if (this.ctcLpa >= 12) {
    this.packageTier = 'Super Dream (> 12 LPA)';
  } else if (this.ctcLpa >= 6) {
    this.packageTier = 'Dream (6 - 12 LPA)';
  } else {
    this.packageTier = 'Standard (< 6 LPA)';
  }

  if (!this.verificationHash) {
    const raw = `${this.studentName}-${this.companyName}-${this.ctcLpa}-${Date.now()}`;
    this.verificationHash = '0x' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }
});

const PlacementOffer = mongoose.model('PlacementOffer', PlacementOfferSchema);

export default PlacementOffer;

