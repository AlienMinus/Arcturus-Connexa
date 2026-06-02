import React, { useEffect, useRef, useState } from "react";
import { FaCaretDown, FaTh } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const NavRight = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { profile } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="navRightContainer" ref={containerRef}>
      <div className="navRight">
        <div className="profileMenu" onClick={toggleDropdown}>
          {profile?.avatar?.url ? (
            <img
              src={profile.avatar.url}
              alt={profile?.name || "Profile"}
              className="profileAvatar"
            />
          ) : (
            <div className="profileAvatar profileAvatarFallback">
              {getInitials(profile?.name)}
            </div>
          )}
          <span className="profile-text">
            {profile?.name ? `${profile.name.split(' ')[0]}` : ''} <FaCaretDown />
          </span>
        </div>

        <div className="businessMenu">
          <span className="business-icon">
            <FaTh size={24} color="#666" />
          </span>
          <span className="business-text">
            For Business <FaCaretDown />
          </span>
        </div>

        <div className="advertise">Advertise</div>
      </div>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            {profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Profile"}
                className="avatar"
              />
            ) : (
              <div className="avatar avatarFallback">
                {getInitials(profile?.name)}
              </div>
            )}
            <div className="user-info">
              <h4>{profile?.name || ''}</h4>
              <p>{profile?.headline || ''}</p>
            </div>
          </div>
          <div className="profile-dropdown-body">
            <Link to="/profile" className="view-profile-btn">
              View Profile
            </Link>
          </div>
          <div className="profile-dropdown-section">
            <h5>Account</h5>
            <ul>
              <Link to="/settings"><li>Settings & Privacy</li></Link>
              <Link to="/help"><li>Help</li></Link>
              <Link to="/settings/language"><li>Language</li></Link>
            </ul>
          </div>
          <div className="profile-dropdown-section">
            <h5>Manage</h5>
            <ul>
              <Link to="/profile/activity"><li>Posts & Activity</li></Link>
              <Link to="/jobs/manage"><li>Job Posting Account</li></Link>
            </ul>
          </div>
          <div className="profile-dropdown-footer">
            <ul>
              <li onClick={handleSignOut} style={{ cursor: "pointer" }}>
                Sign Out
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavRight;