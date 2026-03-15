import React from "react";
import { FaEllipsisH, FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa";

const MessengerHeader = ({ openNewMessage, toggle, isOpen }) => {
  return (
    <div className="messengerHeader">

      <div className="headerLeft">

        <img
          src="https://i.pravatar.cc/150?u=123"
          alt=""
          className="profileImg"
        />

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