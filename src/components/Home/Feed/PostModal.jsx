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
import { useAuth } from "../../../context/AuthContext";
import "./Feed.css";

const PostModal = ({ closeModal, onPostCreated, profile }) => {
  const { token } = useAuth();
  const [isAudienceMenuOpen, setIsAudienceMenuOpen] = useState(false);
  const [audience, setAudience] = useState("Anyone");

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleAudienceMenu = () => setIsAudienceMenuOpen(!isAudienceMenuOpen);

  const selectAudience = (selectedAudience) => {
    setAudience(selectedAudience);
    setIsAudienceMenuOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setMediaFile(file || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() && !mediaFile) {
      setError("Please add text or select media before posting.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || "Failed to create post.");
      }

      await response.json();
      onPostCreated?.();
      closeModal();
    } catch (submitError) {
      setError(submitError.message || "Unable to submit post.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <form className="postModal" onSubmit={handleSubmit}>
        {/* HEADER */}
        <div className="postHeader">
          <div className="postUser">
            {profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Avatar"}
                className="postAvatar"
              />
            ) : (
              <div className="postAvatar postAvatarFallback">
                {profile?.name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
              </div>
            )}
            <div>
              <h4>{profile?.name || ''}</h4>
              <div className="audience-dropdown">
                <button className="audience-button" type="button" onClick={toggleAudienceMenu}>
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
          <button className="closeBtn" type="button" onClick={closeModal}>
            ✕
          </button>
        </div>

        {/* EDITOR */}
        <textarea
          className="postInputArea"
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        {error && <div className="formError">{error}</div>}

        <div className="emojiRow">
          <span>
            <BsEmojiSmile />
          </span>
        </div>

        {/* TOOLS */}
        <div className="postTools">
          <button className="aiButton" type="button">
            <FaMagic /> Rewrite with AI
          </button>
          <label className="mediaInputLabel">
            <FaImage />
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
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
          <button className="postButton" type="submit" disabled={isLoading}>
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostModal;
