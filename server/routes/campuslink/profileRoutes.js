import express from 'express';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import authMiddleware from '../../middleware/auth.js';
import { analyzePlacementRiskAndGuidance } from '../../services/gemmaService.js';
import { computeSkillGaps, getFullCandidateProfile } from './helpers.js';

const router = express.Router();

// GET /api/campuslink/profile/me - Get student's placement readiness profile
router.get('/me', authMiddleware, async (req, res) => {
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
router.post('/', authMiddleware, async (req, res) => {
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
      profile.gemmaModel = gemmaAnalysis.model || 'google/gemma-3-4b-it';
      profile.gemmaProvider = gemmaAnalysis.provider || 'Hugging Face Gemma';
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

// POST /api/campuslink/profile/diagnose-ai - On-demand Gemma AI Risk & Recommendation Diagnostics
router.post('/diagnose-ai', authMiddleware, async (req, res) => {
  try {
    let profile = await PlacementProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Placement profile not found. Please complete profile setup first.' });
    }

    // Fetch applicant's main Arcturus profile data
    const candidateProfile = await getFullCandidateProfile(req.userId);

    const profileSkills = candidateProfile?.skills || [];
    const combinedSkills = Array.from(new Set([...(profile.skills || []), ...profileSkills]));

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
    profile.gemmaModel = gemmaAnalysis.model || 'google/gemma-3-4b-it';
    profile.gemmaProvider = gemmaAnalysis.provider || 'Hugging Face Gemma';
    profile.gemmaDiagnosticTimestamp = new Date();
    profile.skillGaps = computeSkillGaps(combinedSkills, activeDrives);

    await profile.save();

    const profileObj = profile.toObject();
    profileObj.candidateProfile = candidateProfile;

    res.json({
      message: 'Hugging Face Gemma-3 AI Diagnostics completed successfully!',
      profile: profileObj,
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

