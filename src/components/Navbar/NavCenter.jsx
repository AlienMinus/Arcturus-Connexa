import React from "react";
import { FaHome, FaUserFriends, FaBriefcase, FaCommentDots, FaBell } from "react-icons/fa";
import NavItem from "./NavItem";

const NavCenter = () => {
  return (
    <div className="navCenter">

      <NavItem to="/" icon={<FaHome size={24} />} label="Home" />

      <NavItem to="/network" icon={<FaUserFriends size={24} />} label="My Network" />

      <NavItem to="/jobs" icon={<FaBriefcase size={24} />} label="Jobs" />

      <NavItem to="/messaging" icon={<FaCommentDots size={24} />} label="Messaging" />

      <NavItem to="/notifications" icon={<FaBell size={24} />} label="Notifications" badge="8" />

    </div>
  );
};

export default NavCenter;