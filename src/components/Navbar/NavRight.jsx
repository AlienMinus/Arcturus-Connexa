import React, { useEffect, useRef, useState } from "react";
import { 
  FaBullhorn, 
  FaCaretDown, 
  FaGraduationCap, 
  FaTh, 
  FaBookOpen, 
  FaBriefcase, 
  FaShieldAlt, 
  FaPlus,
  FaChevronRight,
  FaBuilding,
  FaExchangeAlt,
  FaCheck,
  FaUserCheck,
  FaTimes
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const NavRight = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isBusinessOpen, setBusinessOpen] = useState(false);
  const { profile } = useProfile();
  const { user, token, logout, activeAccount, switchAccount, userOrganizations } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const isAuthenticated = Boolean(token);
  const isOrgActive = activeAccount?.type === 'organization';
  const canManageJobs = isAuthenticated && isOrgActive;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
        setBusinessOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    setBusinessOpen(false);
  };

  const toggleBusinessDropdown = () => {
    setBusinessOpen((prev) => !prev);
    setDropdownOpen(false);
  };

  const handleAuthAction = () => {
    setDropdownOpen(false);
    if (isAuthenticated) {
      logout();
      navigate("/login", { replace: true });
    } else {
      navigate("/login");
    }
  };

  const userProfileUrl = profile?.username
    ? `/profile/${encodeURIComponent(profile.username)}`
    : "/profile";

  return (
    <div className="navRightContainer" ref={containerRef}>
      <div className="navRight">
        {/* Active Organization Context Pill (if acting as organization) */}
        {isOrgActive && (
          <div 
            className="navOrgActivePill" 
            title={`Acting as ${activeAccount.name}. Click to switch back.`}
            onClick={() => switchAccount('personal')}
          >
            <span className="orgPillDot"></span>
            <span className="orgPillText">Acting as <strong>{activeAccount.name}</strong></span>
            <span className="orgPillAction">Personal ↺</span>
          </div>
        )}

        {/* Profile Nav Trigger */}
        <div
          className={`profileMenu ${isDropdownOpen ? "activeMenu" : ""} ${isOrgActive ? "orgProfileActive" : ""}`}
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
        >
          {isOrgActive ? (
            activeAccount.logo ? (
              <img
                src={activeAccount.logo}
                alt={activeAccount.name}
                className="profileAvatar orgNavAvatar"
              />
            ) : (
              <FaBuilding className="profileAvatar profileAvatarFallback orgNavAvatar" />
            )
          ) : isAuthenticated && profile?.avatar?.url ? (
            <img
              src={profile.avatar.url}
              alt={profile?.name || "Profile"}
              className="profileAvatar"
            />
          ) : (
            <CgProfile className="profileAvatar profileAvatarFallback" />
          )}
          <span className="profile-text">
            {isAuthenticated
              ? isOrgActive
                ? `${activeAccount.name.slice(0, 8)}${activeAccount.name.length > 8 ? '...' : ''}`
                : profile?.name
                  ? `${profile.name.split(" ")[0]}`
                  : "Me"
              : "Sign In"}{" "}
            {isOrgActive && <span className="orgBadgeMini">Org</span>}
            <FaCaretDown />
          </span>
        </div>

        {/* CampusLink Navigation */}
        <Link to="/campuslink" className="businessMenu" title="CampusLink Placement Platform">
          <span className="business-icon">
            <FaGraduationCap size={20} color="#666" />
          </span>
          <span className="business-text">
            CampusLink
          </span>
        </Link>

        {/* For Business Dropdown Trigger */}
        <div
          className={`forBusinessTrigger ${isBusinessOpen ? "activeMenu" : ""}`}
          onClick={toggleBusinessDropdown}
          role="button"
          tabIndex={0}
          title="For Business Solutions & Apps"
        >
          <span className="business-icon">
            <FaTh size={20} color="#666" />
          </span>
          <span className="business-text">
            For Business <FaCaretDown />
          </span>
        </div>
      </div>

      {/* Profile Dropdown Menu */}
      {isDropdownOpen && (
        <div className="profile-dropdown">
          {/* Header with Avatar & Name */}
          <div className={`profile-dropdown-header ${isOrgActive ? 'orgDropdownHeader' : ''}`}>
            {isOrgActive ? (
              activeAccount.logo ? (
                <img
                  src={activeAccount.logo}
                  alt={activeAccount.name}
                  className="dropdownAvatar orgDropdownAvatar"
                />
              ) : (
                <div className="dropdownAvatar dropdownAvatarFallback orgDropdownAvatar">
                  <FaBuilding size={22} color="#0a66c2" />
                </div>
              )
            ) : isAuthenticated && profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Profile"}
                className="dropdownAvatar"
              />
            ) : (
              <CgProfile className="dropdownAvatar dropdownAvatarFallback" />
            )}
            <div className="user-info">
              <h4>
                {isAuthenticated
                  ? isOrgActive
                    ? activeAccount.name
                    : profile?.name || user?.name || "Member"
                  : "Guest Visitor"}
              </h4>
              <p>
                {isAuthenticated
                  ? isOrgActive
                    ? `${activeAccount.role || 'Admin'} • Organization Account`
                    : profile?.headline || "Arcturus Member"
                  : "Sign in to access your network"}
              </p>
            </div>
          </div>

          {/* View Profile or Sign In CTA */}
          <div className="profile-dropdown-body">
            {isAuthenticated ? (
              isOrgActive ? (
                <Link
                  to={activeAccount.slug ? `/company/${activeAccount.slug}` : `/organization/${activeAccount.id}`}
                  className="view-profile-btn org-profile-cta"
                  onClick={() => setDropdownOpen(false)}
                >
                  View Company Page
                </Link>
              ) : (
                <Link
                  to={userProfileUrl}
                  className="view-profile-btn"
                  onClick={() => setDropdownOpen(false)}
                >
                  View Profile
                </Link>
              )
            ) : (
              <Link
                to="/login"
                className="view-profile-btn"
                onClick={() => setDropdownOpen(false)}
              >
                Sign In / Join
              </Link>
            )}
          </div>

          {/* Account Switcher Section (Personal vs Organization) */}
          {isAuthenticated && (
            <div className="profile-dropdown-section account-switcher-section">
              <div className="account-switcher-header">
                <h5>Switch identity</h5>
                <Link 
                  to="/settings/accounts" 
                  className="manage-accounts-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Manage
                </Link>
              </div>

              <div className="account-switcher-list">
                {/* Personal Profile Option */}
                <div 
                  className={`account-switch-row ${!isOrgActive ? 'active-account' : ''}`}
                  onClick={() => {
                    if (isOrgActive) {
                      switchAccount('personal');
                      setDropdownOpen(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="account-switch-avatar">
                    {profile?.avatar?.url ? (
                      <img src={profile.avatar.url} alt="" />
                    ) : (
                      <CgProfile size={26} />
                    )}
                  </div>
                  <div className="account-switch-info">
                    <span className="account-switch-name">
                      {profile?.name || user?.name || 'Personal Profile'}
                    </span>
                    <span className="account-switch-sub">Personal Account</span>
                  </div>
                  {!isOrgActive ? (
                    <span className="account-active-tag">Active</span>
                  ) : (
                    <button 
                      type="button" 
                      className="account-switch-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        switchAccount('personal');
                        setDropdownOpen(false);
                      }}
                    >
                      Use identity
                    </button>
                  )}
                </div>

                {/* Organization Accounts List */}
                {userOrganizations && userOrganizations.length > 0 && (
                  <div className="orgs-switch-group">
                    <span className="orgs-switch-heading">Organizations</span>
                    {userOrganizations.map((org) => {
                      const isSelected = isOrgActive && (activeAccount.id === org._id || activeAccount.orgId === org._id);
                      const orgLogoUrl = org.logo?.url || org.logo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png';
                      const myMembership = org.members?.find((m) => m.userId === user?._id || m.userId?._id === user?._id);
                      const roleTitle = myMembership?.role || (org.adminId === user?._id ? 'Admin' : 'Member');

                      return (
                        <div 
                          key={org._id}
                          className={`account-switch-row ${isSelected ? 'active-account' : ''}`}
                          onClick={() => {
                            if (!isSelected) {
                              switchAccount(org);
                              setDropdownOpen(false);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="account-switch-avatar org-avatar-box">
                            <img src={orgLogoUrl} alt={org.name} />
                          </div>
                          <div className="account-switch-info">
                            <span className="account-switch-name">{org.name}</span>
                            <span className="account-switch-sub">
                              {roleTitle} • <span className={`org-status-pill ${org.status}`}>{org.status}</span>
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="account-active-tag org-tag">Active</span>
                          ) : (
                            <button 
                              type="button" 
                              className="account-switch-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                switchAccount(org);
                                setDropdownOpen(false);
                              }}
                            >
                              Use identity
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Add / Register Company Link */}
                <Link 
                  to="/company/create" 
                  className="create-org-action-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FaPlus size={11} /> Register / Add Organization
                </Link>
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="profile-dropdown-section">
            <h5>Account</h5>
            <ul className="profile-dropdown-list">
              <li>
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                  Settings & Privacy
                </Link>
              </li>
              <li>
                <Link to="/settings/accounts" onClick={() => setDropdownOpen(false)}>
                  Accounts & Organizations
                </Link>
              </li>
              <li>
                <Link to="/help" onClick={() => setDropdownOpen(false)}>
                  Help & Support
                </Link>
              </li>
              <li>
                <Link to="/settings/language" onClick={() => setDropdownOpen(false)}>
                  Language
                </Link>
              </li>
            </ul>
          </div>

          {/* Manage Section */}
          <div className="profile-dropdown-section">
            <h5>Manage</h5>
            <ul className="profile-dropdown-list">
              <li>
                <Link
                  to={
                    profile?.username
                      ? `/profile/${encodeURIComponent(profile.username)}/activity`
                      : "/profile/activity"
                  }
                  onClick={() => setDropdownOpen(false)}
                >
                  Posts & Activity
                </Link>
              </li>
              {!isOrgActive && (
                <li>
                  <Link to="/settings/applications" onClick={() => setDropdownOpen(false)} style={{ color: '#0a66c2', fontWeight: '600' }}>
                    💼 Job Applications Tracker
                  </Link>
                </li>
              )}
              {canManageJobs && (
                <li>
                  <Link to="/jobs/manage" onClick={() => setDropdownOpen(false)}>
                    Job Posting Account
                  </Link>
                </li>
              )}
              {(user?.role === 'admin' || user?.isAdmin || user?.username?.toLowerCase() === 'arcturus_admin' || profile?.username?.toLowerCase() === 'arcturus_admin') && (
                <li>
                  <Link to="/admin" onClick={() => setDropdownOpen(false)} style={{ color: "#0a66c2", fontWeight: "700" }}>
                    🛡️ Admin Operations Hub
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Sign Out / Sign In Footer */}
          <div className="profile-dropdown-footer">
            <button
              type="button"
              className="sign-out-btn"
              onClick={handleAuthAction}
            >
              {isAuthenticated ? "Sign Out" : "Sign In"}
            </button>
          </div>
        </div>
      )}

      {/* For Business Dropdown Panel */}
      {isBusinessOpen && (
        <>
          <div
            className="for-business-backdrop"
            onClick={() => setBusinessOpen(false)}
            aria-hidden="true"
          />
          <div className="for-business-dropdown">
            <div className="for-business-drag-handle" />
            <div className="for-business-header">
              <div className="for-business-header-text">
                <h4>My Business Apps</h4>
                <span className="for-business-subtitle">Explore enterprise tools and growth platforms</span>
              </div>
              <button
                type="button"
                className="for-business-close-btn"
                onClick={() => setBusinessOpen(false)}
                aria-label="Close Business Menu"
              >
                <FaTimes size={16} />
              </button>
            </div>

          <div className="business-apps-grid">
            <Link
              to="/learning"
              className="business-app-card"
              onClick={() => setBusinessOpen(false)}
            >
              <div className="business-app-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <FaBookOpen size={20} />
              </div>
              <div className="business-app-info">
                <strong>Learning Hub</strong>
                <span>Upskill talent with certified technical courses</span>
              </div>
            </Link>

            <Link
              to="/advertise"
              className="business-app-card"
              onClick={() => setBusinessOpen(false)}
            >
              <div className="business-app-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <FaBullhorn size={20} />
              </div>
              <div className="business-app-info">
                <strong>Advertise Portal</strong>
                <span>Launch targeted sponsored campaigns & boost reach</span>
              </div>
            </Link>

            {canManageJobs && (
              <Link
                to="/jobs/manage"
                className="business-app-card"
                onClick={() => setBusinessOpen(false)}
              >
                <div className="business-app-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  <FaBriefcase size={20} />
                </div>
                <div className="business-app-info">
                  <strong>Talent Solutions</strong>
                  <span>Post jobs, manage applications & hire talent</span>
                </div>
              </Link>
            )}

            <Link
              to="/campuslink"
              className="business-app-card"
              onClick={() => setBusinessOpen(false)}
            >
              <div className="business-app-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <FaGraduationCap size={20} />
              </div>
              <div className="business-app-info">
                <strong>CampusLink</strong>
                <span>Placement drives, conflict engine & readiness</span>
              </div>
            </Link>

            {(user?.role === 'admin' || user?.isAdmin || user?.username?.toLowerCase() === 'arcturus_admin' || profile?.username?.toLowerCase() === 'arcturus_admin') && (
              <Link
                to="/admin"
                className="business-app-card"
                onClick={() => setBusinessOpen(false)}
              >
                <div className="business-app-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <FaShieldAlt size={20} />
                </div>
                <div className="business-app-info">
                  <strong>Admin Operations</strong>
                  <span>Security, user moderation & system admin</span>
                </div>
              </Link>
            )}
          </div>

          <div className="for-business-divider" />

          <div className="business-solutions-section">
            <h4>Arcturus Business Solutions</h4>
            <div className="business-solution-list">
              {canManageJobs && (
                <Link to="/jobs/manage" className="business-solution-item" onClick={() => setBusinessOpen(false)}>
                  <div>
                    <strong>Talent Solutions</strong>
                    <p>Find, attract and recruit qualified candidates</p>
                  </div>
                  <FaChevronRight size={12} color="#94a3b8" />
                </Link>
              )}

              <Link to="/advertise" className="business-solution-item" onClick={() => setBusinessOpen(false)}>
                <div>
                  <strong>Marketing & Ad Solutions</strong>
                  <p>Acquire high-value clients and build brand awareness</p>
                </div>
                <FaChevronRight size={12} color="#94a3b8" />
              </Link>

              <Link to="/learning" className="business-solution-item" onClick={() => setBusinessOpen(false)}>
                <div>
                  <strong>Learning & Development</strong>
                  <p>Develop critical skills across your organization</p>
                </div>
                <FaChevronRight size={12} color="#94a3b8" />
              </Link>
            </div>
          </div>

          <div className="for-business-footer">
            <Link
              to="/company/create"
              className="create-company-btn"
              onClick={() => setBusinessOpen(false)}
            >
              <FaPlus size={12} /> Create a Company Page
            </Link>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default NavRight;
