import mongoose from 'mongoose';

const CandidateMatchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentName: { type: String, required: true },
    studentEmail: { type: String },
    rollNumber: { type: String },
    branch: { type: String },
    cgpa: { type: Number },
    fitScore: { type: Number, default: 0 },
    fitRationale: { type: String, default: '' },
    isEligible: { type: Boolean, default: true },
    eligibilityNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'eligible', 'shortlisted', 'in_interview', 'selected', 'rejected'],
      default: 'applied',
    },
    currentStage: { type: String, default: 'Pre-Placement Talk' },
  },
  { timestamps: true }
);

const DriveStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date },
    time: { type: String },
    venue: { type: String },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
  },
  { _id: false }
);

const PlacementDriveSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    companyName: { type: String, required: true, trim: true },
    companyLogo: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    },
    roleTitle: { type: String, required: true, trim: true },
    jobCategory: {
      type: String,
      enum: ['Core Software', 'Cloud & DevOps', 'FinTech & Analytics', 'AI & Data Science', 'Product Engineering'],
      default: 'Core Software',
    },
    ctcLpa: { type: Number, required: true },
    baseStipend: { type: Number, default: 45000 },
    packageTier: {
      type: String,
      enum: ['Standard (< 6 LPA)', 'Dream (6 - 12 LPA)', 'Super Dream (> 12 LPA)'],
      default: 'Dream (6 - 12 LPA)',
    },

    // Recruiter Eligibility Cutoffs
    eligibility: {
      minCgpa: { type: Number, default: 7.0 },
      maxBacklogs: { type: Number, default: 0 },
      allowedBranches: [
        {
          type: String,
          default: [
            'Computer Science & Engineering',
            'Information Technology',
            'Electronics & Communication',
          ],
        },
      ],
      requiredSkills: [{ type: String }],
      minReadinessScore: { type: Number, default: 65 },
    },

    // Drive Schedule & Resource Management
    schedule: {
      driveDate: { type: Date, required: true },
      startTime: { type: String, default: '09:30 AM' },
      endTime: { type: String, default: '05:00 PM' },
      venue: { type: String, default: 'Campus Auditorium - Hall A' },
      isVirtual: { type: Boolean, default: false },
      virtualMeetingUrl: { type: String, default: '' },
      slotId: { type: String, default: 'SLOT-A' },
    },

    stages: [DriveStageSchema],

    candidates: [CandidateMatchSchema],

    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    totalOpenings: { type: Number, default: 15 },
    offersExtended: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Helper to auto-categorize package tier
PlacementDriveSchema.pre('save', function () {
  if (this.ctcLpa >= 12) {
    this.packageTier = 'Super Dream (> 12 LPA)';
  } else if (this.ctcLpa >= 6) {
    this.packageTier = 'Dream (6 - 12 LPA)';
  } else {
    this.packageTier = 'Standard (< 6 LPA)';
  }
});

const PlacementDrive = mongoose.model('PlacementDrive', PlacementDriveSchema);

export default PlacementDrive;

