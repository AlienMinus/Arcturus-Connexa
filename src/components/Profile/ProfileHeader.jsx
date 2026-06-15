import React from 'react';
import { CgProfile } from "react-icons/cg";

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const ProfileHeader = ({ profile, onEdit }) => {
  return (
    <div className="profileHeaderCard">
      <div
        className="profileCover"
        style={{
          backgroundImage: profile.backgroundImage?.url
            ? `url(${profile.backgroundImage.url})`
            : 'linear-gradient(135deg, #0c4a6e 0%, #2563eb 100%)',
        }}
      >
        {profile.backgroundImage?.url ? null : <div className="profileCoverFallback">Arcturus Profile</div>}
      </div>
      <div className="profileIntroCard">
        {profile.avatar?.url ? (
          <img
            className="profileAvatarLarge"
            src={profile.avatar.url}
            alt={profile.name}
          />
        ) : (
          <CgProfile className="profileAvatarLarge profileAvatarLargeFallback" />
        )}
        <div className="profileIntroText">
          <div className="profileIntroTop">
            <div>
              <h1>{profile.name}</h1>
              <p className="profileHeadline">{profile.headline}</p>
              <p className="profileLocation">{profile.location}</p>
            </div>
            {onEdit && (
              <button className="editProfileButton" type="button" onClick={onEdit}>
                Edit profile
              </button>
            )}
          </div>
          <div className="profileStats">
            <span>45 profile views</span>
            <span>10 post impressions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
