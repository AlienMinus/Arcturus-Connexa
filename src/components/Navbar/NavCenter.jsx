import React, { useEffect, useState } from "react";
import { FaHome, FaUserFriends, FaBriefcase, FaCommentDots, FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { buildApiUrl } from "../../utils/api";
import NavItem from "./NavItem";

const NavCenter = () => {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      if (!token) {
        setUnreadCount(0);
        return;
      }
      try {
        const response = await fetch(buildApiUrl('/notifications/unread'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread || 0);
        }
      } catch (err) {
        console.error('Failed to load notification count', err);
      }
    };

    loadUnread();
  }, [token]);

  return (
    <div className="navCenter">
      <NavItem to="/" icon={<FaHome size={24} />} label="Home" />
      <NavItem to="/network" icon={<FaUserFriends size={24} />} label="My Network" />
      <NavItem to="/jobs" icon={<FaBriefcase size={24} />} label="Jobs" />
      <NavItem to="/messaging" icon={<FaCommentDots size={24} />} label="Messaging" />
      <NavItem to="/notifications" icon={<FaBell size={24} />} label="Notifications" badge={unreadCount > 0 ? String(unreadCount) : undefined} />
    </div>
  );
};

export default NavCenter;