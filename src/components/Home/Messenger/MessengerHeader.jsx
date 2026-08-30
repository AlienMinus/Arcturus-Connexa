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
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Messaging options"
          >
            <FaEllipsisH />
          </span>

          {menuOpen && (
            <div
              className="messengerOptionsMenu"
              style={{
                position: "absolute",
                top: "28px",
                right: "0",
                background: "var(--bg-secondary, #ffffff)",
                border: "1px solid var(--border-color, #e0dfdc)",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                zIndex: 9999,
                minWidth: "180px",
                padding: "6px 0",
                fontSize: "13px"
              }}
            >
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary, #1e293b)",
                  textAlign: "left"
                }}
              >
                <FaCheckDouble size={12} color="#0a66c2" />
                <span>Mark all as read</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/messaging");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary, #1e293b)",
                  textAlign: "left"
                }}
              >
                <FaExpandAlt size={12} color="#0a66c2" />
                <span>Open full messenger</span>
              </button>

              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  color: "var(--text-primary, #1e293b)",
                  textDecoration: "none"
                }}
              >
                <FaCog size={12} color="#64748b" />
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
          style={{ cursor: "pointer", position: "relative", display: "flex", alignItems: "center" }}
          title="Compose new message"
        >
          <FaEdit />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                backgroundColor: "#cc0000",
                color: "white",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "1px 4px",
                borderRadius: "10px",
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>

        <span style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={toggle} title={isOpen ? "Minimize" : "Expand"}>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </span>
      </div>
    </div>
  );
};

export default MessengerHeader;