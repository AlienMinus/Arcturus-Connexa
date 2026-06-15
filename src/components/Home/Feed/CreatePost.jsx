import React, { useState } from "react";
import { FaImage, FaVideo, FaCalendarAlt, FaNewspaper } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { useProfile } from "../../../context/ProfileContext";
import PostModal from "./PostModal";

const CreatePost = ({ onPostCreated }) => {
  const { profile } = useProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="card createPostCard">
        <div className="createPostTop" onClick={openModal}>
          {profile?.avatar?.url ? (
            <img
              src={profile.avatar.url}
              alt={profile?.name || "Avatar"}
              className="postAvatar"
            />
          ) : (
            <CgProfile className="postAvatar postAvatarFallback" />
          )}
          <input type="text" placeholder="Start a post" className="postInput" readOnly />
        </div>
        <div className="createPostBottom">
          <div className="postOption" onClick={openModal}><FaImage color="#70b5f9" /> <span>Media</span></div>
          <div className="postOption" onClick={openModal}><FaVideo color="#7fc15e" /> <span>Video</span></div>
          <div className="postOption" onClick={openModal}><FaCalendarAlt color="#e7a33e" /> <span>Event</span></div>
          <div className="postOption" onClick={openModal}><FaNewspaper color="#fc9295" /> <span>Write article</span></div>
        </div>
      </div>
      {isModalOpen && <PostModal closeModal={closeModal} onPostCreated={onPostCreated} profile={profile} />}
    </>
  );
};

export default CreatePost;