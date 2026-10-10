import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import {
  CampusHero,
  CampusTabsNav,
  CommandCenterTab,
  DrivesTab,
  ReadinessTab,
  MatchingTab,
  OffersTab,
  FloatingAIAssistant,
  MockAssessmentModal,
  ScheduleDriveModal,
  StudentsTab,
} from '../../components/CampusLink';
import './CampusLinkPage.css';

const CampusLinkPage = () => {
  const { idOrSlug } = useParams();
  const { token, user, activeAccount } = useAuth();
  const isArcturusAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.username === 'arcturus_admin';
  const isOrganizationAccount = activeAccount?.type === 'organization';

  // Data States
  const [analytics, setAnalytics] = useState(null);
  const [analyticsPayload, setAnalyticsPayload] = useState(null);
  const [selectedAdminInstituteId, setSelectedAdminInstituteId] = useState('');

  // Role & Permission Calculation
  const isApprovedOfficer =
    user?.placementOfficer?.status === 'approved' && Boolean(user?.placementOfficer?.organizationId);
  const isOrgOfficer =
    isOrganizationAccount && (activeAccount?.role === 'Placement Officer' || activeAccount?.role === 'Admin');

  // If admin is an approved placement officer of their organization, they have placement officer rights for that org
  const isAdminPlacementOfficer =
    isArcturusAdmin && Boolean(analyticsPayload?.isPlacementOfficer || isApprovedOfficer || isOrgOfficer);

  const isPlacementOfficer =
    Boolean(
      analyticsPayload?.isPlacementOfficer ||
        isApprovedOfficer ||
        user?.accountType === 'placement_officer' ||
        isOrgOfficer
    );

  // Pure Admin: Platform Administrator who is NOT a placement officer of any organization
  const isPureAdmin = isArcturusAdmin && !isAdminPlacementOfficer;

  // Manage drives: allowed ONLY for placement officers (or an admin who is a placement officer of their org)
  const canManageDrives = !isPureAdmin && (isPlacementOfficer || isOrgOfficer);

  const canAccessCommandCenter = isArcturusAdmin || isPlacementOfficer;

  const officerInstitute =
    analyticsPayload?.institute ||
    (user?.placementOfficer?.organizationId?.name
      ? user.placementOfficer.organizationId
      : null) ||
    (isOrgOfficer && activeAccount
      ? { id: activeAccount.id, name: activeAccount.name, logo: activeAccount.logo }
      : null);

  const [activeTab, setActiveTab] = useState(() => {
    if (isOrganizationAccount) return 'organization';
    if (
      user?.role === 'admin' ||
      user?.isAdmin ||
      user?.username === 'arcturus_admin' ||
      user?.placementOfficer?.status === 'approved' ||
      user?.accountType === 'placement_officer'
    ) {
      return 'analytics';
    }
    return 'readiness';
  });

  // Guard non-privileged users against administrative tabs
  useEffect(() => {
    if (isPureAdmin) {
      if (activeTab !== 'analytics') setActiveTab('analytics');
      return;
    }
    if (isOrganizationAccount && canManageDrives && (activeTab === 'matching' || activeTab === 'drives' || activeTab === 'students')) {
      return;
    } else if (isOrganizationAccount && activeTab !== 'organization' && !canManageDrives) {
      setActiveTab('organization');
    } else if (!isOrganizationAccount && activeTab === 'organization') {
      setActiveTab(canAccessCommandCenter ? 'analytics' : 'readiness');
    } else if (!canAccessCommandCenter && activeTab === 'analytics') {
      setActiveTab('readiness');
    } else if (!canManageDrives && (activeTab === 'matching' || activeTab === 'students')) {
      setActiveTab('readiness');
    }
  }, [isArcturusAdmin, isPureAdmin, isPlacementOfficer, isOrganizationAccount, canManageDrives, canAccessCommandCenter, activeTab]);

  const [drives, setDrives] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [offers, setOffers] = useState([]);
  const [matchingPool, setMatchingPool] = useState(null);
  const [selectedDriveForMatch, setSelectedDriveForMatch] = useState('');
  
  // Organization Students State
  const [students, setStudents] = useState([]);
  const [studentsStats, setStudentsStats] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Drive Edit State
  const [editingDriveId, setEditingDriveId] = useState(null);

  // UI & Loading States
  const [, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isDiagnosingGemma, setIsDiagnosingGemma] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Placement Profile Form State
  const [profileForm, setProfileForm] = useState({
    collegeName: '',
    rollNumber: '',
    branch: '',
    graduationYear: 2026,
    cgpa: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    activeBacklogs: 0,
    totalBacklogs: 0,
    skills: '',
    targetRoles: '',
    placementStatus: 'unplaced',
    mockInterviewsTaken: 0,
    assignedMentor: '',
    technicalScore: 70,
    aptitudeScore: 65,
    communicationScore: 75,
    projectScore: 60,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Drive Scheduling Modal State
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveForm, setDriveForm] = useState({
    companyName: '',
    companyLogo: '',
    roleTitle: '',
    description: '',
    jobCategory: 'Core Software',
    ctcLpa: '',
    baseStipend: '',
    minCgpa: 7.0,
    maxBacklogs: 0,
    allowedBranches: [
      'Computer Science & Engineering',
      'Information Technology',
      'Electronics & Communication',
    ],
    otherBranch: '',
    requiredSkills: '',
    driveDate: '',
    startTime: '09:30 AM',
    endTime: '01:30 PM',
    venue: 'Campus Auditorium - Hall A',
    totalOpenings: 10,
  });

  // Chatbot State & Refs
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: '🎓 **Hello! I am your CAMPUSLINK Placement AI Assistant, powered by Hugging Face Gemma.**\n\nI can help you evaluate corporate placement risk, diagnose technical skill gaps, review active drive cutoffs, or simulate technical interview questions. How can I assist you today?',
      isTyping: false,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [isChatFloatingOpen, setIsChatFloatingOpen] = useState(false);

  // Auto-scroll chat when messages update or sending changes
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatSending]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3800);
  };

  const loadStudents = async (scopeParam = (idOrSlug || selectedAdminInstituteId)) => {
    if (!token) return;
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (scopeParam) params.set('organizationId', scopeParam);
      else if (isOrganizationAccount && activeAccount?.id) params.set('organizationId', activeAccount.id);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(buildApiUrl(`/campuslink/students${qs}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setStudentsStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load students roster:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch initial data
  const loadCampusData = async (adminInstituteId = (idOrSlug || selectedAdminInstituteId)) => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Analytics
      const queryParams = new URLSearchParams();
      if (adminInstituteId) queryParams.set('organizationId', adminInstituteId);
      else if (isOrganizationAccount && activeAccount?.id) queryParams.set('organizationId', activeAccount.id);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const analRes = await fetch(buildApiUrl(`/campuslink/analytics${queryString}`), { headers });
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData.stats);
        setAnalyticsPayload(analData);
      }

      // 2. Fetch Drives & Conflicts (Strictly scoped!)
      const driveParams = new URLSearchParams();
      if (adminInstituteId) driveParams.set('organizationId', adminInstituteId);
      else if (isOrganizationAccount && activeAccount?.id) driveParams.set('organizationId', activeAccount.id);

      const driveQuery = driveParams.toString() ? `?${driveParams.toString()}` : '';
      const drivesRes = await fetch(buildApiUrl(`/campuslink/drives${driveQuery}`), { headers });
      if (drivesRes.ok) {
        const drivesData = await drivesRes.json();
        setDrives(drivesData.drives || []);
        setConflicts(drivesData.conflicts || []);
        if (drivesData.drives?.length > 0 && !selectedDriveForMatch) {
          setSelectedDriveForMatch(drivesData.drives[0]._id);
        }
      }

      // 3. Fetch Offers
      const offerParams = new URLSearchParams();
      if (adminInstituteId) offerParams.set('organizationId', adminInstituteId);
      const offerQuery = offerParams.toString() ? `?${offerParams.toString()}` : '';
      const offersRes = await fetch(buildApiUrl(`/campuslink/offers${offerQuery}`), { headers });
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData.offers || []);
      }

      // 4. Fetch Organization Students Roster
      if (token) {
        loadStudents(adminInstituteId);
      }

      // 5. Fetch Student Placement Profile (if authenticated)
      if (token) {
        const profRes = await fetch(buildApiUrl('/campuslink/profile/me'), { headers });
        if (profRes.ok) {
          const profData = await profRes.json();
          setStudentProfile(profData.profile);
          if (profData.diagnosticReport) {
            setDiagnosticReport(profData.diagnosticReport);
          }
          if (profData.profile) {
            setProfileForm({
              collegeName: profData.profile.collegeName || '',
              rollNumber: profData.profile.rollNumber || '',
              branch: profData.profile.branch || '',
              graduationYear: profData.profile.graduationYear || 2026,
              cgpa: profData.profile.cgpa ?? '',
              tenthPercentage: profData.profile.tenthPercentage ?? '',
              twelfthPercentage: profData.profile.twelfthPercentage ?? '',
              activeBacklogs: profData.profile.activeBacklogs ?? 0,
              totalBacklogs: profData.profile.totalBacklogs ?? profData.profile.activeBacklogs ?? 0,
              skills: Array.isArray(profData.profile.skills) ? profData.profile.skills.join(', ') : '',
              targetRoles: Array.isArray(profData.profile.targetRoles) ? profData.profile.targetRoles.join(', ') : '',
              placementStatus: profData.profile.placementStatus || 'unplaced',
              mockInterviewsTaken: profData.profile.mockInterviewsTaken ?? 0,
              assignedMentor: profData.profile.assignedMentor || '',
              technicalScore: profData.profile.technicalScore ?? 70,
              aptitudeScore: profData.profile.aptitudeScore ?? 65,
              communicationScore: profData.profile.communicationScore ?? 75,
              projectScore: profData.profile.projectScore ?? 60,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load CampusLink data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampusData(idOrSlug || selectedAdminInstituteId);
  }, [token, idOrSlug, selectedAdminInstituteId]);

  // Fetch matching pool when drive changes in tab 4
  const fetchMatchingPool = async (driveId) => {
    if (!driveId) return;
    try {
      const res = await fetch(buildApiUrl(`/campuslink/drives/${driveId}/match`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMatchingPool(data);
      }
    } catch (err) {
      console.error('Failed to load drive matches:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'matching' && selectedDriveForMatch) {
      fetchMatchingPool(selectedDriveForMatch);
    }
  }, [activeTab, selectedDriveForMatch]);

  // Resolve Conflict Handler
  const handleAutoResolveConflict = async (conflict) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const body = {};
      if (conflict.suggestedVenue) body.newVenue = conflict.suggestedVenue;
      if (conflict.suggestedTime) body.newTime = conflict.suggestedTime;

      const res = await fetch(
        buildApiUrl(`/campuslink/drives/${conflict.targetDriveId}/resolve-conflict`),
        { method: 'PATCH', headers, body: JSON.stringify(body) }
      );

      if (res.ok) {
        showToast('✅ Conflict successfully resolved! Venue reallocated.');
        loadCampusData();
      }
    } catch (err) {
      console.error('Failed to auto-resolve conflict:', err);
    }
  };

  // Open modal to schedule a new drive
  const handleOpenCreateDrive = () => {
    setEditingDriveId(null);
    setDriveForm({
      companyName: '',
      companyLogo: '',
      roleTitle: '',
      description: '',
      jobCategory: 'Core Software',
      ctcLpa: '',
      baseStipend: '',
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedBranches: [
        'Computer Science & Engineering',
        'Information Technology',
        'Electronics & Communication',
      ],
      otherBranch: '',
      requiredSkills: '',
      driveDate: '',
      startTime: '09:30 AM',
      endTime: '01:30 PM',
      venue: 'Campus Auditorium - Hall A',
      totalOpenings: 10,
    });
    setShowDriveModal(true);
  };

  // Open modal to edit an existing drive
  const handleEditDrive = (drive) => {
    setEditingDriveId(drive._id);
    setDriveForm({
      companyName: drive.companyName || '',
      companyLogo: drive.companyLogo || '',
      roleTitle: drive.roleTitle || '',
      description: drive.description || '',
      jobCategory: drive.jobCategory || 'Core Software',
      ctcLpa: drive.ctcLpa || '',
      baseStipend: drive.baseStipend || '',
      minCgpa: drive.eligibility?.minCgpa ?? 7.0,
      maxBacklogs: drive.eligibility?.maxBacklogs ?? 0,
      allowedBranches: drive.eligibility?.allowedBranches || [
        'Computer Science & Engineering',
        'Information Technology',
        'Electronics & Communication',
      ],
      otherBranch: '',
      requiredSkills: Array.isArray(drive.eligibility?.requiredSkills)
        ? drive.eligibility.requiredSkills.join(', ')
        : '',
      driveDate: (() => {
        if (!drive.schedule?.driveDate) return '';
        try {
          const d = new Date(drive.schedule.driveDate);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      })(),
      startTime: drive.schedule?.startTime || '09:30 AM',
      endTime: drive.schedule?.endTime || '01:30 PM',
      venue: drive.schedule?.venue || 'Campus Auditorium - Hall A',
      totalOpenings: drive.totalOpenings || 10,
    });
    setShowDriveModal(true);
  };

  // Schedule or Edit a recruitment drive
  const handleScheduleDrive = async (e) => {
    e?.preventDefault();
    if (!token) {
      showToast('Please sign in to schedule or edit a placement drive');
      return;
    }
    if (!driveForm.companyName.trim() || !driveForm.roleTitle.trim() || !driveForm.description.trim() || !driveForm.ctcLpa || !driveForm.driveDate) {
      showToast('Please provide company name, role, job description, CTC package, and drive date');
      return;
    }
    if (driveForm.allowedBranches.includes('Other') && !driveForm.otherBranch.trim()) {
      showToast('Please specify the other eligible branch.');
      return;
    }

    try {
      const skillsArray = typeof driveForm.requiredSkills === 'string'
        ? driveForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const eligibleBranches = driveForm.allowedBranches
        .map((branch) => branch === 'Other' ? driveForm.otherBranch.trim() : branch)
        .filter(Boolean);
      const payload = {
        companyName: driveForm.companyName.trim(),
        companyLogo: driveForm.companyLogo.trim() || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        roleTitle: driveForm.roleTitle.trim(),
        description: driveForm.description.trim(),
        jobCategory: driveForm.jobCategory,
        ctcLpa: Number(driveForm.ctcLpa),
        baseStipend: Number(driveForm.baseStipend) || 0,
        minCgpa: Number(driveForm.minCgpa) || 6.0,
        maxBacklogs: Number(driveForm.maxBacklogs) || 0,
        allowedBranches: eligibleBranches,
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Data Structures', 'Problem Solving'],
        driveDate: driveForm.driveDate,
        startTime: driveForm.startTime || '09:30 AM',
        endTime: driveForm.endTime || '01:30 PM',
        venue: driveForm.venue || 'Campus Auditorium - Hall A',
        totalOpenings: Number(driveForm.totalOpenings) || 10,
        organizationId: idOrSlug || (isOrganizationAccount ? activeAccount?.id : undefined),
      };

      const url = editingDriveId
        ? buildApiUrl(`/campuslink/drives/${editingDriveId}`)
        : buildApiUrl('/campuslink/drives');
      const method = editingDriveId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingDriveId ? '🎯 Recruitment drive updated successfully!' : '🎯 Recruitment drive scheduled successfully!');
        setShowDriveModal(false);
        setEditingDriveId(null);
        setDriveForm({
          companyName: '',
          companyLogo: '',
          roleTitle: '',
          description: '',
          jobCategory: 'Core Software',
          ctcLpa: '',
          baseStipend: '',
          minCgpa: 7.0,
          maxBacklogs: 0,
          allowedBranches: [
            'Computer Science & Engineering',
            'Information Technology',
            'Electronics & Communication',
          ],
          otherBranch: '',
          requiredSkills: '',
          driveDate: '',
          startTime: '09:30 AM',
          endTime: '01:30 PM',
          venue: 'Campus Auditorium - Hall A',
          totalOpenings: 10,
        });
        loadCampusData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save drive');
      }
    } catch (err) {
      console.error('Drive scheduling/editing error:', err);
      showToast('Network error processing placement drive');
    }
  };

  // Update a student's placement status
  const handleUpdateStudentStatus = async (studentId, statusData) => {
    try {
      const res = await fetch(buildApiUrl(`/campuslink/students/${studentId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...statusData,
          organizationId: idOrSlug || officerInstitute?._id || officerInstitute?.id || activeAccount?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update student status');
        return;
      }
      showToast('Student placement record updated!');
      loadStudents();
    } catch (err) {
      console.error('Failed to update student:', err);
      showToast('Server error updating student record');
    }
  };

  // Cancel / Delete a placement drive
  const handleDeleteDrive = async (driveId, companyName) => {
    if (!window.confirm(`Are you sure you want to cancel the recruitment drive for ${companyName}?`)) {
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/campuslink/drives/${driveId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        showToast(`🗑️ Placement drive for ${companyName} cancelled`);
        loadCampusData();
      }
    } catch (err) {
      console.error('Failed to delete drive:', err);
      showToast('Failed to cancel placement drive');
    }
  };

  // Save / Update Student Placement Profile
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!token) {
      showToast('Please sign in to save your placement profile');
      return;
    }
    if (!profileForm.collegeName.trim() || !profileForm.rollNumber.trim() || profileForm.cgpa === '') {
      showToast('Please provide your college name, roll number, and CGPA');
      return;
    }
    try {
      const res = await fetch(buildApiUrl('/campuslink/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        showToast('🎯 Placement profile saved and readiness calculated!');
        setIsEditingProfile(false);
        loadCampusData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      showToast('Network error saving placement profile');
    }
  };

  // Run On-Demand Hugging Face Gemma AI Risk & Recommendation Diagnostics
  const handleRunGemmaDiagnostics = async () => {
    if (!token) {
      showToast('Please sign in to run Gemma AI diagnostics');
      return;
    }
    setIsDiagnosingGemma(true);
    try {
      const res = await fetch(buildApiUrl('/campuslink/profile/diagnose-ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setStudentProfile({ ...data.profile });
        }
        if (data.diagnosticReport) {
          setDiagnosticReport(data.diagnosticReport);
        }
        showToast('✨ Employability & skill-gap diagnostics updated from Arcturus profile!');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to complete Gemma diagnostics');
      }
    } catch (err) {
      console.error('Gemma diagnostics error:', err);
      showToast('Network error during Gemma diagnostics');
    } finally {
      setIsDiagnosingGemma(false);
    }
  };

  // Submit Mock Assessment Handler
  const handleAssessmentSubmit = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(buildApiUrl('/campuslink/profile/assessment'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ technicalDelta: 5, aptitudeDelta: 4, communicationDelta: 6 }),
      });

      if (res.ok) {
        const data = await res.json();
        setStudentProfile(data.profile);
        setShowAssessmentModal(false);
        showToast('🎯 Assessment evaluated! Your Employability Readiness Score increased to ' + data.profile.overallReadiness + '%!');
      }
    } catch (err) {
      console.error('Assessment submit error:', err);
    }
  };

  // Auto Shortlist Candidates Handler
  const handleAutoShortlist = async () => {
    if (!selectedDriveForMatch) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(
        buildApiUrl(`/campuslink/drives/${selectedDriveForMatch}/auto-shortlist`),
        { method: 'POST', headers }
      );
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Auto-shortlisting complete!');
        fetchMatchingPool(selectedDriveForMatch);
      }
    } catch (err) {
      console.error('Auto-shortlist error:', err);
    }
  };

  // Offer Response Handler
  const handleOfferResponse = async (offerId, action) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(buildApiUrl(`/campuslink/offers/${offerId}/respond`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`🎉 Offer ${action}! Notification dispatched.`);
        loadCampusData();
        loadStudents(); // Update placement officer's table of student data!
      } else {
        showToast(data.error || 'Failed to update offer');
      }
    } catch (err) {
      console.error('Failed to respond to offer:', err);
      showToast('Network error processing offer decision');
    }
  };

  // Push Corporate Offer Handler (Placement Officer End)
  const handlePushOffer = async (offerData) => {
    try {
      const res = await fetch(buildApiUrl('/campuslink/offers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...offerData,
          organizationId: idOrSlug || officerInstitute?._id || officerInstitute?.id || activeAccount?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to push offer');
        return false;
      }
      showToast(data.message || '🎉 Offer pushed to student successfully!');
      loadCampusData();
      loadStudents();
      return true;
    } catch (err) {
      console.error('Failed to push offer:', err);
      showToast('Network error pushing offer');
      return false;
    }
  };

  // Upload Offer Verification Document Handler (Student End)
  const handleUploadOfferDocument = async (offerId, docData) => {
    try {
      const res = await fetch(buildApiUrl(`/campuslink/offers/${offerId}/documents`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(docData),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to upload document');
        return false;
      }
      showToast(data.message || '📄 Document uploaded! Awaiting placement officer verification.');
      loadCampusData();
      loadStudents();
      return true;
    } catch (err) {
      console.error('Failed to upload document:', err);
      showToast('Network error uploading document');
      return false;
    }
  };

  // Verify Offer Documents Handler (Placement Officer End)
  const handleVerifyOffer = async (offerId, verifyData) => {
    try {
      const res = await fetch(buildApiUrl(`/campuslink/offers/${offerId}/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(verifyData),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to verify offer');
        return false;
      }
      showToast(data.message || 'Verification complete! Student status updated.');
      loadCampusData();
      loadStudents();
      return true;
    } catch (err) {
      console.error('Failed to verify offer:', err);
      showToast('Network error verifying offer');
      return false;
    }
  };

  // Chatbot Send Handler
  const handleChatSend = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userPrompt = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userPrompt, isTyping: false }]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(buildApiUrl('/campuslink/ai-assistant'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: userPrompt, profileId: studentProfile?._id }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev, 
          { sender: 'assistant', text: data.reply, isTyping: true }
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: 'assistant', 
            text: '⚠️ **System Notice**: Sorry, I encountered an issue processing your request. Please try again.', 
            isTyping: true 
          },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: 'assistant', 
          text: '⚠️ **Network Notice**: Unable to reach the AI placement engine. Please verify your connection.', 
          isTyping: true 
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="campusLinkWrapper">
      <div className={`workspaceIdentityStrip ${activeAccount?.type === 'organization' ? 'organization-context' : ''}`}>
        <div className="workspaceIdentityCopy">
          <span className="workspaceIdentityEyebrow">Placement workspace</span>
          <strong>{activeAccount?.type === 'organization' ? activeAccount.name : 'Personal profile'}</strong>
        </div>
        <Link to="/settings/accounts" className="workspaceIdentityLink">Switch identity</Link>
      </div>
      {isOrganizationAccount && (
        <div className="campusOrganizationWorkspace">
          <div className="campusOrganizationHero">
            <div>
              <span className="campusOrganizationEyebrow">Organization placement workspace</span>
              <h1>{activeAccount.name}</h1>
              <p>Coordinate your hiring presence, review campus opportunities, and manage your organization account from one workspace.</p>
            </div>
            <div className="campusOrganizationStatus">{activeAccount.status || 'approved'}</div>
          </div>

          <div className="campusOrganizationStats">
            <div><strong>{drives.length}</strong><span>Active drives</span></div>
            <div><strong>{offers.length}</strong><span>Placement offers</span></div>
            <div><strong>{conflicts.length}</strong><span>Schedule conflicts</span></div>
          </div>

          <div className="campusOrganizationActions">
            <Link to="/jobs/manage" className="campusOrganizationPrimary">Manage jobs & applicants</Link>
            <Link to={activeAccount.slug ? `/company/${activeAccount.slug}` : `/organization/${activeAccount.id}`} className="campusOrganizationSecondary">View company page</Link>
            {canManageDrives && <button type="button" className="campusOrganizationSecondary" onClick={handleOpenCreateDrive}>Schedule placement drive</button>}
          </div>

          <div className="campusOrganizationNotice">
            <strong>Recruiter workspace active</strong>
            <span>Switch to your Personal Profile from the account menu to view student readiness, eligible drives, and personal offers.</span>
          </div>
          {canManageDrives && (
            <DrivesTab
              isArcturusAdmin={isArcturusAdmin}
              canManageDrives
              drives={drives}
              conflicts={conflicts}
              studentProfile={studentProfile}
              setShowDriveModal={handleOpenCreateDrive}
              handleAutoResolveConflict={handleAutoResolveConflict}
              handleDeleteDrive={handleDeleteDrive}
              handleEditDrive={handleEditDrive}
              setSelectedDriveForMatch={setSelectedDriveForMatch}
              setActiveTab={setActiveTab}
            />
          )}
          {canManageDrives && activeTab === 'students' && (
            <StudentsTab
              organization={activeAccount}
              students={students}
              stats={studentsStats}
              loading={studentsLoading}
              onRefresh={() => loadStudents()}
              onUpdateStudentStatus={handleUpdateStudentStatus}
              onPushOffer={handlePushOffer}
              offers={offers}
              onVerifyOffer={handleVerifyOffer}
              setActiveTab={setActiveTab}
            />
          )}
          {canManageDrives && activeTab === 'matching' && (
            <MatchingTab
              canManageDrives={canManageDrives}
              isPlacementOfficer={isPlacementOfficer}
              isArcturusAdmin={isArcturusAdmin}
              drives={drives}
              selectedDriveForMatch={selectedDriveForMatch}
              setSelectedDriveForMatch={setSelectedDriveForMatch}
              handleAutoShortlist={handleAutoShortlist}
              matchingPool={matchingPool}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      )}
      {!isOrganizationAccount && (
      <>
      {/* Toast */}
      {toastMessage && (
        <div className="campusToast">
          <FaCheckCircle size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <CampusHero
        isArcturusAdmin={isArcturusAdmin}
        isPlacementOfficer={isPlacementOfficer}
        officerInstitute={officerInstitute}
        analyticsPayload={analyticsPayload}
        analytics={analytics}
        drivesCount={drives.length}
      />

      {/* Navigation Tabs Bar */}
      <CampusTabsNav
        isArcturusAdmin={isArcturusAdmin}
        isPlacementOfficer={isPlacementOfficer}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflictsCount={conflicts.length}
        drivesCount={drives.length}
        offersCount={offers.length}
        studentsCount={students.length}
        isChatFloatingOpen={isChatFloatingOpen}
        setIsChatFloatingOpen={setIsChatFloatingOpen}
      />

      {/* TAB 1: PLACEMENT COMMAND CENTER (ANALYTICS) */}
      {activeTab === 'analytics' && (
        <CommandCenterTab
          isArcturusAdmin={isArcturusAdmin}
          isPlacementOfficer={isPlacementOfficer}
          officerInstitute={officerInstitute}
          analyticsPayload={analyticsPayload}
          analytics={analytics}
          selectedAdminInstituteId={selectedAdminInstituteId}
          setSelectedAdminInstituteId={setSelectedAdminInstituteId}
          loadCampusData={loadCampusData}
          setActiveTab={setActiveTab}
          showToast={showToast}
        />
      )}

      {/* TAB 2: DRIVES & CONFLICT RESOLVER */}
      {activeTab === 'drives' && (
        <DrivesTab
          isArcturusAdmin={isArcturusAdmin}
          canManageDrives={canManageDrives}
          drives={drives}
          conflicts={conflicts}
          studentProfile={studentProfile}
          setShowDriveModal={handleOpenCreateDrive}
          handleAutoResolveConflict={handleAutoResolveConflict}
          handleDeleteDrive={handleDeleteDrive}
          handleEditDrive={handleEditDrive}
          setSelectedDriveForMatch={setSelectedDriveForMatch}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 3: ORGANIZATION STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <StudentsTab
          organization={officerInstitute || analyticsPayload?.institute}
          students={students}
          stats={studentsStats}
          loading={studentsLoading}
          onRefresh={() => loadStudents()}
          onUpdateStudentStatus={handleUpdateStudentStatus}
          onPushOffer={handlePushOffer}
          offers={offers}
          onVerifyOffer={handleVerifyOffer}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 4: STUDENT READINESS & SKILL-GAP PORTAL */}
      {activeTab === 'readiness' && (
        <ReadinessTab
          user={user}
          studentProfile={studentProfile}
          diagnosticReport={diagnosticReport}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          handleSaveProfile={handleSaveProfile}
          handleRunGemmaDiagnostics={handleRunGemmaDiagnostics}
          isDiagnosingGemma={isDiagnosingGemma}
          setShowAssessmentModal={setShowAssessmentModal}
        />
      )}

      {/* TAB 5: RECRUITER MATCHING & EXPLAINABLE AI */}
      {activeTab === 'matching' && (
        <MatchingTab
          canManageDrives={canManageDrives}
          isPlacementOfficer={isPlacementOfficer}
          isArcturusAdmin={isArcturusAdmin}
          drives={drives}
          selectedDriveForMatch={selectedDriveForMatch}
          setSelectedDriveForMatch={setSelectedDriveForMatch}
          handleAutoShortlist={handleAutoShortlist}
          matchingPool={matchingPool}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 6: OFFERS & DOCUMENT TRACKING */}
      {activeTab === 'offers' && (
        <OffersTab
          isArcturusAdmin={isArcturusAdmin}
          isPlacementOfficer={isPlacementOfficer}
          offers={offers}
          students={students}
          handleOfferResponse={handleOfferResponse}
          onPushOffer={handlePushOffer}
          onUploadDocument={handleUploadOfferDocument}
          onVerifyOffer={handleVerifyOffer}
        />
      )}

      {/* FLOATING CAMPUSLINK AI ASSISTANT */}
      <FloatingAIAssistant
        isChatFloatingOpen={isChatFloatingOpen}
        setIsChatFloatingOpen={setIsChatFloatingOpen}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        isChatSending={isChatSending}
        handleChatSend={handleChatSend}
        chatScrollRef={chatScrollRef}
        messagesEndRef={messagesEndRef}
      />

      {/* Mock Assessment Modal Simulator */}
      <MockAssessmentModal
        showAssessmentModal={showAssessmentModal}
        setShowAssessmentModal={setShowAssessmentModal}
        handleAssessmentSubmit={handleAssessmentSubmit}
      />

      {/* Schedule / Edit Recruitment Drive Modal */}
      <ScheduleDriveModal
        showDriveModal={showDriveModal}
        setShowDriveModal={setShowDriveModal}
        driveForm={driveForm}
        setDriveForm={setDriveForm}
        handleScheduleDrive={handleScheduleDrive}
        editingDriveId={editingDriveId}
      />
      </>
      )}

      {isOrganizationAccount && (
        <ScheduleDriveModal
          showDriveModal={showDriveModal}
          setShowDriveModal={setShowDriveModal}
          driveForm={driveForm}
          setDriveForm={setDriveForm}
          handleScheduleDrive={handleScheduleDrive}
          editingDriveId={editingDriveId}
        />
      )}
    </div>
  );
};

export default CampusLinkPage;
