import React from "react";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import "./NewMessageModal.css";

const NewMessageModal = ({ closeModal }) => {

  const suggested = [
    "Barsa Priyadarshini Parida",
    "Suman Barik",
    "Ipsita Priyadarsani",
    "Chimgozirim Akagha",
    "Vamsi Krishna Sanaka",
    "Smrutiranjan Mahanta"
  ];

  return (
    <div className="newMessageModal">

      <div className="newMessageHeader">

        <span>New message</span>

        <div className="headerBtns">

          <span style={{ cursor: "pointer" }}><FaExternalLinkAlt size={14} color="#666" /></span>

          <span onClick={closeModal} style={{ cursor: "pointer" }}><FaTimes size={16} color="#666" /></span>

        </div>

      </div>

      <div className="receiverInput">

        <input
          placeholder="Type a name or multiple names"
        />

      </div>

      <div className="suggestedTitle">

        Suggested

      </div>

      <div className="suggestedList">

        {suggested.map((name, i) => (
          <div key={i} className="suggestedUser">

            <img
              src={`https://i.pravatar.cc/40?u=${name}`}
              alt=""
            />

            <span>{name}</span>

          </div>
        ))}

      </div>

    </div>
  );
};

export default NewMessageModal;