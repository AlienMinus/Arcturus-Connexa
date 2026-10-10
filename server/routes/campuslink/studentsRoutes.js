import express from 'express';
import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import PlacementProfile from '../../models/PlacementProfile.js';
import authMiddleware from '../../middleware/auth.js';
import { verifyAccessToken } from '../../utils/jwtUtils.js';
import {
  isCampusLinkAdmin,
  getPlacementOfficerOrganization,
  getManagedOrganization,
  getOrganizationByIdOrSlug,
  escapeRegex,
  sendCampusLinkNotification,
} from './helpers.js';

const router = express.Router();

// GET /api/campuslink/students - Manage all students belonging to the organization
router.get('/', async (req, res) => {
  try {
    let currentUserId = null;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = verifyAccessToken(token);
        currentUserId = decoded?.userId;
      } catch (e) {}
    }

    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requestedOrgParam = req.query.organizationId || req.query.idOrSlug || req.query.instituteId;
    const adminAccess = await isCampusLinkAdmin(currentUserId);
    const officerOrg = await getPlacementOfficerOrganization(currentUserId);
    const managedOrg = requestedOrgParam
      ? await getManagedOrganization(currentUserId, requestedOrgParam)
      : null;

    let targetOrg = officerOrg || managedOrg;
    if (!targetOrg && requestedOrgParam) {
      targetOrg = await getOrganizationByIdOrSlug(requestedOrgParam);
    }

    // Pure admin with no target organization: student management is isolated to institutes
    if (!targetOrg && adminAccess) {
      return res.json({
        students: [],
        stats: { totalStudents: 0, placedCount: 0, unplacedCount: 0, averageCgpa: 0, averageReadiness: 0 },
        message: 'Student management is isolated to verified institutional placement officers.',
      });
    }

    if (!targetOrg) {
      return res.status(403).json({
        error: 'Access denied: You must be a verified placement officer of an organization to manage students.',
      });
    }

    const orgId = targetOrg._id;
    const orgName = targetOrg.name;

    // 1. Find all users registered with this organization
    const enrolledUsers = await User.find({
      $or: [
        { 'institute.organizationId': orgId },
        { 'institute.name': { $regex: new RegExp(`^${escapeRegex(orgName)}$`, 'i') } },
      ],
    })
      .select('firstName lastName username email profilePicture isVerified institute')
      .lean();

    const enrolledUserIds = enrolledUsers.map((u) => u._id);
    const enrolledUserMap = new Map(enrolledUsers.map((u) => [u._id.toString(), u]));

    // 2. Find all placement profiles linked to this organization
    const placementProfiles = await PlacementProfile.find({
      $or: [
        { organizationId: orgId },
        { collegeName: { $regex: new RegExp(`^${escapeRegex(orgName)}$`, 'i') } },
        ...(enrolledUserIds.length > 0 ? [{ userId: { $in: enrolledUserIds } }] : []),
      ],
    })
      .populate('userId', 'firstName lastName username email profilePicture isVerified institute')
      .lean();

    const profileUserIdSet = new Set();
    const studentsList = [];

    // Format profiles
    for (const p of placementProfiles) {
      const u = p.userId;
      if (u?._id) {
        profileUserIdSet.add(u._id.toString());
      }
      const fullName = u
        ? [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
        : `Student ${p.rollNumber || 'Member'}`;

      studentsList.push({
        profileId: p._id.toString(),
        userId: u?._id?.toString() || p.userId?.toString() || null,
        name: fullName,
        username: u?.username || '',
        email: u?.email || '',
        avatar: u?.profilePicture?.url || u?.profilePicture || null,
        rollNumber: p.rollNumber || u?.institute?.studentId || 'ARCT-ENROLLED',
        collegeName: p.collegeName || orgName,
        branch: p.branch || u?.institute?.department || 'General Engineering',
        graduationYear: p.graduationYear || u?.institute?.graduationYear || new Date().getFullYear(),
        cgpa: Number(p.cgpa ?? 0),
        activeBacklogs: Number(p.activeBacklogs ?? 0),
        overallReadiness: Number(p.overallReadiness ?? 50),
        readinessLevel: p.readinessLevel || (p.overallReadiness >= 70 ? 'Ready' : 'Developing'),
        placementStatus: p.placementStatus || 'unplaced',
        assignedMentor: p.assignedMentor || '',
        skills: Array.isArray(p.skills) ? p.skills : [],
        isVerified: Boolean(u?.isVerified || u?.institute?.verified),
      });
    }

    // Add enrolled users who do not yet have a PlacementProfile created
    for (const u of enrolledUsers) {
      if (!profileUserIdSet.has(u._id.toString())) {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
        studentsList.push({
          profileId: null,
          userId: u._id.toString(),
          name: fullName,
          username: u.username,
          email: u.email,
          avatar: u.profilePicture?.url || u.profilePicture || null,
          rollNumber: u.institute?.studentId || `ARCT-${u.username.toUpperCase()}`,
          collegeName: orgName,
          branch: u.institute?.department || 'Engineering',
          graduationYear: u.institute?.graduationYear || new Date().getFullYear(),
          cgpa: 0,
          activeBacklogs: 0,
          overallReadiness: 50,
          readinessLevel: 'Developing',
          placementStatus: 'unplaced',
          assignedMentor: '',
          skills: [],
          isVerified: Boolean(u.isVerified || u.institute?.verified),
        });
      }
    }

    // Apply optional query filters
    let filteredStudents = studentsList;
    const { search, status, readiness, branch } = req.query;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.branch.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      filteredStudents = filteredStudents.filter(
        (s) => s.placementStatus.toLowerCase() === status.toLowerCase()
      );
    }

    if (readiness && readiness !== 'all') {
      filteredStudents = filteredStudents.filter(
        (s) => s.readinessLevel.toLowerCase() === readiness.toLowerCase()
      );
    }

    if (branch && branch !== 'all') {
      filteredStudents = filteredStudents.filter(
        (s) => s.branch.toLowerCase() === branch.toLowerCase()
      );
    }

    // Calculate aggregated statistics
    const totalStudents = studentsList.length;
    const placedCount = studentsList.filter((s) =>
      ['placed', 'offer_accepted'].includes(s.placementStatus)
    ).length;
    const unplacedCount = totalStudents - placedCount;
    const readyCount = studentsList.filter((s) =>
      ['Ready', 'Highly Employable'].includes(s.readinessLevel)
    ).length;

    const avgCgpa =
      totalStudents > 0
        ? Number((studentsList.reduce((acc, s) => acc + s.cgpa, 0) / totalStudents).toFixed(2))
        : 0;

    const avgReadiness =
      totalStudents > 0
        ? Math.round(studentsList.reduce((acc, s) => acc + s.overallReadiness, 0) / totalStudents)
        : 0;

    const branchCounts = {};
    studentsList.forEach((s) => {
      const b = s.branch || 'Other';
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });

    res.json({
      students: filteredStudents,
      organization: {
        id: targetOrg._id.toString(),
        name: targetOrg.name,
        slug: targetOrg.slug,
        logo: targetOrg.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      },
      stats: {
        totalStudents,
        filteredCount: filteredStudents.length,
        placedCount,
        unplacedCount,
        readyCount,
        averageCgpa: avgCgpa,
        averageReadiness: avgReadiness,
        placementRatePercentage:
          totalStudents > 0 ? Number(((placedCount / totalStudents) * 100).toFixed(1)) : 0,
        branchDistribution: Object.entries(branchCounts).map(([b, count]) => ({ branch: b, count })),
      },
    });
  } catch (err) {
    console.error('Failed to fetch organization students:', err);
    res.status(500).json({ error: 'Failed to retrieve students roster' });
  }
});

// PATCH /api/campuslink/students/:id/status - Update student placement status & mentor info
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Can be PlacementProfile ID or User ID
    const { placementStatus, assignedMentor, mentorRecommendation } = req.body;

    const adminAccess = await isCampusLinkAdmin(req.userId);
    const officerOrg = await getPlacementOfficerOrganization(req.userId);
    let managedOrg = req.body.organizationId
      ? await getManagedOrganization(req.userId, req.body.organizationId)
      : null;

    if (!managedOrg && req.body.organizationId && adminAccess) {
      managedOrg = await getOrganizationByIdOrSlug(req.body.organizationId);
    }

    let authorizedOrg = officerOrg || managedOrg;

    // Check if user has placement officer role / accountType
    if (!authorizedOrg) {
      const officerUser = await User.findById(req.userId).select('role accountType institute placementOfficer').lean();
      if (officerUser?.placementOfficer?.organizationId) {
        authorizedOrg = await Organization.findById(officerUser.placementOfficer.organizationId);
      } else if (officerUser?.institute?.organizationId) {
        authorizedOrg = await Organization.findById(officerUser.institute.organizationId);
      }
    }

    if (!authorizedOrg && !adminAccess) {
      return res.status(403).json({
        error: 'Access denied: Only authorized placement officers can update student placement records.',
      });
    }

    let profile = null;
    if (id && id.length === 24) {
      profile = await PlacementProfile.findById(id);
      if (!profile) {
        profile = await PlacementProfile.findOne({ userId: id });
      }
    }

    if (!profile) {
      // Find the student user to confirm exists
      const studentUser = await User.findById(id).lean();
      if (!studentUser) {
        return res.status(404).json({ error: 'Student record not found.' });
      }
      profile = new PlacementProfile({
        userId: studentUser._id,
        organizationId: authorizedOrg?._id || studentUser.institute?.organizationId,
        collegeName: authorizedOrg?.name || studentUser.institute?.name || '',
        placementStatus: placementStatus || 'unplaced',
        assignedMentor: assignedMentor || '',
        mentorActionRecommendation: mentorRecommendation || '',
      });
    } else {
      if (placementStatus) profile.placementStatus = placementStatus;
      if (assignedMentor !== undefined) profile.assignedMentor = assignedMentor;
      if (mentorRecommendation !== undefined) profile.mentorActionRecommendation = mentorRecommendation;
      if (!profile.organizationId && authorizedOrg?._id) profile.organizationId = authorizedOrg._id;
    }

    await profile.save();

    // Instant Notification to the Student
    const studentUserId = profile.userId;
    if (studentUserId) {
      const statusLabel = (placementStatus || profile.placementStatus || 'unplaced')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      let noteText = '';
      if (mentorRecommendation) noteText += ` Recommendation: "${mentorRecommendation}".`;
      if (assignedMentor) noteText += ` Assigned Faculty Mentor: ${assignedMentor}.`;

      await sendCampusLinkNotification(studentUserId, {
        message: `📌 Placement Status Update: Your status has been updated to "${statusLabel}" by your institutional Placement Cell.${noteText}`,
        fromUserId: req.userId,
        type: 'campuslink',
      });
    }

    res.json({
      message: 'Student placement status updated successfully!',
      profile,
    });
  } catch (err) {
    console.error('Failed to update student placement status:', err);
    res.status(500).json({ error: 'Failed to update student status' });
  }
});

export default router;

