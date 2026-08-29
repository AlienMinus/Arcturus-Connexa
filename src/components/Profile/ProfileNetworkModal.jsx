import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaUserFriends, FaUserPlus, FaUsers } from 'react-icons/fa';
import './Profile.css';

const ProfileNetworkModal = ({
  isOpen,
  onClose,
  initialTab = 'followers',
  followers = [],
  following = [],
  connections = [],
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const getActiveList = () => {
    switch (activeTab) {
      case 'followers':
        return { title: 'Followers', list: followers };
      case 'following':
        return { title: 'Following', list: following };
      case 'connections':
      default:
        return { title: 'Connections', list: connections };
    }
  };

  const { title: currentTitle, list: currentList } = getActiveList();

  return (
    <div className="networkModalOverlay" onClick={onClose}>
      <div className="networkModalContent" onClick={(e) => e.stopPropagation()}>
        {/* Header with Close */}
        <div className="networkModalHeader">
          <div className="networkModalTabs">
            <button
              type="button"
              className={`networkTabBtn ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              Followers ({followers.length})
            </button>
            <button
              type="button"
              className={`networkTabBtn ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              Following ({following.length})
            </button>
            <button
              type="button"
              className={`networkTabBtn ${activeTab === 'connections' ? 'active' : ''}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections ({connections.length})
            </button>
          </div>
          <button type="button" className="networkModalCloseBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>
        </div>

        {/* User List */}
        <div className="networkModalBody">
          {currentList.length === 0 ? (
            <div className="networkEmptyState">
              <FaUsers className="networkEmptyIcon" />
              <h4>No {currentTitle.toLowerCase()} to display</h4>
              <p>When this member builds their network, they will appear here.</p>
            </div>
          ) : (
            <div className="networkUserList">
              {currentList.map((user, idx) => {
                const avatarUrl = user.avatar?.url || (typeof user.avatar === 'string' ? user.avatar : null);
                const targetLink = user.username ? `/profile/${encodeURIComponent(user.username)}` : null;

                return (
                  <div key={user.id || user.username || idx} className="networkUserRow">
                    <Link
                      to={targetLink || '#'}
                      className="networkUserInfo"
                      onClick={onClose}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={user.name || 'User'} className="networkUserAvatar" />
                      ) : (
                        <div className="networkUserAvatarFallback">{user.name?.[0] || 'U'}</div>
                      )}
                      <div className="networkUserDetails">
                        <h4 className="networkUserName">{user.name || user.username}</h4>
                        <p className="networkUserHeadline">{user.headline || 'Member'}</p>
                      </div>
                    </Link>

                    {targetLink && (
                      <Link
                        to={targetLink}
                        className="networkViewProfileBtn"
                        onClick={onClose}
                      >
                        View profile
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileNetworkModal;

