import React, { useState } from "react";
import { useProfile } from "../../../context/ProfileContext";
import MessengerHeader from "./MessengerHeader";
import MessageSearch from "./MessageSearch";
import MessageTabs from "./MessageTabs";
import ConversationList from "./ConversationList";
import NewMessageModal from "./NewMessageModal";
import ChatWindow from "./ChatWindow";
import "./Messenger.css";

const Messenger = () => {
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("focused");
  const { profile } = useProfile();

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className={`messenger ${!isOpen ? "closed" : ""}`}>
        <MessengerHeader
          profile={profile}
          openNewMessage={() => setShowNewMessage(true)}
          toggle={toggle}
          isOpen={isOpen}
        />
        {isOpen && (
          <>
            <MessageSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <ConversationList
              onSelectChat={setActiveChat}
              searchTerm={searchTerm}
              activeTab={activeTab}
            />
          </>
        )}
      </div>
      {showNewMessage && (
        <NewMessageModal
          closeModal={() => setShowNewMessage(false)}
          onSelectChat={(contact) => {
            setShowNewMessage(false);
            setActiveChat(contact);
          }}
        />
      )}
      {activeChat && (
        <ChatWindow contact={activeChat} closeChat={() => setActiveChat(null)} />
      )}
    </>
  );
};

export default Messenger;