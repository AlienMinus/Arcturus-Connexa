import express from 'express';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import authMiddleware from '../../middleware/auth.js';
import { analyzePlacementRiskAndGuidance } from '../../services/gemmaService.js';
import {
  computeSkillGaps,
  getFullCandidateProfile,
  derivePlacementDataFromProfile,
  generateDiagnosticReport,
  escapeRegex,
} from './helpers.js';

const router = express.Router();

// GET /api/campuslink/profile/me - Get student's placement readiness profile derived directly from profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const candidateProfile = await getFullCandidateProfile(req.userId);
    const userDoc = await User.findById(req.userId).lean();
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).lean();

    let profile = await PlacementProfile.findOne({ userId: req.userId });

    // If no PlacementProfile exists yet, auto-create one directly from the student's Arcturus profile!
    if (!profile && candidateProfile) {
      const derived = derivePlacementDataFromProfile(userDoc, candidateProfile);
      let resolvedOrg = null;
      if (userDoc?.institute?.organizationId) {
        resolvedOrg = await Organization.findById(userDoc.institute.organizationId).lean();
      }
      if (!resolvedOrg && derived.collegeName) {
        resolvedOrg = await Organization.findOne({
          name: { $regex: new RegExp(`^${escapeRegex(derived.collegeName)}$`, 'i') },
          status: 'approved',
        }).lean();
      }

      const skillGaps = computeSkillGaps(derived.skills, activeDrives);

      profile = await PlacementProfile.create({
        userId: req.userId,
        organizationId: resolvedOrg?._id,
        ...derived,
        skillGaps,
        aiReadinessSummary: `${derived.readinessLevel} placement readiness at ${derived.overallReadiness}%. Profile dynamically evaluated from Arcturus credentials.`,
        mentorActionRecommendation: 'Candidate is on track for upcoming placement drives. Focus on independent system design and problem solving practice.',
        gemmaDiagnosticTimestamp: new Date(),
      });
    }

    if (!profile) {
      return res.json({ profile: null, candidateProfile, diagnosticReport: null });
    }

    // Synchronize latest profile credentials directly from candidate's Arcturus profile
    const derived = derivePlacementDataFromProfile(userDoc, candidateProfile);
    profile.collegeName = derived.collegeName;
    profile.branch = derived.branch;
    profile.graduationYear = derived.graduationYear;
    profile.cgpa = derived.cgpa;
    if (derived.tenthPercentage !== undefined) profile.tenthPercentage = derived.tenthPercentage;
    if (derived.twelfthPercentage !== undefined) profile.twelfthPercentage = derived.twelfthPercentage;
    profile.skills = derived.skills;
    profile.targetRoles = derived.targetRoles;
    profile.technicalScore = derived.technicalScore;
    profile.aptitudeScore = derived.aptitudeScore;
    profile.communicationScore = derived.communicationScore;
    profile.projectScore = derived.projectScore;
    profile.overallReadiness = derived.overallReadiness;
    profile.readinessLevel = derived.readinessLevel;
    profile.skillGaps = computeSkillGaps(derived.skills, activeDrives);
    await profile.save();

    const profileObj = profile.toObject ? profile.toObject() : profile;
    profileObj.candidateProfile = candidateProfile;

    const diagnosticReport = generateDiagnosticReport({
      profile: profileObj,
      candidateProfile,
      activeDrives,
    });

    res.json({ profile: profileObj, candidateProfile, diagnosticReport });
  } catch (err) {
    console.error('Failed to get student placement profile:', err);
    res.status(500).json({ error: 'Failed to load placement profile' });
  }
});

// POST /api/campuslink/profile - Create or update student placement profile with real data
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      rollNumber,
      collegeName,
      branch,
      graduationYear,
      cgpa,
      activeBacklogs,
      totalBacklogs,
      tenthPercentage,
      twelfthPercentage,
      skills,
      targetRoles,
      placementStatus,
      mockInterviewsTaken,
      assignedMentor,
      technicalScore: customTechScore,
      aptitudeScore: customAptScore,
      communicationScore: customCommScore,
      projectScore: customProjScore,
    } = req.body;

    if (!rollNumber || !collegeName || !branch || cgpa === undefined) {
      return res.status(400).json({ error: 'Roll number, college name, branch, and CGPA are required.' });
    }

    const studentSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const studentTargetRoles = Array.isArray(targetRoles)
      ? targetRoles
      : typeof targetRoles === 'string'
      ? targetRoles.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Campus Placement Candidate'];

    const numCgpa = Math.min(10, Math.max(0, Number(cgpa) || 0));
    const numActiveBacklogs = Math.max(0, Number(activeBacklogs) || 0);
    const numTotalBacklogs = totalBacklogs !== undefined && totalBacklogs !== ''
      ? Math.max(numActiveBacklogs, Number(totalBacklogs) || 0)
      : numActiveBacklogs;
    const numGradYear = Number(graduationYear) || new Date().getFullYear();
    const numTenth = tenthPercentage !== undefined && tenthPercentage !== '' ? Number(tenthPercentage) : undefined;
    const numTwelfth = twelfthPercentage !== undefined && twelfthPercentage !== '' ? Number(twelfthPercentage) : undefined;
    const numMockInterviews = Math.max(0, Number(mockInterviewsTaken) || 0);

    const validBranches = [
      'Computer Science & Engineering',
      'Information Technology',
      'Electronics & Communication',
      'Electrical & Electronics',
      'Mechanical Engineering',
      'Civil Engineering',
    ];
    let sanitizedBranch = branch.trim();
    if (sanitizedBranch === 'Electrical Engineering') {
      sanitizedBranch = 'Electrical & Electronics';
    } else if (!validBranches.includes(sanitizedBranch)) {
      sanitizedBranch = 'Computer Science & Engineering';
    }

    const validPlacementStatuses = ['unplaced', 'shortlisted', 'interviewing', 'placed', 'opted_out'];
    const sanitizedPlacementStatus = validPlacementStatuses.includes(placementStatus)
      ? placementStatus
      : 'unplaced';

    // Import complete candidate profile data from Arcturus Profile page
    const candidateProfile = await getFullCandidateProfile(req.userId);

    const profileSkills = candidateProfile?.skills || [];
    const combinedSkills = Array.from(new Set([...studentSkills, ...profileSkills]));

    const projectCount = candidateProfile?.projects?.length || 0;
    const experienceCount = candidateProfile?.experience?.length || 0;
    const certificationsCount = candidateProfile?.certifications?.length || 0;

    // Compute realistic score dimensions incorporating applicant's real projects, descriptions & background
    const defaultTech = Math.min(100, Math.max(30, combinedSkills.length * 8 + Math.round(numCgpa * 4) + certificationsCount * 5));
    const defaultApt = Math.min(100, Math.max(35, Math.round(numCgpa * 9) - numActiveBacklogs * 5));
    const defaultComm = 75; // Baseline behavioral score
    const defaultProj = Math.min(100, Math.max(40, projectCount * 18 + combinedSkills.length * 5 + (experienceCount > 0 ? 15 : 0)));

    const technicalScore = customTechScore !== undefined && customTechScore !== ''
      ? Math.min(100, Math.max(0, Number(customTechScore)))
      : defaultTech;

    const aptitudeScore = customAptScore !== undefined && customAptScore !== ''
      ? Math.min(100, Math.max(0, Number(customAptScore)))
      : defaultApt;

    const communicationScore = customCommScore !== undefined && customCommScore !== ''
      ? Math.min(100, Math.max(0, Number(customCommScore)))
      : defaultComm;

    const projectScore = customProjScore !== undefined && customProjScore !== ''
      ? Math.min(100, Math.max(0, Number(customProjScore)))
      : defaultProj;

    const overallReadiness = Math.round(
      technicalScore * 0.35 + aptitudeScore * 0.25 + communicationScore * 0.2 + projectScore * 0.2
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
      branch: sanitizedBranch,
      graduationYear: numGradYear,
      cgpa: numCgpa,
      activeBacklogs: numActiveBacklogs,
      skills: combinedSkills,
      technicalScore,
      aptitudeScore,
      communicationScore,
      projectScore,
      overallReadiness,
      readinessLevel,
      targetRoles: studentTargetRoles,
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

    // Resolve linked Organization for this college
    let resolvedOrg = null;
    const userDoc = await User.findById(req.userId).select('institute').lean();
    if (userDoc?.institute?.organizationId) {
      resolvedOrg = await Organization.findById(userDoc.institute.organizationId).lean();
    }
    if (!resolvedOrg && collegeName) {
      resolvedOrg = await Organization.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(collegeName.trim())}$`, 'i') },
        status: 'approved',
      }).lean();
    }

    if (userDoc) {
      await User.findByIdAndUpdate(req.userId, {
        $set: {
          'institute.name': collegeName.trim(),
          ...(resolvedOrg ? { 'institute.organizationId': resolvedOrg._id, 'institute.verified': true } : {}),
          'institute.graduationYear': numGradYear,
          'institute.department': sanitizedBranch,
          'institute.studentId': rollNumber.trim(),
        },
      });
    }

    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (profile) {
      profile.rollNumber = rollNumber.trim();
      profile.collegeName = collegeName.trim();
      if (resolvedOrg?._id) profile.organizationId = resolvedOrg._id;
      profile.branch = sanitizedBranch;
      profile.graduationYear = numGradYear;
      profile.cgpa = numCgpa;
      profile.activeBacklogs = numActiveBacklogs;
      profile.totalBacklogs = numTotalBacklogs;
      if (numTenth !== undefined) profile.tenthPercentage = numTenth;
      if (numTwelfth !== undefined) profile.twelfthPercentage = numTwelfth;
      profile.skills = combinedSkills;
      profile.targetRoles = studentTargetRoles;
      profile.placementStatus = sanitizedPlacementStatus;
      profile.mockInterviewsTaken = numMockInterviews;
      if (assignedMentor !== undefined) profile.assignedMentor = assignedMentor.trim();
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
      profile.gemmaModel = gemmaAnalysis.model || 'google/gemma-3-4b-it';
      profile.gemmaProvider = gemmaAnalysis.provider || 'Hugging Face Gemma';
      profile.gemmaDiagnosticTimestamp = new Date();
      await profile.save();
    } else {
      profile = await PlacementProfile.create({
        userId: req.userId,
        organizationId: resolvedOrg?._id || undefined,
        rollNumber: rollNumber.trim(),
        collegeName: collegeName.trim(),
        branch: sanitizedBranch,
        graduationYear: numGradYear,
        cgpa: numCgpa,
        activeBacklogs: numActiveBacklogs,
        totalBacklogs: numTotalBacklogs,
        tenthPercentage: numTenth,
        twelfthPercentage: numTwelfth,
        skills: combinedSkills,
        targetRoles: studentTargetRoles,
        placementStatus: sanitizedPlacementStatus,
        mockInterviewsTaken: numMockInterviews,
        assignedMentor: (assignedMentor || '').trim(),
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
        gemmaModel: gemmaAnalysis.model || 'google/gemma-3-4b-it',
        gemmaProvider: gemmaAnalysis.provider || 'Hugging Face Gemma',
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

// POST /api/campuslink/profile/diagnose-ai - On-demand Gemma AI Risk & Recommendation Diagnostics directly from profile
router.post('/diagnose-ai', authMiddleware, async (req, res) => {
  try {
    const candidateProfile = await getFullCandidateProfile(req.userId);
    const userDoc = await User.findById(req.userId).lean();
    const activeDrives = await PlacementDrive.find({ status: { $ne: 'completed' } }).lean();

    // Auto-derive fresh academic metrics directly from candidate's Arcturus profile
    const derived = derivePlacementDataFromProfile(userDoc, candidateProfile);

    let resolvedOrg = null;
    if (userDoc?.institute?.organizationId) {
      resolvedOrg = await Organization.findById(userDoc.institute.organizationId).lean();
    }
    if (!resolvedOrg && derived.collegeName) {
      resolvedOrg = await Organization.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(derived.collegeName)}$`, 'i') },
        status: 'approved',
      }).lean();
    }

    let profile = await PlacementProfile.findOne({ userId: req.userId });

    const combinedSkills = Array.from(new Set([
      ...(profile?.skills || []),
      ...(candidateProfile?.skills || []),
    ]));

    // Run Hugging Face Gemma Risk & Recommendation Diagnostics using live profile portfolio
    const gemmaAnalysis = await analyzePlacementRiskAndGuidance({
      rollNumber: profile?.rollNumber || derived.rollNumber,
      collegeName: profile?.collegeName || derived.collegeName,
      branch: profile?.branch || derived.branch,
      graduationYear: profile?.graduationYear || derived.graduationYear,
      cgpa: profile?.cgpa || derived.cgpa,
      activeBacklogs: profile?.activeBacklogs || 0,
      skills: combinedSkills,
      technicalScore: derived.technicalScore,
      aptitudeScore: derived.aptitudeScore,
      communicationScore: derived.communicationScore,
      projectScore: derived.projectScore,
      overallReadiness: derived.overallReadiness,
      readinessLevel: derived.readinessLevel,
      targetRoles: derived.targetRoles,
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

    const skillGaps = computeSkillGaps(combinedSkills, activeDrives);

    if (profile) {
      profile.collegeName = derived.collegeName;
      profile.rollNumber = derived.rollNumber;
      profile.branch = derived.branch;
      profile.graduationYear = derived.graduationYear;
      profile.cgpa = derived.cgpa;
      profile.skills = combinedSkills;
      profile.targetRoles = derived.targetRoles;
      profile.technicalScore = derived.technicalScore;
      profile.aptitudeScore = derived.aptitudeScore;
      profile.communicationScore = derived.communicationScore;
      profile.projectScore = derived.projectScore;
      profile.overallReadiness = derived.overallReadiness;
      profile.readinessLevel = derived.readinessLevel;
      profile.skillGaps = skillGaps;
      profile.isAtRisk = gemmaAnalysis.isAtRisk;
      profile.riskReason = gemmaAnalysis.riskReason;
      profile.aiReadinessSummary = gemmaAnalysis.aiReadinessSummary;
      profile.mentorActionRecommendation = gemmaAnalysis.mentorActionRecommendation;
      profile.gemmaModel = gemmaAnalysis.model || 'google/gemma-3-4b-it';
      profile.gemmaProvider = gemmaAnalysis.provider || 'Hugging Face Gemma';
      profile.gemmaDiagnosticTimestamp = new Date();
      if (resolvedOrg?._id) profile.organizationId = resolvedOrg._id;
      await profile.save();
    } else {
      profile = await PlacementProfile.create({
        userId: req.userId,
        organizationId: resolvedOrg?._id,
        ...derived,
        skills: combinedSkills,
        skillGaps,
        isAtRisk: gemmaAnalysis.isAtRisk,
        riskReason: gemmaAnalysis.riskReason,
        aiReadinessSummary: gemmaAnalysis.aiReadinessSummary,
        mentorActionRecommendation: gemmaAnalysis.mentorActionRecommendation,
        gemmaModel: gemmaAnalysis.model || 'google/gemma-3-4b-it',
        gemmaProvider: gemmaAnalysis.provider || 'Hugging Face Gemma',
        gemmaDiagnosticTimestamp: new Date(),
      });
    }

    const profileObj = profile.toObject ? profile.toObject() : profile;
    profileObj.candidateProfile = candidateProfile;

    const diagnosticReport = generateDiagnosticReport({
      profile: profileObj,
      candidateProfile,
      activeDrives,
      gemmaAnalysis,
    });

    res.json({
      message: 'Employability & skill-gap diagnostics generated successfully from Arcturus profile!',
      profile: profileObj,
      diagnosticReport,
      gemmaAnalysis,
    });
  } catch (err) {
    console.error('Failed to run Gemma diagnostics:', err);
    res.status(500).json({ error: 'Failed to run Gemma AI diagnostics' });
  }
});

// POST /api/campuslink/profile/assessment - Submit mock interview/assessment & recompute readiness
router.post('/assessment', authMiddleware, async (req, res) => {
  try {
    const { technicalDelta = 4, aptitudeDelta = 3, communicationDelta = 5 } = req.body;

    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.technicalScore = Math.min(100, profile.technicalScore + Number(technicalDelta));
    profile.aptitudeScore = Math.min(100, profile.aptitudeScore + Number(aptitudeDelta));
    profile.communicationScore = Math.min(100, profile.communicationScore + Number(communicationDelta));
    profile.mockInterviewsTaken = (profile.mockInterviewsTaken || 0) + 1;
    profile.lastAssessmentDate = new Date();

    const technicalWeight = profile.technicalScore * 0.4;
    const aptitudeWeight = profile.aptitudeScore * 0.25;
    const commWeight = profile.communicationScore * 0.15;
    const projectWeight = (profile.projectScore || 50) * 0.2;
    profile.overallReadiness = Math.round(technicalWeight + aptitudeWeight + commWeight + projectWeight);

    if (profile.overallReadiness >= 85) profile.readinessLevel = 'Highly Employable';
    else if (profile.overallReadiness >= 70) profile.readinessLevel = 'Ready';
    else if (profile.overallReadiness < 50) profile.readinessLevel = 'Not Ready';
    else profile.readinessLevel = 'Developing';

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

export default router;

