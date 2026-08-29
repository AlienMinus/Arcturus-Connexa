import React, { useEffect, useState } from 'react';
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
  post: 'posted',
  repost: 'shared your post',
  reaction: 'reacted to your post',
  follow: 'followed you',
  connection: 'accepted your connection request',
  request: 'sent you a connection request',
  other: '',
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationsPage = () => {
  const { token } = useAuth();
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

  if (loading) return <div className="notificationsPage">Loading notifications…</div>;
  if (error) return <div className="notificationsPage error">{error}</div>;

  return (
    <div className="notificationsPage">
      <h1>Notifications</h1>
      <div className="notificationsBadge">
        {notifications.filter((n) => !n.read).length} unread
      </div>
      {notifications.length === 0 ? (
        <div className="notificationsEmpty">No notifications yet.</div>
      ) : (
        <div className="notificationsList">
          {notifications.map((notification) => {
            const author = notification.author;
            const authorName = author?.name || 'Arcturus';
            const label = NOTIFICATION_LABELS[notification.type] || '';
            return (
              <div
                key={notification._id}
                className={`notificationItem ${notification.read ? 'read' : 'unread'}`}
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
                <div className="notificationContent">
                  <div className="notificationHeader">
                    {label ? (
                      <span>
                        <strong>{authorName}</strong> {label}
                      </span>
                    ) : (
                      <strong>{authorName}</strong>
                    )}
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
