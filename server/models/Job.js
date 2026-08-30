import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    companyLogo: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png' },
    location: { type: String, required: true },
    workplaceType: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'Hybrid',
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    salary: { type: String, default: '' },
    skills: [{ type: String }],
    description: { type: String, required: true },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicants: [
      {
        applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        email: { type: String },
        headline: { type: String },
        appliedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['Applied', 'In Review', 'Shortlisted', 'Rejected', 'Hired'],
          default: 'Applied',
        },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', JobSchema);

export default Job;

