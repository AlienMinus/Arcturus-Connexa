import React from 'react';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaRobot 
} from 'react-icons/fa';

export const CampusTabsNav = ({
  isArcturusAdmin,
  activeTab,
  setActiveTab,
  conflictsCount,
  drivesCount,
  offersCount,
  isChatFloatingOpen,
  setIsChatFloatingOpen,
}) => {
  return (
    <div className="campusTabsCard">
      {isArcturusAdmin && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartLine size={14} /> Command Center
        </button>
      )}

      {isArcturusAdmin ? (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
          onClick={() => setActiveTab('drives')}
        >
          <FaCalendarAlt size={14} /> Drives & Conflicts
          {conflictsCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px' }}>
              {conflictsCount}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <FaUserCheck size={14} /> My Readiness & AI Risk
        </button>
      )}

      {isArcturusAdmin ? (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <FaUserCheck size={14} /> Student Readiness Engine
        </button>
      ) : (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
          onClick={() => setActiveTab('drives')}
        >
          <FaCalendarAlt size={14} /> Eligible Drives ({drivesCount})
        </button>
      )}

      {isArcturusAdmin && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'matching' ? 'active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          <FaUsers size={14} /> Recruiter Matching
        </button>
      )}

      <button
        type="button"
        className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
        onClick={() => setActiveTab('offers')}
      >
        <FaFileInvoiceDollar size={14} /> {isArcturusAdmin ? 'All Offers & Compliance' : 'My Offers'} ({offersCount})
      </button>

      <button
        type="button"
        className={`campusTabBtn ${isChatFloatingOpen ? 'active' : ''}`}
        onClick={() => setIsChatFloatingOpen((prev) => !prev)}
        title="Toggle CampusLink AI Placement Assistant"
      >
        <FaRobot size={14} /> AI Assistant
      </button>
    </div>
  );
};

export default CampusTabsNav;

