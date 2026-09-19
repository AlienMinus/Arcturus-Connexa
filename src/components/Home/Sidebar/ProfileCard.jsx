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
  const profileUsername = profile?.username || profile?.userId?.username || '';
  const profileLink = profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : '/profile';

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
            {profile?.isVerified && <MdVerified className="verified-icon" title="Arcturus Verified Account" />}
          </div>
        </Link>
        <p className="description">{profile?.headline || ''}</p>
        {profile?.location && (
          <p className="location">
            <FaMapMarkerAlt />&nbsp;{profile.location}
          </p>
        )}
        {profile?.institute?.organizationId && (
          <p className="organization">
            {profile.institute.logo ? (
              <img src={profile.institute.logo} alt="" style={{ width: '13px', height: '13px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <FaUniversity />
            )}
            &nbsp;
            <Link
              to={`/company/${profile.institute.slug || profile.institute.organizationId}`}
              style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
            >
              {profile.institute.name}
            </Link>
            {profile.institute.verified && <span style={{ color: '#16a34a', marginLeft: '4px', fontSize: '11px' }}>✓</span>}
          </p>
        )}
        {!profile?.institute?.organizationId && (profile?.organization?.name || profile?.experience?.[0]?.subtitle || profile?.experience?.[0]?.title) && (
          <p className="organization">
            <FaUniversity />&nbsp;{profile?.organization?.name || profile?.experience?.[0]?.subtitle || profile?.experience?.[0]?.title}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;