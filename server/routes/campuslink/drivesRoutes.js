import express from 'express';
import PlacementDrive from '../../models/PlacementDrive.js';
import PlacementProfile from '../../models/PlacementProfile.js';
import Profile from '../../models/Profile.js';
import authMiddleware from '../../middleware/auth.js';
import { detectDriveConflicts } from '../../utils/conflictDetector.js';
import { isCampusLinkAdmin, getPlacementOfficerOrganization, getManagedOrganization } from './helpers.js';

const router = express.Router();

// GET /api/campuslink/drives - Get all drives and real-time conflicts
router.get('/', async (req, res) => {
  try {
    const filter = req.query.organizationId ? { organizationId: req.query.organizationId } : {};
    const drives = await PlacementDrive.find(filter).sort({ 'schedule.driveDate': 1 }).lean();
    const conflicts = detectDriveConflicts(drives);

    res.json({ drives, conflicts });
  } catch (err) {
    console.error('Failed to fetch placement drives:', err);
    res.status(500).json({ error: 'Failed to retrieve drives' });
  }
});

// POST /api/campuslink/drives - Create placement drive (Admin restricted)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      organizationId: requestedOrganizationId,
      companyName,
      companyLogo,
      roleTitle,
      description,
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
    const adminAccess = await isCampusLinkAdmin(req.userId);
    const officerOrganization = adminAccess ? null : await getPlacementOfficerOrganization(req.userId);
    const requestedOrganization = requestedOrganizationId ? await getManagedOrganization(req.userId, requestedOrganizationId) : null;
    if (!adminAccess && !officerOrganization && !requestedOrganization) {
      return res.status(403).json({
        error: 'Access denied: an approved linked organization is required to schedule this drive.',
      });
    }
    const organizationId = adminAccess ? requestedOrganizationId : officerOrganization?._id || requestedOrganization?._id;
    if (!organizationId) return res.status(400).json({ error: 'An organization is required for this placement drive.' });

    if (!companyName || !roleTitle || !description || !ctcLpa || !driveDate) {
      return res.status(400).json({ error: 'Company name, role, job description, CTC, and drive date are required.' });
    }

    const drive = await PlacementDrive.create({
      organizationId,
      companyName: companyName.trim(),
      companyLogo: companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      roleTitle: roleTitle.trim(),
      description: description.trim(),
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
router.patch('/:id/resolve-conflict', authMiddleware, async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    const officerOrganization = await getPlacementOfficerOrganization(req.userId);
    const managedOrganization = drive?.organizationId ? await getManagedOrganization(req.userId, drive.organizationId) : null;
    const authorized = (await isCampusLinkAdmin(req.userId)) || (officerOrganization && drive?.organizationId?.toString() === officerOrganization._id.toString()) || managedOrganization;
    if (!authorized) {
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

    const updatedDrive = await PlacementDrive.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!updatedDrive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    res.json({ message: 'Conflict resolved! Drive schedule updated.', drive: updatedDrive });
  } catch (err) {
    console.error('Failed to resolve conflict:', err);
    res.status(500).json({ error: 'Conflict resolution failed' });
  }
});

// DELETE /api/campuslink/drives/:id - Delete or cancel a placement drive
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    const officerOrganization = await getPlacementOfficerOrganization(req.userId);
    const managedOrganization = drive?.organizationId ? await getManagedOrganization(req.userId, drive.organizationId) : null;
    const authorized = (await isCampusLinkAdmin(req.userId)) || (officerOrganization && drive?.organizationId?.toString() === officerOrganization._id.toString()) || managedOrganization;
    if (!authorized) {
      return res.status(403).json({
        error: 'Access denied: Deleting recruitment drives is restricted strictly to Arcturus Administrators.',
      });
    }

    const deletedDrive = await PlacementDrive.findByIdAndDelete(req.params.id);
    if (!deletedDrive) {
      return res.status(404).json({ error: 'Drive not found' });
    }
    res.json({ message: 'Placement drive removed successfully' });
  } catch (err) {
    console.error('Failed to delete drive:', err);
    res.status(500).json({ error: 'Failed to delete drive' });
  }
});

// GET /api/campuslink/drives/:id/match - Explainable AI Matching & Ranking Engine
router.get('/:id/match', authMiddleware, async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    const adminAccess = await isCampusLinkAdmin(req.userId);
    const officerOrganization = await getPlacementOfficerOrganization(req.userId);
    const managedOrganization = drive.organizationId ? await getManagedOrganization(req.userId, drive.organizationId) : null;
    const officerAccess = officerOrganization && drive.organizationId?.toString() === officerOrganization._id.toString();
    if (!adminAccess && !officerAccess && !managedOrganization) {
      return res.status(403).json({ error: 'Only Arcturus Admin or the linked Placement Officer can view candidate matching.' });
    }

    // Evaluate all registered student profiles
    const allProfiles = await PlacementProfile.find().populate('userId', 'firstName lastName email username profilePicture institute').lean();
    const candidateOrganization = officerOrganization || managedOrganization;
    const scopedProfiles = candidateOrganization
      ? allProfiles.filter((profile) => profile.userId?.institute?.organizationId?.toString() === candidateOrganization._id.toString())
      : allProfiles;
    const userIds = scopedProfiles.map((p) => p.userId?._id).filter(Boolean);
    const candidateProfiles = await Profile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(candidateProfiles.map((cp) => [cp.userId.toString(), cp]));

    const rankedCandidates = scopedProfiles.map((p) => {
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
router.post('/:id/auto-shortlist', authMiddleware, async (req, res) => {
  try {
    const driveForAuthorization = await PlacementDrive.findById(req.params.id);
    const officerOrganization = await getPlacementOfficerOrganization(req.userId);
    const managedOrganization = driveForAuthorization?.organizationId ? await getManagedOrganization(req.userId, driveForAuthorization.organizationId) : null;
    const authorized = (await isCampusLinkAdmin(req.userId)) || (officerOrganization && driveForAuthorization?.organizationId?.toString() === officerOrganization._id.toString()) || managedOrganization;
    if (!authorized) return res.status(403).json({ error: 'Only the linked Placement Officer or Arcturus Admin can shortlist candidates.' });
    const drive = driveForAuthorization;
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

export default router;

