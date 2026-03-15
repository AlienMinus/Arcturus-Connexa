import React, { useState } from "react";
import { FaImage, FaVideo, FaCalendarAlt, FaNewspaper } from "react-icons/fa";
import PostModal from "./PostModal";

const CreatePost = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="card createPostCard">
        <div className="createPostTop" onClick={openModal}>
          <img src="https://i.pravatar.cc/150?u=123" alt="Avatar" className="postAvatar" />
          <input type="text" placeholder="Start a post" className="postInput" readOnly />
        </div>
        <div className="createPostBottom">
          <div className="postOption"><FaImage color="#70b5f9" /> <span>Media</span></div>
          <div className="postOption"><FaVideo color="#7fc15e" /> <span>Video</span></div>
          <div className="postOption"><FaCalendarAlt color="#e7a33e" /> <span>Event</span></div>
          <div className="postOption"><FaNewspaper color="#fc9295" /> <span>Write article</span></div>
        </div>
      </div>
      {isModalOpen && <PostModal closeModal={closeModal} />}
    </>
  );
};

export default CreatePost;