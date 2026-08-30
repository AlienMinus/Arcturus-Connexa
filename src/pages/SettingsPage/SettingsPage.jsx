import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  FaUserCog, 
  FaShieldAlt, 
  FaEye, 
  FaGlobe, 
  FaBell, 
  FaArrowLeft, 
  FaCheck, 
  FaSave, 
  FaCheckCircle, 
  FaLock, 
  FaToggleOn, 
  FaToggleOff 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { buildApiUrl } from '../../utils/api';
import './SettingsPage.css';

const LANGUAGES = [
  { code: 'en', name: 'English (US)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'zh', name: '中文 (Mandarin)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'pt', name: 'Português (Portuguese)' },
];

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme, toggleTheme } = useTheme();

  // Determine initial tab from pathname (e.g. /settings/language -> 'language')
  const getInitialTab = () => {
    if (location.pathname.includes('/language')) return 'language';
    if (location.pathname.includes('/privacy') || location.pathname.includes('/visibility')) return 'visibility';
    if (location.pathname.includes('/security')) return 'security';
    if (location.pathname.includes('/notifications')) return 'notifications';
    return 'account';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('arcturus_lang') || 'en';
  });

  // Settings states
  const [settings, setSettings] = useState({
    profileViewingMode: 'public', // public, semi, private
    showEmailToConnections: true,
    shareProfileUpdates: true,
    twoFactorAuth: false,
    rememberSessions: true,
    emailNotifications: true,
    pushNotifications: true,
    soundEffects: true,
    autoplayVideos: true,
    theme: 'light',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [toastMessage, setToastMessage] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleToggle = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast('Settings saved successfully');
      return updated;
    });
  };

  const handleLanguageChange = (e) => {
    const code = e.target.value;
    setSelectedLanguage(code);
    localStorage.setItem('arcturus_lang', code);
    showToast(`Language updated to ${LANGUAGES.find((l) => l.code === code)?.name}`);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('Please enter your current password');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      showToast('Password updated locally (guest mode)');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await fetch(buildApiUrl('/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password changed successfully! 🔒');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="settingsPageWrapper">
      <div className="settingsContainer">
        {/* Header Bar */}
        <div className="settingsTopBar">
          <Link to="/profile" className="settingsBackBtn">
            <FaArrowLeft size={13} /> <span>Back to Profile</span>
          </Link>
          <h2>Settings & Privacy</h2>
          <div className="settingsUserBadge">
            <span>{profile?.name || user?.username || 'Member'}</span>
          </div>
        </div>

        {/* Status Toast */}
        {toastMessage && (
          <div className="settingsToast">
            <FaCheckCircle size={15} /> <span>{toastMessage}</span>
          </div>
        )}

        {/* Layout Grid: Left Sidebar + Right Content Panel */}
        <div className="settingsLayout">
          <aside className="settingsSidebar">
            <nav className="settingsNav">
              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <FaUserCog className="tabIcon" />
                <span>Account Preferences</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <FaShieldAlt className="tabIcon" />
                <span>Sign in & Security</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'visibility' ? 'active' : ''}`}
                onClick={() => setActiveTab('visibility')}
              >
                <FaEye className="tabIcon" />
                <span>Visibility & Privacy</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'language' ? 'active' : ''}`}
                onClick={() => setActiveTab('language')}
              >
                <FaGlobe className="tabIcon" />
                <span>Language & Region</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <FaBell className="tabIcon" />
                <span>Notifications</span>
              </button>
            </nav>
          </aside>

          <main className="settingsContentArea">
            {/* Account Preferences */}
            {activeTab === 'account' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Account Preferences</h3>
                  <p>Manage your display options, themes, and general experience on Arcturus.</p>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Display Theme</h4>
                      <p>Choose between standard light mode and high-contrast dark theme.</p>
                    </div>
                    <div className="rowControl themeControlGroup">
                      <select 
                        value={theme} 
                        onChange={(e) => {
                          setTheme(e.target.value);
                          showToast(`Theme set to ${e.target.value === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}`);
                        }}
                      >
                        <option value="light">Light Mode ☀️</option>
                        <option value="dark">Dark Mode 🌙</option>
                      </select>
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => {
                          toggleTheme();
                          showToast(`Theme set to ${theme === 'dark' ? 'Light Mode ☀️' : 'Dark Mode 🌙'}`);
                        }}
                        title="Toggle dark mode"
                      >
                        {theme === 'dark' ? (
                          <FaToggleOn size={28} className="toggleActive" />
                        ) : (
                          <FaToggleOff size={28} className="toggleInactive" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Autoplay Videos</h4>
                      <p>Automatically play videos in your feed when scrolling over them.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('autoplayVideos')}
                      >
                        {settings.autoplayVideos ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Feed Content Quality Filter</h4>
                      <p>Prioritize industry-relevant insights and network posts in your main feed.</p>
                    </div>
                    <div className="rowControl">
                      <span className="badgeActive"><FaCheck size={10} /> Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sign In & Security */}
            {activeTab === 'security' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Sign in & Security</h3>
                  <p>Protect your account credentials, passwords, and authentication sessions.</p>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Two-Step Verification (2FA)</h4>
                      <p>Require an additional verification code when signing in from unrecognized devices.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('twoFactorAuth')}
                      >
                        {settings.twoFactorAuth ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Remember Sign-In Sessions</h4>
                      <p>Stay signed in on your trusted personal browser for up to 30 days.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('rememberSessions')}
                      >
                        {settings.rememberSessions ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <div className="settingsPasswordBox">
                    <div className="passwordBoxHeader">
                      <FaLock className="lockIcon" />
                      <h4>Change Account Password</h4>
                    </div>
                    <form onSubmit={handlePasswordSubmit} className="passwordForm">
                      <div className="formGroup">
                        <label>Current Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="formRowGrid">
                        <div className="formGroup">
                          <label>New Password</label>
                          <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="formGroup">
                          <label>Confirm New Password</label>
                          <input
                            type="password"
                            placeholder="Repeat new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="submit" className="savePasswordBtn" disabled={isUpdatingPassword}>
                        <FaSave size={13} /> {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Visibility & Privacy */}
            {activeTab === 'visibility' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Visibility & Privacy</h3>
                  <p>Choose what other members and recruiters can see about your profile and activity.</p>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Profile Viewing Options</h4>
                      <p>Choose whether you show your name and headline when viewing other profiles.</p>
                    </div>
                    <div className="rowControl">
                      <select
                        value={settings.profileViewingMode}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, profileViewingMode: e.target.value }));
                          showToast('Profile viewing mode updated');
                        }}
                      >
                        <option value="public">Your Name and Headline (Public)</option>
                        <option value="semi">Private Profile Characteristics</option>
                        <option value="private">Private Mode (Anonymous)</option>
                      </select>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Email Visibility</h4>
                      <p>Allow your 1st-degree connections to view your primary contact email.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('showEmailToConnections')}
                      >
                        {settings.showEmailToConnections ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Share Profile Updates with Network</h4>
                      <p>Notify your connections when you update your job experience, education, or anniversaries.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('shareProfileUpdates')}
                      >
                        {settings.shareProfileUpdates ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language & Region */}
            {activeTab === 'language' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Language & Region</h3>
                  <p>Select your interface language and regional translation preferences.</p>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Display Language</h4>
                      <p>Select the primary language for buttons, navigation, and system texts.</p>
                    </div>
                    <div className="rowControl">
                      <select value={selectedLanguage} onChange={handleLanguageChange}>
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Feed Post Automatic Translation</h4>
                      <p>Automatically offer one-click translations for foreign language posts.</p>
                    </div>
                    <div className="rowControl">
                      <span className="badgeActive"><FaCheck size={10} /> Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Notifications Preferences</h3>
                  <p>Customize the alerts, emails, and messages you receive.</p>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Email Digest & Alerts</h4>
                      <p>Receive weekly job recommendations, message summaries, and connection requests.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('emailNotifications')}
                      >
                        {settings.emailNotifications ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Push & Browser Notifications</h4>
                      <p>Get instant alerts when someone messages you or likes your posts.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('pushNotifications')}
                      >
                        {settings.pushNotifications ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>

                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>In-App Sound Effects</h4>
                      <p>Play a soft chime when a new message arrives in the messenger.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => handleToggle('soundEffects')}
                      >
                        {settings.soundEffects ? <FaToggleOn size={28} className="toggleActive" /> : <FaToggleOff size={28} className="toggleInactive" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

