import React from 'react';
import { 
  FaCalendarAlt, 
  FaUserCheck, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaRobot,
  FaShieldAlt,
  FaUniversity,
  FaGraduationCap
} from 'react-icons/fa';

export const CampusTabsNav = ({
  isArcturusAdmin,
  isPlacementOfficer,
  activeTab,
  setActiveTab,
  conflictsCount = 0,
  drivesCount = 0,
  offersCount = 0,
  studentsCount = 0,
  isChatFloatingOpen,
  setIsChatFloatingOpen,
}) => {
  const isPureAdmin = isArcturusAdmin && !isPlacementOfficer;

  // Global Operations Hub exclusive view for Platform Admin
  if (isPureAdmin) {
    return (
      <div className="campusTabsCard">
        <button
          type="button"
          className="campusTabBtn active"
          onClick={() => setActiveTab('analytics')}
        >
          <FaShieldAlt size={14} /> Global Operations Hub
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
  }

  return (
    <div className="campusTabsCard">
      {/* PLACEMENT OFFICER VIEW */}
      {isPlacementOfficer && (
        <>
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FaUniversity size={14} /> Institutional Command Center
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            <FaCalendarAlt size={14} /> Drives & Conflict Management
            {conflictsCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  marginLeft: '4px',
                }}
              >
                {conflictsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <FaGraduationCap size={14} /> Manage Students {studentsCount > 0 ? `(${studentsCount})` : ''}
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'matching' ? 'active' : ''}`}
            onClick={() => setActiveTab('matching')}
          >
            <FaUsers size={14} /> Multi-Campus Matching
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            <FaFileInvoiceDollar size={14} /> Institutional Offers ({offersCount})
          </button>
        </>
      )}

      {/* STUDENT VIEW */}
      {!isPlacementOfficer && (
        <>
          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
            onClick={() => setActiveTab('readiness')}
          >
            <FaUserCheck size={14} /> My Readiness & AI Risk
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
          >
            <FaCalendarAlt size={14} /> Eligible Drives ({drivesCount})
          </button>

          <button
            type="button"
            className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            <FaFileInvoiceDollar size={14} /> My Offers ({offersCount})
          </button>
        </>
      )}

      {/* AI Assistant */}
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
