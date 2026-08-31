import React, { useEffect, useRef, useState } from "react";
import { FaBullhorn, FaCaretDown, FaTh } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const NavRight = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
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

        {/* For Business Link */}
        <Link to="/learning" className="businessMenu">
          <span className="business-icon">
            <FaTh size={20} color="#666" />
          </span>
          <span className="business-text">
            For Business <FaCaretDown />
          </span>
        </Link>

        {/* Advertise Link */}
        <Link to="/advertise" className="advertise">
          <FaBullhorn size={18} aria-hidden="true" />
          <span>Advertise</span>
        </Link>
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
    </div>
  );
};

export default NavRight;
