import React from "react";
import { CgProfile } from "react-icons/cg";

const ConversationItem = ({ data, onClick }) => {
  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="conversationItem" onClick={onClick} style={{ cursor: "pointer" }}>

      {data.avatar?.url ? (
        <img
          src={data.avatar.url}
          className="chatAvatar"
          alt={data.name}
        />
      ) : (
        <CgProfile className="chatAvatar chatAvatarFallback" />
      )}

      <div className="chatText" style={{ flex: 1, minWidth: 0 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
          <h4 style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: data.unreadCount > 0 ? "bold" : "normal" }}>{data.name}</h4>
          {data.timestamp && <span style={{ fontSize: "12px", color: "#666", flexShrink: 0 }}>{formatTime(data.timestamp)}</span>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <p style={{ margin: "4px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: data.unreadCount > 0 ? "bold" : "normal", color: data.unreadCount > 0 ? "#333" : "#666" }}>{data.msg}</p>
          {data.unreadCount > 0 && <span style={{ backgroundColor: "#0a66c2", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>{data.unreadCount}</span>}
        </div>

      </div>

    </div>
  );
};

export default ConversationItem;