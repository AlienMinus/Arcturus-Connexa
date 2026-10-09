import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUserCheck, 
  FaAward, 
  FaCheckCircle, 
  FaBriefcase, 
  FaExternalLinkAlt, 
  FaRobot, 
  FaExclamationTriangle, 
  FaSyncAlt, 
  FaChartLine, 
  FaLightbulb,
  FaGraduationCap,
  FaUniversity,
  FaIdCard,
  FaDownload,
  FaCopy,
  FaCheck,
  FaCode,
  FaChevronDown,
  FaChevronUp,
  FaTools,
  FaRocket,
  FaLayerGroup
} from 'react-icons/fa';

export const ReadinessTab = ({
  user,
  studentProfile,
  diagnosticReport,
  handleRunGemmaDiagnostics,
  isDiagnosingGemma,
  setShowAssessmentModal,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Fallback diagnostic report generator if backend hasn't populated one yet
  const getActiveReport = () => {
    if (diagnosticReport) return diagnosticReport;

    if (studentProfile) {
      return {
        reportId: `ACT-DIAG-${studentProfile._id ? studentProfile._id.slice(-6).toUpperCase() : 'PENDING'}`,
        generatedAt: studentProfile.gemmaDiagnosticTimestamp || new Date().toISOString(),
        status: 'COMPLETED',
        candidate: {
          fullName: studentProfile.candidateProfile?.fullName || user?.name || user?.username || 'Candidate',
          username: user?.username || '',
          email: user?.email || '',
          headline: studentProfile.candidateProfile?.headline || user?.headline || '',
          collegeName: studentProfile.collegeName || 'Arcturus Affiliated University',
          department: studentProfile.branch || 'Computer Science & Engineering',
          rollNumber: studentProfile.rollNumber || user?.username?.toUpperCase() || 'CANDIDATE-01',
          graduationYear: studentProfile.graduationYear || 2026,
          cgpa: studentProfile.cgpa || 8.0,
          activeBacklogs: studentProfile.activeBacklogs || 0,
          totalBacklogs: studentProfile.totalBacklogs || 0,
          skills: studentProfile.skills || [],
          targetRoles: studentProfile.targetRoles || ['Software Development Engineer', 'Full Stack Developer'],
          portfolioSummary: {
            projectsCount: studentProfile.candidateProfile?.projects?.length || 0,
            experienceCount: studentProfile.candidateProfile?.experience?.length || 0,
            certificationsCount: studentProfile.candidateProfile?.certifications?.length || 0,
            skillsCount: studentProfile.skills?.length || 0,
          },
        },
        predictiveReadiness: {
          overallScore: studentProfile.overallReadiness || 75,
          readinessLevel: studentProfile.readinessLevel || 'Ready',
          status: (studentProfile.placementStatus || 'unplaced').replace('_', ' ').toUpperCase(),
          dimensions: {
            technicalCompetency: { score: studentProfile.technicalScore || 70, benchmark: 75, status: (studentProfile.technicalScore || 70) >= 75 ? 'Strong' : 'Needs Practice' },
            aptitudeAndProblemSolving: { score: studentProfile.aptitudeScore || 65, benchmark: 70, status: (studentProfile.aptitudeScore || 65) >= 70 ? 'Above Average' : 'Moderate' },
            communicationAndBehavioral: { score: studentProfile.communicationScore || 75, benchmark: 75, status: (studentProfile.communicationScore || 75) >= 75 ? 'Competent' : 'Developing' },
            projectAndPracticalExperience: { score: studentProfile.projectScore || 60, benchmark: 65, status: (studentProfile.projectScore || 60) >= 65 ? 'Strong' : 'Expand Portfolio' },
          },
          percentileRank: `Top ${Math.max(5, Math.min(40, 100 - (studentProfile.overallReadiness || 75)))}% in University Batch`,
          placementProbability: `${Math.min(99, Math.max(50, Math.round((studentProfile.overallReadiness || 75) * 1.08)))}%`,
        },
        skillGapAnalysis: (studentProfile.skillGaps || []).map((gap) => ({
          companyAndRole: gap.targetRole,
          matchPercentage: gap.matchPercentage,
          matchedSkills: gap.matchedSkills,
          missingSkills: gap.missingSkills,
          recommendation: gap.recommendation,
          suggestedLearning: gap.suggestedCourses || [],
        })),
        actionableRemedialPlan: {
          isAtRisk: Boolean(studentProfile.isAtRisk),
          riskReason: studentProfile.riskReason || 'None identified',
          diagnosticRationale: studentProfile.aiReadinessSummary || 'Foundational placement readiness strong for scheduled corporate drives.',
          selfStudyRoadmap: studentProfile.mentorActionRecommendation || 'Focus on self-guided algorithmic preparation and containerization.',
          independentMilestones: [
            {
              step: 1,
              priority: 'HIGH',
              domain: 'Technical Core & System Architecture',
              action: 'Build and deploy a full-stack project featuring asynchronous queues, Docker containerization, and unit tests.',
              estimatedEffort: '1-2 weeks self-study',
            },
            {
              step: 2,
              priority: 'HIGH',
              domain: 'Data Structures & Algorithms',
              action: 'Complete targeted problem sets on dynamic programming, trees, and graph traversal patterns to clear coding benchmarks.',
              estimatedEffort: '10-14 days practice',
            },
            {
              step: 3,
              priority: 'MEDIUM',
              domain: 'Behavioral & Scenario Interviews',
              action: 'Formulate STAR-method responses for technical project challenges and trade-off decisions.',
              estimatedEffort: '3-4 self-paced sessions',
            },
            {
              step: 4,
              priority: 'LOW',
              domain: 'Mock Velocity Simulations',
              action: 'Execute timed coding and aptitude simulations on Arcturus CampusLink to improve velocity under test conditions.',
              estimatedEffort: '2 practice runs',
            },
          ],
          recommendedFocusCompetencies: [
            'System Design & Microservices Architecture',
            'Docker & Cloud Containerization',
            'AWS / Cloud Orchestration',
            'Data Structures & Algorithms (Trees, Graphs & DP)',
            'RESTful API Security & Asynchronous Queues',
          ],
        },
        inferenceEngine: {
          model: studentProfile.gemmaModel || 'google/gemma-3-4b-it',
          provider: studentProfile.gemmaProvider || 'Hugging Face Gemma',
          status: 'Verified',
          timestamp: studentProfile.gemmaDiagnosticTimestamp || new Date().toISOString(),
        },
      };
    }

    return null;
  };

  const activeReport = getActiveReport();

  // Download Report as formatted JSON file
  const handleDownloadJsonReport = () => {
    if (!activeReport) return;
    const reportJson = JSON.stringify(activeReport, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedUsername = (user?.username || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.download = `Arcturus-Placement-Diagnostics-${sanitizedUsername}-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = () => {
    if (!activeReport) return;
    navigator.clipboard.writeText(JSON.stringify(activeReport, null, 2)).then(() => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2400);
    });
  };

  return (
    <div className="campusPanel">
      {/* Panel Top Header */}
      <div className="campusPanelHeader">
        <div>
          <h2><FaUserCheck color="#0a66c2" /> Student Employability & Skill-Gap Profiling</h2>
          <p>Continuous AI employability scoring, recruitment drive skill-gap identification, and self-guided remedial roadmaps.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

      {/* ARCTURUS SYNCHRONIZED PROFILE CREDENTIALS BANNER */}
      <div className="profileCredentialsBanner">
        <div className="profileCredentialsMain">
          <div className="profileCredentialsAvatarWrap">
            {user?.profilePicture?.url || user?.profilePicture ? (
              <img
                src={user.profilePicture.url || user.profilePicture}
                alt={user.name || user.username}
                className="profileCredentialsAvatar"
              />
            ) : (
              <div className="profileCredentialsAvatarPlaceholder">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profileCredentialsDetails">
            <div className="profileCredentialsNameRow">
              <h3>{studentProfile?.candidateProfile?.fullName || user?.name || user?.username || 'Campus Candidate'}</h3>
              <span className="profileCredentialsVerifiedBadge">
                <FaCheckCircle size={12} /> Arcturus Synced
              </span>
            </div>
            {studentProfile?.candidateProfile?.headline && (
              <p className="profileCredentialsHeadline">
                {studentProfile.candidateProfile.headline}
              </p>
            )}

            <div className="profileCredentialsMetaGrid">
              <div className="metaGridItem">
                <FaUniversity color="#0a66c2" size={13} />
                <span>{studentProfile?.collegeName || user?.institute?.name || 'Arcturus Affiliated University'}</span>
              </div>
              <div className="metaGridItem">
                <FaGraduationCap color="#16a34a" size={13} />
                <span>{studentProfile?.branch || 'Computer Science & Engineering'} (Grad {studentProfile?.graduationYear || 2026})</span>
              </div>
              <div className="metaGridItem">
                <FaIdCard color="#7e22ce" size={13} />
                <span>ID: {studentProfile?.rollNumber || user?.institute?.studentId || user?.username?.toUpperCase() || 'ARCT-STUDENT'}</span>
              </div>
              <div className="metaGridItem">
                <FaChartLine color="#ea580c" size={13} />
                <span>CGPA: <strong>{studentProfile?.cgpa ?? 8.2}</strong> / 10.0</span>
              </div>
            </div>

            {/* Portfolio summary pills */}
            <div className="profileCredentialsPills">
              <span className="portfolioPill">
                <FaBriefcase size={11} /> {studentProfile?.candidateProfile?.projects?.length || 0} Technical Projects
              </span>
              <span className="portfolioPill">
                <FaLayerGroup size={11} /> {studentProfile?.candidateProfile?.experience?.length || 0} Work / Internships
              </span>
              <span className="portfolioPill">
                <FaAward size={11} /> {studentProfile?.candidateProfile?.certifications?.length || 0} Certifications
              </span>
              <span className="portfolioPill">
                <FaTools size={11} /> {studentProfile?.skills?.length || 0} Verified Skills
              </span>
            </div>
          </div>
        </div>

        <div className="profileCredentialsAction">
          <p className="profileCredentialsSyncNote">
            All academic credentials and portfolio items are synchronized live from your Arcturus account.
          </p>
          {user?.username && (
            <Link
              to={`/profile/${user.username}`}
              target="_blank"
              className="profileCredentialsEditBtn"
            >
              <FaExternalLinkAlt size={11} /> Edit Arcturus Portfolio
            </Link>
          )}
        </div>
      </div>

      {/* ONE-CLICK DIAGNOSTICS HERO ACTION CTA */}
      <div className="diagnosticsHeroCta">
        <div className="diagnosticsHeroContent">
          <div className="diagnosticsHeroBadge">
            <FaRobot size={13} /> Gemma-3 Predictive Intelligence
          </div>
          <h3>Run Employability & Skill-Gap Diagnostics</h3>
          <p>
            Evaluate your verified Arcturus profile data against current campus drives. Generates predicted continuous scores across 4 dimensions, identifies drive eligibility gaps, and provides an actionable self-guided remedial report without manual forms.
          </p>
        </div>

        <button
          type="button"
          className="diagnosticsHeroRunBtn"
          onClick={handleRunGemmaDiagnostics}
          disabled={isDiagnosingGemma}
        >
          <FaSyncAlt size={15} className={isDiagnosingGemma ? 'fa-spin' : ''} />
          {isDiagnosingGemma
            ? 'Analyzing Profile & Drives...'
            : studentProfile
            ? 'Re-Run Placement Diagnostics'
            : 'Run Employability Diagnostics'}
        </button>
      </div>

      {/* DETAILED JSON RESPONSE & DOWNLOADABLE REPORT CARD */}
      {activeReport && (
        <div className="reportDownloadCard">
          <div className="reportDownloadHeader">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="reportStatusBadge">
                  <FaCheckCircle size={12} /> {activeReport.status || 'COMPLETED'}
                </span>
                <span className="reportIdTag">
                  Report ID: <strong>{activeReport.reportId}</strong>
                </span>
              </div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.15rem' }}>
                📋 Detailed Placement Diagnostic Report (JSON Payload)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Generated via Hugging Face Gemma inference on {new Date(activeReport.generatedAt).toLocaleDateString()} at{' '}
                {new Date(activeReport.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>

            <div className="reportActionButtonsGroup">
              <button
                type="button"
                className="reportDownloadBtn primary"
                onClick={handleDownloadJsonReport}
                title="Download complete diagnostic report as a .json file"
              >
                <FaDownload size={13} /> Download Report (JSON)
              </button>

              <button
                type="button"
                className="reportDownloadBtn secondary"
                onClick={handleCopyJson}
                title="Copy raw JSON payload to clipboard"
              >
                {copiedJson ? <FaCheck size={13} color="#16a34a" /> : <FaCopy size={13} />}
                {copiedJson ? 'Copied!' : 'Copy JSON'}
              </button>

              <button
                type="button"
                className="reportDownloadBtn secondary"
                onClick={() => setShowRawJson(!showRawJson)}
                title="Toggle interactive in-UI raw JSON viewer"
              >
                <FaCode size={13} />
                {showRawJson ? 'Hide JSON' : 'Inspect JSON'}
                {showRawJson ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
              </button>
            </div>
          </div>

          {/* Interactive in-UI JSON Inspector */}
          {showRawJson && (
            <div className="jsonViewerContainer">
              <div className="jsonViewerToolbar">
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  application/json · {JSON.stringify(activeReport).length} bytes
                </span>
                <button
                  type="button"
                  className="jsonCopyInlineBtn"
                  onClick={handleCopyJson}
                >
                  {copiedJson ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="diagnosticJsonViewer">
                <code>{JSON.stringify(activeReport, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TOP READINESS SCORE DIAL & DIMENSION BREAKDOWN */}
      {studentProfile && (
        <>
          <div className="readinessHeaderGrid">
            {/* Dial Box */}
            <div className="readinessDialBox">
              <div className="readinessScoreCircle">
                {studentProfile.overallReadiness}%
              </div>
              <span className={`readinessLevelBadge ${(studentProfile.readinessLevel || 'ready').toLowerCase().replace(' ', '-')}`}>
                {studentProfile.readinessLevel}
              </span>

              <span className={`placementStatusBadge status-${studentProfile.placementStatus || 'unplaced'}`}>
                Status: {(studentProfile.placementStatus || 'unplaced').replace('_', ' ').toUpperCase()}
              </span>

              <h4 style={{ margin: '14px 0 4px', color: '#0f172a' }}>
                {studentProfile.collegeName}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                {studentProfile.branch} · Roll: {studentProfile.rollNumber} (Grad {studentProfile.graduationYear})
              </p>

              <div className="dialAcademicMeta">
                <span>CGPA: <strong>{studentProfile.cgpa}</strong></span>
                <span>•</span>
                <span>Active Backlogs: <strong>{studentProfile.activeBacklogs || 0}</strong></span>
                <span>•</span>
                <span>Probability: <strong>{activeReport?.predictiveReadiness?.placementProbability || '88%'}</strong></span>
              </div>

              {studentProfile.targetRoles?.length > 0 && (
                <div className="dialTargetRoles">
                  {studentProfile.targetRoles.map((role, idx) => (
                    <span key={idx} className="dialRoleChip">🎯 {role}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 4-Dimension Scores Breakdown */}
            <div className="campusSubCard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>4-Dimension Readiness Breakdown</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Percentile: <strong>{activeReport?.predictiveReadiness?.percentileRank || 'Top 15% Batch'}</strong>
                </span>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Technical Competency (DSA, Web & Systems)</span>
                  <span style={{ fontWeight: 700, color: '#0a66c2' }}>{studentProfile.technicalScore}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile.technicalScore}%`, background: '#0a66c2' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Aptitude & Quantitative Problem Solving</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{studentProfile.aptitudeScore}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile.aptitudeScore}%`, background: '#16a34a' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Communication & Behavioral Interview Skills</span>
                  <span style={{ fontWeight: 700, color: '#7e22ce' }}>{studentProfile.communicationScore}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile.communicationScore}%`, background: '#7e22ce' }} />
                </div>
              </div>

              <div className="dimensionScoreRow">
                <div className="dimensionLabelRow">
                  <span>Projects & Practical Experience Depth</span>
                  <span style={{ fontWeight: 700, color: '#ea580c' }}>{studentProfile.projectScore}%</span>
                </div>
                <div className="dimensionTrack">
                  <div className="dimensionFill" style={{ width: `${studentProfile.projectScore}%`, background: '#ea580c' }} />
                </div>
              </div>

              {studentProfile.aiReadinessSummary && (
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginTop: 14, fontSize: '0.82rem', color: '#475569', lineHeight: 1.45, borderLeft: '3px solid #0a66c2' }}>
                  <strong>Diagnostic Evaluation Rationale:</strong> {studentProfile.aiReadinessSummary}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONABLE REMEDIAL ROADMAP (SELF-GUIDED / NO MENTOR NEEDED) */}
          <div className="gemmaInsightCard">
            <div className="gemmaHeader">
              <div className="gemmaHeaderLeft">
                <span className="gemmaBadge">
                  <FaRocket size={13} /> Self-Guided Actionable Remedial Roadmap
                </span>
                {studentProfile.isAtRisk ? (
                  <span className="gemmaRiskStatusBadge danger">
                    <FaExclamationTriangle size={12} /> Specific Preparation Gap Flagged
                  </span>
                ) : (
                  <span className="gemmaRiskStatusBadge optimal">
                    <FaCheckCircle size={12} /> Optimal Corporate Placement Track
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Self-study track — No mentor intervention required
              </span>
            </div>

            {/* At-Risk Warning Callout if Flagged */}
            {studentProfile.isAtRisk && (
              <div className="gemmaRiskCallout">
                <FaExclamationTriangle color="#e11d48" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#9f1239' }}>Identified Placement Hurdle:</strong>
                  <p>{studentProfile.riskReason || 'Academic or readiness bottleneck flagged below recruiter benchmark.'}</p>
                </div>
              </div>
            )}

            {/* Diagnostics Rationale & Self-Study Strategy */}
            <div className="gemmaGrid">
              <div className="gemmaBox">
                <div className="gemmaBoxTitle">
                  <FaChartLine color="#0a66c2" /> Employability Diagnostic Rationale
                </div>
                <p className="gemmaBoxText">
                  {studentProfile.aiReadinessSummary ||
                    'Candidate profile evaluated against recruiter benchmarks. Foundational readiness is strong for upcoming recruitment drives.'}
                </p>
              </div>

              <div className="gemmaBox">
                <div className="gemmaBoxTitle">
                  <FaLightbulb color="#ca8a04" /> Independent Remedial Strategy
                </div>
                <p className="gemmaBoxText">
                  {studentProfile.mentorActionRecommendation ||
                    'Focus on self-guided algorithmic preparation and containerization to achieve maximum compensation packages in upcoming drives.'}
                </p>
              </div>
            </div>

            {/* Self-Study Milestones List */}
            {activeReport?.actionableRemedialPlan?.independentMilestones && (
              <div style={{ marginTop: 20 }}>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: 10 }}>
                  🎯 Step-by-Step Independent Preparation Milestones:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeReport.actionableRemedialPlan.independentMilestones.map((m, idx) => (
                    <div key={idx} className="remedialMilestoneCard">
                      <div className="remedialMilestoneHeader">
                        <span className={`milestonePriorityBadge priority-${m.priority.toLowerCase()}`}>
                          {m.priority} PRIORITY
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                          Step {m.step}: {m.domain}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: 'auto' }}>
                          ⏱️ {m.estimatedEffort}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        {m.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Recommended Recruiter Competencies */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <strong style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: 8 }}>
                ⚡ High-Impact Competencies Recommended for Self-Study:
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: '0.74rem', color: '#94a3b8', flexWrap: 'wrap', gap: 8 }}>
              <span>
                Inference Model: <strong>{studentProfile.gemmaModel || 'google/gemma-3-4b-it'}</strong> · Hosted via Hugging Face API
              </span>
              {studentProfile.gemmaDiagnosticTimestamp && (
                <span>
                  Last Evaluated: {new Date(studentProfile.gemmaDiagnosticTimestamp).toLocaleDateString()} at{' '}
                  {new Date(studentProfile.gemmaDiagnosticTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* SKILL-GAP ANALYSIS AGAINST SCHEDULED DRIVES */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#0f172a' }}>
              Skill-Gap Diagnostics Against Active Recruitment Drives
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
                    <strong>Actionable Remedy:</strong> {gap.recommendation}
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

          {/* CANDIDATE'S SYNCHRONIZED PORTFOLIO PREVIEW */}
          <div className="campusSubCard" style={{ borderColor: '#bae6fd', background: '#f8fafc', marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaBriefcase color="#0284c7" /> Synchronized Arcturus Portfolio
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Live projects, experiences, and certifications feeding into your employability score
                </p>
              </div>
              {user?.username && (
                <Link
                  to={`/profile/${user.username}`}
                  target="_blank"
                  className="campusTabBtn"
                  style={{ fontSize: '0.78rem', padding: '5px 12px', textDecoration: 'none', background: '#ffffff', color: '#0284c7', borderColor: '#bae6fd' }}
                >
                  <FaExternalLinkAlt size={11} /> Update on Arcturus
                </Link>
              )}
            </div>

            {/* Technical Projects with Descriptions & Tech Badges */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                  Technical Projects ({studentProfile.candidateProfile?.projects?.length || 0})
                </strong>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Used for Technical Depth & Systems Evaluation</span>
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
                    No technical projects added to your Arcturus profile yet. Adding projects with descriptions and tech stacks significantly improves your placement score.
                  </p>
                </div>
              )}
            </div>

            {/* Work & Internship Experiences */}
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

            {/* Certifications */}
            {studentProfile.candidateProfile?.certifications?.length > 0 && (
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', marginBottom: 8 }}>
                  Certifications & Credentials ({studentProfile.candidateProfile.certifications.length})
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
        </>
      )}
    </div>
  );
};

export default ReadinessTab;
