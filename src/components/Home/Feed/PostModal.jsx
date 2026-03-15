import React, { useState } from "react";
import {
  FaImage,
  FaCalendarAlt,
  FaTrophy,
  FaBriefcase,
  FaPoll,
  FaFileAlt,
  FaCamera,
  FaMagic,
  FaCaretDown,
} from "react-icons/fa";
import { BsEmojiSmile, BsClockHistory } from "react-icons/bs";
import "./Feed.css";

const PostModal = ({ closeModal }) => {
  const [isAudienceMenuOpen, setIsAudienceMenuOpen] = useState(false);
  const [audience, setAudience] = useState("Anyone");

  const toggleAudienceMenu = () => setIsAudienceMenuOpen(!isAudienceMenuOpen);

  const selectAudience = (selectedAudience) => {
    setAudience(selectedAudience);
    setIsAudienceMenuOpen(false);
  };

  return (
    <div className="modal-overlay">
      <div className="postModal">
        {/* HEADER */}
        <div className="postHeader">
          <div className="postUser">
            <img
              src="https://i.pravatar.cc/150?u=123"
              alt=""
              className="postAvatar"
            />
            <div>
              <h4>Manas R. Das</h4>
              <div className="audience-dropdown">
                <button className="audience-button" onClick={toggleAudienceMenu}>
                  <span>{audience}</span>
                  <FaCaretDown />
                </button>
                {isAudienceMenuOpen && (
                  <ul className="audience-menu">
                    <li onClick={() => selectAudience("Anyone")}>Anyone</li>
                    <li onClick={() => selectAudience("Anyone + Twitter")}>Anyone + Twitter</li>
                    <li onClick={() => selectAudience("Connections only")}>Connections only</li>
                    <li onClick={() => selectAudience("Group")}>Group</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          <button className="closeBtn" onClick={closeModal}>
            ✕
          </button>
        </div>
        {/* EDITOR */}
        <textarea
          className="postInputArea"
          placeholder="What do you want to talk about?"
        />
        {/* EMOJI */}
        <div className="emojiRow">
          <span>
            <BsEmojiSmile />
          </span>
        </div>
        
        {/* TOOLS */}
        <div className="postTools">
          {/* AI BUTTON */}
        <button className="aiButton">
          <FaMagic /> Rewrite with AI
        </button>
          <span>
            <FaImage />
          </span>
          <span>
            <FaCalendarAlt />
          </span>
          <span>
            <FaTrophy />
          </span>
          <span>
            <FaBriefcase />
          </span>
          <span>
            <FaPoll />
          </span>
          <span>
            <FaFileAlt />
          </span>
          <span>
            <FaCamera />
          </span>
        </div>
        {/* FOOTER */}
        <div className="postFooter">
          <span className="schedule">
            <BsClockHistory />
          </span>
          <button className="postButton">Post</button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
