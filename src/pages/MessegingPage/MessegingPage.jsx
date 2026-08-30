import React, { useState, useRef, useEffect } from "react";
import { FaEdit, FaEllipsisH, FaCheckDouble, FaCog, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import ConversationList from "../../components/Home/Messenger/ConversationList";
import MessageSearch from "../../components/Home/Messenger/MessageSearch";
import ChatWindow from "../../components/Home/Messenger/ChatWindow";
import NewMessageModal from "../../components/Home/Messenger/NewMessageModal";
import useMediaQuery from "../../hooks/useMediaQuery";
import "./MessegingPage.css";

const MessegingPage = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [isComposing, setIsComposing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`messaging-page-container ${activeChat ? "has-active-chat" : ""}`}>
      {/* On mobile: Render conversation list only when NO chat is open */}
      {(!isMobile || !activeChat) && (
        <div className="messaging-sidebar">
          <div className="messaging-sidebar-header">
            <div className="sidebarHeaderTitleRow">
              <h2>Messaging</h2>
              <div className="sidebarHeaderActions">
                <div className="sidebarMenuWrapper" ref={menuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="msgActionIconBtn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    title="Options"
                  >
                    <FaEllipsisH size={14} />
                  </button>

                  {menuOpen && (
                    <div className="messagingHeaderMenu">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                        }}
                      >
                        <FaCheckDouble size={12} color="#0a66c2" />
                        <span>Mark all as read</span>
                      </button>
                      <Link to="/settings" onClick={() => setMenuOpen(false)}>
                        <FaCog size={12} color="#64748b" />
                        <span>Messaging settings</span>
                      </Link>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="msgActionIconBtn"
                  onClick={() => setIsComposing(true)}
                  title="Compose new message"
                >
                  <FaEdit size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="messaging-search-container">
            <MessageSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
            />
          </div>

          <div className="messaging-list-container">
            <ConversationList
              onSelectChat={(chat) => {
                setActiveChat(chat);
                setIsComposing(false);
              }}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      )}

      {/* On mobile: Render chat main pane only when a chat IS active */}
      {(!isMobile || Boolean(activeChat)) && (
        <div className="messaging-main">
          {activeChat ? (
            <ChatWindow contact={activeChat} closeChat={() => setActiveChat(null)} />
          ) : isComposing ? (
            <div className="composeContainer">
              <NewMessageModal closeModal={() => setIsComposing(false)} />
            </div>
          ) : (
            <div className="messaging-empty-state">
              <img src="/logo.png" alt="Arcturus" className="empty-state-logo" />
              <h2>Select a message</h2>
              <p>Choose from your existing conversations, start a new one, or simply keep swimming.</p>
              <button
                type="button"
                className="startNewMsgBtn"
                onClick={() => setIsComposing(true)}
              >
                <FaEdit size={13} /> <span>New Message</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Compose modal overlay if opened in floating mode */}
      {isComposing && !isMobile && activeChat && (
        <div className="composeFloatingModal">
          <NewMessageModal closeModal={() => setIsComposing(false)} />
        </div>
      )}
    </div>
  );
};

export default MessegingPage;
