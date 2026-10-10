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
  FaRobot,
  FaUniversity,
  FaLock,
  FaArrowLeft,
  FaSearch,
  FaBuilding
} from 'react-icons/fa';

export const CommandCenterTab = ({
  isArcturusAdmin,
  isPlacementOfficer,
  officerInstitute,
  analyticsPayload,
  analytics,
  selectedAdminInstituteId,
  setSelectedAdminInstituteId,
  loadCampusData,
  setActiveTab,
  showToast,
}) => {
  // Access Restriction for regular students
  if (!isArcturusAdmin && !isPlacementOfficer) {
    return (
      <div className="campusPanel">
        <div
          className="campusSubCard"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderColor: '#fde68a',
            background: '#fffbeb',
            margin: '20px auto',
            maxWidth: 680,
          }}
        >
          <FaLock size={52} color="#d97706" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#92400e', margin: '0 0 10px', fontSize: '1.4rem' }}>
            Institutional Command Center Restricted
          </h2>
          <p style={{ color: '#78350f', margin: '0 auto 24px', fontSize: '0.94rem', lineHeight: 1.6 }}>
            The Institutional Command Center, multi-tenant administrative metrics, and at-risk candidate escalations
            are accessible exclusively to verified <strong>Institute Placement Officers</strong> and{' '}
            <strong>Arcturus Platform Administrators</strong>.
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

  const isPureAdmin = isArcturusAdmin && !isPlacementOfficer;

  // Platform Operations Hub for Pure Administrators (No individual student placement data)
  if (isPureAdmin) {
    const platformAnalytics = analyticsPayload?.platformAnalytics || {};
    const platformDirectory = analyticsPayload?.platformDirectory || [];

    return (
      <div className="campusPanel">
        {/* Header */}
        <div className="campusPanelHeader">
          <div>
            <h2>
              <FaShieldAlt color="#0a66c2" /> Platform Operations & Infrastructure Hub
            </h2>
            <p>
              Arcturus Enterprise Platform Administration. System telemetry, verified organization directory, and infrastructure operations.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="isolationSecurityBadge" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
              <FaShieldAlt size={11} /> Platform Admin Mode
            </span>
            <button type="button" className="campusTabBtn active" onClick={() => loadCampusData()}>
              <FaSyncAlt size={12} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Isolation Policy Banner */}
        <div
          className="campusSubCard"
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FaLock color="#0a66c2" size={16} />
            <strong style={{ color: '#0f172a', fontSize: '0.94rem' }}>
              Institutional Student Placement Data Isolated
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            Under Arcturus Institutional Privacy Architecture, individual candidate profiles, academic CGPAs, at-risk rosters, and recruitment drive scheduling are strictly isolated to verified Institutional Placement Officers. Platform Administrators view platform-wide telemetry and partner organization status.
          </p>
        </div>

        {/* Platform Telemetry KPI Grid */}
        <div className="campusKpiGrid">
          <div className="campusKpiCard">
            <div className="campusKpiIconBox" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <FaUsers size={22} />
            </div>
            <div className="campusKpiMeta">
              <h5>Total Platform Users</h5>
              <p>{platformAnalytics.totalPlatformUsers || analytics?.totalRegisteredStudents || 0}</p>
            </div>
          </div>

          <div className="campusKpiCard">
            <div className="campusKpiIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
              <FaAward size={22} />
            </div>
            <div className="campusKpiMeta">
              <h5>Verified Compliance</h5>
              <p>{platformAnalytics.verificationRate != null ? `${platformAnalytics.verificationRate}%` : '100%'}</p>
            </div>
          </div>

          <div className="campusKpiCard">
            <div className="campusKpiIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
              <FaBuilding size={22} />
            </div>
            <div className="campusKpiMeta">
              <h5>Partner Organizations</h5>
              <p>{platformAnalytics.totalOrganizations || platformDirectory.length || 0}</p>
            </div>
          </div>

          <div className="campusKpiCard">
            <div className="campusKpiIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
              <FaChartLine size={22} />
            </div>
            <div className="campusKpiMeta">
              <h5>System Health & Uptime</h5>
              <p>{platformAnalytics.apiUptime || '99.98%'}</p>
            </div>
          </div>
        </div>

        {/* Verified Organizations Directory Table */}
        <div className="institutesTableCard">
          <div className="institutesTableCardHeader">
            <h3>
              <FaUniversity color="#0a66c2" /> Verified Partner Organizations & Institutions ({platformDirectory.length})
            </h3>
            <small style={{ color: '#64748b' }}>Platform Network Directory</small>
          </div>

          <div className="institutesTableWrapper">
            <table className="institutesTable">
              <thead>
                <tr>
                  <th>Organization / Institution</th>
                  <th>Industry / Domain</th>
                  <th>Location</th>
                  <th>Network Status</th>
                </tr>
              </thead>
              <tbody>
                {platformDirectory.length > 0 ? (
                  platformDirectory.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div className="instituteMetaCell">
                          <img src={org.logo} alt={org.name} className="instituteMetaLogo" />
                          <div>
                            <p className="instituteMetaName">{org.name}</p>
                            <p className="instituteMetaLocation">@{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td><strong>{org.industry || 'Higher Education'}</strong></td>
                      <td>📍 {org.location || 'Network Member'}</td>
                      <td>
                        <span className="ratePill ratePillHigh">
                          ✅ {org.status || 'Verified'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
                      No partner organizations currently registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const inspectingInstitute = analyticsPayload?.inspectingInstitute;
  const isInspectingSingleInstitute = Boolean(selectedAdminInstituteId && inspectingInstitute);
  const instituteName =
    inspectingInstitute?.name ||
    officerInstitute?.name ||
    analyticsPayload?.institute?.name ||
    'Authorized Institute';

  const handleAdminInstituteSelect = (e) => {
    const val = e.target.value;
    setSelectedAdminInstituteId(val);
    loadCampusData(val);
  };

  const handleClearAdminFilter = () => {
    setSelectedAdminInstituteId('');
    loadCampusData('');
  };

  const handleInspectInstitute = (instId) => {
    setSelectedAdminInstituteId(instId);
    loadCampusData(instId);
  };

  return (
    <div className="campusPanel">
      {/* =========================================================================
          TOP HEADER
          ========================================================================= */}
      <div className="campusPanelHeader">
        <div>
          <h2>
            {isArcturusAdmin ? (
              <>
                <FaShieldAlt color="#0a66c2" /> Global CampusLink Administration
              </>
            ) : (
              <>
                <FaUniversity color="#0a66c2" /> {instituteName} Command Center
              </>
            )}
          </h2>
          <p>
            {isArcturusAdmin
              ? 'Arcturus Enterprise Placement Network. Oversee multi-campus hiring metrics, partner universities, and drive schedules.'
              : `Real-time placement intelligence and candidate tracking for ${instituteName}. Other institutes' data is strictly isolated.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isPlacementOfficer && (
            <span className="isolationSecurityBadge" title="Multi-tenant isolation active">
              <FaLock size={11} /> Isolated Institute Workspace
            </span>
          )}
          <button type="button" className="campusTabBtn active" onClick={() => loadCampusData(selectedAdminInstituteId)}>
            <FaSyncAlt size={12} /> Refresh Data
          </button>
        </div>
      </div>

      {/* =========================================================================
          ADMIN TOOLBAR: MULTI-INSTITUTE SELECTOR
          ========================================================================= */}
      {isArcturusAdmin && (
        <div className="adminOperationsToolbar">
          <div className="adminInstituteSelectorGroup">
            <label htmlFor="adminInstituteFilter">
              <FaUniversity size={14} color="#0a66c2" /> Filter by Institution:
            </label>
            <select
              id="adminInstituteFilter"
              className="adminInstituteSelect"
              value={selectedAdminInstituteId}
              onChange={handleAdminInstituteSelect}
            >
              <option value="">🌐 All Partner Institutes (Global Network Overview)</option>
              {analyticsPayload?.institutesList?.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  🏛️ {inst.name}
                </option>
              ))}
            </select>
          </div>

          {isInspectingSingleInstitute && (
            <button type="button" className="adminResetBtn" onClick={handleClearAdminFilter}>
              <FaArrowLeft size={11} /> Return to Global Overview
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          ADMIN INSPECTION ACTIVE BANNER
          ========================================================================= */}
      {isArcturusAdmin && isInspectingSingleInstitute && (
        <div className="adminInspectBanner">
          <div className="adminInspectBannerInfo">
            {inspectingInstitute.logo && (
              <img
                src={inspectingInstitute.logo}
                alt={inspectingInstitute.name}
                className="adminInspectBannerLogo"
              />
            )}
            <div>
              <h4 className="adminInspectBannerTitle">
                Currently Inspecting: {inspectingInstitute.name}
              </h4>
              <p className="adminInspectBannerSubtitle">
                📍 {inspectingInstitute.location || 'Campus Network'} · Institutional data isolated to this college
              </p>
            </div>
          </div>
          <button type="button" className="adminResetBtn" onClick={handleClearAdminFilter}>
            <FaArrowLeft size={11} /> Exit Inspection Mode
          </button>
        </div>
      )}

      {/* =========================================================================
          KEY METRIC KPI CARDS
          ========================================================================= */}
      <div className="campusKpiGrid">
        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            {isArcturusAdmin && !isInspectingSingleInstitute ? <FaBuilding size={22} /> : <FaUsers size={22} />}
          </div>
          <div className="campusKpiMeta">
            <h5>
              {isArcturusAdmin && !isInspectingSingleInstitute ? 'Partner Institutes' : 'Enrolled Candidates'}
            </h5>
            <p>
              {isArcturusAdmin && !isInspectingSingleInstitute
                ? analyticsPayload?.platformOverview?.totalInstitutes ||
                  analyticsPayload?.institutesSummary?.length ||
                  analyticsPayload?.institutesList?.length ||
                  0
                : analytics?.totalRegisteredStudents || 0}
            </p>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
            <FaAward size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>
              {isArcturusAdmin && !isInspectingSingleInstitute ? 'Global Placement Rate' : 'Placement Rate'}
            </h5>
            <p>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</p>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FaDollarSign size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Average CTC Package</h5>
            <p>{analytics?.averageCtcLpa ? `${analytics.averageCtcLpa} LPA` : '—'}</p>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <FaFileInvoiceDollar size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Highest CTC Package</h5>
            <p>{analytics?.highestPackageLpa ? `${analytics.highestPackageLpa} LPA` : '—'}</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ADMIN ONLY: MULTI-INSTITUTE COMPARATIVE LEADERBOARD
          (Rendered when in Global Overview mode)
          ========================================================================= */}
      {isArcturusAdmin && !isInspectingSingleInstitute && analyticsPayload?.institutesSummary?.length > 0 && (
        <div className="institutesTableCard">
          <div className="institutesTableCardHeader">
            <h3>
              <FaUniversity color="#0a66c2" /> Participating Institutions Directory & Performance Matrix (
              {analyticsPayload.institutesSummary.length})
            </h3>
            <small style={{ color: '#64748b' }}>Cross-Institutional Network Comparison</small>
          </div>

          <div className="institutesTableWrapper">
            <table className="institutesTable">
              <thead>
                <tr>
                  <th>Institute / University</th>
                  <th>Candidates</th>
                  <th>Placed (%)</th>
                  <th>Active Drives</th>
                  <th>Average CTC</th>
                  <th>Highest CTC</th>
                  <th>At-Risk Flagged</th>
                  <th>Placement Officer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {analyticsPayload.institutesSummary.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <div className="instituteMetaCell">
                        <img src={inst.logo} alt={inst.name} className="instituteMetaLogo" />
                        <div>
                          <p className="instituteMetaName">{inst.name}</p>
                          <p className="instituteMetaLocation">📍 {inst.location}</p>
                        </div>
                      </div>
                    </td>
                    <td><strong>{inst.studentsCount}</strong></td>
                    <td>
                      <span
                        className={`ratePill ${
                          inst.placementRatePercentage >= 75
                            ? 'ratePillHigh'
                            : inst.placementRatePercentage >= 40
                            ? 'ratePillMed'
                            : 'ratePillLow'
                        }`}
                      >
                        {inst.placementRatePercentage}% ({inst.placedCount} placed)
                      </span>
                    </td>
                    <td>{inst.activeDrivesCount}</td>
                    <td>{inst.averageCtcLpa ? `${inst.averageCtcLpa} LPA` : '—'}</td>
                    <td><strong>{inst.highestPackageLpa ? `${inst.highestPackageLpa} LPA` : '—'}</strong></td>
                    <td>
                      {inst.atRiskCount > 0 ? (
                        <span style={{ color: '#ea580c', fontWeight: 700 }}>
                          ⚠️ {inst.atRiskCount} flagged
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>✅ 0 flagged</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {inst.officers?.join(', ') || 'Not Assigned'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inspectInstituteBtn"
                        onClick={() => handleInspectInstitute(inst.id)}
                        title={`Inspect ${inst.name} isolated command center`}
                      >
                        <FaSearch size={11} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SPLIT VIEW: BRANCH CONVERSIONS + PACKAGE TIERS
          ========================================================================= */}
      <div className="campusAnalyticsSplit">
        {/* Branch Conversion Rates */}
        <div className="campusSubCard">
          <h3>
            <FaGraduationCap color="#0a66c2" />{' '}
            {isArcturusAdmin && !isInspectingSingleInstitute
              ? 'Platform Network Branch Conversions'
              : `${instituteName} Branch Conversions`}
          </h3>
          {analytics?.branchConversion?.length > 0 ? (
            analytics.branchConversion.map((b) => (
              <div key={b.branch} className="branchRow">
                <div className="branchRowHeader">
                  <span>{b.branch}</span>
                  <span>
                    {b.placedPercent}% ({b.placed}/{b.total} placed)
                  </span>
                </div>
                <div className="branchBarTrack">
                  <div className="branchBarFill" style={{ width: `${b.placedPercent}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No student placement data recorded for this scope.</p>
            </div>
          )}
        </div>

        {/* Salary Package Tiers */}
        <div className="campusSubCard">
          <h3>
            <FaDollarSign color="#16a34a" /> Salary Package Tier Distribution
          </h3>
          {analytics?.packageTiers?.length > 0 ? (
            analytics.packageTiers.map((t) => (
              <div key={t.tier} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 4,
                  }}
                >
                  <span>{t.tier}</span>
                  <span>
                    {t.count} offers ({t.percentage}%)
                  </span>
                </div>
                <div className="branchBarTrack">
                  <div
                    className="branchBarFill"
                    style={{
                      width: `${t.percentage}%`,
                      background: t.tier.includes('Super')
                        ? '#7e22ce'
                        : t.tier.includes('Dream')
                        ? '#0284c7'
                        : '#64748b',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No offers recorded for this scope yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          PREDICTIVE AT-RISK STUDENTS PANEL
          ========================================================================= */}
      <div className="campusSubCard" style={{ borderColor: '#fed7aa' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h3 style={{ color: '#9a3412', margin: 0 }}>
            <FaExclamationTriangle color="#ea580c" /> Predictive At-Risk Candidates (
            {analytics?.atRiskStudents?.length || 0}){' '}
            {isPlacementOfficer && `• ${instituteName}`}
          </h3>
          <small style={{ color: '#c2410c' }}>
            {isPlacementOfficer
              ? `Strictly isolated to ${instituteName} candidates`
              : 'Gemma AI Academic Cutoff & Backlog Diagnostic'}
          </small>
        </div>

        {analytics?.atRiskStudents?.length > 0 ? (
          analytics.atRiskStudents.map((s) => (
            <div key={s.id} className="atRiskStudentCard">
              <div className="atRiskMeta">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0 }}>
                    {s.name} ({s.rollNumber}) · {s.branch}
                  </h4>
                  {isArcturusAdmin && s.collegeName && (
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      🏛️ {s.collegeName}
                    </span>
                  )}
                  <span className="gemmaBadge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                    <FaRobot size={10} /> Gemma AI Flagged
                  </span>
                </div>
                <p style={{ marginTop: 4 }}>
                  CGPA: <strong>{s.cgpa}</strong> · Backlogs: <strong>{s.activeBacklogs}</strong> · Readiness:{' '}
                  <strong>
                    {s.readiness}% ({s.readinessLevel})
                  </strong>
                </p>
                <p style={{ color: '#b45309', marginTop: 3 }}>
                  <em>Trigger: {s.riskReason}</em>
                </p>
                {s.mentorRecommendation && (
                  <p
                    style={{
                      color: '#6d28d9',
                      marginTop: 4,
                      fontSize: '0.8rem',
                      background: '#f5f3ff',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      lineHeight: 1.4,
                    }}
                  >
                    💡 <strong>Actionable Remedial Plan:</strong> {s.mentorRecommendation}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: '#166534',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
              🎉 All registered candidates in this scope currently meet academic benchmarks. Zero at-risk students flagged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCenterTab;
