import React, { useState } from "react";
import ConversationList from "../../components/Home/Messenger/ConversationList";
import MessageSearch from "../../components/Home/Messenger/MessageSearch";
import ChatWindow from "../../components/Home/Messenger/ChatWindow";
import "./MessegingPage.css";

const MessegingPage = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="messaging-page-container">
      <div className="messaging-sidebar">
        <div className="messaging-sidebar-header">
          <h2>Messaging</h2>
        </div>
        <div className="messaging-search-container">
          <MessageSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <div className="messaging-list-container">
          <ConversationList onSelectChat={setActiveChat} searchTerm={searchTerm} />
        </div>
      </div>
      <div className="messaging-main">
        {activeChat ? (
          <ChatWindow contact={activeChat} closeChat={() => setActiveChat(null)} />
        ) : (
          <div className="messaging-empty-state">
            <img src="/logo.png" alt="LinkedIn" className="empty-state-logo" />
            <h2>Select a message</h2>
            <p>Choose from your existing conversations, start a new one, or simply keep swimming.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessegingPage;
