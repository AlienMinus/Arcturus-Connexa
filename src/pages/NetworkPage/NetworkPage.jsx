import React, { useEffect, useState } from 'react';
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

const NetworkPage = () => {
  const { token } = useAuth();
  const [network, setNetwork] = useState([]);
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
      <h1>My Network</h1>
      {network.length === 0 ? (
        <p>No users found in your network yet.</p>
      ) : (
        <div className="networkGrid">
          {network.map((user) => (
            <div className="networkCard" key={user.id}>
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
              <div className="networkBadges">
                {user.isConnected && <span className="networkBadge connected">Connected</span>}
                {user.isFollowing && !user.isConnected && <span className="networkBadge following">Following</span>}
                {user.hasPendingRequest && <span className="networkBadge pending">Request sent</span>}
                {user.hasIncomingRequest && <span className="networkBadge incoming">Request received</span>}
              </div>
              {user.hasIncomingRequest && (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkPage;
