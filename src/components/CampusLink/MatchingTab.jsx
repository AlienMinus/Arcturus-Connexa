import React from 'react';
import { FaShieldAlt, FaUserCheck, FaUsers } from 'react-icons/fa';

export const MatchingTab = ({
  isArcturusAdmin,
  drives,
  selectedDriveForMatch,
  setSelectedDriveForMatch,
  handleAutoShortlist,
  matchingPool,
  setActiveTab,
}) => {
  if (!isArcturusAdmin) {
    return (
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
    );
  }

  return (
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
  );
};

export default MatchingTab;

