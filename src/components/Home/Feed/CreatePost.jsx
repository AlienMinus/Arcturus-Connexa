import React, { useState } from "react";
import { FaImage, FaVideo, FaCalendarAlt, FaNewspaper } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { Link } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";
import PostModal from "./PostModal";

const CreatePost = ({ onPostCreated }) => {
  const { profile } = useProfile();
  const [modalTool, setModalTool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModalWithTool = (tool = null) => {
    setModalTool(tool);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTool(null);
  };

  const profileLink = `/profile/${encodeURIComponent(profile?.username || profile?.name || '')}`;

  return (
    <>
      <div className="card createPostCard">
        <div className="createPostTop">
          <Link to={profileLink} className="createPostAvatarLink" title="View your profile">
            {profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Avatar"}
                className="postAvatar"
              />
            ) : (
              <CgProfile className="postAvatar postAvatarFallback" />
            )}
          </Link>
          <input
            type="text"
            placeholder="Start a post"
            className="postInput"
            onClick={() => openModalWithTool(null)}
            readOnly
          />
        </div>
        <div className="createPostBottom">
          <div className="postOption" onClick={() => openModalWithTool('media')}>
            <FaImage color="#70b5f9" /> <span>Media</span>
          </div>
          <div className="postOption" onClick={() => openModalWithTool('video')}>
            <FaVideo color="#7fc15e" /> <span>Video</span>
          </div>
          <div className="postOption" onClick={() => openModalWithTool('event')}>
            <FaCalendarAlt color="#e7a33e" /> <span>Event</span>
          </div>
          <div className="postOption" onClick={() => openModalWithTool('article')}>
            <FaNewspaper color="#fc9295" /> <span>Write article</span>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <PostModal
          closeModal={closeModal}
          onPostCreated={onPostCreated}
          profile={profile}
          initialTool={modalTool}
        />
      )}
    </>
  );
};

export default CreatePost;