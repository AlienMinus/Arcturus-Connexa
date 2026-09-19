import React from 'react';
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaExclamationTriangle, 
  FaTrash, 
  FaCheckCircle, 
  FaTimes, 
  FaUserCheck 
} from 'react-icons/fa';

export const DrivesTab = ({
  isArcturusAdmin,
  canManageDrives = isArcturusAdmin,
  drives,
  conflicts,
  studentProfile,
  setShowDriveModal,
  handleAutoResolveConflict,
  handleDeleteDrive,
  setSelectedDriveForMatch,
  setActiveTab,
}) => {
  return (
    <div className="campusPanel">
      <div className="campusPanelHeader">
        <div>
          <h2>
            <FaCalendarAlt color="#0a66c2" />{' '}
            {canManageDrives ? 'Placement Drives & Conflict Management' : 'Scheduled Placement Drives & Eligibility'}
          </h2>
          <p>
            {canManageDrives
              ? 'Manage recruiter schedules, venue allocations, and resolve drive collisions automatically.'
              : 'Browse active campus recruitment drives, review CGPA / backlog criteria, and test your readiness.'}
          </p>
        </div>
        {canManageDrives && (
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
            {canManageDrives
              ? 'Schedule an upcoming campus recruitment drive to manage venues, dates, and detect real-time conflicts.'
              : 'No corporate placement drives are currently scheduled. Check back soon or visit the Readiness portal to benchmark your skills.'}
          </p>
          {canManageDrives && (
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
                  {canManageDrives && (
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
                {!canManageDrives && studentProfile && (
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
                {canManageDrives ? (
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
  );
};

export default DrivesTab;

