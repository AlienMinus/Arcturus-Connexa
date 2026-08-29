import React from 'react';
import { CgProfile } from "react-icons/cg";
import { FaPencilAlt, FaUserPlus, FaUserCheck, FaCheck } from "react-icons/fa";

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
    if (isConnected) {
      return (
        <button className="connectedButton" type="button" disabled>
          <FaCheck size={12} /> Connected
        </button>
      );
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
      return (
        <button className="pendingButton" type="button" disabled>
          Pending
        </button>
      );
    }
    return (
      <button className="connectButton" type="button" onClick={onConnectRequest} disabled={actionLoading}>
        <FaUserPlus size={13} /> Connect
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
            : 'linear-gradient(135deg, #0a4373 0%, #0077b5 50%, #00a0dc 100%)',
        }}
      >
        {!profile.backgroundImage?.url && (
          <div className="profileCoverFallback">Arcturus Network</div>
        )}
      </div>

      <div className="profileIntroCard">
        <div className="profileAvatarWrapper">
          {profile.avatar?.url ? (
            <img
              className="profileAvatarLarge"
              src={profile.avatar.url}
              alt={profile.name}
            />
          ) : (
            <CgProfile className="profileAvatarLarge profileAvatarLargeFallback" />
          )}
        </div>

        <div className="profileIntroText">
          <div className="profileIntroTop">
            <div className="profileInfoPrimary">
              <h1 className="profileName">{profile.name}</h1>
              {profile.headline && <p className="profileHeadline">{profile.headline}</p>}
              {profile.location && <p className="profileLocation">{profile.location}</p>}
            </div>
            {onEdit && (
              <button className="editProfileButton" type="button" onClick={onEdit}>
                <FaPencilAlt size={12} /> Edit profile
              </button>
            )}
          </div>

          <div className="profileStats">
            <span className="profileStatItem"><strong>{profile.connectionsCount || 0}</strong> connections</span>
            <span className="profileStatDot">•</span>
            <span className="profileStatItem"><strong>{profile.followersCount || 0}</strong> followers</span>
            <span className="profileStatDot">•</span>
            <span className="profileStatItem"><strong>{profile.followingCount || 0}</strong> following</span>
          </div>

          {(onFollow || onConnectRequest) && (
            <div className="actionButtons">
              {onFollow && (
                <button
                  className={`followButton ${isFollowing ? 'following' : ''}`}
                  type="button"
                  onClick={onFollow}
                  disabled={actionLoading}
                >
                  {isFollowing ? (
                    <><FaUserCheck size={13} /> Following</>
                  ) : (
                    <><FaUserPlus size={13} /> Follow</>
                  )}
                </button>
              )}
              {onConnectRequest && renderConnectionButton()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
