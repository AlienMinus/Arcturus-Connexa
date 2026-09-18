import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      default: 'Arcturus Connexa',
    },
    organizationLogo: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    objective: {
      type: String,
      enum: ['brand_awareness', 'website_visits', 'job_promotion', 'lead_generation'],
      default: 'brand_awareness',
    },
    targetIndustry: {
      type: String,
      default: 'Technology & Software',
    },
    targetLocation: {
      type: String,
      default: 'Worldwide',
    },
    placement: {
      type: String,
      enum: ['feed', 'sidebar', 'both'],
      default: 'both',
    },
    headline: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    callToAction: {
      type: String,
      default: 'Learn More',
    },
    destinationUrl: {
      type: String,
      default: '',
    },
    dailyBudget: {
      type: Number,
      default: 25,
      min: 5,
    },
    totalBudget: {
      type: Number,
      default: 250,
      min: 10,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', CampaignSchema);

export default Campaign;

