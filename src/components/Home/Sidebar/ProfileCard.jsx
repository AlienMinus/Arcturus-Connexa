import React from "react";
import { FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { CgProfile } from "react-icons/cg";

import { useProfile } from '../../../context/ProfileContext';

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const ProfileCard = () => {
  const { profile } = useProfile();

  return (
    <div className="card profileCard">
      {profile?.backgroundImage?.url ? (
        <img
          className="cover"
          src={profile.backgroundImage.url}
          alt="Profile cover"
        />
      ) : (
        <div className="cover coverFallback" />
      )}
      {profile?.avatar?.url ? (
        <img
          className="avatar"
          src={profile.avatar.url}
          alt={profile?.name || "Profile avatar"}
        />
      ) : (
        <CgProfile className="avatar avatarFallback" />
      )}
      <div className="profile-text-container">
        <div className="profile-name-container">
          <h3 className="profile-name">{profile?.name || ''}</h3>
          <MdVerified className="verified-icon" />
        </div>
        <p className="description">{profile?.headline || ''}</p>
        <p className="location">
          <FaMapMarkerAlt />&nbsp;{profile?.location || ''}
        </p>
        <p className="organization">
          <FaUniversity />&nbsp;{profile?.headline || ''}
        </p>
      </div>
    </div>
  );
};

export default ProfileCard;