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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

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

  const handleSignOut = () => {
    logout();
    setDropdownOpen(false);
    navigate("/login", { replace: true });
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
          {profile?.avatar?.url ? (
            <img
              src={profile.avatar.url}
              alt={profile?.name || "Profile"}
              className="profileAvatar"
            />
          ) : (
            <CgProfile className="profileAvatar profileAvatarFallback" />
          )}
          <span className="profile-text">
            {profile?.name ? `${profile.name.split(" ")[0]}` : "Me"}{" "}
            <FaCaretDown />
          </span>
        </div>

        {/* For Business Placeholder */}
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
            {profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Profile"}
                className="avatar"
              />
            ) : (
              <CgProfile className="avatar avatarFallback" />
            )}
            <div className="user-info">
              <h4>{profile?.name || "User"}</h4>
              <p>{profile?.headline || "Arcturus Member"}</p>
            </div>
          </div>

          {/* View Profile CTA */}
          <div className="profile-dropdown-body">
            <Link
              to={userProfileUrl}
              className="view-profile-btn"
              onClick={() => setDropdownOpen(false)}
            >
              View Profile
            </Link>
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
                <Link to="/settings" onClick={() => setDropdownOpen(false)}>
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
                  to={profile?.username ? `/profile/${encodeURIComponent(profile.username)}/activity` : "/profile/activity"}
                  onClick={() => setDropdownOpen(false)}
                >
                  Posts & Activity
                </Link>
              </li>
              <li>
                <Link to="/jobs" onClick={() => setDropdownOpen(false)}>
                  Job Posting Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Sign Out Footer */}
          <div className="profile-dropdown-footer">
            <button
              type="button"
              className="sign-out-btn"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavRight;
