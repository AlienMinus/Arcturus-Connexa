import React from 'react';
import { 
  FaGraduationCap, 
  FaShieldAlt, 
  FaAward, 
  FaDollarSign, 
  FaBriefcase,
  FaUniversity,
  FaUsers
} from 'react-icons/fa';

export const CampusHero = ({
  isArcturusAdmin,
  isPlacementOfficer,
  officerInstitute,
  analyticsPayload,
  analytics,
  drivesCount,
}) => {
  const instituteName = officerInstitute?.name || analyticsPayload?.institute?.name || '';
  const totalPartnerInstitutes =
    analyticsPayload?.platformOverview?.totalInstitutes ||
    analyticsPayload?.institutesSummary?.length ||
    analyticsPayload?.institutesList?.length ||
    0;

  return (
    <div className="campusHeroCard">
      <div className="campusHeroLeft">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: '16px',
            background: isArcturusAdmin ? '#fef3c7' : isPlacementOfficer ? '#f0fdf4' : '#e0f2fe',
            color: isArcturusAdmin ? '#92400e' : isPlacementOfficer ? '#166534' : '#0369a1',
            border: isPlacementOfficer ? '1px solid #bbf7d0' : 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: 10,
            width: 'fit-content',
          }}
        >
          {isArcturusAdmin ? (
            <>
              <FaShieldAlt size={12} />
              🛡️ 🌐 Global CampusLink Administration • Platform Operations
            </>
          ) : isPlacementOfficer ? (
            <>
              <FaUniversity size={12} />
              🏛️ Institutional Command Center • {instituteName || 'Authorized Institute'}
            </>
          ) : (
            <>
              <FaGraduationCap size={12} />
              🎓 Student Placement & Readiness Portal
            </>
          )}
        </div>

        <h1>
          <FaGraduationCap size={28} />
          {isArcturusAdmin ? (
            'CAMPUSLINK • Global Operations'
          ) : isPlacementOfficer && instituteName ? (
            `CAMPUSLINK • ${instituteName}`
          ) : (
            'CAMPUSLINK'
          )}
        </h1>

        <p className="campusHeroTagline">
          {isArcturusAdmin
            ? 'Arcturus Enterprise Multi-Institutional Placement Hub. Oversee platform-wide placement metrics, evaluate partner colleges, manage recruitment pipelines, and resolve campus schedule collisions.'
            : isPlacementOfficer
            ? `Authorized Placement Management Hub for ${instituteName || 'your institute'}. Student data from other institutions is strictly isolated and restricted from view.`
            : 'AI-Powered Campus-to-Corporate Placement Portal. Benchmark technical readiness against scheduled drives, diagnose placement risks with Gemma, and explore corporate opportunities.'}
        </p>
      </div>

      <div className="campusHeroBadges">
        {isArcturusAdmin ? (
          <>
            <div className="campusHeroBadge">
              <FaUniversity color="#38bdf8" /> Partner Colleges: <strong>{totalPartnerInstitutes}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaUsers color="#a855f7" /> Network Students: <strong>{analytics?.totalRegisteredStudents || 0}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaAward color="#facc15" /> Global Rate: <strong>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaBriefcase color="#4ade80" /> Total Drives: <strong>{drivesCount}</strong>
            </div>
          </>
        ) : isPlacementOfficer ? (
          <>
            <div className="campusHeroBadge">
              <FaUsers color="#38bdf8" /> Enrolled Candidates: <strong>{analytics?.totalRegisteredStudents || 0}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaAward color="#facc15" /> Placement Rate: <strong>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaDollarSign color="#4ade80" /> Avg CTC: <strong>{analytics?.averageCtcLpa ? `${analytics.averageCtcLpa} LPA` : '—'}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaBriefcase color="#a855f7" /> Active Drives: <strong>{drivesCount}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="campusHeroBadge">
              <FaAward color="#facc15" /> Placement Rate: <strong>{analytics?.totalRegisteredStudents > 0 ? `${analytics.placementRatePercentage}%` : '0%'}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaDollarSign color="#4ade80" /> Avg CTC: <strong>{analytics?.averageCtcLpa ? `${analytics.averageCtcLpa} LPA` : '—'}</strong>
            </div>
            <div className="campusHeroBadge">
              <FaBriefcase color="#38bdf8" /> Active Drives: <strong>{drivesCount}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CampusHero;
