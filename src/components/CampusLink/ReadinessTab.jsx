import React from 'react';
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
  FaLightbulb 
} from 'react-icons/fa';

export const ReadinessTab = ({
  user,
  studentProfile,
  isEditingProfile,
  setIsEditingProfile,
  profileForm,
  setProfileForm,
  handleSaveProfile,
  handleRunGemmaDiagnostics,
  isDiagnosingGemma,
  setShowAssessmentModal,
}) => {
  return (
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

          {/* IMPORTED ARCTURUS CANDIDATE PROFILE PORTFOLIO */}
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

          {/* HUGGING FACE GEMMA AI RISK & RECOMMENDATION SECTION */}
          <div className="gemmaInsightCard">
            <div className="gemmaHeader">
              <div className="gemmaHeaderLeft">
                <span className="gemmaBadge">
                  <FaRobot size={13} /> Hugging Face Gemma AI Engine
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
                title="Refresh AI risk diagnostics using Hugging Face Gemma"
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
                Inference Model: <strong>{studentProfile.gemmaModel || 'google/gemma-3-4b-it'}</strong> · Hosted via Hugging Face API
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
  );
};

export default ReadinessTab;

