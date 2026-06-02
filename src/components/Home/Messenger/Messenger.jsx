import React, { useState } from "react";
import { useProfile } from "../../../context/ProfileContext";
import MessengerHeader from "./MessengerHeader";
import MessageSearch from "./MessageSearch";
import MessageTabs from "./MessageTabs";
import ConversationList from "./ConversationList";
import NewMessageModal from "./NewMessageModal";
import "./Messenger.css";

const Messenger = () => {
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
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
            <MessageSearch />
            <MessageTabs />
            <ConversationList />
          </>
        )}
      </div>
      {showNewMessage && (
        <NewMessageModal closeModal={() => setShowNewMessage(false)} />
      )}
    </>
  );
};

export default Messenger;