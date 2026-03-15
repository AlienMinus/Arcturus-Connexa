import React from "react";
import { FaHome, FaUserFriends, FaBriefcase, FaCommentDots, FaBell } from "react-icons/fa";
import NavItem from "./NavItem";

const NavCenter = () => {
  return (
    <div className="navCenter">

      <NavItem icon={<FaHome size={24} />} label="Home" active />

      <NavItem icon={<FaUserFriends size={24} />} label="My Network" />

      <NavItem icon={<FaBriefcase size={24} />} label="Jobs" />

      <NavItem icon={<FaCommentDots size={24} />} label="Messaging" />

      <NavItem icon={<FaBell size={24} />} label="Notifications" badge="8" />

    </div>
  );
};

export default NavCenter;