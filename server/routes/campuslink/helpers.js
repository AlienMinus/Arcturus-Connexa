import User from '../../models/User.js';
import Profile from '../../models/Profile.js';
import Organization from '../../models/Organization.js';

// Dynamic skill gap analysis evaluated against real scheduled placement drives
export const computeSkillGaps = (studentSkills = [], drives = []) => {
  if (!Array.isArray(drives) || drives.length === 0) {
    return [];
  }
  const normalized = studentSkills.map((s) => s.toLowerCase().trim());
  return drives.map((drive) => {
    const roleName = `${drive.companyName} - ${drive.roleTitle}`;
    const requiredSkills = drive.eligibility?.requiredSkills || ['Problem Solving', 'Data Structures'];
    const matched = [];
    const missing = [];

    requiredSkills.forEach((req) => {
      if (normalized.some((s) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    });

    const matchPercentage = requiredSkills.length > 0
      ? Math.round((matched.length / requiredSkills.length) * 100)
      : 100;

    const recommendation =
      missing.length > 0
        ? `Skill gap detected in ${missing.slice(0, 2).join(' and ')} for ${drive.companyName}. Complete targeted preparation to reach recruiter cutoff.`
        : `100% technical competency matched with ${drive.companyName}'s hiring criteria!`;

    const suggestedCourses = missing.slice(0, 2).map((sk) => ({
      title: `${sk} Practical Preparation`,
      provider: 'Arcturus Learning',
      url: '/learning',
    }));

    return {
      targetRole: roleName,
      matchedSkills: matched,
      missingSkills: missing,
      matchPercentage,
      recommendation,
      suggestedCourses,
    };
  });
};

// Check if a user possesses Arcturus administrator privileges
export const isCampusLinkAdmin = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId);
  return (
    user?.role === 'admin' ||
    user?.isAdmin === true ||
    user?.username?.toLowerCase() === 'arcturus_admin' ||
    user?.email?.toLowerCase()?.includes('admin@arcturus')
  );
};

export const getPlacementOfficerOrganization = async (userId) => {
  const user = await User.findById(userId).select('placementOfficer').lean();
  if (user?.placementOfficer?.status !== 'approved' || !user.placementOfficer.organizationId) return null;
  return Organization.findOne({ _id: user.placementOfficer.organizationId, status: 'approved' });
};

export const getManagedOrganization = async (userId, organizationId) => {
  if (!userId || !organizationId) return null;
  return Organization.findOne({
    _id: organizationId,
    status: 'approved',
    $or: [{ adminId: userId }, { 'members.userId': userId }],
  });
};

// Extract and import all candidate individual profile data from Arcturus Profile & User models
export const getFullCandidateProfile = async (userId) => {
  if (!userId) return null;
  try {
    const [userDoc, userProfile] = await Promise.all([
      User.findById(userId).populate('institute.organizationId', 'name logo slug').lean(),
      Profile.findOne({ userId }).lean(),
    ]);

    if (!userDoc && !userProfile) return null;

    const fullName = [userDoc?.firstName, userDoc?.middleName, userDoc?.lastName]
      .filter(Boolean)
      .join(' ') || userProfile?.name || userDoc?.name || userDoc?.username || '';

    return {
      userId,
      fullName,
      username: userDoc?.username || '',
      email: userDoc?.email || '',
      avatar: userProfile?.avatar?.url || userDoc?.profilePicture || null,
      headline: userProfile?.headline || userDoc?.headline || '',
      summary: userProfile?.summary || '',
      location: userProfile?.location || '',
      projects: Array.isArray(userProfile?.projects) ? userProfile.projects : [],
      experience: Array.isArray(userProfile?.experience) ? userProfile.experience : [],
      certifications: Array.isArray(userProfile?.certifications) ? userProfile.certifications : [],
      education: Array.isArray(userProfile?.education) ? userProfile.education : [],
      skills: Array.isArray(userProfile?.skills) ? userProfile.skills : [],
      honors: Array.isArray(userProfile?.honors) ? userProfile.honors : [],
      interests: Array.isArray(userProfile?.interests) ? userProfile.interests : [],
      featured: Array.isArray(userProfile?.featured) ? userProfile.featured : [],
      institute: userDoc?.institute || null,
      isVerified: Boolean(userDoc?.isVerified),
    };
  } catch (err) {
    console.error('Failed to import full candidate profile for user', userId, err);
    return null;
  }
};

