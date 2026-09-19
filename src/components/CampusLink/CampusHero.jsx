import React from 'react';
import { 
  FaGraduationCap, 
  FaShieldAlt, 
  FaAward, 
  FaDollarSign, 
  FaBriefcase 
} from 'react-icons/fa';

export const CampusHero = ({ isArcturusAdmin, analytics, drivesCount }) => {
  return (
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
            : 'AI-Powered Campus-to-Corporate Placement Portal. Benchmark technical readiness against scheduled drives, diagnose placement risks with Gemma, and explore corporate opportunities.'}
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
          <FaBriefcase color="#38bdf8" /> Active Drives: <strong>{drivesCount}</strong>
        </div>
      </div>
    </div>
  );
};

export default CampusHero;

