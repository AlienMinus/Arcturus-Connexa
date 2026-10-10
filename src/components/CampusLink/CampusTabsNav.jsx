import React from 'react';
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaRobot,
  FaShieldAlt,
  FaUniversity
} from 'react-icons/fa';

export const CampusTabsNav = ({
  isArcturusAdmin,
  isPlacementOfficer,
  activeTab,
  setActiveTab,
  conflictsCount,
  drivesCount,
  offersCount,
  isChatFloatingOpen,
  setIsChatFloatingOpen,
}) => {
  const canAccessCommandCenter = isArcturusAdmin || isPlacementOfficer;
  const canAccessMatching = isPlacementOfficer;

  return (
    <div className="campusTabsCard">
      {/* TAB 1: Command Center (Admin or Placement Officer only) */}
      {canAccessCommandCenter && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          {isArcturusAdmin && !isPlacementOfficer ? (
            <>
              <FaShieldAlt size={14} /> Operations & System Hub
            </>
          ) : (
            <>
              <FaUniversity size={14} /> Institutional Command Center
            </>
          )}
        </button>
      )}

      {/* For Students: Readiness is Tab 1 */}
      {!canAccessCommandCenter && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <FaUserCheck size={14} /> My Readiness & AI Risk
        </button>
      )}

      {/* TAB 2: Drives */}
      <button
        type="button"
        className={`campusTabBtn ${activeTab === 'drives' ? 'active' : ''}`}
        onClick={() => setActiveTab('drives')}
      >
        <FaCalendarAlt size={14} />{' '}
        {isPlacementOfficer ? (
          'Campus Drives & Schedules'
        ) : isArcturusAdmin ? (
          'Scheduled Placement Drives'
        ) : (
          `Eligible Drives (${drivesCount})`
        )}
        {isPlacementOfficer && conflictsCount > 0 && (
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

      {/* For Officers & Admins: Student Readiness Portal is Tab 3 */}
      {canAccessCommandCenter && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'readiness' ? 'active' : ''}`}
          onClick={() => setActiveTab('readiness')}
        >
          <FaUserCheck size={14} />{' '}
          {isArcturusAdmin ? 'Student Readiness Engine' : 'Student Readiness Portal'}
        </button>
      )}

      {/* TAB 4: Recruiter Matching (Admin or Placement Officer only) */}
      {canAccessMatching && (
        <button
          type="button"
          className={`campusTabBtn ${activeTab === 'matching' ? 'active' : ''}`}
          onClick={() => setActiveTab('matching')}
        >
          <FaUsers size={14} /> {isArcturusAdmin ? 'Multi-Campus Matching' : 'Recruiter Matching'}
        </button>
      )}

      {/* TAB 5: Offers */}
      <button
        type="button"
        className={`campusTabBtn ${activeTab === 'offers' ? 'active' : ''}`}
        onClick={() => setActiveTab('offers')}
      >
        <FaFileInvoiceDollar size={14} />{' '}
        {isArcturusAdmin
          ? `Network Offers & Compliance (${offersCount})`
          : isPlacementOfficer
          ? `Institutional Offers (${offersCount})`
          : `My Offers (${offersCount})`}
      </button>

      {/* TAB 6: AI Assistant */}
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
