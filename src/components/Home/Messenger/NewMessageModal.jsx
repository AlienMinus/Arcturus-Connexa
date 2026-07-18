import React, { useState, useEffect } from "react";
import { FaExternalLinkAlt, FaTimes, FaPaperPlane } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { buildApiUrl } from "../../../utils/api";
import "./NewMessageModal.css";

const NewMessageModal = ({ closeModal }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildApiUrl('/users'), {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        if (!response.ok) throw new Error("Failed to load users");
        const data = await response.json();
        setUsers(data.contacts || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSend = async () => {
    if (!selectedUser || !messageText.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl('/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          receiverId: selectedUser.id || selectedUser._id,
          content: messageText,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="newMessageModal">

      <div className="newMessageHeader">

        <span>New message</span>

        <div className="headerBtns">

          <span style={{ cursor: "pointer" }}><FaExternalLinkAlt size={14} color="#666" /></span>

          <span onClick={closeModal} style={{ cursor: "pointer" }}><FaTimes size={16} color="#666" /></span>

        </div>

      </div>

      {!selectedUser ? (
        <>
          <div className="receiverInput">
            <input
              placeholder="Type a name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="suggestedTitle">
            Suggested
          </div>
          <div className="suggestedList">
            {loading && <div style={{ padding: "0 12px", color: "#666" }}>Loading users...</div>}
            {error && <div style={{ padding: "0 12px", color: "red" }}>{error}</div>}
            {!loading && !error && filteredUsers.map((item) => (
              <div 
                key={item.id || item._id} 
                className="suggestedUser"
                onClick={() => setSelectedUser(item)}
                style={{ cursor: "pointer" }}
              >
                {item.avatar?.url ? (
                  <img src={item.avatar.url} alt={item.name} className="suggestedAvatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <CgProfile className="suggestedAvatar suggestedAvatarFallback" />
                )}
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="messageComposer">
          <div className="selectedUserLabel" style={{ padding: "12px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>To: <strong>{selectedUser.name}</strong></span>
            <span style={{ fontSize: "12px", color: "#0a66c2", cursor: "pointer" }} onClick={() => setSelectedUser(null)}>Change</span>
          </div>
          <div className="messageInputArea" style={{ padding: "10px", display: "flex", alignItems: "flex-end", gap: "8px", borderTop: "1px solid #eee", marginTop: "auto" }}>
            <textarea
              placeholder="Write a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ flex: 1, minHeight: "20px", maxHeight: "80px", border: "1px solid #ccc", borderRadius: "16px", padding: "8px 12px", resize: "none", outline: "none", fontFamily: "inherit", fontSize: "14px" }}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              style={{
                background: messageText.trim() ? "#0a66c2" : "#ebebeb",
                color: messageText.trim() ? "white" : "#a8a8a8",
                border: "none",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: messageText.trim() ? "pointer" : "not-allowed",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
                marginBottom: "2px"
              }}
            >
              {sending ? "..." : <FaPaperPlane size={14} style={{ marginLeft: "-2px" }} />}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewMessageModal;