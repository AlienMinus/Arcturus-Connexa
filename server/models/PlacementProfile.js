import mongoose from 'mongoose';

const SkillGapItemSchema = new mongoose.Schema(
  {
    targetRole: { type: String, required: true },
    missingSkills: [{ type: String }],
    matchedSkills: [{ type: String }],
    matchPercentage: { type: Number, default: 0 },
    recommendation: { type: String, default: '' },
    suggestedCourses: [{ title: String, provider: String, url: String }],
  },
  { _id: false }
);

const PlacementProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: { type: String, required: true, trim: true },
    collegeName: { type: String, required: true, trim: true },
    branch: {
      type: String,
      enum: [
        'Computer Science & Engineering',
        'Information Technology',
        'Electronics & Communication',
        'Electrical & Electronics',
        'Mechanical Engineering',
        'Civil Engineering',
      ],
      default: 'Computer Science & Engineering',
    },
    graduationYear: { type: Number, default: () => new Date().getFullYear() },
    cgpa: { type: Number, required: true, min: 0, max: 10 },
    activeBacklogs: { type: Number, default: 0 },
    totalBacklogs: { type: Number, default: 0 },
    tenthPercentage: { type: Number },
    twelfthPercentage: { type: Number },
    skills: [{ type: String }],
    targetRoles: [{ type: String }],

    // 4-Dimension Readiness Breakdown (0 - 100)
    technicalScore: { type: Number, default: 50 },
    aptitudeScore: { type: Number, default: 50 },
    communicationScore: { type: Number, default: 50 },
    projectScore: { type: Number, default: 50 },
    overallReadiness: { type: Number, default: 50 },

    // 4-Tier Categorization: Not Ready -> Developing -> Ready -> Highly Employable
    readinessLevel: {
      type: String,
      enum: ['Not Ready', 'Developing', 'Ready', 'Highly Employable'],
      default: 'Developing',
    },
    aiReadinessSummary: {
      type: String,
      default: '',
    },

    skillGaps: [SkillGapItemSchema],

    placementStatus: {
      type: String,
      enum: ['unplaced', 'shortlisted', 'interviewing', 'placed', 'opted_out'],
      default: 'unplaced',
    },

    // Predictive At-Risk identification
    isAtRisk: { type: Boolean, default: false },
    riskReason: { type: String, default: '' },
    assignedMentor: { type: String, default: '' },
    mentorActionRecommendation: { type: String, default: '' },
    gemmaDiagnosticTimestamp: { type: Date, default: Date.now },
    gemmaModel: { type: String, default: 'google/gemma-3-4b-it' },
    gemmaProvider: { type: String, default: 'Hugging Face Gemma' },

    mockInterviewsTaken: { type: Number, default: 0 },
    lastAssessmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto compute readiness level before saving
PlacementProfileSchema.pre('save', function () {
  const avg = Math.round(
    this.technicalScore * 0.35 +
      this.aptitudeScore * 0.25 +
      this.communicationScore * 0.2 +
      this.projectScore * 0.2
  );
  this.overallReadiness = avg;

  if (avg >= 85) {
    this.readinessLevel = 'Highly Employable';
  } else if (avg >= 70) {
    this.readinessLevel = 'Ready';
  } else if (avg >= 50) {
    this.readinessLevel = 'Developing';
  } else {
    this.readinessLevel = 'Not Ready';
  }

  // Predictive at risk flag: low CGPA, active backlogs, or low readiness
  if (this.cgpa < 6.5 || this.activeBacklogs > 0 || this.overallReadiness < 55 || this.isAtRisk) {
    this.isAtRisk = true;
    if (!this.riskReason) {
      this.riskReason =
        this.activeBacklogs > 0
          ? 'Active backlogs require clearance'
          : this.cgpa < 6.5
          ? 'CGPA is below standard 7.0 recruiter cutoff'
          : 'Employability readiness score is below 55%';
    }
  } else {
    this.isAtRisk = false;
    this.riskReason = '';
  }
});

const PlacementProfile = mongoose.model('PlacementProfile', PlacementProfileSchema);

export default PlacementProfile;

