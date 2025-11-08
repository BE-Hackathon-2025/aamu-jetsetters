import { useState, useEffect } from 'react';
import { firebaseAuthService } from '../../services/firebaseAuth';
import { preferencesApi } from '../../services/preferencesApi';
import { browserNotificationService } from '../../services/browserNotifications';
import './ProfilePage.css';

interface ProfilePageProps {
  onLogout: () => void;
  onStartTour?: () => void;
}

function ProfilePage({ onLogout, onStartTour }: ProfilePageProps) {
  const [notifications, setNotifications] = useState({
    waterQualityAlerts: true,
    systemUpdates: true,
    maintenanceNotices: false,
    emailNotifications: true,
    pushNotifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const user = firebaseAuthService.getCurrentUser();

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const preferences = await preferencesApi.getPreferences(user.uid);
        
        if (preferences) {
          setNotifications({
            waterQualityAlerts: preferences.waterQualityAlerts,
            systemUpdates: preferences.systemUpdates,
            maintenanceNotices: preferences.maintenanceNotices,
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
          });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  const handleToggle = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    
    setNotifications((prev) => ({
      ...prev,
      [key]: newValue,
    }));
    setSaveMessage(null);

    if (key === 'pushNotifications' && newValue) {
      if (browserNotificationService.isSupported()) {
        const permission = await browserNotificationService.requestPermission();
        if (permission !== 'granted') {
          setNotifications((prev) => ({
            ...prev,
            pushNotifications: false,
          }));
          setSaveMessage('Browser notification permission was denied. Please enable it in your browser settings.');
          setTimeout(() => setSaveMessage(null), 5000);
        }
      } else {
        setNotifications((prev) => ({
          ...prev,
          pushNotifications: false,
        }));
        setSaveMessage('Browser notifications are not supported in this browser.');
        setTimeout(() => setSaveMessage(null), 5000);
      }
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.uid || !user?.email) {
      alert('User information not available. Please try logging in again.');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await preferencesApi.savePreferences(user.uid, user.email, notifications);
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    await firebaseAuthService.logout();
    onLogout();
  };

  return (
    <div className="profile-page">
      <div className="profile-section">
        <h2 className="profile-title">Profile</h2>
        
        <div className="profile-info-card">
          <div className="profile-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-details">
            <p className="profile-name">{user?.displayName || 'Community Member'}</p>
            <p className="profile-email">{user?.email || 'Not available'}</p>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">Notification Preferences</h3>
        <p className="section-description">
          Manage how you receive water quality updates and system alerts
        </p>

        <div className="notification-settings">
          <div className="notification-category">
            <h4 className="category-title">Alert Types</h4>
            
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-label">Water Quality Alerts</span>
                <span className="notification-desc">Get notified about water quality changes</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.waterQualityAlerts}
                  onChange={() => handleToggle('waterQualityAlerts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-label">System Updates</span>
                <span className="notification-desc">Updates about water system status</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.systemUpdates}
                  onChange={() => handleToggle('systemUpdates')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-label">Maintenance Notices</span>
                <span className="notification-desc">Scheduled maintenance notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.maintenanceNotices}
                  onChange={() => handleToggle('maintenanceNotices')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="notification-category">
            <h4 className="category-title">Delivery Method</h4>
            
            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-label">Email Notifications</span>
                <span className="notification-desc">Receive alerts via email</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <span className="notification-label">Push Notifications</span>
                <span className="notification-desc">Receive alerts in your browser</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={() => handleToggle('pushNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <button 
          className="save-button" 
          onClick={handleSavePreferences}
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saveMessage && (
          <p className={saveMessage.includes('Failed') ? 'error-message' : 'success-message'}>
            {saveMessage}
          </p>
        )}
      </div>

      <div className="profile-section">
        <h3 className="section-title">Help & Support</h3>
        <p className="section-description">
          Learn how to use the dashboard and access help resources
        </p>
        {onStartTour && (
          <button 
            className="tour-button" 
            onClick={onStartTour}
            style={{
              width: '100%',
              padding: '12px 24px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(157, 78, 221, 0.2))',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: '10px',
              color: '#00d4ff',
              fontFamily: 'Ubuntu, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(157, 78, 221, 0.3))';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(157, 78, 221, 0.2))';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Take Dashboard Tour
          </button>
        )}
      </div>

      <div className="profile-section">
        <button className="logout-button" onClick={handleLogoutClick}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;

