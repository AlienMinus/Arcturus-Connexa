import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { buildApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './NotificationsPage.css';

const getInitials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '';

const NOTIFICATION_LABELS = {
  post: 'shared a new post',
  repost: 'shared your post',
  reaction: 'reacted to your post',
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'followed you',
  connection: 'accepted your connection request',
  request: 'sent you a connection request',
  profile_view: 'viewed your profile',
  other: '',
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(buildApiUrl('/notifications'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }
        const data = await response.json();
        const loadedNotifications = data.notifications || [];
        setNotifications(loadedNotifications);

        if (loadedNotifications.some((notification) => !notification.read)) {
          const markReadResponse = await fetch(buildApiUrl('/notifications/read-all'), {
            method: 'PATCH',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (markReadResponse.ok) {
            setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
            window.dispatchEvent(new Event('notifications-read'));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadNotifications();
    }
  }, [token]);

  const handleNotificationClick = async (notification) => {
    // If notification has a specific post ID
    if (notification.postId) {
      const username = notification.author?.username || 'user';
      navigate(`/${encodeURIComponent(username)}/posts/${notification.postId}`);
      return;
    }

    // If connection request or network notification
    if (notification.type === 'request' || notification.type === 'connection') {
      navigate('/mynetwork');
      return;
    }

    // If job notification
    if (notification.type === 'job') {
      navigate('/jobs');
      return;
    }

    // If author exists, view their profile
    if (notification.author?.username) {
      navigate(`/profile/${encodeURIComponent(notification.author.username)}`);
      return;
    }
  };

  if (loading) return <div className="notificationsPage">Loading notifications…</div>;
  if (error) return <div className="notificationsPage error">{error}</div>;

  return (
    <div className="notificationsPage">
      <h1>Notifications</h1>
      <div className="notificationsBadge">
        {notifications.filter((n) => !n.read).length} unread
      </div>
      {notifications.length === 0 ? (
        <div className="notificationsEmpty">
          <FaBell size={32} style={{ color: 'var(--accent-blue, #0a66c2)', opacity: 0.8, marginBottom: '4px' }} />
          <span>No notifications yet.</span>
        </div>
      ) : (
        <div className="notificationsList">
          {notifications.map((notification) => {
            const author = notification.author;
            const authorName = author?.name || 'Arcturus Member';
            const label = NOTIFICATION_LABELS[notification.type] || '';
            const profileUrl = author?.username ? `/profile/${encodeURIComponent(author.username)}` : '#';

            return (
              <div
                key={notification._id}
                className={`notificationItem ${notification.read ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {author?.username ? (
                  <Link
                    to={profileUrl}
                    className="notificationAvatarLink"
                    onClick={(e) => e.stopPropagation()}
                    title={`View ${authorName}'s profile`}
                  >
                    {author?.avatar?.url ? (
                      <img
                        src={author.avatar.url}
                        alt={authorName}
                        className="notificationAvatar"
                      />
                    ) : (
                      <div className="notificationAvatar notificationAvatarFallback">
                        {getInitials(authorName)}
                      </div>
                    )}
                  </Link>
                ) : (
                  author?.avatar?.url ? (
                    <img
                      src={author.avatar.url}
                      alt={authorName}
                      className="notificationAvatar"
                    />
                  ) : (
                    <div className="notificationAvatar notificationAvatarFallback">
                      {getInitials(authorName)}
                    </div>
                  )
                )}

                <div className="notificationContent">
                  <div className="notificationHeader">
                    {author?.username ? (
                      <Link
                        to={profileUrl}
                        className="notificationAuthorNameLink"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <strong>{authorName}</strong>
                      </Link>
                    ) : (
                      <strong>{authorName}</strong>
                    )}
                    {label && <span> {label}</span>}
                  </div>
                  <div className="notificationDesc">{notification.message}</div>
                  <div className="notificationMeta">
                    {formatTime(notification.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
