import express from 'express';
import jwt from 'jsonwebtoken';
import PlacementProfile from '../models/PlacementProfile.js';
import PlacementDrive from '../models/PlacementDrive.js';
import PlacementOffer from '../models/PlacementOffer.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import authMiddleware from '../middleware/auth.js';
import { detectDriveConflicts } from '../utils/conflictDetector.js';
import { analyzePlacementRiskAndGuidance, generateGemmaChatReply } from '../services/gemmaService.js';

const router = express.Router();

// Dynamic skill gap analysis evaluated against real scheduled placement drives
const computeSkillGaps = (studentSkills = [], drives = []) => {
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

const isCampusLinkAdmin = async (userId) => {
  const user = await User.findById(userId);
  return (
    user?.role === 'admin' ||
    user?.isAdmin === true ||
    user?.username?.toLowerCase() === 'arcturus_admin' ||
    user?.email?.toLowerCase()?.includes('admin@arcturus')
  );
};

// Helper to extract and import all candidate individual profile data from Arcturus Profile & User models
const getFullCandidateProfile = async (userId) => {
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

// GET /api/campuslink/profile/me - Get student's placement readiness profile
router.get('/profile/me', authMiddleware, async (req, res) => {
  try {
    let profile = await PlacementProfile.findOne({ userId: req.userId }).lean();
    if (!profile) {
      return res.json({ profile: null });
    }

    // Refresh dynamic skill gap recommendations against actual scheduled drives
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).lean();
    profile.skillGaps = computeSkillGaps(profile.skills || [], activeDrives);

    // Import full candidate individual profile data (projects, experiences, certifications)
    const candidateProfile = await getFullCandidateProfile(req.userId);
    profile.candidateProfile = candidateProfile;

    res.json({ profile });
  } catch (err) {
    console.error('Failed to get student placement profile:', err);
    res.status(500).json({ error: 'Failed to load placement profile' });
  }
});

// POST /api/campuslink/profile - Create or update student placement profile with real data
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      rollNumber,
      collegeName,
      branch,
      graduationYear,
      cgpa,
      activeBacklogs,
      skills,
      targetRoles,
    } = req.body;

    if (!rollNumber || !collegeName || !branch || cgpa === undefined) {
      return res.status(400).json({ error: 'Roll number, college name, branch, and CGPA are required.' });
    }

    const studentSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const numCgpa = Number(cgpa) || 0;
    const numBacklogs = Number(activeBacklogs) || 0;
    const numGradYear = Number(graduationYear) || new Date().getFullYear();

    // Import complete candidate profile data from Arcturus Profile page
    const candidateProfile = await getFullCandidateProfile(req.userId);

    const profileSkills = candidateProfile?.skills || [];
    const combinedSkills = Array.from(new Set([...studentSkills, ...profileSkills]));

    const projectCount = candidateProfile?.projects?.length || 0;
    const experienceCount = candidateProfile?.experience?.length || 0;
    const certificationsCount = candidateProfile?.certifications?.length || 0;

    // Compute realistic score dimensions incorporating applicant's real projects, descriptions & background
    const technicalScore = Math.min(100, Math.max(30, combinedSkills.length * 8 + Math.round(numCgpa * 4) + certificationsCount * 5));
    const aptitudeScore = Math.min(100, Math.max(35, Math.round(numCgpa * 9) - numBacklogs * 5));
    const communicationScore = 75; // Baseline behavioral score
    const projectScore = Math.min(100, Math.max(40, projectCount * 18 + combinedSkills.length * 5 + (experienceCount > 0 ? 15 : 0)));

    const overallReadiness = Math.round(
      technicalScore * 0.4 + aptitudeScore * 0.25 + communicationScore * 0.15 + projectScore * 0.2
    );

    let readinessLevel = 'Developing';
    if (overallReadiness >= 85) readinessLevel = 'Highly Employable';
    else if (overallReadiness >= 70) readinessLevel = 'Ready';
    else if (overallReadiness < 50) readinessLevel = 'Not Ready';

    // Skill gaps evaluated dynamically against real scheduled recruitment drives
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).lean();
    const skillGaps = computeSkillGaps(combinedSkills, activeDrives);

    // Run Hugging Face Gemma Risk & Recommendation Diagnostics using imported candidate profile data
    const gemmaAnalysis = await analyzePlacementRiskAndGuidance({
      rollNumber,
      collegeName,
      branch,
      graduationYear: numGradYear,
      cgpa: numCgpa,
      activeBacklogs: numBacklogs,
      skills: combinedSkills,
      technicalScore,
      aptitudeScore,
      communicationScore,
      projectScore,
      overallReadiness,
      readinessLevel,
      targetRoles,
      // Full candidate profile portfolio imported from Arcturus Profile page
      headline: candidateProfile?.headline || '',
      summary: candidateProfile?.summary || '',
      location: candidateProfile?.location || '',
      projects: candidateProfile?.projects || [],
      experience: candidateProfile?.experience || [],
      certifications: candidateProfile?.certifications || [],
      education: candidateProfile?.education || [],
      honors: candidateProfile?.honors || [],
      interests: candidateProfile?.interests || [],
      featured: candidateProfile?.featured || [],
      isVerified: Boolean(candidateProfile?.isVerified),
    });

    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (profile) {
      profile.rollNumber = rollNumber.trim();
      profile.collegeName = collegeName.trim();
      profile.branch = branch.trim();
      profile.graduationYear = numGradYear;
      profile.cgpa = numCgpa;
      profile.activeBacklogs = numBacklogs;
      profile.skills = combinedSkills;
      profile.targetRoles = targetRoles || profile.targetRoles;
      profile.technicalScore = technicalScore;
      profile.aptitudeScore = aptitudeScore;
      profile.communicationScore = communicationScore;
      profile.projectScore = projectScore;
      profile.overallReadiness = overallReadiness;
      profile.readinessLevel = readinessLevel;
      profile.skillGaps = skillGaps;
      profile.isAtRisk = gemmaAnalysis.isAtRisk;
      profile.riskReason = gemmaAnalysis.riskReason;
      profile.aiReadinessSummary = gemmaAnalysis.aiReadinessSummary;
      profile.mentorActionRecommendation = gemmaAnalysis.mentorActionRecommendation;
      profile.gemmaDiagnosticTimestamp = new Date();
      await profile.save();
    } else {
      profile = await PlacementProfile.create({
        userId: req.userId,
        rollNumber: rollNumber.trim(),
        collegeName: collegeName.trim(),
        branch: branch.trim(),
        graduationYear: numGradYear,
        cgpa: numCgpa,
        activeBacklogs: numBacklogs,
        totalBacklogs: numBacklogs,
        skills: combinedSkills,
        targetRoles: targetRoles || ['Campus Placement Candidate'],
        technicalScore,
        aptitudeScore,
        communicationScore,
        projectScore,
        overallReadiness,
        readinessLevel,
        skillGaps,
        isAtRisk: gemmaAnalysis.isAtRisk,
        riskReason: gemmaAnalysis.riskReason,
        aiReadinessSummary: gemmaAnalysis.aiReadinessSummary,
        mentorActionRecommendation: gemmaAnalysis.mentorActionRecommendation,
        gemmaDiagnosticTimestamp: new Date(),
      });
    }

    const profileObj = profile.toObject ? profile.toObject() : profile;
    profileObj.candidateProfile = candidateProfile;

    res.json({
      message: 'Placement profile saved and analyzed with Hugging Face Gemma!',
      profile: profileObj,
      gemmaAnalysis,
    });
  } catch (err) {
    console.error('Failed to save placement profile:', err);
    res.status(500).json({ error: 'Failed to save placement profile' });
  }
});

// POST /api/campuslink/profile/diagnose-ai - On-demand Gemma AI Risk & Recommendation Diagnostics
router.post('/profile/diagnose-ai', authMiddleware, async (req, res) => {
  try {
    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Placement profile not found. Please complete profile setup first.' });
    }

    // Fetch applicant's main Arcturus profile data
    const candidateProfile = await getFullCandidateProfile(req.userId);

    const profileSkills = candidateProfile?.skills || [];
    const combinedSkills = Array.from(new Set([...(profile.skills || []), ...profileSkills]));

    const projectCount = candidateProfile?.projects?.length || 0;
    const experienceCount = candidateProfile?.experience?.length || 0;
    const certificationsCount = candidateProfile?.certifications?.length || 0;

    const gemmaAnalysis = await analyzePlacementRiskAndGuidance({
      rollNumber: profile.rollNumber,
      collegeName: profile.collegeName,
      branch: profile.branch,
      graduationYear: profile.graduationYear,
      cgpa: profile.cgpa,
      activeBacklogs: profile.activeBacklogs,
      skills: combinedSkills,
      technicalScore: profile.technicalScore,
      aptitudeScore: profile.aptitudeScore,
      communicationScore: profile.communicationScore,
      projectScore: profile.projectScore,
      overallReadiness: profile.overallReadiness,
      readinessLevel: profile.readinessLevel,
      targetRoles: profile.targetRoles,
      // Full candidate profile portfolio imported from Arcturus Profile page
      headline: candidateProfile?.headline || '',
      summary: candidateProfile?.summary || '',
      location: candidateProfile?.location || '',
      projects: candidateProfile?.projects || [],
      experience: candidateProfile?.experience || [],
      certifications: candidateProfile?.certifications || [],
      education: candidateProfile?.education || [],
      honors: candidateProfile?.honors || [],
      interests: candidateProfile?.interests || [],
      featured: candidateProfile?.featured || [],
      isVerified: Boolean(candidateProfile?.isVerified),
    });

    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).lean();

    profile.skills = combinedSkills;
    profile.aiReadinessSummary = gemmaAnalysis.aiReadinessSummary;
    profile.isAtRisk = gemmaAnalysis.isAtRisk;
    profile.riskReason = gemmaAnalysis.riskReason;
    profile.mentorActionRecommendation = gemmaAnalysis.mentorActionRecommendation;
    profile.gemmaDiagnosticTimestamp = new Date();
    profile.skillGaps = computeSkillGaps(combinedSkills, activeDrives);

    await profile.save();

    const profileObj = profile.toObject();
    profileObj.candidateProfile = candidateProfile;

    res.json({
      message: 'Hugging Face Gemma-2 AI Diagnostics completed successfully!',
      profile: profileObj,
      gemmaAnalysis,
    });
  } catch (err) {
    console.error('Failed to run Gemma diagnostics:', err);
    res.status(500).json({ error: 'Failed to run Gemma AI diagnostics' });
  }
});

// POST /api/campuslink/profile/assessment - Submit mock interview/assessment & recompute readiness
router.post('/profile/assessment', authMiddleware, async (req, res) => {
  try {
    const { technicalDelta = 4, aptitudeDelta = 3, communicationDelta = 5 } = req.body;

    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.technicalScore = Math.min(100, profile.technicalScore + Number(technicalDelta));
    profile.aptitudeScore = Math.min(100, profile.aptitudeScore + Number(aptitudeDelta));
    profile.communicationScore = Math.min(100, profile.communicationScore + Number(communicationDelta));
    profile.mockInterviewsTaken += 1;
    profile.lastAssessmentDate = new Date();

    await profile.save();

    res.json({
      message: 'Assessment completed! Readiness scores boosted.',
      profile,
    });
  } catch (err) {
    console.error('Failed to process assessment:', err);
    res.status(500).json({ error: 'Assessment submission failed' });
  }
});

// GET /api/campuslink/drives - Get all drives and real-time conflicts
router.get('/drives', async (req, res) => {
  try {
    const drives = await PlacementDrive.find().sort({ 'schedule.driveDate': 1 }).lean();
    const conflicts = detectDriveConflicts(drives);

    res.json({ drives, conflicts });
  } catch (err) {
    console.error('Failed to fetch placement drives:', err);
    res.status(500).json({ error: 'Failed to retrieve drives' });
  }
});

// POST /api/campuslink/drives - Create placement drive
router.post('/drives', authMiddleware, async (req, res) => {
  try {
    if (!(await isCampusLinkAdmin(req.userId))) {
      return res.status(403).json({
        error: 'Access denied: Scheduling recruitment drives is restricted strictly to Arcturus Administrators.',
      });
    }

    const {
      companyName,
      companyLogo,
      roleTitle,
      jobCategory,
      ctcLpa,
      baseStipend,
      minCgpa,
      maxBacklogs,
      allowedBranches,
      requiredSkills,
      minReadinessScore,
      driveDate,
      startTime,
      endTime,
      venue,
      totalOpenings,
    } = req.body;

    if (!companyName || !roleTitle || !ctcLpa || !driveDate) {
      return res.status(400).json({ error: 'Company name, role, CTC, and drive date are required.' });
    }

    const drive = await PlacementDrive.create({
      companyName: companyName.trim(),
      companyLogo: companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      roleTitle: roleTitle.trim(),
      jobCategory: jobCategory || 'Core Software',
      ctcLpa: Number(ctcLpa),
      baseStipend: Number(baseStipend) || 45000,
      eligibility: {
        minCgpa: Number(minCgpa) || 7.0,
        maxBacklogs: Number(maxBacklogs) || 0,
        allowedBranches: allowedBranches || ['Computer Science & Engineering', 'Information Technology'],
        requiredSkills: requiredSkills || ['Data Structures', 'Python', 'Web Technologies'],
        minReadinessScore: Number(minReadinessScore) || 65,
      },
      schedule: {
        driveDate: new Date(driveDate),
        startTime: startTime || '09:30 AM',
        endTime: endTime || '04:30 PM',
        venue: venue || 'Campus Auditorium - Hall A',
      },
      stages: [
        { name: 'Pre-Placement Talk (PPT)', status: 'upcoming' },
        { name: 'Online Technical Assessment', status: 'upcoming' },
        { name: 'Technical Interview', status: 'upcoming' },
        { name: 'HR Alignment', status: 'upcoming' },
      ],
      totalOpenings: Number(totalOpenings) || 10,
    });

    res.status(201).json({ message: 'Placement drive scheduled successfully!', drive });
  } catch (err) {
    console.error('Failed to create drive:', err);
    res.status(500).json({ error: 'Failed to schedule drive' });
  }
});

// PATCH /api/campuslink/drives/:id/resolve-conflict - 1-Click conflict resolution
router.patch('/drives/:id/resolve-conflict', authMiddleware, async (req, res) => {
  try {
    if (!(await isCampusLinkAdmin(req.userId))) {
      return res.status(403).json({
        error: 'Access denied: Resolving drive conflicts is restricted strictly to Arcturus Administrators.',
      });
    }

    const { newVenue, newTime } = req.body;
    const update = {};
    if (newVenue) update['schedule.venue'] = newVenue;
    if (newTime) {
      const parts = newTime.split('-');
      update['schedule.startTime'] = parts[0]?.trim() || '02:00 PM';
      update['schedule.endTime'] = parts[1]?.trim() || '06:30 PM';
    }

    const drive = await PlacementDrive.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    res.json({ message: 'Conflict resolved! Drive schedule updated.', drive });
  } catch (err) {
    console.error('Failed to resolve conflict:', err);
    res.status(500).json({ error: 'Conflict resolution failed' });
  }
});

// DELETE /api/campuslink/drives/:id - Delete or cancel a placement drive
router.delete('/drives/:id', authMiddleware, async (req, res) => {
  try {
    if (!(await isCampusLinkAdmin(req.userId))) {
      return res.status(403).json({
        error: 'Access denied: Deleting recruitment drives is restricted strictly to Arcturus Administrators.',
      });
    }

    const drive = await PlacementDrive.findByIdAndDelete(req.params.id);
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }
    res.json({ message: 'Placement drive removed successfully' });
  } catch (err) {
    console.error('Failed to delete drive:', err);
    res.status(500).json({ error: 'Failed to delete drive' });
  }
});

// GET /api/campuslink/drives/:id/match - Explainable AI Matching & Ranking Engine
router.get('/drives/:id/match', async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    // Evaluate all registered student profiles
    const allProfiles = await PlacementProfile.find().populate('userId', 'firstName lastName email username profilePicture').lean();
    const userIds = allProfiles.map((p) => p.userId?._id).filter(Boolean);
    const candidateProfiles = await Profile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(candidateProfiles.map((cp) => [cp.userId.toString(), cp]));

    const rankedCandidates = allProfiles.map((p) => {
      const name = p.userId ? `${p.userId.firstName} ${p.userId.lastName}`.trim() : `Student ${p.rollNumber}`;
      const email = p.userId?.email || `${p.rollNumber.toLowerCase()}@college.edu`;
      const up = p.userId ? profileMap.get(p.userId._id.toString()) : null;

      const userProjects = Array.isArray(up?.projects) ? up.projects : [];
      const userExperiences = Array.isArray(up?.experience) ? up.experience : [];

      // 1. Check CGPA eligibility
      const meetsCgpa = p.cgpa >= drive.eligibility.minCgpa;

      // 2. Check Backlogs eligibility
      const meetsBacklogs = p.activeBacklogs <= drive.eligibility.maxBacklogs;

      // 3. Check Branch eligibility
      const meetsBranch = (drive.eligibility.allowedBranches || []).some(
        (b) => b.toLowerCase().includes(p.branch.toLowerCase()) || p.branch.toLowerCase().includes(b.toLowerCase())
      );

      // 4. Calculate Skill & Project Match %
      const studentSkills = (p.skills || []).concat(up?.skills || []).map((s) => s.toLowerCase());
      const reqSkills = drive.eligibility.requiredSkills || [];
      const matched = reqSkills.filter((r) =>
        studentSkills.some((s) => s.includes(r.toLowerCase()) || r.toLowerCase().includes(s))
      );
      const skillScore = reqSkills.length > 0 ? (matched.length / reqSkills.length) * 100 : 80;

      // Check for matching projects in candidate's profile
      const matchingProject = userProjects.find((proj) =>
        (proj.techStack || []).some((tech) =>
          reqSkills.some((req) => req.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(req.toLowerCase()))
        )
      );

      // Project boost factor (up to 10 points for candidate with relevant practical projects)
      const projectBonus = matchingProject ? 10 : userProjects.length > 0 ? 5 : 0;

      // 5. Readiness benchmark factor
      const readinessFactor = Math.min(100, (p.overallReadiness / (drive.eligibility.minReadinessScore || 70)) * 100);

      // Total Fit Score Calculation
      const fitScore = Math.min(
        100,
        Math.round(
          (meetsCgpa ? 25 : 5) +
          (meetsBacklogs ? 15 : 0) +
          (meetsBranch ? 15 : 5) +
          (skillScore * 0.25) +
          (readinessFactor * 0.15) +
          projectBonus
        )
      );

      const isEligible = meetsCgpa && meetsBacklogs && meetsBranch;

      // Generate EXPLAINABLE AI Rationale
      let fitRationale = '';
      if (!meetsCgpa) {
        fitRationale = `Below Cutoff: Student CGPA (${p.cgpa}) is below recruiter threshold (${drive.eligibility.minCgpa}).`;
      } else if (!meetsBranch) {
        fitRationale = `Branch Restriction: Recruiter only accepts ${drive.eligibility.allowedBranches.join(', ')}.`;
      } else if (!meetsBacklogs) {
        fitRationale = `Ineligible: Recruiter policy mandates 0 active backlogs (Student has ${p.activeBacklogs}).`;
      } else if (fitScore >= 80) {
        fitRationale = `Eligible & Top Match: CGPA (${p.cgpa} >= ${drive.eligibility.minCgpa}) meets cutoff, ${Math.round(skillScore)}% skill alignment (${matched.slice(0, 3).join(', ')}), and High Employability readiness (${p.overallReadiness}%).`;
        if (matchingProject) {
          fitRationale += ` Features relevant project "${matchingProject.title}" using ${matchingProject.techStack?.slice(0, 3).join(', ')}.`;
        }
      } else {
        fitRationale = `Moderate Fit: Meets academic criteria, but skill alignment shows gaps in ${reqSkills.filter((r) => !matched.includes(r)).slice(0, 2).join(', ')}.`;
        if (userProjects.length > 0) {
          fitRationale += ` Portfolio includes ${userProjects.length} project(s).`;
        }
      }

      return {
        userId: p.userId?._id,
        studentName: name,
        studentEmail: email,
        rollNumber: p.rollNumber,
        branch: p.branch,
        cgpa: p.cgpa,
        fitScore,
        fitRationale,
        isEligible,
        status: isEligible && fitScore >= 75 ? 'shortlisted' : 'applied',
        readinessLevel: p.readinessLevel,
        overallReadiness: p.overallReadiness,
        projectsCount: userProjects.length,
        experienceCount: userExperiences.length,
      };
    });

    // Sort candidates by fitScore descending
    rankedCandidates.sort((a, b) => b.fitScore - a.fitScore);

    res.json({
      driveTitle: `${drive.companyName} - ${drive.roleTitle}`,
      eligibility: drive.eligibility,
      candidates: rankedCandidates,
      totalCandidates: rankedCandidates.length,
      shortlistedCount: rankedCandidates.filter((c) => c.status === 'shortlisted').length,
    });
  } catch (err) {
    console.error('Failed to compute drive matching:', err);
    res.status(500).json({ error: 'Matching calculation failed' });
  }
});

// POST /api/campuslink/drives/:id/auto-shortlist - 1-Click Auto Shortlist
router.post('/drives/:id/auto-shortlist', authMiddleware, async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ error: 'Drive not found' });

    // Find eligible profiles meeting drive criteria
    const filter = {
      cgpa: { $gte: drive.eligibility.minCgpa || 0 },
      activeBacklogs: { $lte: drive.eligibility.maxBacklogs || 0 },
    };
    if (drive.eligibility.allowedBranches && drive.eligibility.allowedBranches.length > 0) {
      filter.branch = { $in: drive.eligibility.allowedBranches };
    }

    const result = await PlacementProfile.updateMany(filter, { $set: { placementStatus: 'shortlisted' } });
    const count = result.modifiedCount || 0;

    res.json({
      message: `Successfully auto-shortlisted ${count} candidate(s) meeting CGPA & branch criteria for ${drive.companyName}!`,
      count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Auto-shortlisting failed' });
  }
});

// GET /api/campuslink/analytics - Placement Command Center Insights (Real Dynamic Aggregation)
router.get('/analytics', async (req, res) => {
  try {
    const totalRegisteredStudents = await PlacementProfile.countDocuments();
    const placementReadyCount = await PlacementProfile.countDocuments({ overallReadiness: { $gte: 70 } });
    const activeDrivesCount = await PlacementDrive.countDocuments({ status: { $ne: 'completed' } });
    const totalOffersExtended = await PlacementOffer.countDocuments();
    const totalOffersAccepted = await PlacementOffer.countDocuments({ status: 'accepted' });
    const placementRatePercentage = totalRegisteredStudents > 0 
      ? Number(((totalOffersAccepted / totalRegisteredStudents) * 100).toFixed(1)) 
      : 0;

    // Calculate real average and highest CTC from offers (or drives if no offers)
    let averageCtcLpa = 0;
    let highestPackageLpa = 0;
    const offerStats = await PlacementOffer.aggregate([
      { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } }
    ]);
    if (offerStats.length > 0 && offerStats[0].avgCtc != null) {
      averageCtcLpa = Number((offerStats[0].avgCtc || 0).toFixed(1));
      highestPackageLpa = Number((offerStats[0].maxCtc || 0).toFixed(1));
    } else {
      const driveStats = await PlacementDrive.aggregate([
        { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } }
      ]);
      if (driveStats.length > 0 && driveStats[0].avgCtc != null) {
        averageCtcLpa = Number((driveStats[0].avgCtc || 0).toFixed(1));
        highestPackageLpa = Number((driveStats[0].maxCtc || 0).toFixed(1));
      }
    }

    // Real Branch Conversion aggregated from student profiles
    const branchAgg = await PlacementProfile.aggregate([
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [{ $in: ['$placementStatus', ['placed', 'offer_accepted']] }, 1, 0]
            }
          }
        }
      }
    ]);
    const branchConversion = branchAgg.map((b) => ({
      branch: b._id || 'General Engineering',
      total: b.total,
      placed: b.placed,
      placedPercent: b.total > 0 ? Number(((b.placed / b.total) * 100).toFixed(1)) : 0,
    }));

    // Real Package Tiers from Offers
    const packageTiersAgg = await PlacementOffer.aggregate([
      {
        $group: {
          _id: '$packageTier',
          count: { $sum: 1 }
        }
      }
    ]);
    const totalOffersCount = packageTiersAgg.reduce((acc, curr) => acc + curr.count, 0);
    const packageTiers = packageTiersAgg.map((pt) => ({
      tier: pt._id || 'Standard (< 6 LPA)',
      count: pt.count,
      percentage: totalOffersCount > 0 ? Math.round((pt.count / totalOffersCount) * 100) : 0,
    }));

    // Real At-Risk Students from Database
    const atRiskProfiles = await PlacementProfile.find({
      $or: [
        { isAtRisk: true },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } },
        { overallReadiness: { $lt: 50 } }
      ]
    }).populate('userId', 'firstName lastName email').limit(20).lean();

    const atRiskStudents = atRiskProfiles.map((p) => {
      const studentName = p.userId ? `${p.userId.firstName} ${p.userId.lastName}`.trim() : `Student ${p.rollNumber}`;
      let riskReason = p.riskReason || 'Readiness score below benchmark';
      if (!p.riskReason) {
        if (p.activeBacklogs > 0 && p.cgpa < 6.5) {
          riskReason = `Active backlogs (${p.activeBacklogs}) & CGPA below 6.5`;
        } else if (p.activeBacklogs > 0) {
          riskReason = `${p.activeBacklogs} active backlog(s) flagged`;
        } else if (p.cgpa < 6.5) {
          riskReason = `CGPA (${p.cgpa}) below institutional benchmark (6.5)`;
        }
      }
      return {
        id: p._id.toString(),
        name: studentName,
        rollNumber: p.rollNumber,
        branch: p.branch,
        cgpa: p.cgpa,
        activeBacklogs: p.activeBacklogs,
        readiness: p.overallReadiness,
        readinessLevel: p.readinessLevel,
        riskReason,
        mentor: p.assignedMentor || 'Department Faculty Advisor',
        mentorRecommendation: p.mentorActionRecommendation || 'Schedule 1-on-1 counseling session to review academic progress.',
        aiReadinessSummary: p.aiReadinessSummary || '',
      };
    });

    const stats = {
      totalRegisteredStudents,
      placementReadyCount,
      placementRatePercentage,
      activeDrivesCount,
      totalOffersExtended,
      totalOffersAccepted,
      averageCtcLpa,
      highestPackageLpa,
      branchConversion,
      packageTiers,
      atRiskStudents,
    };

    res.json({ stats });
  } catch (err) {
    console.error('Failed to fetch placement analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// GET /api/campuslink/offers - List offers
router.get('/offers', async (req, res) => {
  try {
    const offers = await PlacementOffer.find().sort({ createdAt: -1 }).lean();
    res.json({ offers });
  } catch (err) {
    console.error('Failed to load offers:', err);
    res.status(500).json({ error: 'Failed to retrieve offers' });
  }
});

// POST /api/campuslink/offers/:id/respond - Accept or Decline offer
router.post('/offers/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' | 'declined'
    const offer = await PlacementOffer.findByIdAndUpdate(
      req.params.id,
      { $set: { status: action, verificationStatus: 'verified' } },
      { new: true }
    );

    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    res.json({ message: `Offer successfully ${action}!`, offer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// POST /api/campuslink/ai-assistant - Conversational Placement Assistant Powered by Gemma
router.post('/ai-assistant', async (req, res) => {
  try {
    const { prompt, profileId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Fetch active drives for real context
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).limit(6).lean();
    const conflicts = detectDriveConflicts(activeDrives);

    // Optional profile if token or profileId is provided
    let profile = null;
    let candidateData = null;
    if (profileId) {
      profile = await PlacementProfile.findById(profileId).lean();
      if (profile?.userId) {
        candidateData = await getFullCandidateProfile(profile.userId);
      }
    } else if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded?.userId) {
          profile = await PlacementProfile.findOne({ userId: decoded.userId }).lean();
          candidateData = await getFullCandidateProfile(decoded.userId);
        }
      } catch (e) {
        // Token decode ignored if invalid
      }
    }

    const mergedProfile = candidateData ? { ...(profile || {}), ...candidateData } : profile;

    const reply = await generateGemmaChatReply({
      prompt,
      profile: mergedProfile,
      drives: activeDrives,
      conflicts,
    });

    res.json({
      reply,
      engine: 'Hugging Face Gemma-2-2B-IT',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('CampusLink AI Assistant error:', err);
    res.status(500).json({ error: 'AI Assistant error' });
  }
});

export default router;

