import React from "react";
import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import "./NewMessageModal.css";

const NewMessageModal = ({ closeModal }) => {

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  const suggested = [
    { id: 'suggested-01', name: 'Barsa Priyadarshini Parida' },
    { id: 'suggested-02', name: 'Suman Barik' },
    { id: 'suggested-03', name: 'Ipsita Priyadarsani' },
    { id: 'suggested-04', name: 'Chimgozirim Akagha' },
    { id: 'suggested-05', name: 'Vamsi Krishna Sanaka' },
    { id: 'suggested-06', name: 'Smrutiranjan Mahanta' },
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

        {suggested.map((item) => (
          <div key={item.id} className="suggestedUser">
            <div className="suggestedAvatar suggestedAvatarFallback">
              {getInitials(item.name)}
            </div>
            <span>{item.name}</span>
          </div>
        ))}

      </div>

    </div>
  );
};

export default NewMessageModal;