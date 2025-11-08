import { useState, useEffect } from 'react';
import './NotificationsPage.css';
import { notificationsApi, type Notification } from '../../services/notificationsApi';

interface NotificationsPageProps {
  onMarkAllRead?: () => void;
}

function NotificationsPage({ onMarkAllRead }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getAllNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
    } catch {
      // Silently handle errors
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    if (onMarkAllRead) {
      onMarkAllRead();
      }
    } catch {
      // Silently handle errors
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch {
      // Silently handle errors
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = () => {
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h2 className="notifications-title">Notifications</h2>
        {unreadCount > 0 && (
          <span className="unread-count">{unreadCount} unread</span>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="notifications-actions">
          <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        </div>
      )}

      <div className="notifications-list">
        {loading ? (
          <div className="no-notifications">
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="no-notifications">
            <p>Error loading notifications</p>
            <span>{error}</span>
            <button onClick={fetchNotifications} style={{ marginTop: '10px', padding: '8px 16px' }}>
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>No notifications yet</p>
            <span>You're all caught up!</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              {!notification.read && <div className="unread-indicator"></div>}
              
              <div className={`notification-icon-wrapper water-quality`}>
                {getNotificationIcon()}
              </div>

              <div className="notification-details">
                <h3 className="notification-card-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-timestamp">{formatTimeAgo(notification.createdAt)}</span>
              </div>

              <button
                className="delete-notification-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNotification(notification.id);
                }}
                aria-label="Delete notification"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;

