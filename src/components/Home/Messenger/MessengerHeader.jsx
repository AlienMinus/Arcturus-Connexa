import React, { useState, useEffect, useRef } from "react";
import { FaEllipsisH, FaEdit, FaChevronDown, FaChevronUp, FaCheckDouble, FaCog, FaExpandAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    setMenuOpen(false);
  };

  return (
    <div className="messengerHeader">
      <div className="headerLeft" onClick={toggle} style={{ cursor: "pointer" }}>
        {profile?.avatar?.url ? (
          <img
            src={profile.avatar.url}
            alt={profile?.name || "Profile"}
            className="profileImg"
          />
        ) : (
          <div className="profileImg profileImgFallback">
            {getInitials(profile?.name) || <CgProfile size={18} />}
          </div>
        )}
        <span>Messaging</span>
      </div>

      <div className="headerIcons">
        <div className="headerMenuWrapper" ref={menuRef} style={{ position: "relative" }}>
          <span
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Messaging options"
          >
            <FaEllipsisH />
          </span>

          {menuOpen && (
            <div className="messengerOptionsMenu">
              <button
                type="button"
                className="messengerOptionItem"
                onClick={handleMarkAllRead}
              >
                <FaCheckDouble size={13} color="#0a66c2" />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                className="messengerOptionItem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/messaging");
                }}
              >
                <FaExpandAlt size={13} color="#0a66c2" />
                <span>Open full messenger</span>
              </button>

              <Link
                to="/settings"
                className="messengerOptionItem"
                onClick={() => setMenuOpen(false)}
              >
                <FaCog size={13} color="#64748b" />
                <span>Messaging settings</span>
              </Link>
            </div>
          )}
        </div>

        <span
          onClick={(e) => {
            e.stopPropagation();
            openNewMessage();
          }}
          title="Compose new message"
        >
          <FaEdit />
        </span>

        <span onClick={toggle} title={isOpen ? "Minimize" : "Expand"}>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </span>
      </div>
    </div>
  );
};

export default MessengerHeader;