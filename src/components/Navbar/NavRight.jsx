import React, { useState } from "react";
import { FaCaretDown, FaTh } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Navbar.css";

const NavRight = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="navRightContainer">
      <div className="navRight">
        <div className="profileMenu" onClick={toggleDropdown}>
          <img
            src="https://i.pravatar.cc/150?u=123"
            alt=""
            className="profileAvatar"
          />
          <span className="profile-text">
            Me <FaCaretDown />
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
            <img
              src="https://i.pravatar.cc/150?u=123"
              alt=""
              className="avatar"
            />
            <div className="user-info">
              <h4>Manas R. Das</h4>
              <p>Student</p>
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
              <li>Sign Out</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavRight;