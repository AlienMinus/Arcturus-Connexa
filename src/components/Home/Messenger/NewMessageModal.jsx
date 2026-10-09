import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaExternalLinkAlt, FaTimes, FaPaperPlane, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { buildApiUrl } from "../../../utils/api";
import "./NewMessageModal.css";

const NewMessageModal = ({ closeModal, onSelectChat }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const getInitials = (name) =>
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "";

  // Fetch followers, followings, and connections paged by 10
  useEffect(() => {
    let isCancelled = false;

    const fetchNetworkContacts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const url = `/users/network-contacts?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(buildApiUrl(url), {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });

        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(json?.error || "Failed to load network members");
        }

        const data = await response.json();
        if (!isCancelled) {
          setUsers(data.contacts || []);
          setTotal(data.total || 0);
          setTotalPages(Math.max(1, data.totalPages || 1));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchNetworkContacts();

    return () => {
      isCancelled = true;
    };
  }, [page, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleSend = async () => {
    if (!selectedUser || !messageText.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("authToken");
      const receiverId = selectedUser.id || selectedUser._id;
      const response = await fetch(buildApiUrl("/messages"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          receiverId,
          content: messageText.trim(),
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || "Failed to send message");
      }

      if (onSelectChat) {
        onSelectChat(selectedUser);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleExpandToMessaging = () => {
    closeModal();
    navigate("/messaging");
  };

  return (
    <div className="newMessageModal">
      <div className="newMessageHeader">
        <span>New message</span>
        <div className="headerBtns">
          <span
            onClick={handleExpandToMessaging}
            title="Open full messaging page"
            style={{ cursor: "pointer" }}
          >
            <FaExternalLinkAlt size={13} color="#666" />
          </span>
          <span onClick={closeModal} title="Close" style={{ cursor: "pointer" }}>
            <FaTimes size={15} color="#666" />
          </span>
        </div>
      </div>

      {!selectedUser ? (
        <>
          <div className="receiverInput">
            <input
              placeholder="Type a name"
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>

          <div className="suggestedTitle">
            Suggested
          </div>

          <div className="suggestedList">
            {loading && (
              <div className="newMsgStateMessage">
                Loading network members...
              </div>
            )}

            {error && (
              <div className="newMsgStateMessage newMsgErrorMessage">
                {error}
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <div className="newMsgEmptyState">
                <p>
                  {searchTerm
                    ? `No connections or followers match "${searchTerm}"`
                    : "No connections, followers, or following found"}
                </p>
                <span>
                  {searchTerm
                    ? "Try a different spelling or name."
                    : "Connect with or follow members to message them."}
                </span>
              </div>
            )}

            {!loading &&
              !error &&
              users.map((item) => (
                <div
                  key={item.id || item._id}
                  className="suggestedUser"
                  onClick={() => setSelectedUser(item)}
                >
                  {item.avatar?.url ? (
                    <img
                      src={item.avatar.url}
                      alt={item.name}
                      className="suggestedAvatar"
                    />
                  ) : (
                    <div className="suggestedAvatar suggestedAvatarFallback">
                      {getInitials(item.name) || <CgProfile size={22} />}
                    </div>
                  )}

                  <div className="suggestedUserInfo">
                    <div className="suggestedUserNameRow">
                      <span className="suggestedUserName">{item.name}</span>
                      <span className="suggestedRelationBadge">
                        {item.isConnected
                          ? "Connection"
                          : item.isFollowing
                          ? "Following"
                          : "Follower"}
                      </span>
                    </div>
                    {item.headline && (
                      <span className="suggestedUserHeadline">
                        {item.headline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination controls: 10 list members per page */}
          {!loading && !error && total > 0 && (
            <div className="newMsgPagination">
              <button
                type="button"
                className="newMsgPageBtn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous 10 members"
              >
                <FaChevronLeft size={10} /> Prev
              </button>

              <span className="newMsgPageInfo">
                Page {page} of {totalPages} ({total} members)
              </span>

              <button
                type="button"
                className="newMsgPageBtn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next 10 members"
              >
                Next <FaChevronRight size={10} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="messageComposer">
          <div className="selectedUserLabel">
            <span>
              To: <strong>{selectedUser.name}</strong>
            </span>
            <span
              className="selectedUserChangeBtn"
              onClick={() => setSelectedUser(null)}
            >
              Change
            </span>
          </div>

          <div className="messageInputArea">
            <textarea
              placeholder="Write a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="messageSendBtn"
              title="Send message"
            >
              {sending ? "..." : <FaPaperPlane size={13} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewMessageModal;