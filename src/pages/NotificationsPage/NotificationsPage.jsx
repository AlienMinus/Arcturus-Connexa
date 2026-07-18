import React, { useEffect, useState } from 'react';
import { buildApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './NotificationsPage.css';

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
        setNotifications(data.notifications || []);
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
      {notifications.length === 0 ? (
        <div className="notificationsEmpty">No notifications yet.</div>
      ) : (
        <div className="notificationsList">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notificationItem ${notification.read ? 'read' : 'unread'}`}
            >
              <div className="notificationMessage">{notification.message}</div>
              <div className="notificationMeta">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
