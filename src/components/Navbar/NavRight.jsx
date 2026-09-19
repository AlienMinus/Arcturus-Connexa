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
  FaChevronRight 
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
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const isAuthenticated = Boolean(token);

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
        {/* Profile Nav Trigger */}
        <div
          className={`profileMenu ${isDropdownOpen ? "activeMenu" : ""}`}
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
        >
          {isAuthenticated && profile?.avatar?.url ? (
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
              ? profile?.name
                ? `${profile.name.split(" ")[0]}`
                : "Me"
              : "Sign In"}{" "}
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
          <div className="profile-dropdown-header">
            {isAuthenticated && profile?.avatar?.url ? (
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
                  ? profile?.name || user?.name || "Member"
                  : "Guest Visitor"}
              </h4>
              <p>
                {isAuthenticated
                  ? profile?.headline || "Arcturus Member"
                  : "Sign in to access your network"}
              </p>
            </div>
          </div>

          {/* View Profile or Sign In CTA */}
          <div className="profile-dropdown-body">
            {isAuthenticated ? (
              <Link
                to={userProfileUrl}
                className="view-profile-btn"
                onClick={() => setDropdownOpen(false)}
              >
                View Profile
              </Link>
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
              <li>
                <Link to="/jobs/manage" onClick={() => setDropdownOpen(false)}>
                  Job Posting Account
                </Link>
              </li>
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
        <div className="for-business-dropdown">
          <div className="for-business-header">
            <h4>My Business Apps</h4>
            <span className="for-business-subtitle">Explore enterprise tools and growth platforms</span>
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
              <Link to="/jobs/manage" className="business-solution-item" onClick={() => setBusinessOpen(false)}>
                <div>
                  <strong>Talent Solutions</strong>
                  <p>Find, attract and recruit qualified candidates</p>
                </div>
                <FaChevronRight size={12} color="#94a3b8" />
              </Link>

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
      )}
    </div>
  );
};

export default NavRight;
