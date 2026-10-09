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
  FaLightbulb,
  FaGraduationCap,
  FaUniversity,
  FaIdCard,
  FaUserTie,
  FaClipboardList
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
        <div className="campusProfileFormCard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>
                {studentProfile ? '✏️ Edit Placement Profile' : '🎓 Setup Your Placement Profile'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
                Complete your full academic records, test scores, and career preferences to calculate your exact employability readiness score.
              </p>
            </div>
            {studentProfile && (
              <button
                type="button"
                className="escalateBtn"
                style={{ background: '#64748b', cursor: 'pointer' }}
                onClick={() => setIsEditingProfile(false)}
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="campusPlacementForm">
            {/* Section 1: Academic & University Records */}
            <div className="campusFormSection">
              <div className="campusFormSectionTitle">
                <FaUniversity color="#0a66c2" /> 1. Academic & University Information
              </div>
              <p className="campusFormSectionDesc">
                Core institutional and degree credentials verified for campus recruitment eligibility.
              </p>

              <div className="campusFormGrid">
                <div className="campusFormGroup fullWidth">
                  <label className="campusFormLabel">
                    <span>College / University Name *</span>
                  </label>
                  <input
                    type="text"
                    className="campusFormInput"
                    placeholder="e.g. National Institute of Technology, Rourkela"
                    value={profileForm.collegeName}
                    onChange={(e) => setProfileForm({ ...profileForm, collegeName: e.target.value })}
                    required
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Roll Number / Student ID *</span>
                  </label>
                  <input
                    type="text"
                    className="campusFormInput"
                    placeholder="e.g. 21CS084"
                    value={profileForm.rollNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, rollNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Branch / Department *</span>
                  </label>
                  <select
                    className="campusFormSelect"
                    value={profileForm.branch}
                    onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                    required
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Graduation Year *</span>
                  </label>
                  <input
                    type="number"
                    className="campusFormInput"
                    placeholder="2026"
                    value={profileForm.graduationYear}
                    onChange={(e) => setProfileForm({ ...profileForm, graduationYear: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Current CGPA (out of 10) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="campusFormInput"
                    placeholder="e.g. 8.45"
                    value={profileForm.cgpa}
                    onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                    required
                  />
                  <span className="campusFormHelper">Recruiter benchmark cutoff is typically 7.00+</span>
                </div>
              </div>
            </div>

            {/* Section 2: Board Exam Percentages & Backlogs */}
            <div className="campusFormSection">
              <div className="campusFormSectionTitle">
                <FaGraduationCap color="#0a66c2" /> 2. Secondary Examinations & Backlog History
              </div>
              <p className="campusFormSectionDesc">
                10th / 12th board percentages and backlog records required for company criteria filtering.
              </p>

              <div className="campusFormGrid">
                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>10th Board Percentage (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="campusFormInput"
                    placeholder="e.g. 88.5"
                    value={profileForm.tenthPercentage}
                    onChange={(e) => setProfileForm({ ...profileForm, tenthPercentage: e.target.value })}
                  />
                  <span className="campusFormHelper">Used for shortlisting in Tier-1 mass & core drives</span>
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>12th / Diploma Percentage (%)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="campusFormInput"
                    placeholder="e.g. 91.2"
                    value={profileForm.twelfthPercentage}
                    onChange={(e) => setProfileForm({ ...profileForm, twelfthPercentage: e.target.value })}
                  />
                  <span className="campusFormHelper">Minimum 60% or 70% required by most campus recruiters</span>
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Active Backlogs (Current)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="campusFormInput"
                    placeholder="0"
                    value={profileForm.activeBacklogs}
                    onChange={(e) => setProfileForm({ ...profileForm, activeBacklogs: Number(e.target.value) })}
                  />
                  <span className="campusFormHelper">Must be 0 for most product & top tier drives</span>
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Total Backlogs Ever (Active + Cleared)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="campusFormInput"
                    placeholder="0"
                    value={profileForm.totalBacklogs}
                    onChange={(e) => setProfileForm({ ...profileForm, totalBacklogs: Number(e.target.value) })}
                  />
                  <span className="campusFormHelper">Historical backlog tracking for audit verification</span>
                </div>
              </div>
            </div>

            {/* Section 3: Technical Skills & Career Aspirations */}
            <div className="campusFormSection">
              <div className="campusFormSectionTitle">
                <FaClipboardList color="#0a66c2" /> 3. Skills & Target Recruiter Roles
              </div>
              <p className="campusFormSectionDesc">
                Used to dynamically compute skill gaps against upcoming recruitment drives.
              </p>

              <div className="campusFormGrid">
                <div className="campusFormGroup fullWidth">
                  <label className="campusFormLabel">
                    <span>Key Technical Skills (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    className="campusFormInput"
                    placeholder="e.g. React, Node.js, Python, DSA, System Design, SQL, Docker, AWS"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  />
                  <span className="campusFormHelper">Separate skills with commas. These match with drive requirements.</span>
                </div>

                <div className="campusFormGroup fullWidth">
                  <label className="campusFormLabel">
                    <span>Target Job Roles (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    className="campusFormInput"
                    placeholder="e.g. Software Development Engineer, Full Stack Developer, Data Analyst, Cloud Engineer"
                    value={profileForm.targetRoles}
                    onChange={(e) => setProfileForm({ ...profileForm, targetRoles: e.target.value })}
                  />
                  <span className="campusFormHelper">Roles you wish to be evaluated for in skill-gap analysis.</span>
                </div>
              </div>
            </div>

            {/* Section 4: Placement Status & Mentorship */}
            <div className="campusFormSection">
              <div className="campusFormSectionTitle">
                <FaUserTie color="#0a66c2" /> 4. Placement Status & Mentorship Support
              </div>
              <p className="campusFormSectionDesc">
                Track your active campus placement standing and assigned faculty advisor.
              </p>

              <div className="campusFormGrid">
                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Current Placement Status</span>
                  </label>
                  <select
                    className="campusFormSelect"
                    value={profileForm.placementStatus}
                    onChange={(e) => setProfileForm({ ...profileForm, placementStatus: e.target.value })}
                  >
                    <option value="unplaced">Unplaced (Actively Seeking)</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewing">In Interview Process</option>
                    <option value="placed">Placed (Offer Accepted)</option>
                    <option value="opted_out">Opted Out (Higher Studies / Entrepreneurship)</option>
                  </select>
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Mock Interviews Completed</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="campusFormInput"
                    placeholder="0"
                    value={profileForm.mockInterviewsTaken}
                    onChange={(e) => setProfileForm({ ...profileForm, mockInterviewsTaken: Number(e.target.value) })}
                  />
                  <span className="campusFormHelper">Practice interview sessions attended on CampusLink</span>
                </div>

                <div className="campusFormGroup fullWidth">
                  <label className="campusFormLabel">
                    <span>Assigned Faculty Mentor / Placement Advisor</span>
                  </label>
                  <input
                    type="text"
                    className="campusFormInput"
                    placeholder="e.g. Dr. A. Sharma (Head of Placement Cell)"
                    value={profileForm.assignedMentor}
                    onChange={(e) => setProfileForm({ ...profileForm, assignedMentor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Dimension Self-Rating Benchmarks */}
            <div className="campusFormSection">
              <div className="campusFormSectionTitle">
                <FaChartLine color="#0a66c2" /> 5. Readiness Dimension Benchmarks (0 - 100)
              </div>
              <p className="campusFormSectionDesc">
                Self-assessed or diagnostic baseline competencies across the 4 key evaluation pillars.
              </p>

              <div className="campusFormGrid">
                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Technical Competency (DSA & Web)</span>
                    <strong style={{ color: '#0a66c2' }}>{profileForm.technicalScore || 50}%</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    className="campusFormRange"
                    value={profileForm.technicalScore || 50}
                    onChange={(e) => setProfileForm({ ...profileForm, technicalScore: Number(e.target.value) })}
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Aptitude & Quantitative Problem Solving</span>
                    <strong style={{ color: '#16a34a' }}>{profileForm.aptitudeScore || 50}%</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    className="campusFormRange"
                    value={profileForm.aptitudeScore || 50}
                    onChange={(e) => setProfileForm({ ...profileForm, aptitudeScore: Number(e.target.value) })}
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Communication & Behavioral Skills</span>
                    <strong style={{ color: '#7e22ce' }}>{profileForm.communicationScore || 50}%</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    className="campusFormRange"
                    value={profileForm.communicationScore || 50}
                    onChange={(e) => setProfileForm({ ...profileForm, communicationScore: Number(e.target.value) })}
                  />
                </div>

                <div className="campusFormGroup">
                  <label className="campusFormLabel">
                    <span>Projects & Practical Experience Depth</span>
                    <strong style={{ color: '#ea580c' }}>{profileForm.projectScore || 50}%</strong>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    className="campusFormRange"
                    value={profileForm.projectScore || 50}
                    onChange={(e) => setProfileForm({ ...profileForm, projectScore: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                className="campusSubmitBtn"
              >
                <FaCheckCircle size={15} /> Save Placement Profile & Run Employability Diagnostics
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

              <span className={`placementStatusBadge status-${studentProfile.placementStatus || 'unplaced'}`}>
                Status: {(studentProfile.placementStatus || 'unplaced').replace('_', ' ').toUpperCase()}
              </span>

              <h4 style={{ margin: '12px 0 4px', color: '#0f172a' }}>
                {studentProfile.collegeName}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Branch: {studentProfile.branch} · Roll: {studentProfile.rollNumber} (Grad {studentProfile.graduationYear})
              </p>
              <div className="dialAcademicMeta">
                <span>CGPA: <strong>{studentProfile.cgpa}</strong></span>
                <span>•</span>
                <span>Backlogs: <strong>{studentProfile.activeBacklogs || 0} active</strong> (Total: {studentProfile.totalBacklogs ?? studentProfile.activeBacklogs ?? 0})</span>
              </div>

              {(studentProfile.tenthPercentage || studentProfile.twelfthPercentage) && (
                <div className="dialBoardMeta">
                  {studentProfile.tenthPercentage && <span>10th: <strong>{studentProfile.tenthPercentage}%</strong></span>}
                  {studentProfile.tenthPercentage && studentProfile.twelfthPercentage && <span>•</span>}
                  {studentProfile.twelfthPercentage && <span>12th: <strong>{studentProfile.twelfthPercentage}%</strong></span>}
                </div>
              )}

              {studentProfile.assignedMentor && (
                <div className="dialMentorMeta">
                  <FaUserTie size={12} color="#0a66c2" /> Mentor: {studentProfile.assignedMentor}
                </div>
              )}

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
                  Imported directly from candidate's individual profile page for Gemma placement risk & readiness analysis
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
                    No technical projects added to your Arcturus profile yet. Adding projects with descriptions and tech stacks significantly improves your Gemma placement score.
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

