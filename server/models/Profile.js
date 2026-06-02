import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String },
    public_id: { type: String },
    resource_type: { type: String },
  },
  { _id: false }
);

const ListItemSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    location: String,
    dateRange: String,
    description: String,
    url: String,
    issuer: String,
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    summary: { type: String, default: '' },
    backgroundImage: MediaSchema,
    avatar: MediaSchema,
    featured: [
      {
        title: String,
        subtitle: String,
        description: String,
        url: String,
      },
    ],
    activity: [
      {
        title: String,
        description: String,
        date: String,
        url: String,
      },
    ],
    experience: [ListItemSchema],
    education: [ListItemSchema],
    certifications: [ListItemSchema],
    projects: [
      {
        title: String,
        description: String,
        url: String,
      },
    ],
    skills: [String],
    honors: [
      {
        title: String,
        issuer: String,
        date: String,
      },
    ],
    interests: [String],
  },
  { timestamps: true }
);

const Profile = mongoose.model('Profile', ProfileSchema);

export default Profile;
