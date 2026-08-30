import React, { useEffect, useState } from "react";
import { FaHome, FaUserFriends, FaBriefcase, FaCommentDots, FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { buildApiUrl } from "../../utils/api";
import NavItem from "./NavItem";

const NavCenter = () => {
  const { token } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!token) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        // 1. Fetch unread notifications
        const notifRes = await fetch(buildApiUrl('/notifications/unread'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setUnreadNotifications(notifData.unread || 0);
        }

        // 2. Fetch unread messages
        const msgRes = await fetch(buildApiUrl('/messages/unread'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setUnreadMessages(msgData.unread || 0);
        }
      } catch (err) {
        console.error('Failed to load navbar badge counts', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);

    const handleNotificationsRead = () => setUnreadNotifications(0);
    const handleMessagesRead = () => setUnreadMessages(0);

    window.addEventListener('notifications-read', handleNotificationsRead);
    window.addEventListener('messages-read', handleMessagesRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handleNotificationsRead);
      window.removeEventListener('messages-read', handleMessagesRead);
    };
  }, [token]);

  return (
    <div className="navCenter">
      <NavItem to="/" icon={<FaHome size={24} />} label="Home" />
      <NavItem to="/network" icon={<FaUserFriends size={24} />} label="My Network" />
      <NavItem to="/jobs" icon={<FaBriefcase size={24} />} label="Jobs" />
      <NavItem 
        to="/messaging" 
        icon={<FaCommentDots size={24} />} 
        label="Messaging" 
        badge={unreadMessages > 0 ? String(unreadMessages) : undefined} 
      />
      <NavItem 
        to="/notifications" 
        icon={<FaBell size={24} />} 
        label="Notifications" 
        badge={unreadNotifications > 0 ? String(unreadNotifications) : undefined} 
      />
    </div>
  );
};

export default NavCenter;
