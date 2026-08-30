import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { FaPencilAlt, FaUserPlus, FaUserCheck, FaCheck, FaCamera, FaSpinner } from "react-icons/fa";
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import ProfileNetworkModal from './ProfileNetworkModal';

const ProfileHeader = ({
  profile,
  onEdit,
  onFollow,
  onConnectRequest,
  onAcceptConnection,
  onDeclineConnection,
  onProfileUpdate,
  actionState = {},
}) => {
  const navigate = useNavigate();
  const { refreshProfile } = useProfile();
  const {
    isFollowing,
    isConnected,
    hasOutgoingConnectionRequest,
    hasIncomingConnectionRequest,
    loading: actionLoading,
  } = actionState;

  const [networkModalTab, setNetworkModalTab] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const followers = profile?.followers || [];
  const following = profile?.following || [];
  const connections = profile?.connections || [];

  const followersCount = profile?.followersCount ?? followers.length;
  const followingCount = profile?.followingCount ?? following.length;
  const connectionsCount = profile?.connectionsCount ?? connections.length;
  const postsCount = profile?.posts?.length || 0;

  const isOwnProfile = Boolean(onEdit);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(buildApiUrl('/profile/avatar'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile && onProfileUpdate) {
          onProfileUpdate(data.profile);
        } else if (data.avatar) {
          onProfileUpdate?.({ avatar: data.avatar });
        }
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('backgroundImage', file);

      const res = await fetch(buildApiUrl('/profile/cover'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile && onProfileUpdate) {
          onProfileUpdate(data.profile);
        } else if (data.backgroundImage) {
          onProfileUpdate?.({ backgroundImage: data.backgroundImage });
        }
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to upload cover banner', err);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

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
        {/* Cover Photo */}
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

          {isOwnProfile && (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
              />
              <button
                type="button"
                className="profileCoverCameraBtn"
                onClick={() => coverInputRef.current?.click()}
                title="Change cover banner"
                disabled={uploadingCover}
              >
                {uploadingCover ? <FaSpinner className="spinAnimation" size={12} /> : <FaCamera size={12} />}
                <span>{uploadingCover ? 'Updating...' : 'Edit cover'}</span>
              </button>
            </>
          )}
        </div>

        <div className="profileIntroCard">
          {/* Avatar with Camera Change Button at Bottom-Right */}
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

            {isOwnProfile && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className="profileAvatarCameraBtn"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Change profile picture"
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <FaSpinner className="spinAnimation" size={13} /> : <FaCamera size={13} />}
                </button>
              </>
            )}
          </div>

          <div className="profileIntroText">
            <div className="profileIntroTop">
              <div className="profileInfoPrimary">
                <h1 className="profileName">{profile.name}</h1>
                {profile.headline && <p className="profileHeadline">{profile.headline}</p>}
                {profile.location && <p className="profileLocation">{profile.location}</p>}
              </div>

              {/* Header Stats Numbers */}
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

            {/* Social Proof Row */}
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
