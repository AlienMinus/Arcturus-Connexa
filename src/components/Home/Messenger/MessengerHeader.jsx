import React, { useState, useEffect } from "react";
import { FaEllipsisH, FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { buildApiUrl } from "../../../utils/api";

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const MessengerHeader = ({ profile, openNewMessage, toggle, isOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(buildApiUrl('/messages/unread'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="messengerHeader">

      <div className="headerLeft">

        {profile?.avatar?.url ? (
          <img
            src={profile.avatar.url}
            alt={profile?.name || "Profile"}
            className="profileImg"
          />
        ) : (
          <CgProfile className="profileImg profileImgFallback" />
        )}

        <span>Messaging</span>

      </div>

      <div className="headerIcons">

        <span style={{ cursor: "pointer" }}><FaEllipsisH /></span>

        <span onClick={openNewMessage} style={{ cursor: "pointer", position: "relative" }}>
          <FaEdit />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              backgroundColor: "#cc0000",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              padding: "1px 4px",
              borderRadius: "10px"
            }}>
              {unreadCount}
            </span>
          )}
        </span>

        <span style={{ cursor: "pointer" }} onClick={toggle}>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </span>

      </div>

    </div>
  );
};

export default MessengerHeader;