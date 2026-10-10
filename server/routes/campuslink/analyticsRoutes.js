import express from 'express';
import { verifyAccessToken } from '../../utils/jwtUtils.js';
import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import PlacementProfile from '../../models/PlacementProfile.js';
import PlacementDrive from '../../models/PlacementDrive.js';
import PlacementOffer from '../../models/PlacementOffer.js';
import {
  isCampusLinkAdmin,
  getPlacementOfficerOrganization,
  getManagedOrganization,
  getOrganizationByIdOrSlug,
  escapeRegex,
} from './helpers.js';

const router = express.Router();

// Helper to compute core placement metrics for a specific filter scope
async function computeMetricsForScope({ profileFilter = {}, driveFilter = {}, offerFilter = {} }) {
  const totalRegisteredStudents = await PlacementProfile.countDocuments(profileFilter);
  const placementReadyCount = await PlacementProfile.countDocuments({
    ...profileFilter,
    overallReadiness: { $gte: 70 },
  });
  const activeDrivesCount = await PlacementDrive.countDocuments({
    ...driveFilter,
    status: { $ne: 'completed' },
  });
  const totalOffersExtended = await PlacementOffer.countDocuments(offerFilter);
  const totalOffersAccepted = await PlacementOffer.countDocuments({
    ...offerFilter,
    status: 'accepted',
  });
  const placementRatePercentage = totalRegisteredStudents > 0
    ? Number(((totalOffersAccepted / totalRegisteredStudents) * 100).toFixed(1))
    : 0;

  // Real Average & Highest CTC from Offers (fallback to drives if no offers)
  let averageCtcLpa = 0;
  let highestPackageLpa = 0;
  const offerStats = await PlacementOffer.aggregate([
    { $match: offerFilter },
    { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } },
  ]);

  if (offerStats.length > 0 && offerStats[0].avgCtc != null) {
    averageCtcLpa = Number((offerStats[0].avgCtc || 0).toFixed(1));
    highestPackageLpa = Number((offerStats[0].maxCtc || 0).toFixed(1));
  } else {
    const driveStats = await PlacementDrive.aggregate([
      { $match: driveFilter },
      { $group: { _id: null, avgCtc: { $avg: '$ctcLpa' }, maxCtc: { $max: '$ctcLpa' } } },
    ]);
    if (driveStats.length > 0 && driveStats[0].avgCtc != null) {
      averageCtcLpa = Number((driveStats[0].avgCtc || 0).toFixed(1));
      highestPackageLpa = Number((driveStats[0].maxCtc || 0).toFixed(1));
    }
  }

  // Branch Conversion aggregated from student profiles
  const branchAgg = await PlacementProfile.aggregate([
    { $match: profileFilter },
    {
      $group: {
        _id: '$branch',
        total: { $sum: 1 },
        placed: {
          $sum: {
            $cond: [{ $in: ['$placementStatus', ['placed', 'offer_accepted']] }, 1, 0],
          },
        },
      },
    },
  ]);

  const branchConversion = branchAgg.map((b) => ({
    branch: b._id || 'General Engineering',
    total: b.total,
    placed: b.placed,
    placedPercent: b.total > 0 ? Number(((b.placed / b.total) * 100).toFixed(1)) : 0,
  }));

  // Package Tiers from Offers
  const packageTiersAgg = await PlacementOffer.aggregate([
    { $match: offerFilter },
    {
      $group: {
        _id: '$packageTier',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalOffersCount = packageTiersAgg.reduce((acc, curr) => acc + curr.count, 0);
  const packageTiers = packageTiersAgg.map((pt) => ({
    tier: pt._id || 'Standard (< 6 LPA)',
    count: pt.count,
    percentage: totalOffersCount > 0 ? Math.round((pt.count / totalOffersCount) * 100) : 0,
  }));

  return {
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
  };
}

// Helper to query and format at-risk students for a specific scope
async function getAtRiskStudentsForScope(profileFilter = {}) {
  const atRiskProfiles = await PlacementProfile.find({
    ...profileFilter,
    $or: [
      { isAtRisk: true },
      { activeBacklogs: { $gt: 0 } },
      { cgpa: { $lt: 6.5 } },
      { overallReadiness: { $lt: 50 } },
    ],
  })
    .populate('userId', 'firstName lastName email username profilePicture')
    .limit(30)
    .lean();

  return atRiskProfiles.map((p) => {
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
      collegeName: p.collegeName,
      branch: p.branch,
      cgpa: p.cgpa,
      activeBacklogs: p.activeBacklogs,
      readiness: p.overallReadiness,
      readinessLevel: p.readinessLevel,
      riskReason,
      mentor: p.assignedMentor || 'Department Faculty Advisor',
      mentorRecommendation:
        p.mentorActionRecommendation || 'Schedule 1-on-1 counseling session to review academic progress.',
      aiReadinessSummary: p.aiReadinessSummary || '',
    };
  });
}

// Build query filters rigorously isolated to an institution
async function buildFiltersForInstitute(targetOrg) {
  const orgId = targetOrg._id;
  const orgName = targetOrg.name;

  // Find users enrolled with this institute
  const studentUsers = await User.find({
    $or: [
      { 'institute.organizationId': orgId },
      { 'institute.name': { $regex: new RegExp(`^${escapeRegex(orgName)}$`, 'i') } },
    ],
  })
    .select('_id')
    .lean();
  const studentUserIds = studentUsers.map((u) => u._id);

  const profileFilter = {
    $or: [
      { organizationId: orgId },
      { collegeName: { $regex: new RegExp(`^${escapeRegex(orgName)}$`, 'i') } },
      ...(studentUserIds.length > 0 ? [{ userId: { $in: studentUserIds } }] : []),
    ],
  };

  const scopedProfiles = await PlacementProfile.find(profileFilter).select('_id userId rollNumber').lean();
  const scopedProfileUserIds = scopedProfiles.map((p) => p.userId).filter(Boolean);
  const scopedRollNumbers = scopedProfiles.map((p) => p.rollNumber).filter(Boolean);

  const driveFilter = { organizationId: orgId };

  const offerFilter = {
    $or: [
      { organizationId: orgId },
      { collegeName: { $regex: new RegExp(`^${escapeRegex(orgName)}$`, 'i') } },
      ...(scopedProfileUserIds.length > 0 ? [{ studentId: { $in: scopedProfileUserIds } }] : []),
      ...(scopedRollNumbers.length > 0 ? [{ rollNumber: { $in: scopedRollNumbers } }] : []),
    ],
  };

  return { profileFilter, driveFilter, offerFilter };
}

// Build platform-wide multi-institute comparative leaderboard for Arcturus Admin
async function buildInstitutesSummary() {
  // Query educational organizations or approved organizations with drives/profiles
  const orgs = await Organization.find({ status: 'approved' })
    .select('name slug logo location industry members adminId')
    .lean();

  const distinctColleges = await PlacementProfile.distinct('collegeName');

  const summaries = [];
  const processedNames = new Set();

  for (const org of orgs) {
    processedNames.add(org.name.toLowerCase());
    const filters = await buildFiltersForInstitute(org);
    const metrics = await computeMetricsForScope(filters);
    const atRiskCount = await PlacementProfile.countDocuments({
      ...filters.profileFilter,
      $or: [
        { isAtRisk: true },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } },
        { overallReadiness: { $lt: 50 } },
      ],
    });

    // Find assigned placement officers
    const officers = await User.find({
      $or: [
        { 'placementOfficer.organizationId': org._id, 'placementOfficer.status': 'approved' },
        { _id: { $in: org.members?.filter((m) => m.role === 'Placement Officer').map((m) => m.userId) || [] } },
      ],
    })
      .select('firstName lastName email')
      .lean();

    const officerNames = officers.map((o) => `${o.firstName} ${o.lastName}`.trim()).filter(Boolean);

    summaries.push({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      logo: org.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      location: org.location || 'Campus Network',
      industry: org.industry,
      studentsCount: metrics.totalRegisteredStudents,
      placedCount: metrics.totalOffersAccepted,
      placementRatePercentage: metrics.placementRatePercentage,
      activeDrivesCount: metrics.activeDrivesCount,
      averageCtcLpa: metrics.averageCtcLpa,
      highestPackageLpa: metrics.highestPackageLpa,
      atRiskCount,
      officers: officerNames.length > 0 ? officerNames : ['Not Assigned'],
      isRegisteredOrg: true,
    });
  }

  // Include any colleges from student profiles that may not have an Organization entry yet
  for (const collegeName of distinctColleges) {
    if (!collegeName || processedNames.has(collegeName.toLowerCase())) continue;
    processedNames.add(collegeName.toLowerCase());

    const profileFilter = { collegeName: { $regex: new RegExp(`^${escapeRegex(collegeName)}$`, 'i') } };
    const scopedProfiles = await PlacementProfile.find(profileFilter).select('_id userId rollNumber').lean();
    const scopedRollNumbers = scopedProfiles.map((p) => p.rollNumber).filter(Boolean);
    const offerFilter = { rollNumber: { $in: scopedRollNumbers } };
    const driveFilter = { 'schedule.venue': { $regex: new RegExp(escapeRegex(collegeName), 'i') } };

    const metrics = await computeMetricsForScope({ profileFilter, driveFilter, offerFilter });
    const atRiskCount = await PlacementProfile.countDocuments({
      ...profileFilter,
      $or: [
        { isAtRisk: true },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } },
        { overallReadiness: { $lt: 50 } },
      ],
    });

    summaries.push({
      id: `virtual-${encodeURIComponent(collegeName)}`,
      name: collegeName,
      slug: collegeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      location: 'Student Registered Affiliation',
      industry: 'Higher Education',
      studentsCount: metrics.totalRegisteredStudents,
      placedCount: metrics.totalOffersAccepted,
      placementRatePercentage: metrics.placementRatePercentage,
      activeDrivesCount: metrics.activeDrivesCount,
      averageCtcLpa: metrics.averageCtcLpa,
      highestPackageLpa: metrics.highestPackageLpa,
      atRiskCount,
      officers: ['Pending Verification'],
      isRegisteredOrg: false,
    });
  }

  // Sort by student count descending
  summaries.sort((a, b) => b.studentsCount - a.studentsCount);
  return summaries;
}

// GET /api/campuslink/analytics - Placement Command Center Insights
router.get('/', async (req, res) => {
  try {
    let currentUserId = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyAccessToken(token);
        currentUserId = decoded?.userId;
      } catch (e) {
        // invalid / expired token
      }
    }

    const adminAccess = await isCampusLinkAdmin(currentUserId);
    const requestedOrgParam = req.query.organizationId || req.query.idOrSlug || req.query.instituteId;
    const officerOrganization = await getPlacementOfficerOrganization(currentUserId);
    const managedOrganization =
      requestedOrgParam
        ? await getManagedOrganization(currentUserId, requestedOrgParam)
        : null;

    const authorizedOfficerOrg = officerOrganization || managedOrganization;

    // =========================================================================
    // CASE 1: AUTHORIZED PLACEMENT OFFICER (STRICT INSTITUTIONAL ISOLATION)
    // If admin is also a placement officer of their org, they see ONLY their org's placement data
    // =========================================================================
    if (authorizedOfficerOrg) {
      const targetOrg = authorizedOfficerOrg;
      const filters = await buildFiltersForInstitute(targetOrg);
      const metrics = await computeMetricsForScope(filters);
      const atRiskStudents = await getAtRiskStudentsForScope(filters.profileFilter);

      return res.json({
        role: 'placement_officer',
        isArcturusAdmin: false,
        isPlacementOfficer: true,
        canManageDrives: true,
        isScopedToInstitute: true,
        institute: {
          id: targetOrg._id.toString(),
          name: targetOrg.name,
          slug: targetOrg.slug,
          logo: targetOrg.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
          location: targetOrg.location,
        },
        stats: {
          ...metrics,
          atRiskStudents,
        },
        // Strict Isolation: Never leak other institutes to placement officers
        institutesSummary: null,
        institutesList: null,
      });
    }

    // =========================================================================
    // CASE 2: ARCTURUS PLATFORM ADMIN (PLATFORM OPERATIONS ANALYTICS ONLY)
    // Individual student placement data and drive management are hidden from pure admins
    // =========================================================================
    if (adminAccess) {
      const totalPlatformUsers = await User.countDocuments();
      const totalVerifiedUsers = await User.countDocuments({ isVerified: true });
      const totalOrganizations = await Organization.countDocuments({ status: 'approved' });
      const activeInstitutionsCount = await Organization.countDocuments({
        status: 'approved',
        $or: [{ industry: /education|university|college|institute/i }, { type: /institution|university/i }],
      });
      const activePlatformDrives = await PlacementDrive.countDocuments({ status: { $ne: 'completed' } });

      const orgs = await Organization.find({ status: 'approved' })
        .select('name slug logo location industry createdAt')
        .lean();

      const platformDirectory = orgs.map((org) => ({
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        logo: org.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        location: org.location || 'Network Member',
        industry: org.industry || 'Organization',
        status: 'Verified',
      }));

      return res.json({
        role: 'admin',
        isArcturusAdmin: true,
        isPlacementOfficer: false,
        canManageDrives: false,
        isPlatformOperationsHub: true,
        isScopedToInstitute: false,
        platformAnalytics: {
          totalPlatformUsers,
          totalVerifiedUsers,
          verificationRate: totalPlatformUsers > 0 ? Math.round((totalVerifiedUsers / totalPlatformUsers) * 100) : 100,
          totalOrganizations,
          activeInstitutionsCount: activeInstitutionsCount || totalOrganizations,
          activePlatformDrives,
          systemHealth: '100% Operational',
          apiUptime: '99.98%',
        },
        platformDirectory,
        stats: {
          totalRegisteredStudents: totalPlatformUsers,
          activeDrivesCount: activePlatformDrives,
          placementRatePercentage: 0,
          averageCtcLpa: 0,
          highestPackageLpa: 0,
          atRiskStudents: [],
          branchConversion: [],
          packageTiers: [],
        },
        message: 'Individual student placement records and drive management are strictly isolated to verified institutional placement officers.',
      });
    }

    // =========================================================================
    // CASE 3: REGULAR USER / STUDENT (RESTRICTED PREVIEW FOR HERO BADGES ONLY)
    // =========================================================================
    let studentOrg = null;
    if (requestedOrgParam) {
      studentOrg = await getOrganizationByIdOrSlug(requestedOrgParam);
    }
    if (!studentOrg && currentUserId) {
      const studentUser = await User.findById(currentUserId).select('institute').lean();
      if (studentUser?.institute?.organizationId) {
        studentOrg = await getOrganizationByIdOrSlug(studentUser.institute.organizationId);
      } else if (studentUser?.institute?.name) {
        studentOrg = await getOrganizationByIdOrSlug(studentUser.institute.name);
      } else {
        const pProfile = await PlacementProfile.findOne({ userId: currentUserId }).select('organizationId collegeName').lean();
        if (pProfile?.organizationId) {
          studentOrg = await getOrganizationByIdOrSlug(pProfile.organizationId);
        } else if (pProfile?.collegeName) {
          studentOrg = await getOrganizationByIdOrSlug(pProfile.collegeName);
        }
      }
    }

    const scopeFilters = studentOrg
      ? await buildFiltersForInstitute(studentOrg)
      : { profileFilter: {}, driveFilter: {}, offerFilter: {} };

    const benchmarkMetrics = await computeMetricsForScope(scopeFilters);

    return res.json({
      role: 'student',
      isArcturusAdmin: false,
      isPlacementOfficer: false,
      isRestricted: true,
      institute: studentOrg
        ? {
            id: studentOrg._id.toString(),
            name: studentOrg.name,
            logo: studentOrg.logo?.url,
          }
        : null,
      stats: {
        totalRegisteredStudents: benchmarkMetrics.totalRegisteredStudents,
        placementRatePercentage: benchmarkMetrics.placementRatePercentage,
        averageCtcLpa: benchmarkMetrics.averageCtcLpa,
        highestPackageLpa: benchmarkMetrics.highestPackageLpa,
        activeDrivesCount: benchmarkMetrics.activeDrivesCount,
        // Zero Leak: At-risk student lists are never exposed to students
        atRiskStudents: [],
        branchConversion: [],
        packageTiers: [],
      },
      message: 'Institutional Command Center is restricted to authorized Placement Officers and Platform Administrators.',
    });
  } catch (err) {
    console.error('Failed to fetch placement analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

export default router;
