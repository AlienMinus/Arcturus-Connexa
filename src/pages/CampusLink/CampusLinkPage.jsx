import React, { useState, useEffect, useRef } from 'react';
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
} from '../../components/CampusLink';
import './CampusLinkPage.css';

const CampusLinkPage = () => {
  const { token, user } = useAuth();
  const isArcturusAdmin = user?.role === 'admin' || user?.username === 'arcturus_admin';
  const [activeTab, setActiveTab] = useState(() => 
    (user?.role === 'admin' || user?.username === 'arcturus_admin' ? 'analytics' : 'readiness')
  );
  
  // Guard non-admins against administrative tabs
  useEffect(() => {
    if (!isArcturusAdmin && (activeTab === 'analytics' || activeTab === 'matching')) {
      setActiveTab('readiness');
    }
  }, [isArcturusAdmin, activeTab]);
  
  // Data States
  const [analytics, setAnalytics] = useState(null);
  const [drives, setDrives] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [matchingPool, setMatchingPool] = useState(null);
  const [selectedDriveForMatch, setSelectedDriveForMatch] = useState('');
  
  // UI & Loading States
  const [, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isDiagnosingGemma, setIsDiagnosingGemma] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Placement Profile Form State
  const [profileForm, setProfileForm] = useState({
    collegeName: '',
    rollNumber: '',
    branch: 'Computer Science & Engineering',
    graduationYear: 2026,
    cgpa: '',
    activeBacklogs: 0,
    skills: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Drive Scheduling Modal State
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveForm, setDriveForm] = useState({
    companyName: '',
    companyLogo: '',
    roleTitle: '',
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
      text: '🎓 **Hello! I am your CAMPUSLINK Placement AI Assistant, powered by Hugging Face Gemma-2.**\n\nI can help you evaluate corporate placement risk, diagnose technical skill gaps, review active drive cutoffs, or simulate technical interview questions. How can I assist you today?',
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

  // Fetch initial data
  const loadCampusData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Analytics
      const analRes = await fetch(buildApiUrl('/campuslink/analytics'));
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData.stats);
      }

      // 2. Fetch Drives & Conflicts
      const drivesRes = await fetch(buildApiUrl('/campuslink/drives'));
      if (drivesRes.ok) {
        const drivesData = await drivesRes.json();
        setDrives(drivesData.drives || []);
        setConflicts(drivesData.conflicts || []);
        if (drivesData.drives?.length > 0 && !selectedDriveForMatch) {
          setSelectedDriveForMatch(drivesData.drives[0]._id);
        }
      }

      // 3. Fetch Offers
      const offersRes = await fetch(buildApiUrl('/campuslink/offers'));
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData.offers || []);
      }

      // 4. Fetch Student Placement Profile (if authenticated)
      if (token) {
        const profRes = await fetch(buildApiUrl('/campuslink/profile/me'), { headers });
        if (profRes.ok) {
          const profData = await profRes.json();
          setStudentProfile(profData.profile);
          if (profData.profile) {
            setProfileForm({
              collegeName: profData.profile.collegeName || '',
              rollNumber: profData.profile.rollNumber || '',
              branch: profData.profile.branch || 'Computer Science & Engineering',
              graduationYear: profData.profile.graduationYear || 2026,
              cgpa: profData.profile.cgpa ?? '',
              activeBacklogs: profData.profile.activeBacklogs ?? 0,
              skills: Array.isArray(profData.profile.skills) ? profData.profile.skills.join(', ') : '',
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
    loadCampusData();
  }, [token]);

  // Fetch matching pool when drive changes in tab 4
  const fetchMatchingPool = async (driveId) => {
    if (!driveId) return;
    try {
      const res = await fetch(buildApiUrl(`/campuslink/drives/${driveId}/match`));
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

  // Schedule a new recruitment drive
  const handleScheduleDrive = async (e) => {
    e?.preventDefault();
    if (!token) {
      showToast('Please sign in to schedule a placement drive');
      return;
    }
    if (!driveForm.companyName.trim() || !driveForm.roleTitle.trim() || !driveForm.ctcLpa || !driveForm.driveDate) {
      showToast('Please provide company name, role, CTC package, and drive date');
      return;
    }

    try {
      const skillsArray = typeof driveForm.requiredSkills === 'string'
        ? driveForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        companyName: driveForm.companyName.trim(),
        companyLogo: driveForm.companyLogo.trim() || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        roleTitle: driveForm.roleTitle.trim(),
        jobCategory: driveForm.jobCategory,
        ctcLpa: Number(driveForm.ctcLpa),
        baseStipend: Number(driveForm.baseStipend) || 0,
        minCgpa: Number(driveForm.minCgpa) || 6.0,
        maxBacklogs: Number(driveForm.maxBacklogs) || 0,
        allowedBranches: driveForm.allowedBranches,
        requiredSkills: skillsArray.length > 0 ? skillsArray : ['Data Structures', 'Problem Solving'],
        driveDate: driveForm.driveDate,
        startTime: driveForm.startTime || '09:30 AM',
        endTime: driveForm.endTime || '01:30 PM',
        venue: driveForm.venue || 'Campus Auditorium - Hall A',
        totalOpenings: Number(driveForm.totalOpenings) || 10,
      };

      const res = await fetch(buildApiUrl('/campuslink/drives'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('🎯 Recruitment drive scheduled successfully!');
        setShowDriveModal(false);
        setDriveForm({
          companyName: '',
          companyLogo: '',
          roleTitle: '',
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
        showToast(err.error || 'Failed to schedule drive');
      }
    } catch (err) {
      console.error('Drive scheduling error:', err);
      showToast('Network error scheduling placement drive');
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
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProfile(data.profile);
        showToast('✨ Hugging Face Gemma AI diagnostic complete! Risk & recommendations updated.');
        loadCampusData();
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
      if (res.ok) {
        showToast(`🎉 Offer marked as ${action}! Document verified.`);
        loadCampusData();
      }
    } catch (err) {
      console.error('Failed to respond to offer:', err);
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
        analytics={analytics}
        drivesCount={drives.length}
      />

      {/* Navigation Tabs Bar */}
      <CampusTabsNav
        isArcturusAdmin={isArcturusAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflictsCount={conflicts.length}
        drivesCount={drives.length}
        offersCount={offers.length}
        isChatFloatingOpen={isChatFloatingOpen}
        setIsChatFloatingOpen={setIsChatFloatingOpen}
      />

      {/* TAB 1: PLACEMENT COMMAND CENTER (ANALYTICS) */}
      {activeTab === 'analytics' && (
        <CommandCenterTab
          isArcturusAdmin={isArcturusAdmin}
          analytics={analytics}
          loadCampusData={loadCampusData}
          setActiveTab={setActiveTab}
          showToast={showToast}
        />
      )}

      {/* TAB 2: DRIVES & CONFLICT RESOLVER */}
      {activeTab === 'drives' && (
        <DrivesTab
          isArcturusAdmin={isArcturusAdmin}
          drives={drives}
          conflicts={conflicts}
          studentProfile={studentProfile}
          setShowDriveModal={setShowDriveModal}
          handleAutoResolveConflict={handleAutoResolveConflict}
          handleDeleteDrive={handleDeleteDrive}
          setSelectedDriveForMatch={setSelectedDriveForMatch}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 3: STUDENT READINESS & SKILL-GAP PORTAL */}
      {activeTab === 'readiness' && (
        <ReadinessTab
          user={user}
          studentProfile={studentProfile}
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

      {/* TAB 4: RECRUITER MATCHING & EXPLAINABLE AI */}
      {activeTab === 'matching' && (
        <MatchingTab
          isArcturusAdmin={isArcturusAdmin}
          drives={drives}
          selectedDriveForMatch={selectedDriveForMatch}
          setSelectedDriveForMatch={setSelectedDriveForMatch}
          handleAutoShortlist={handleAutoShortlist}
          matchingPool={matchingPool}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 5: OFFERS & DOCUMENT TRACKING */}
      {activeTab === 'offers' && (
        <OffersTab
          isArcturusAdmin={isArcturusAdmin}
          offers={offers}
          handleOfferResponse={handleOfferResponse}
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

      {/* Schedule Recruitment Drive Modal */}
      <ScheduleDriveModal
        showDriveModal={showDriveModal}
        setShowDriveModal={setShowDriveModal}
        driveForm={driveForm}
        setDriveForm={setDriveForm}
        handleScheduleDrive={handleScheduleDrive}
      />
    </div>
  );
};

export default CampusLinkPage;
