import React from 'react';
import { 
  FaShieldAlt, 
  FaUserCheck, 
  FaChartLine, 
  FaSyncAlt, 
  FaUsers, 
  FaAward, 
  FaDollarSign, 
  FaFileInvoiceDollar, 
  FaGraduationCap, 
  FaExclamationTriangle, 
  FaRobot 
} from 'react-icons/fa';

export const CommandCenterTab = ({
  isArcturusAdmin,
  analytics,
  loadCampusData,
  setActiveTab,
  showToast,
}) => {
  if (!isArcturusAdmin) {
    return (
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
    );
  }

  return (
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
  );
};

export default CommandCenterTab;

