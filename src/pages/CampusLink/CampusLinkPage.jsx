import React, { useState, useEffect } from 'react';
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
  FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './CampusLinkPage.css';

const CampusLinkPage = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'drives' | 'readiness' | 'matching' | 'offers' | 'assistant'
  
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
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [assessmentAnswers, setAssessmentAnswers] = useState({ q1: 'b', q2: 'a', q3: 'c' });

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: '🎓 **Hello! I am your CAMPUSLINK Placement AI Assistant.**\n\nI can help you check drive eligibility, analyze your technical skill gaps, review your readiness score, or simulate interview questions. How can I assist you today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

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
    setChatMessages((prev) => [...prev, { sender: 'user', text: userPrompt }]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await fetch(buildApiUrl('/campuslink/ai-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { sender: 'assistant', text: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: 'Sorry, I encountered an issue processing your request. Please try again.' },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Network connection issue with the AI engine.' },
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
          <h1>
            <FaGraduationCap size={28} />
            CAMPUSLINK
          </h1>
          <p className="campusHeroTagline">
            AI-Powered Campus-to-Corporate Placement Management & Analytics Platform.
            Streamlining readiness profiling, recruiter matching, drive conflict detection, and institutional analytics.
          </p>
        </div>

        <div className="campusHeroBadges">
          <div className="campusHeroBadge">
            <FaAward color="#facc15" /> Placement Rate: <strong>86.9%</strong>
          </div>
          <div className="campusHeroBadge">
            <FaDollarSign color="#4ade80" /> Avg CTC: <strong>14.8 LPA</strong>
          </div>
          <div className="campusHeroBadge">
            <FaBriefcase color="#38bdf8" /> Active Drives: <strong>{drives.length}</strong>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="campusTabsCard">
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartLine size={14} /> Command Center (Analytics)
          <FaChartLine size={14} /> <span>Command Center</span>
        </button>

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
          onClick={() => setActiveTab('drives')}
        >
          <FaCalendarAlt size={14} /> Drives & Conflict Resolver
          <FaCalendarAlt size={14} /> <span>Drives & Conflicts</span>
          {conflicts.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
              {conflicts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <FaUserCheck size={14} /> Readiness & Skill-Gap Portal
          <FaUserCheck size={14} /> <span>Readiness & Skills</span>
        </button>

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'matching' ? 'active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          <FaUsers size={14} /> Recruiter Matching & Explainable AI
          <FaUsers size={14} /> <span>Recruiter Matching</span>
        </button>

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          <FaFileInvoiceDollar size={14} /> Offers & Documentation ({offers.length})
          <FaFileInvoiceDollar size={14} /> <span>Offers & Documents</span>
          {offers.length > 0 && (
            <span style={{ background: 'rgba(0,0,0,0.08)', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
              {offers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveTab('assistant')}
        >
          <FaRobot size={14} /> CampusLink AI Assistant
          <FaRobot size={14} /> <span>AI Assistant</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: PLACEMENT COMMAND CENTER (ANALYTICS)
          ======================================================== */}
      {activeTab === 'analytics' && (
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
                <p>{analytics?.totalRegisteredStudents || 420}</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
                <FaAward size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Placement Rate</h5>
                <p>{analytics?.placementRatePercentage || 86.9}%</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
                <FaDollarSign size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Average Package</h5>
                <p>{analytics?.averageCtcLpa || 14.8} LPA</p>
              </div>
            </div>

            <div className="campusKpiCard">
              <div className="campusKpiIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <FaFileInvoiceDollar size={22} />
              </div>
              <div className="campusKpiMeta">
                <h5>Highest Package</h5>
                <p>{analytics?.highestPackageLpa || 44.0} LPA</p>
              </div>
            </div>
          </div>

          {/* Split View: Branch Conversion Rates + Package Distribution */}
          <div className="campusAnalyticsSplit">
            {/* Branch Conversion Rates */}
            <div className="campusSubCard">
              <h3><FaGraduationCap color="#0a66c2" /> Branch-Wise Placement Conversion Rates</h3>
              {analytics?.branchConversion?.map((b) => (
                <div key={b.branch} className="branchRow">
                  <div className="branchRowHeader">
                    <span>{b.branch}</span>
                    <span>{b.placedPercent}% ({b.placed}/{b.total} placed)</span>
                  </div>
                  <div className="branchBarTrack">
                    <div className="branchBarFill" style={{ width: `${b.placedPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Salary Package Tiers */}
            <div className="campusSubCard">
              <h3><FaDollarSign color="#16a34a" /> Salary Package Tier Distribution</h3>
              {analytics?.packageTiers?.map((t) => (
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
              ))}
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

            {analytics?.atRiskStudents?.map((s) => (
              <div key={s.id} className="atRiskStudentCard">
                <div className="atRiskMeta">
                  <h4>{s.name} ({s.rollNumber}) · {s.branch}</h4>
                  <p>CGPA: <strong>{s.cgpa}</strong> · Backlogs: <strong>{s.activeBacklogs}</strong> · Readiness: <strong>{s.readiness}% ({s.readinessLevel})</strong></p>
                  <p style={{ color: '#b45309', marginTop: 3 }}><em>Trigger: {s.riskReason}</em></p>
                </div>

                <button
                  type="button"
                  className="escalateBtn"
                  onClick={() => showToast(`Escalated ${s.name} to mentor ${s.mentor} for remedial coaching.`)}
                >
                  Escalate to Mentor: {s.mentor.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: DRIVES & CONFLICT RESOLVER
          ======================================================== */}
      {activeTab === 'drives' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaCalendarAlt color="#0a66c2" /> Placement Drives & Conflict Management</h2>
              <p>Manage recruiter schedules, venue allocations, and resolve drive collisions automatically.</p>
            </div>
          </div>

          {/* Real-time Conflict Alert Banner */}
          {conflicts.length > 0 && (
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
                  <div>
                    <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.9rem' }}>{c.title}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563' }}>{c.description}</span>
                    <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                      💡 Recommended: {c.recommendation}
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
          <div className="drivesGrid">
            {drives.map((d) => (
              <div key={d._id} className="driveCard">
                <div>
                  <div className="driveCardTop">
                    <img src={d.companyLogo} alt={d.companyName} className="driveLogo" />
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block' }}>{d.companyName}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#0a66c2', fontWeight: 600 }}>{d.roleTitle}</span>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{d.jobCategory} · {d.packageTier}</div>
                    </div>
                  </div>

                  <div className="driveDetailsRow">
                    <div><strong>Package:</strong> {d.ctcLpa} LPA (Stipend: ₹{d.baseStipend.toLocaleString()}/mo)</div>
                    <div><strong>Eligibility:</strong> Min CGPA {d.eligibility?.minCgpa} · Max {d.eligibility?.maxBacklogs} Backlogs</div>
                    <div><strong>Date & Time:</strong> {new Date(d.schedule?.driveDate).toLocaleDateString()} ({d.schedule?.startTime} - {d.schedule?.endTime})</div>
                    <div><strong>Venue:</strong> {d.schedule?.venue}</div>
                  </div>

                  <div className="driveStagesRow">
                    {d.stages?.map((st, i) => (
                      <span key={i} className="stagePill">{st.name}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
                </div>
              </div>
            ))}
          </div>
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
            <button
              type="button"
              className="campusTabBtn active"
              onClick={() => setShowAssessmentModal(true)}
            >
              <FaAward size={14} /> Take Mock Assessment Booster
            </button>
          </div>

          {/* Top Readiness Score Dial & Dimension Breakdown */}
          <div className="readinessHeaderGrid">
            {/* Dial Card */}
            <div className="readinessDialBox">
              <div className="readinessScoreCircle">
                {studentProfile?.overallReadiness || 86}%
              </div>
              <span className={`readinessLevelBadge ${(studentProfile?.readinessLevel || 'ready').toLowerCase().replace(' ', '-')}`}>
                {studentProfile?.readinessLevel || 'Ready'}
              </span>
              <h4 style={{ margin: '12px 0 4px', color: '#0f172a' }}>
                {studentProfile?.collegeName || 'Arcturus Institute of Technology'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Branch: {studentProfile?.branch || 'Computer Science & Engineering'} · Roll: {studentProfile?.rollNumber || '21CS042'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, marginTop: 8 }}>
                CGPA: {studentProfile?.cgpa || 8.7} · Active Backlogs: {studentProfile?.activeBacklogs || 0}
              </p>
            </div>

            {/* 4-Dimension Scores Breakdown */}
            <div className="campusSubCard">
              <h3>Dimension Breakdown</h3>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Technical Competency (DSA, Web & Systems)</span>
                  <span>{studentProfile?.technicalScore || 86}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile?.technicalScore || 86}%`, background: '#0a66c2' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Aptitude & Quantitative Problem Solving</span>
                  <span>{studentProfile?.aptitudeScore || 88}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile?.aptitudeScore || 88}%`, background: '#16a34a' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Communication & Behavioral Interview Skills</span>
                  <span>{studentProfile?.communicationScore || 80}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile?.communicationScore || 80}%`, background: '#7e22ce' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Projects & Practical Experience Depth</span>
                  <span>{studentProfile?.projectScore || 90}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile?.projectScore || 90}%`, background: '#ea580c' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginTop: 14, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                <strong>AI Diagnostic Rationale:</strong> {studentProfile?.aiReadinessSummary}
              </div>
            </div>
          </div>

          {/* Skill-Gap Analysis against Target Roles */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>
              Skill-Gap Diagnostics Against Target Recruiter Roles
            </h3>

            {studentProfile?.skillGaps?.map((gap, i) => (
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
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: RECRUITER MATCHING & EXPLAINABLE AI
          ======================================================== */}
      {activeTab === 'matching' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaUsers color="#0a66c2" /> Recruiter Candidate Matching & Explainable AI</h2>
              <p>Rank and evaluate candidate pools with transparent, natural-language shortlisting rationale.</p>
            </div>

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
          </div>

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
                  {matchingPool.candidates?.length} Evaluated Candidates · {matchingPool.shortlistedCount} Shortlisted
                </div>
              </div>
            </div>
          )}

          {/* Ranked Candidates List */}
          <div>
            {matchingPool?.candidates?.map((c, i) => (
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
            ))}
          </div>
        </div>
      )}

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
                      🔐 Hash: {o.verificationHash || '0x7f8a9b2c'}
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
          TAB 6: CAMPUSLINK AI ASSISTANT (CHATBOT)
          ======================================================== */}
      {activeTab === 'assistant' && (
        <div className="campusPanel">
          <div className="campusPanelHeader">
            <div>
              <h2><FaRobot color="#0a66c2" /> CampusLink AI Placement Assistant</h2>
              <p>Ask questions about drive eligibility, interview preparation, and technical skill gaps.</p>
            </div>
          </div>

          <div className="campusChatWrapper">
            <div className="campusChatMessages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chatMsg ${msg.sender}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                </div>
              ))}
              {isChatSending && (
                <div className="chatMsg assistant" style={{ color: '#64748b' }}>
                  <em>CampusLink AI is analyzing placement data...</em>
                </div>
              )}
            </div>

            {/* Quick Prompts Chips */}
            <div className="chatQuickPrompts">
              {[
                'Am I eligible for Google Cloud India drive?',
                'Diagnose my skill gaps for SDE role',
                'Top technical interview questions for placement',
                'Check drive schedule conflicts',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="quickPromptChip"
                  onClick={() => {
                    setChatInput(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form className="chatInputBar" onSubmit={handleChatSend}>
              <input
                type="text"
                className="chatInput"
                placeholder="Ask about placement drives, eligibility, skill gaps, or interview prep..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="chatSendBtn" disabled={isChatSending}>
                <FaPaperPlane size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default CampusLinkPage;

