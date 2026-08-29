import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaUserCheck, FaEye, FaUsers } from 'react-icons/fa';
import { buildApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './NetworkPage.css';

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Recently';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NetworkPage = () => {
  const { token } = useAuth();
  const [network, setNetwork] = useState([]);
  const [profileViewers, setProfileViewers] = useState([]);
  const [profileViewsCount, setProfileViewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const loadNetwork = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(buildApiUrl('/users/network'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(json?.error || 'Failed to load network');
        }
        const data = await response.json();
        setNetwork(data.network || []);
        setProfileViewers(data.profileViewers || []);
        setProfileViewsCount(data.profileViewsCount || data.profileViewers?.length || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadNetwork();
    } else {
      setLoading(false);
      setNetwork([]);
    }
  }, [token]);

  const performAction = async (userId, path) => {
    setActionLoadingId(userId);
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}${path}`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Action failed');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConnectRequest = async (user) => {
    const success = await performAction(user.id, '/connect');
    if (success) {
      setNetwork((current) =>
        current.map((u) => (u.id === user.id ? { ...u, hasPendingRequest: true } : u))
      );
      setProfileViewers((current) =>
        current.map((u) => (u.id === user.id ? { ...u, hasPendingRequest: true } : u))
      );
    }
  };

  const handleAccept = async (user) => {
    const success = await performAction(user.id, '/connect/accept');
    if (success) {
      setNetwork((current) =>
        current.map((u) =>
          u.id === user.id
            ? { ...u, isConnected: true, hasIncomingRequest: false }
            : u
        )
      );
      setProfileViewers((current) =>
        current.map((u) =>
          u.id === user.id
            ? { ...u, isConnected: true, hasIncomingRequest: false }
            : u
        )
      );
    }
  };

  const handleDecline = async (user) => {
    const success = await performAction(user.id, '/connect/decline');
    if (success) {
      setNetwork((current) =>
        current.map((u) =>
          u.id === user.id ? { ...u, hasIncomingRequest: false } : u
        )
      );
      setProfileViewers((current) =>
        current.map((u) =>
          u.id === user.id ? { ...u, hasIncomingRequest: false } : u
        )
      );
    }
  };

  if (loading) {
    return <div className="networkPage loading">Loading network…</div>;
  }

  if (error) {
    return <div className="networkPage error">{error}</div>;
  }

  return (
    <div className="networkPage">
      <div className="networkHeader">
        <h1>My Network</h1>
      </div>

      {/* ==========================================================================
          WHO VIEWED YOUR PROFILE SECTION
          ========================================================================== */}
      <section className="networkSectionCard">
        <div className="networkSectionHeader">
          <div className="sectionTitleRow">
            <FaEye className="sectionTitleIcon" />
            <div>
              <h2>Who viewed your profile</h2>
              <p className="sectionSubtitle">
                <strong>{profileViewsCount}</strong> member{profileViewsCount === 1 ? '' : 's'} viewed your profile
              </p>
            </div>
          </div>
        </div>

        {profileViewers.length === 0 ? (
          <div className="networkEmptyViewers">
            <p>No recent profile views recorded yet. As other Arcturus members visit your profile, they will appear here.</p>
          </div>
        ) : (
          <div className="profileViewersList">
            {profileViewers.map((viewer) => {
              const targetLink = viewer.username ? `/profile/${encodeURIComponent(viewer.username)}` : null;

              return (
                <div key={viewer.id} className="profileViewerRow">
                  <Link to={targetLink || '#'} className="viewerInfoLink">
                    <div className="viewerAvatarWrapper">
                      {viewer.avatar?.url ? (
                        <img src={viewer.avatar.url} alt={viewer.name} className="viewerAvatar" />
                      ) : (
                        <div className="viewerAvatarFallback">{getInitials(viewer.name)}</div>
                      )}
                    </div>
                    <div className="viewerDetails">
                      <h3 className="viewerName">{viewer.name}</h3>
                      <p className="viewerHeadline">{viewer.headline}</p>
                      <span className="viewerTime">Viewed {formatTimeAgo(viewer.viewedAt)}</span>
                    </div>
                  </Link>

                  <div className="viewerActions">
                    {viewer.isConnected ? (
                      <span className="networkBadge connected"><FaUserCheck size={11} /> Connected</span>
                    ) : viewer.hasPendingRequest ? (
                      <span className="networkBadge pending">Pending</span>
                    ) : viewer.hasIncomingRequest ? (
                      <button
                        type="button"
                        className="viewerActionBtn primary"
                        disabled={actionLoadingId === viewer.id}
                        onClick={() => handleAccept(viewer)}
                      >
                        Accept
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="viewerActionBtn outline"
                        disabled={actionLoadingId === viewer.id}
                        onClick={() => handleConnectRequest(viewer)}
                      >
                        <FaUserPlus size={12} /> Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================================================
          GROW YOUR NETWORK / SUGGESTIONS SECTION
          ========================================================================== */}
      <section className="networkSectionCard" style={{ marginTop: '24px' }}>
        <div className="networkSectionHeader">
          <div className="sectionTitleRow">
            <FaUsers className="sectionTitleIcon" />
            <div>
              <h2>Grow your network</h2>
              <p className="sectionSubtitle">People you may know based on your profile & activities</p>
            </div>
          </div>
        </div>

        {network.length === 0 ? (
          <p style={{ padding: '16px', color: '#64748b' }}>No more suggestions right now.</p>
        ) : (
          <div className="networkGrid">
            {network.map((user) => {
              const targetLink = user.username ? `/profile/${encodeURIComponent(user.username)}` : null;

              return (
                <div className="networkCard" key={user.id}>
                  <Link to={targetLink || '#'} className="networkCardTop" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="networkAvatarWrap">
                      {user.avatar?.url ? (
                        <img src={user.avatar.url} alt={user.name} className="networkAvatar" />
                      ) : (
                        <div className="networkAvatarFallback">{getInitials(user.name)}</div>
                      )}
                    </div>
                    <div className="networkDetails">
                      <h3>{user.name}</h3>
                      <p>{user.headline}</p>
                    </div>
                  </Link>

                  <div className="networkBadges">
                    {user.isConnected && <span className="networkBadge connected"><FaUserCheck size={11} /> Connected</span>}
                    {user.isFollowing && !user.isConnected && <span className="networkBadge following">Following</span>}
                    {user.hasPendingRequest && <span className="networkBadge pending">Request sent</span>}
                    {user.hasIncomingRequest && <span className="networkBadge incoming">Request received</span>}
                  </div>

                  {user.hasIncomingRequest ? (
                    <div className="networkActions">
                      <button
                        className="networkActionBtn accept"
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleAccept(user)}
                      >
                        Accept
                      </button>
                      <button
                        className="networkActionBtn decline"
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleDecline(user)}
                      >
                        Decline
                      </button>
                    </div>
                  ) : !user.isConnected && !user.hasPendingRequest ? (
                    <div className="networkActions">
                      <button
                        className="networkActionBtn connect"
                        disabled={actionLoadingId === user.id}
                        onClick={() => handleConnectRequest(user)}
                      >
                        <FaUserPlus size={12} style={{ marginRight: '6px' }} /> Connect
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default NetworkPage;
