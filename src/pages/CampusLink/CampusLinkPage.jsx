import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FaGraduationCap, 
  FaChartLine, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaBriefcase, 
  FaFileInvoiceDollar, 
  FaRobot, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaUsers, 
  FaDollarSign, 
  FaAward, 
  FaTimes, 
  FaPaperPlane, 
  FaSyncAlt,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaArrowRight,
  FaPlus,
  FaTrash,
  FaLightbulb
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './CampusLinkPage.css';

// Real React Markdown Typewriter Component
const TypewriterMarkdown = ({ text, isTyping, scrollRef, onComplete }) => {
  const [displayedText, setDisplayedText] = useState(() => (isTyping ? '' : text));
  const [isFinished, setIsFinished] = useState(!isTyping);

  useEffect(() => {
    if (!isTyping || isFinished) {
      setDisplayedText(text);
      setIsFinished(true);
      return;
    }

    let currentIdx = 0;
    const step = 3; // reveals 3 chars per tick for smooth, fast streaming
    const speed = 14; // 14ms per tick

    const timer = setInterval(() => {
      currentIdx += step;
      if (currentIdx >= text.length) {
        setDisplayedText(text);
        setIsFinished(true);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, currentIdx));
      }

      if (scrollRef?.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isTyping, isFinished, onComplete, scrollRef]);

  const handleSkip = () => {
    if (!isFinished) {
      setDisplayedText(text);
      setIsFinished(true);
      onComplete?.();
      if (scrollRef?.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  };

  return (
    <div
      className={`chatMsgMarkdown ${!isFinished ? 'isTypingActive' : ''}`}
      onClick={handleSkip}
      title={!isFinished ? 'Click to reveal full response' : undefined}
      style={{ cursor: !isFinished ? 'pointer' : 'default' }}
    >
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isFinished && <span className="typewriterCursor" aria-hidden="true" />}
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isDiagnosingGemma, setIsDiagnosingGemma] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [assessmentAnswers, setAssessmentAnswers] = useState({ q1: 'b', q2: 'a', q3: 'c' });

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
      <div className="campusHeroCard">
        <div className="campusHeroLeft">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: '16px',
            background: isArcturusAdmin ? '#fef3c7' : '#e0f2fe',
            color: isArcturusAdmin ? '#92400e' : '#0369a1',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: 10,
            width: 'fit-content'
          }}>
            <FaShieldAlt size={12} />
            {isArcturusAdmin ? '👑 Institutional Command Center • Arcturus Admin' : '🎓 Student Placement & Readiness Portal'}
          </div>
          <h1>
            <FaGraduationCap size={28} />
            CAMPUSLINK
          </h1>
          <p className="campusHeroTagline">
            {isArcturusAdmin
              ? 'Arcturus Enterprise Placement Command Center. Oversee institutional analytics, coordinate corporate drives, eliminate venue collisions, and evaluate candidate matching.'
              : 'AI-Powered Campus-to-Corporate Placement Portal. Benchmark technical readiness against scheduled drives, diagnose placement risks with Gemma-2, and explore corporate opportunities.'}
          </p>
        </div>

        <div className="campusHeroBadges">
          <div className="campusHeroBadge">
            <FaAward color="#facc15" /> Placement Rate: <strong>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</strong>
          </div>
          <div className="campusHeroBadge">
            <FaDollarSign color="#4ade80" /> Avg CTC: <strong>{analytics?.averageCtcLpa ? `${analytics.averageCtcLpa} LPA` : '—'}</strong>
          </div>
          <div className="campusHeroBadge">
            <FaBriefcase color="#38bdf8" /> Active Drives: <strong>{drives.length}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="campusTabsCard">
        {isArcturusAdmin && (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartLine size={14} /> Command Center
          </button>
        )}

        {isArcturusAdmin ? (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            <FaCalendarAlt size={14} /> Drives & Conflicts
            {conflicts.length > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
                {conflicts.length}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
            onClick={() => setActiveTab('readiness')}
          >
            <FaUserCheck size={14} /> My Readiness & AI Risk
          </button>
        )}

        {isArcturusAdmin ? (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
            onClick={() => setActiveTab('readiness')}
          >
            <FaUserCheck size={14} /> Student Readiness Engine
          </button>
        ) : (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            <FaCalendarAlt size={14} /> Eligible Drives ({drives.length})
          </button>
        )}

        {isArcturusAdmin && (
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'matching' ? 'active' : ''}`}
            onClick={() => setActiveTab('matching')}
          >
            <FaUsers size={14} /> Recruiter Matching
          </button>
        )}

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          <FaFileInvoiceDollar size={14} /> {isArcturusAdmin ? 'All Offers & Compliance' : 'My Offers'} ({offers.length})
        </button>

        <button
          type="button"
          className={`campusTabBtn ${isChatFloatingOpen ? 'active' : ''}`}
          onClick={() => setIsChatFloatingOpen((prev) => !prev)}
          title="Toggle CampusLink AI Placement Assistant"
        >
          <FaRobot size={14} /> AI Assistant
        </button>
      </div>

      {/* ========================================================
          TAB 1: PLACEMENT COMMAND CENTER (ANALYTICS)
          ======================================================== */}
      {activeTab === 'analytics' && (!isArcturusAdmin ? (
        <div className="campusPanel">
          <div className="campusSubCard" style={{ textAlign: 'center', padding: '60px 24px', borderColor: '#fde68a', background: '#fffbeb', margin: '20px auto', maxWidth: 680 }}>
            <FaShieldAlt size={52} color="#d97706" style={{ marginBottom: 16 }} />
            <h2 style={{ color: '#92400e', margin: '0 0 10px', fontSize: '1.4rem' }}>Institutional Command Center Restricted</h2>
            <p style={{ color: '#78350f', margin: '0 auto 24px', fontSize: '0.94rem', lineHeight: 1.6 }}>
              The Placement Command Center, macro institutional metrics, and risk escalations are restricted exclusively to authorized <strong>Arcturus Platform Administrators</strong>.
            </p>
            <button
              type="button"
              className="campusTabBtn active"
              style={{ margin: '0 auto', display: 'inline-flex' }}
              onClick={() => setActiveTab('readiness')}
            >
              <FaUserCheck size={14} /> Open My Student Readiness Portal
            </button>
          </div>
        </div>
      ) : (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaChartLine color="#0a66c2" /> Institutional Placement Command Center</h2>
              <p>Real-time analytics on student readiness, recruitment pipeline, and branch-wise conversion rates.</p>
            </div>
            <button type="button" className="campusTabBtn active" onClick={loadCampusData}>
              <FaSyncAlt size={12} /> Refresh Data
            </button>
          </div>

          {/* Key Metric KPI Cards */}
          <div className="campusKpiGrid">
            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <FaUsers size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Registered Students</h5>
                <p>{analytics?.totalRegisteredStudents || 0}</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
                <FaAward size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Placement Rate</h5>
                <p>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
                <FaDollarSign size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Average Package</h5>
                <p>{analytics?.averageCtcLpa ? `${analytics.averageCtcLpa} LPA` : '—'}</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <FaFileInvoiceDollar size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Highest Package</h5>
                <p>{analytics?.highestPackageLpa ? `${analytics.highestPackageLpa} LPA` : '—'}</p>
              </div>
            </div>
          </div>

          {/* Split View: Branch Conversion Rates + Package Distribution */}
          <div className="campusAnalyticsSplit">
            {/* Branch Conversion Rates */}
            <div className="campusSubCard">
              <h3><FaGraduationCap color="#0a66c2" /> Branch-Wise Placement Conversion Rates</h3>
              {analytics?.branchConversion?.length > 0 ? (
                analytics.branchConversion.map((b) => (
                  <div key={b.branch} className="branchRow">
                    <div className="branchRowHeader">
                      <span>{b.branch}</span>
                      <span>{b.placedPercent}% ({b.placed}/{b.total} placed)</span>
                    </div>
                    <div className="branchBarTrack">
                      <div className="branchBarFill" style={{ width: `${b.placedPercent}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No student placement data recorded yet.</p>
                </div>
              )}
            </div>

            {/* Salary Package Tiers */}
            <div className="campusSubCard">
              <h3><FaDollarSign color="#16a34a" /> Salary Package Tier Distribution</h3>
              {analytics?.packageTiers?.length > 0 ? (
                analytics.packageTiers.map((t) => (
                  <div key={t.tier} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      <span>{t.tier}</span>
                      <span>{t.count} offers ({t.percentage}%)</span>
                    </div>
                    <div className="branchBarTrack">
                      <div
                        className="branchBarFill"
                        style={{
                          width: `${t.percentage}%`,
                          background: t.tier.includes('Super') ? '#7e22ce' : t.tier.includes('Dream') ? '#0284c7' : '#64748b',
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No offers recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Predictive At-Risk Students Panel */}
          <div className="campusSubCard" style={{ borderColor: '#fed7aa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ color: '#9a3412', margin: 0 }}>
                <FaExclamationTriangle color="#ea580c" /> Predictive At-Risk Student Identification ({analytics?.atRiskStudents?.length || 0})
              </h3>
              <small style={{ color: '#c2410c' }}>Identified via Low CGPA, Backlogs, or Readiness Bottlenecks</small>
            </div>

            {analytics?.atRiskStudents?.length > 0 ? (
              analytics.atRiskStudents.map((s) => (
                <div key={s.id} className="atRiskStudentCard">
                  <div className="atRiskMeta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0 }}>{s.name} ({s.rollNumber}) · {s.branch}</h4>
                      <span className="gemmaBadge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        <FaRobot size={10} /> Gemma AI Flagged
                      </span>
                    </div>
                    <p style={{ marginTop: 4 }}>CGPA: <strong>{s.cgpa}</strong> · Backlogs: <strong>{s.activeBacklogs}</strong> · Readiness: <strong>{s.readiness}% ({s.readinessLevel})</strong></p>
                    <p style={{ color: '#b45309', marginTop: 3 }}><em>Trigger: {s.riskReason}</em></p>
                    {s.mentorRecommendation && (
                      <p style={{ color: '#6d28d9', marginTop: 4, fontSize: '0.8rem', background: '#f5f3ff', padding: '5px 9px', borderRadius: '6px', lineHeight: 1.4 }}>
                        💡 <strong>Gemma Remedial Plan:</strong> {s.mentorRecommendation}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="escalateBtn"
                    onClick={() => showToast(`📢 Escalated ${s.name} to ${s.mentor || 'Advisor'} with Gemma Remedial Plan.`)}
                  >
                    Escalate to Mentor
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#166534', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                  🎉 All registered students currently meet academic benchmarks and eligibility criteria. Zero at-risk students flagged.
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* ========================================================
          TAB 2: DRIVES & CONFLICT RESOLVER
          ======================================================== */}
      {activeTab === 'drives' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaCalendarAlt color="#0a66c2" /> {isArcturusAdmin ? 'Placement Drives & Conflict Management' : 'Scheduled Placement Drives & Eligibility'}</h2>
              <p>{isArcturusAdmin ? 'Manage recruiter schedules, venue allocations, and resolve drive collisions automatically.' : 'Browse active campus recruitment drives, review CGPA / backlog criteria, and test your readiness.'}</p>
            </div>
            {isArcturusAdmin && (
              <button
                type="button"
                className="campusTabBtn active"
                onClick={() => setShowDriveModal(true)}
              >
                <FaPlus size={12} /> Schedule Recruitment Drive
              </button>
            )}
          </div>

          {/* Real-time Conflict Alert Banner - ADMIN EXCLUSIVE */}
          {isArcturusAdmin && conflicts.length > 0 && (
            <div className="conflictAlertBanner">
              <div className="conflictAlertHeader">
                <FaExclamationTriangle size={18} />
                <span>Scheduling Conflicts Detected ({conflicts.length} Active Collision{conflicts.length > 1 ? 's' : ''})</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.86rem', color: '#991b1b' }}>
                Our Conflict Engine flagged scheduling overlap and venue double-booking that would cause student interview clashes.
              </p>

              {conflicts.map((c) => (
                <div key={c.id} className="conflictItemBox">
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`conflictSeverityBadge ${c.severity?.toLowerCase() || 'critical'}`}>
                        {c.severity || 'CRITICAL'}
                      </span>
                      <strong style={{ color: '#991b1b', fontSize: '0.92rem' }}>{c.title}</strong>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', lineHeight: 1.4 }}>
                      {c.description}
                    </span>
                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                      💡 Recommendation: {c.recommendation}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="conflictResolveBtn"
                    onClick={() => handleAutoResolveConflict(c)}
                  >
                    1-Click Auto-Resolve
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drives Grid */}
          {drives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FaCalendarAlt size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <h3 style={{ color: '#1e293b' }}>No Active Placement Drives</h3>
              <p style={{ margin: '6px 0 18px', fontSize: '0.9rem' }}>
                {isArcturusAdmin
                  ? 'Schedule an upcoming campus recruitment drive to manage venues, dates, and detect real-time conflicts.'
                  : 'No corporate placement drives are currently scheduled. Check back soon or visit the Readiness portal to benchmark your skills.'}
              </p>
              {isArcturusAdmin && (
                <button
                  type="button"
                  className="campusTabBtn active"
                  onClick={() => setShowDriveModal(true)}
                >
                  <FaPlus size={12} /> Schedule First Placement Drive
                </button>
              )}
            </div>
          ) : (
            <div className="drivesGrid">
              {drives.map((d) => (
                <div key={d._id} className="driveCard">
                  <div>
                    <div className="driveCardTop">
                      <img src={d.companyLogo} alt={d.companyName} className="driveLogo" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block' }}>{d.companyName}</strong>
                        <span style={{ fontSize: '0.85rem', color: '#0a66c2', fontWeight: 600 }}>{d.roleTitle}</span>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{d.jobCategory} · {d.packageTier}</div>
                      </div>
                      {isArcturusAdmin && (
                        <button
                          type="button"
                          className="driveCancelBtn"
                          title={`Cancel ${d.companyName} recruitment drive`}
                          onClick={() => handleDeleteDrive(d._id, d.companyName)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>

                    <div className="driveDetailsRow">
                      <div><strong>Package:</strong> {d.ctcLpa} LPA (Stipend: ₹{Number(d.baseStipend || 0).toLocaleString()}/mo)</div>
                      <div><strong>Eligibility:</strong> Min CGPA {d.eligibility?.minCgpa} · Max {d.eligibility?.maxBacklogs} Backlogs</div>
                      <div><strong>Date & Time:</strong> {new Date(d.schedule?.driveDate).toLocaleDateString()} ({d.schedule?.startTime} - {d.schedule?.endTime})</div>
                      <div><strong>Venue:</strong> {d.schedule?.venue}</div>
                    </div>

                    {/* Student Eligibility Pill */}
                    {!isArcturusAdmin && studentProfile && (
                      <div style={{ marginTop: 8 }}>
                        {(() => {
                          const studentCgpa = Number(studentProfile?.cgpa ?? 0);
                          const studentBacklogs = Number(studentProfile?.activeBacklogs ?? 0);
                          const minCgpa = Number(d.eligibility?.minCgpa || 0);
                          const maxBacklogs = Number(d.eligibility?.maxBacklogs ?? 0);
                          const eligible = studentCgpa >= minCgpa && studentBacklogs <= maxBacklogs;

                          return eligible ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#15803d', padding: '4px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                              <FaCheckCircle size={11} /> Eligible to Apply (Your CGPA: {studentCgpa} ≥ Cutoff: {minCgpa})
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fee2e2', color: '#b91c1c', padding: '4px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                              <FaTimes size={11} /> Cutoff Not Met (Min {minCgpa} CGPA, Max {maxBacklogs} Backlogs)
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    <div className="driveStagesRow">
                      {d.stages?.map((st, i) => (
                        <span key={i} className="stagePill">{st.name}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {isArcturusAdmin ? (
                      <button
                        type="button"
                        className="campusTabBtn active"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          setSelectedDriveForMatch(d._id);
                          setActiveTab('matching');
                        }}
                      >
                        View Ranked Candidates
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="campusTabBtn active"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setActiveTab('readiness')}
                      >
                        <FaUserCheck size={13} /> Check Skill Gaps For This Role
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: STUDENT READINESS & SKILL-GAP PORTAL
          ======================================================== */}
      {activeTab === 'readiness' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaUserCheck color="#0a66c2" /> Student Employability & Skill-Gap Profiling</h2>
              <p>4-tier continuous employability scoring, dimension benchmarks, and AI gap diagnostics.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {studentProfile && !isEditingProfile && (
                <button
                  type="button"
                  className="campusTabBtn"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </button>
              )}
              {studentProfile && (
                <button
                  type="button"
                  className="campusTabBtn active"
                  onClick={() => setShowAssessmentModal(true)}
                >
                  <FaAward size={14} /> Take Mock Assessment Booster
                </button>
              )}
            </div>
          </div>

          {!studentProfile || isEditingProfile ? (
            <div className="campusSubCard" style={{ maxWidth: 720, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>
                    {studentProfile ? '✏️ Update Placement Profile' : '🎓 Setup Your Placement Profile'}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                    Enter your academic records and technical skills to compute your real employability readiness score and match with campus recruitment drives.
                  </p>
                </div>
                {studentProfile && (
                  <button
                    type="button"
                    className="escalateBtn"
                    style={{ background: '#64748b' }}
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    College / University Name *
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="Enter your college or university"
                    value={profileForm.collegeName}
                    onChange={(e) => setProfileForm({ ...profileForm, collegeName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Roll Number / Student ID *
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="Enter your student roll number"
                    value={profileForm.rollNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, rollNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Branch / Department *
                  </label>
                  <select
                    className="chatInput"
                    value={profileForm.branch}
                    onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                    required
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Graduation Year *
                  </label>
                  <input
                    type="number"
                    className="chatInput"
                    placeholder="2026"
                    value={profileForm.graduationYear}
                    onChange={(e) => setProfileForm({ ...profileForm, graduationYear: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Current CGPA (out of 10) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="chatInput"
                    placeholder="e.g. 8.2"
                    value={profileForm.cgpa}
                    onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="chatInput"
                    value={profileForm.activeBacklogs}
                    onChange={(e) => setProfileForm({ ...profileForm, activeBacklogs: Number(e.target.value) })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Key Technical Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="e.g. React, Node.js, Python, DSA, SQL, System Design"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                  <button
                    type="submit"
                    className="campusTabBtn active"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  >
                    <FaCheckCircle size={14} /> Save Profile & Calculate Employability Score
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Top Readiness Score Dial & Dimension Breakdown */}
              <div className="readinessHeaderGrid">
                {/* Dial Card */}
                <div className="readinessDialBox">
                  <div className="readinessScoreCircle">
                    {studentProfile.overallReadiness}%
                  </div>
                  <span className={`readinessLevelBadge ${(studentProfile.readinessLevel || 'ready').toLowerCase().replace(' ', '-')}`}>
                    {studentProfile.readinessLevel}
                  </span>
                  <h4 style={{ margin: '12px 0 4px', color: '#0f172a' }}>
                    {studentProfile.collegeName}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    Branch: {studentProfile.branch} · Roll: {studentProfile.rollNumber}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: 8 }}>
                    CGPA: {studentProfile.cgpa} · Active Backlogs: {studentProfile.activeBacklogs || 0}
                  </p>
                </div>

                {/* 4-Dimension Scores Breakdown */}
                <div className="campusSubCard">
                  <h3>Dimension Breakdown</h3>

                  <div className="dimensionScoreRow">
                    <div className="dimensionLabelRow">
                      <span>Technical Competency (DSA, Web & Systems)</span>
                      <span>{studentProfile.technicalScore}%</span>
                    </div>
                    <div className="dimensionTrack">
                      <div className="dimensionFill" style={{ width: `${studentProfile.technicalScore}%`, background: '#0a66c2' }} />
                    </div>
                  </div>

                  <div className="dimensionScoreRow">
                    <div className="dimensionLabelRow">
                      <span>Aptitude & Quantitative Problem Solving</span>
                      <span>{studentProfile.aptitudeScore}%</span>
                    </div>
                    <div className="dimensionTrack">
                      <div className="dimensionFill" style={{ width: `${studentProfile.aptitudeScore}%`, background: '#16a34a' }} />
                    </div>
                  </div>

                  <div className="dimensionScoreRow">
                    <div className="dimensionLabelRow">
                      <span>Communication & Behavioral Interview Skills</span>
                      <span>{studentProfile.communicationScore}%</span>
                    </div>
                    <div className="dimensionTrack">
                      <div className="dimensionFill" style={{ width: `${studentProfile.communicationScore}%`, background: '#7e22ce' }} />
                    </div>
                  </div>

                  <div className="dimensionScoreRow">
                    <div className="dimensionLabelRow">
                      <span>Projects & Practical Experience Depth</span>
                      <span>{studentProfile.projectScore}%</span>
                    </div>
                    <div className="dimensionTrack">
                      <div className="dimensionFill" style={{ width: `${studentProfile.projectScore}%`, background: '#ea580c' }} />
                    </div>
                  </div>

                  {studentProfile.aiReadinessSummary && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginTop: 14, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                      <strong>AI Diagnostic Rationale:</strong> {studentProfile.aiReadinessSummary}
                    </div>
                  )}
                </div>
              </div>

              {/* ========================================================
                  IMPORTED ARCTURUS CANDIDATE PROFILE PORTFOLIO
                  ======================================================== */}
              <div className="campusSubCard" style={{ borderColor: '#bae6fd', background: '#f8fafc', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FaBriefcase color="#0284c7" /> Imported Candidate Profile Portfolio
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      Imported directly from candidate's individual profile page for Gemma-2 placement risk & readiness analysis
                    </p>
                  </div>
                  {user?.username && (
                    <Link
                      to={`/profile/${user.username}`}
                      target="_blank"
                      className="campusTabBtn"
                      style={{ fontSize: '0.78rem', padding: '5px 12px', textDecoration: 'none', background: '#ffffff', color: '#0284c7', borderColor: '#bae6fd' }}
                    >
                      <FaExternalLinkAlt size={11} /> View / Edit Profile in Arcturus
                    </Link>
                  )}
                </div>

                {/* Candidate Headline & Summary */}
                {studentProfile.candidateProfile?.headline && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Professional Headline: </strong>
                    <span style={{ fontSize: '0.84rem', color: '#334155' }}>{studentProfile.candidateProfile.headline}</span>
                  </div>
                )}
                {studentProfile.candidateProfile?.summary && (
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', marginBottom: 14, lineHeight: 1.45 }}>
                    <strong style={{ color: '#0369a1' }}>About Statement: </strong> {studentProfile.candidateProfile.summary}
                  </div>
                )}

                {/* Technical Projects with Descriptions & Tech Badges */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                      Technical Projects ({studentProfile.candidateProfile?.projects?.length || 0})
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Used for Project Depth & Risk Evaluation</span>
                  </div>

                  {studentProfile.candidateProfile?.projects?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {studentProfile.candidateProfile.projects.map((proj, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <strong style={{ fontSize: '0.92rem', color: '#0a66c2' }}>{proj.title}</strong>
                            {proj.url && (
                              <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                Repository / Demo <FaExternalLinkAlt size={10} />
                              </a>
                            )}
                          </div>
                          {proj.techStack?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
                              {proj.techStack.map((tech, tidx) => (
                                <span key={tidx} style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                          {proj.description && (
                            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                        No technical projects added to your Arcturus profile yet. Adding projects with descriptions and tech stacks significantly improves your Gemma-2 placement score.
                      </p>
                    </div>
                  )}
                </div>

                {/* Work & Internship Experiences with Descriptions */}
                {studentProfile.candidateProfile?.experience?.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: 8 }}>
                      Work & Internship Experience ({studentProfile.candidateProfile.experience.length})
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {studentProfile.candidateProfile.experience.map((exp, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                          <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{exp.title}</strong>
                          {exp.subtitle && <span style={{ fontSize: '0.85rem', color: '#64748b' }}> · {exp.subtitle}</span>}
                          {exp.dateRange && <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>{exp.dateRange}</span>}
                          {exp.description && (
                            <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Licenses & Certifications */}
                {studentProfile.candidateProfile?.certifications?.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: 8 }}>
                      Licenses & Certifications ({studentProfile.candidateProfile.certifications.length})
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {studentProfile.candidateProfile.certifications.map((cert, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{cert.title}</strong>
                            {cert.issuer && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{cert.issuer}</span>}
                          </div>
                          {cert.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{cert.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================
                  HUGGING FACE GEMMA-2 AI RISK & RECOMMENDATION SECTION
                  ======================================================== */}
              <div className="gemmaInsightCard">
                <div className="gemmaHeader">
                  <div className="gemmaHeaderLeft">
                    <span className="gemmaBadge">
                      <FaRobot size={13} /> Hugging Face Gemma-2 AI Engine
                    </span>
                    {studentProfile.isAtRisk ? (
                      <span className="gemmaRiskStatusBadge danger">
                        <FaExclamationTriangle size={12} /> Predictive At-Risk Flagged
                      </span>
                    ) : (
                      <span className="gemmaRiskStatusBadge optimal">
                        <FaCheckCircle size={12} /> Optimal Corporate Placement Track
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="gemmaRunBtn"
                    onClick={handleRunGemmaDiagnostics}
                    disabled={isDiagnosingGemma}
                    title="Refresh AI risk diagnostics using Hugging Face Gemma-2-2B-IT"
                  >
                    <FaSyncAlt size={12} className={isDiagnosingGemma ? 'fa-spin' : ''} />
                    {isDiagnosingGemma ? 'Diagnosing with Gemma...' : 'Re-Run Gemma AI Diagnostics'}
                  </button>
                </div>

                {/* At-Risk Warning Callout if Flagged */}
                {studentProfile.isAtRisk && (
                  <div className="gemmaRiskCallout">
                    <FaExclamationTriangle color="#e11d48" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#9f1239' }}>Identified Corporate Placement Risk Factor:</strong>
                      <p>{studentProfile.riskReason || 'Academic or readiness bottleneck flagged below recruiter benchmark.'}</p>
                    </div>
                  </div>
                )}

                {/* Split Diagnostics Grid */}
                <div className="gemmaGrid">
                  <div className="gemmaBox">
                    <div className="gemmaBoxTitle">
                      <FaChartLine color="#0a66c2" /> Gemma Employability Diagnostic Rationale
                    </div>
                    <p className="gemmaBoxText">
                      {studentProfile.aiReadinessSummary ||
                        'Candidate profile evaluated against recruiter benchmarks. Meets foundational readiness criteria for upcoming recruitment drives.'}
                    </p>
                  </div>

                  <div className="gemmaBox">
                    <div className="gemmaBoxTitle">
                      <FaLightbulb color="#ca8a04" /> Remedial Mentor Guidance & Action Plan
                    </div>
                    <p className="gemmaBoxText">
                      {studentProfile.mentorActionRecommendation ||
                        'Candidate is on track for Tier-1 corporate drives. Recommend targeted system design prep and competitive mock interviews for premium CTC packages.'}
                    </p>
                  </div>
                </div>

                {/* Gemma Recommended Next Competencies */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: 6 }}>
                    🎯 Top Recruiter Competencies Recommended by Gemma for Your Target Roles:
                  </strong>
                  <div className="gemmaSkillsList">
                    {[
                      'System Design & Microservices Architecture',
                      'Docker & Cloud Containerization',
                      'AWS / Cloud Orchestration',
                      'Data Structures & Algorithms (Trees, Graphs & DP)',
                      'RESTful API Security & Asynchronous Queues',
                    ].map((sk) => (
                      <span key={sk} className="gemmaSkillPill">
                        ⚡ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: '0.74rem', color: '#94a3b8', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    Inference Model: <strong>google/gemma-2-2b-it</strong> · Hosted via Hugging Face API
                  </span>
                  {studentProfile.gemmaDiagnosticTimestamp && (
                    <span>
                      Last Diagnosed: {new Date(studentProfile.gemmaDiagnosticTimestamp).toLocaleDateString()} at{' '}
                      {new Date(studentProfile.gemmaDiagnosticTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Skill-Gap Analysis against Target Roles */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>
                  Skill-Gap Diagnostics Against Target Recruiter Roles
                </h3>

                {studentProfile.skillGaps?.length > 0 ? (
                  studentProfile.skillGaps.map((gap, i) => (
                    <div key={i} className="skillGapCard">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <strong style={{ fontSize: '1rem', color: '#0a66c2' }}>{gap.targetRole}</strong>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: gap.matchPercentage >= 75 ? '#166534' : '#b45309' }}>
                          Match: {gap.matchPercentage}%
                        </span>
                      </div>

                      <div className="skillPillGroup">
                        {gap.matchedSkills?.map((s) => (
                          <span key={s} className="skillPill matched">✓ {s}</span>
                        ))}
                        {gap.missingSkills?.map((s) => (
                          <span key={s} className="skillPill missing">✗ Gap: {s}</span>
                        ))}
                      </div>

                      <p style={{ margin: '8px 0', fontSize: '0.84rem', color: '#475569' }}>
                        <strong>Recommendation:</strong> {gap.recommendation}
                      </p>

                      {gap.suggestedCourses?.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {gap.suggestedCourses.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url}
                              className="quickPromptChip"
                              style={{ textDecoration: 'none', color: '#0a66c2' }}
                            >
                              📚 {c.title} ({c.provider}) <FaExternalLinkAlt size={10} style={{ marginLeft: 4 }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '10px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No skill gaps identified against currently scheduled recruiter criteria.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: RECRUITER MATCHING & EXPLAINABLE AI
          ======================================================== */}
      {activeTab === 'matching' && (!isArcturusAdmin ? (
        <div className="campusPanel">
          <div className="campusSubCard" style={{ textAlign: 'center', padding: '60px 24px', borderColor: '#fde68a', background: '#fffbeb', margin: '20px auto', maxWidth: 680 }}>
            <FaShieldAlt size={52} color="#d97706" style={{ marginBottom: 16 }} />
            <h2 style={{ color: '#92400e', margin: '0 0 10px', fontSize: '1.4rem' }}>Recruiter Candidate Matching Restricted</h2>
            <p style={{ color: '#78350f', margin: '0 auto 24px', fontSize: '0.94rem', lineHeight: 1.6 }}>
              Candidate pool ranking, automated shortlisting, and candidate fit rationales are restricted exclusively to authorized <strong>Arcturus Administrators</strong> and corporate hiring partners.
            </p>
            <button
              type="button"
              className="campusTabBtn active"
              style={{ margin: '0 auto', display: 'inline-flex' }}
              onClick={() => setActiveTab('readiness')}
            >
              <FaUserCheck size={14} /> Open My Student Readiness Portal
            </button>
          </div>
        </div>
      ) : (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaUsers color="#0a66c2" /> Recruiter Candidate Matching & Explainable AI</h2>
              <p>Rank and evaluate candidate pools with transparent, natural-language shortlisting rationale.</p>
            </div>

            {drives.length > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  className="chatInput"
                  style={{ padding: '8px 12px' }}
                  value={selectedDriveForMatch}
                  onChange={(e) => setSelectedDriveForMatch(e.target.value)}
                >
                  {drives.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.companyName} - {d.roleTitle}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="campusTabBtn active"
                  onClick={handleAutoShortlist}
                >
                  1-Click Auto-Shortlist
                </button>
              </div>
            )}
          </div>

          {drives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FaUsers size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <h3 style={{ color: '#1e293b' }}>No Active Drives Available for Candidate Matching</h3>
              <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>Recruiter matching evaluates candidates once placement drives are created.</p>
            </div>
          ) : (
            <>
              {/* Drive Match Pool Summary */}
              {matchingPool && (
                <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{matchingPool.driveTitle}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                        Criteria: Min CGPA {matchingPool.eligibility?.minCgpa} · Allowed Branches: {matchingPool.eligibility?.allowedBranches?.join(', ')}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0a66c2' }}>
                      {matchingPool.candidates?.length || 0} Evaluated Candidates · {matchingPool.shortlistedCount || 0} Shortlisted
                    </div>
                  </div>
                </div>
              )}

              {/* Ranked Candidates List */}
              <div>
                {matchingPool?.candidates?.length > 0 ? (
                  matchingPool.candidates.map((c, i) => (
                    <div key={i} className="candidatePoolCard">
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{c.studentName}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>({c.rollNumber})</span>
                          <span className={`readinessLevelBadge ${(c.readinessLevel || 'ready').toLowerCase().replace(' ', '-')}`}>
                            {c.readinessLevel}
                          </span>
                        </div>

                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#475569' }}>
                          Branch: {c.branch} · CGPA: <strong>{c.cgpa}</strong> · Readiness: <strong>{c.overallReadiness}%</strong>
                        </p>

                        {/* Explainable AI Rationale Box */}
                        <div className={`explainableBox ${c.isEligible ? 'eligible' : 'ineligible'}`}>
                          <strong>🤖 Explainable AI Rationale:</strong> {c.fitRationale}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.fitScore >= 75 ? '#166534' : '#b45309' }}>
                          {c.fitScore}%
                        </div>
                        <small style={{ color: '#64748b', display: 'block' }}>Fit Score</small>
                        <span style={{
                          display: 'inline-block',
                          marginTop: 6,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: c.status === 'shortlisted' ? '#dcfce7' : '#f1f5f9',
                          color: c.status === 'shortlisted' ? '#166534' : '#64748b',
                        }}>
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No student profiles currently evaluated for this drive.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* ========================================================
          TAB 5: OFFERS & DOCUMENT TRACKING
          ======================================================== */}
      {activeTab === 'offers' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaFileInvoiceDollar color="#0a66c2" /> Post-Selection Offers & Verification Lifecycle</h2>
              <p>Track student offer letters, CTC packages, acceptance status, and cryptographic verification hashes.</p>
            </div>
          </div>

          {offers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FaFileInvoiceDollar size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <h3>No Offers Recorded Yet</h3>
            </div>
          ) : (
            <div>
              {offers.map((o) => (
                <div key={o._id} className="offerRowCard">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <img src={o.companyLogo} alt={o.companyName} className="driveLogo" />
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{o.companyName}</strong>
                      <span style={{ color: '#0a66c2', fontWeight: 600, display: 'block', fontSize: '0.88rem' }}>
                        {o.role} · {o.offerType}
                      </span>
                      <small style={{ color: '#64748b' }}>
                        Offered to: <strong>{o.studentName}</strong> ({o.rollNumber} - {o.branch})
                      </small>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                      ₹{o.ctcLpa} LPA
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.packageTier}</span>
                  </div>

                  <div>
                    <div className="hashBadge" title="Cryptographic verification hash">
                      🔐 Hash: {o.verificationHash || 'Pending Verification'}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: o.status === 'accepted' ? '#dcfce7' : o.status === 'declined' ? '#fee2e2' : '#fef3c7',
                      color: o.status === 'accepted' ? '#166534' : o.status === 'declined' ? '#991b1b' : '#b45309',
                      textTransform: 'capitalize',
                    }}>
                      Status: {o.status}
                    </span>
                  </div>

                  {o.status === 'offered' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="escalateBtn"
                        style={{ background: '#16a34a' }}
                        onClick={() => handleOfferResponse(o._id, 'accepted')}
                      >
                        Accept Offer
                      </button>
                      <button
                        type="button"
                        className="escalateBtn"
                        style={{ background: '#dc2626' }}
                        onClick={() => handleOfferResponse(o._id, 'declined')}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          FLOATING CAMPUSLINK AI ASSISTANT (BOTTOM LEFT)
          ======================================================== */}
      <div className="campusFloatingAssistantContainer">
        {isChatFloatingOpen && (
          <div className="campusFloatingChatWidget">
            <div className="floatingChatHeader">
              <div className="floatingChatTitle">
                <div className="floatingChatHeaderAvatar">
                  <FaRobot size={18} color="#0a66c2" />
                </div>
                <div>
                  <strong>CampusLink AI Assistant</strong>
                  <small>Online · Powered by Hugging Face Gemma-2</small>
                </div>
              </div>
              <button
                type="button"
                className="floatingChatCloseBtn"
                onClick={() => setIsChatFloatingOpen(false)}
                title="Minimize AI Assistant"
                aria-label="Close Assistant"
              >
                <FaTimes size={15} />
              </button>
            </div>

            <div className="campusChatMessages floatingChatScroll" ref={chatScrollRef}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chatMsg ${msg.sender}`}>
                  {msg.sender === 'assistant' ? (
                    <TypewriterMarkdown
                      text={msg.text}
                      isTyping={Boolean(msg.isTyping)}
                      scrollRef={chatScrollRef}
                      onComplete={() => {
                        setChatMessages((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, isTyping: false } : m))
                        );
                      }}
                    />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  )}
                </div>
              ))}
              {isChatSending && (
                <div className="chatMsg assistant typingLoaderMsg">
                  <div className="typingDots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    CampusLink AI (Gemma-2) is analyzing placement data...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Chips */}
            <div className="chatQuickPrompts floatingPrompts">
              {[
                'Evaluate my placement risk & recommendations',
                'Am I eligible for current active drives?',
                'Diagnose my skill gaps for target roles',
                'Top technical interview questions',
                'Check drive schedule conflicts',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="quickPromptChip"
                  onClick={() => setChatInput(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form className="chatInputBar floatingInputBar" onSubmit={handleChatSend}>
              <input
                type="text"
                className="chatInput"
                placeholder="Ask about drives, skill gaps, or prep..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chatSendBtn" disabled={isChatSending}>
                <FaPaperPlane size={13} />
              </button>
            </form>
          </div>
        )}

        {/* Round Floating AI Launcher Button */}
        <button
          type="button"
          className={`campusFloatingRoundBtn ${isChatFloatingOpen ? 'active' : ''}`}
          title={isChatFloatingOpen ? "Close AI Assistant" : "CampusLink AI Placement Assistant"}
          onClick={() => setIsChatFloatingOpen((prev) => !prev)}
          aria-label="Toggle CampusLink AI Assistant"
        >
          <div className="floatingIconBadge">
            {isChatFloatingOpen ? (
              <FaTimes size={20} />
            ) : (
              <FaRobot size={24} color="#38bdf8" />
            )}
            {!isChatFloatingOpen && <span className="floatingPulseDot" />}
          </div>
        </button>
      </div>

      {/* Mock Assessment Modal Simulator */}
      {showAssessmentModal && (
        <div className="modalOverlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '540px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>🎯 Quick Readiness Assessment Simulator</h3>
              <FaTimes style={{ cursor: 'pointer' }} onClick={() => setShowAssessmentModal(false)} />
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
              Answer these 3 quick technical & aptitude questions to update and boost your 4-tier Employability Readiness Score.
            </p>

            <div style={{ margin: '16px 0', fontSize: '0.88rem', color: '#1e293b' }}>
              <p><strong>1. Technical:</strong> What is the time complexity of searching in a balanced BST?</p>
              <label style={{ display: 'block', margin: '4px 0' }}>
                <input type="radio" name="q1" defaultChecked /> O(log N)
              </label>
              <label style={{ display: 'block', margin: '4px 0' }}>
                <input type="radio" name="q1" /> O(N)
              </label>

              <p style={{ marginTop: 12 }}><strong>2. System Design:</strong> Which mechanism prevents single points of failure in cloud backends?</p>
              <label style={{ display: 'block', margin: '4px 0' }}>
                <input type="radio" name="q2" defaultChecked /> Multi-AZ Redundancy & Load Balancing
              </label>
              <label style={{ display: 'block', margin: '4px 0' }}>
                <input type="radio" name="q2" /> Single Large Virtual Machine
              </label>

              <p style={{ marginTop: 12 }}><strong>3. Aptitude:</strong> A train crosses a 300m platform in 30 seconds at 54 km/h. Length of train?</p>
              <label style={{ display: 'block', margin: '4px 0' }}>
                <input type="radio" name="q3" defaultChecked /> 150 meters
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="campusTabBtn"
                onClick={() => setShowAssessmentModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campusTabBtn active"
                onClick={handleAssessmentSubmit}
              >
                Submit & Boost Readiness
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Recruitment Drive Modal */}
      {showDriveModal && (
        <div className="modalOverlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCalendarAlt color="#0a66c2" /> Schedule Campus Recruitment Drive
              </h3>
              <FaTimes style={{ cursor: 'pointer' }} onClick={() => setShowDriveModal(false)} />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Define company details, CTC package, eligibility criteria, date, and venue. Our Conflict Engine will automatically audit schedule clashes.
            </p>

            <form onSubmit={handleScheduleDrive} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="e.g. Google, Microsoft, Adobe"
                  value={driveForm.companyName}
                  onChange={(e) => setDriveForm({ ...driveForm, companyName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Role Title *
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="e.g. Software Development Engineer"
                  value={driveForm.roleTitle}
                  onChange={(e) => setDriveForm({ ...driveForm, roleTitle: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Package CTC (LPA) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  className="chatInput"
                  placeholder="e.g. 18.5"
                  value={driveForm.ctcLpa}
                  onChange={(e) => setDriveForm({ ...driveForm, ctcLpa: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Monthly Stipend (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="chatInput"
                  placeholder="e.g. 50000"
                  value={driveForm.baseStipend}
                  onChange={(e) => setDriveForm({ ...driveForm, baseStipend: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Job Category
                </label>
                <select
                  className="chatInput"
                  value={driveForm.jobCategory}
                  onChange={(e) => setDriveForm({ ...driveForm, jobCategory: e.target.value })}
                >
                  <option value="Core Software">Core Software</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="FinTech & Analytics">FinTech & Analytics</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Product Engineering">Product Engineering</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Drive Date *
                </label>
                <input
                  type="date"
                  className="chatInput"
                  value={driveForm.driveDate}
                  onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Start Time
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="09:30 AM"
                  value={driveForm.startTime}
                  onChange={(e) => setDriveForm({ ...driveForm, startTime: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  End Time
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="01:30 PM"
                  value={driveForm.endTime}
                  onChange={(e) => setDriveForm({ ...driveForm, endTime: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Campus Venue *
                </label>
                <select
                  className="chatInput"
                  value={driveForm.venue}
                  onChange={(e) => setDriveForm({ ...driveForm, venue: e.target.value })}
                >
                  <option value="Campus Auditorium - Hall A">Campus Auditorium - Hall A</option>
                  <option value="Campus Auditorium - Hall B">Campus Auditorium - Hall B</option>
                  <option value="Seminar Hall B">Seminar Hall B</option>
                  <option value="Tech Center Lab 101">Tech Center Lab 101</option>
                  <option value="Placement Cell Boardroom">Placement Cell Boardroom</option>
                  <option value="Virtual Assessment Lab">Virtual Assessment Lab (Online)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Minimum CGPA Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="chatInput"
                  value={driveForm.minCgpa}
                  onChange={(e) => setDriveForm({ ...driveForm, minCgpa: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Maximum Allowed Backlogs
                </label>
                <input
                  type="number"
                  min="0"
                  className="chatInput"
                  value={driveForm.maxBacklogs}
                  onChange={(e) => setDriveForm({ ...driveForm, maxBacklogs: Number(e.target.value) })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Eligible Branches
                </label>
                <div className="branchCheckboxGrid">
                  {[
                    'Computer Science & Engineering',
                    'Information Technology',
                    'Electronics & Communication',
                    'Electrical Engineering',
                    'Mechanical Engineering',
                    'Civil Engineering',
                  ].map((branch) => {
                    const isChecked = driveForm.allowedBranches.includes(branch);
                    return (
                      <label key={branch} className="branchCheckboxItem">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDriveForm({
                                ...driveForm,
                                allowedBranches: [...driveForm.allowedBranches, branch],
                              });
                            } else {
                              setDriveForm({
                                ...driveForm,
                                allowedBranches: driveForm.allowedBranches.filter((b) => b !== branch),
                              });
                            }
                          }}
                        />
                        <span>{branch}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="e.g. React, Node.js, Python, DSA, System Design"
                  value={driveForm.requiredSkills}
                  onChange={(e) => setDriveForm({ ...driveForm, requiredSkills: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, gridColumn: '1 / -1', marginTop: 12 }}>
                <button
                  type="button"
                  className="campusTabBtn"
                  onClick={() => setShowDriveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="campusTabBtn active"
                >
                  <FaPlus size={12} /> Schedule Drive & Check Conflicts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusLinkPage;

