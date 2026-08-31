import React from "react";
import { Link } from "react-router-dom";
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
  const profileLink = `/profile/${encodeURIComponent(profile?.username || profile?.name || '')}`;

  return (
    <div className="card profileCard">
      <Link to={profileLink} className="profileCoverLink">
        {profile?.backgroundImage?.url ? (
          <img
            className="cover"
            src={profile.backgroundImage.url}
            alt="Profile cover"
          />
        ) : (
          <div className="cover coverFallback" />
        )}
      </Link>

      <Link to={profileLink} className="profileAvatarLink">
        {profile?.avatar?.url ? (
          <img
            className="avatar"
            src={profile.avatar.url}
            alt={profile?.name || "Profile avatar"}
          />
        ) : (
          <CgProfile className="avatar avatarFallback" />
        )}
      </Link>

      <div className="profile-text-container">
        <Link to={profileLink} className="profileNameLink" style={{ textDecoration: 'none' }}>
          <div className="profile-name-container">
            <h3 className="profile-name">{profile?.name || ''}</h3>
            <MdVerified className="verified-icon" />
          </div>
        </Link>
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