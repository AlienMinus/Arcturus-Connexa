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

const ProfileHeader = ({
  profile,
  onEdit,
  onFollow,
  onConnectRequest,
  onAcceptConnection,
  onDeclineConnection,
  actionState = {},
}) => {
  const {
    isFollowing,
    isConnected,
    hasOutgoingConnectionRequest,
    hasIncomingConnectionRequest,
    loading: actionLoading,
  } = actionState;

  const renderConnectionButton = () => {
    if (profile?.isConnected) {
      return <button className="connectedButton" type="button">Connected</button>;
    }
    if (hasIncomingConnectionRequest) {
      return (
        <div className="connectionActions">
          <button className="acceptConnectionButton" type="button" onClick={onAcceptConnection} disabled={actionLoading}>
            Accept
          </button>
          <button className="declineConnectionButton" type="button" onClick={onDeclineConnection} disabled={actionLoading}>
            Decline
          </button>
        </div>
      );
    }
    if (hasOutgoingConnectionRequest) {
      return <button className="pendingButton" type="button" disabled>Request Sent</button>;
    }
    return (
      <button className="connectButton" type="button" onClick={onConnectRequest} disabled={actionLoading}>
        Connect
      </button>
    );
  };

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
            <span>{profile.followersCount || 0} followers</span>
            <span>{profile.followingCount || 0} following</span>
            <span>{profile.connectionsCount || 0} connections</span>
          </div>
          {onFollow || onConnectRequest ? (
            <div className="actionButtons">
              {onFollow && (
                <button
                  className={`followButton ${isFollowing ? 'following' : ''}`}
                  type="button"
                  onClick={onFollow}
                  disabled={actionLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {onConnectRequest && renderConnectionButton()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
