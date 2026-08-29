import React, { useState } from 'react';
import { CgProfile } from "react-icons/cg";
import { FaPencilAlt, FaUserPlus, FaUserCheck, FaCheck } from "react-icons/fa";
import ProfileNetworkModal from './ProfileNetworkModal';

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

  const [networkModalTab, setNetworkModalTab] = useState(null);

  const followers = profile?.followers || [];
  const following = profile?.following || [];
  const connections = profile?.connections || [];

  const followersCount = profile?.followersCount ?? followers.length;
  const followingCount = profile?.followingCount ?? following.length;
  const connectionsCount = profile?.connectionsCount ?? connections.length;
  const postsCount = profile?.posts?.length || 0;

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

  const renderSocialProof = () => {
    const list = followers.length > 0 ? followers : connections;
    const isFollowers = followers.length > 0;
    const verb = isFollowers ? 'Followed by' : 'Connected with';

    if (list.length === 0) {
      if (followersCount === 0 && connectionsCount === 0) return null;
      return (
        <div 
          className="profileSocialProof" 
          onClick={() => setNetworkModalTab('followers')}
          role="button"
          tabIndex={0}
        >
          <span className="socialProofText">
            <strong>{followersCount}</strong> followers · <strong>{connectionsCount}</strong> connections
          </span>
        </div>
      );
    }

    const sampleUsers = list.slice(0, 3);
    const totalCount = isFollowers ? followersCount : connectionsCount;
    const remainingCount = Math.max(0, totalCount - Math.min(2, list.length));

    return (
      <div
        className="profileSocialProof"
        onClick={() => setNetworkModalTab(isFollowers ? 'followers' : 'connections')}
        role="button"
        tabIndex={0}
      >
        <div className="avatarStack">
          {sampleUsers.map((u, i) => {
            const avatarUrl = u.avatar?.url || (typeof u.avatar === 'string' ? u.avatar : null);
            return avatarUrl ? (
              <img
                key={u.id || u.username || i}
                src={avatarUrl}
                alt={u.name || 'User'}
                className="avatarStackItem"
              />
            ) : (
              <div key={u.id || u.username || i} className="avatarStackItem avatarStackFallback">
                {u.name?.[0] || 'U'}
              </div>
            );
          })}
        </div>
        <div className="socialProofText">
          <span>{verb} </span>
          <strong>{list[0]?.name || list[0]?.username}</strong>
          {list[1] && (
            <>
              <span>, </span>
              <strong>{list[1]?.name || list[1]?.username}</strong>
            </>
          )}
          {remainingCount > 0 && (
            <>
              <span> and </span>
              <strong>{remainingCount} other{remainingCount > 1 ? 's' : ''}</strong>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
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

              {/* Header Stats Numbers (Posts, Followers, Following, Connections) */}
              <div className="profileHeaderStatsRow">
                <div className="profileHeaderStatBox">
                  <span className="profileStatNumber">{postsCount}</span>
                  <span className="profileStatLabel">Posts</span>
                </div>
                <div
                  className="profileHeaderStatBox clickable"
                  onClick={() => setNetworkModalTab('followers')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="profileStatNumber">{followersCount}</span>
                  <span className="profileStatLabel">Followers</span>
                </div>
                <div
                  className="profileHeaderStatBox clickable"
                  onClick={() => setNetworkModalTab('following')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="profileStatNumber">{followingCount}</span>
                  <span className="profileStatLabel">Following</span>
                </div>
                <div
                  className="profileHeaderStatBox clickable"
                  onClick={() => setNetworkModalTab('connections')}
                  role="button"
                  tabIndex={0}
                >
                  <span className="profileStatNumber">{connectionsCount}</span>
                  <span className="profileStatLabel">Connections</span>
                </div>
              </div>
            </div>

            {/* Social Proof Row: Overlapping Avatars + "Followed by ... and X others" */}
            {renderSocialProof()}

            {/* Action Buttons */}
            <div className="profileHeaderActions">
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

              {onEdit && (
                <button className="editProfileButton" type="button" onClick={onEdit}>
                  <FaPencilAlt size={12} /> Edit profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Modal */}
      <ProfileNetworkModal
        isOpen={Boolean(networkModalTab)}
        initialTab={networkModalTab || 'followers'}
        onClose={() => setNetworkModalTab(null)}
        followers={followers}
        following={following}
        connections={connections}
      />
    </>
  );
};

export default ProfileHeader;
