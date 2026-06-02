import React from "react";
import { FaEllipsisH, FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa";

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const MessengerHeader = ({ profile, openNewMessage, toggle, isOpen }) => {
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
          <div className="profileImg profileImgFallback">
            {getInitials(profile?.name)}
          </div>
        )}

        <span>Messaging</span>

      </div>

      <div className="headerIcons">

        <span style={{ cursor: "pointer" }}><FaEllipsisH /></span>

        <span onClick={openNewMessage} style={{ cursor: "pointer", position: "relative" }}>
          <FaEdit />
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
            2
          </span>
        </span>

        <span style={{ cursor: "pointer" }} onClick={toggle}>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </span>

      </div>

    </div>
  );
};

export default MessengerHeader;