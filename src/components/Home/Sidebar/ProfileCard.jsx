import React from "react";
import { FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const ProfileCard = () => {
  return (
    <div className="card profileCard">

      <img
        className="cover"
        src="https://picsum.photos/300/90"
        alt=""
      />

      <img
        className="avatar"
        src="https://i.pravatar.cc/150?u=123"
        alt=""
      />

      <div className="profile-text-container">
        <div className="profile-name-container">
          <h3 className="profile-name">Manas R. Das</h3>
          <MdVerified className="verified-icon" />
        </div>

        <p className="description">
          AI Engineer | Project Strategist |
          MERN Stack Developer | IoT
        </p>

        <p className="location">
          <FaMapMarkerAlt />&nbsp;Cuttack, Odisha
        </p>

        <p className="organization">
          <FaUniversity />&nbsp;Ajay Binay Institute of Technology, Cuttack
        </p>
      </div>

    </div>
  );
};

export default ProfileCard;