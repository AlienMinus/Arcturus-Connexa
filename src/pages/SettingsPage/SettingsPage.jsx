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
  FaToggleOff,
  FaUniversity,
  FaHourglassHalf,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaBriefcase,
  FaBuilding,
  FaSearch,
  FaTrashAlt,
  FaPaperPlane,
  FaClock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaPlus,
  FaSyncAlt,
  FaTimesCircle
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
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
  const { user, token, activeAccount, switchAccount, userOrganizations, refreshOrganizations } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { theme, setTheme, toggleTheme } = useTheme();

  // Determine initial tab from pathname (e.g. /settings/applications -> 'applications')
  const getInitialTab = () => {
    if (location.pathname.includes('/applications')) return 'applications';
    if (location.pathname.includes('/accounts') || location.pathname.includes('/organizations')) return 'accounts';
    if (location.pathname.includes('/verification')) return 'verification';
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

  // Job Application Tracking State
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [withdrawingJobId, setWithdrawingJobId] = useState(null);

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

  // Verification & Institute States
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [savingInstitute, setSavingInstitute] = useState(false);
  const [approvedOrgs, setApprovedOrgs] = useState([]);
  const [officerApplication, setOfficerApplication] = useState({ status: 'none', organizationId: '', statement: '', rejectionReason: '' });
  const [officerSubmitting, setOfficerSubmitting] = useState(false);

  const [verificationForm, setVerificationForm] = useState({
    fullName: user?.name || (user?.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
    category: 'Student / Scholar',
    affiliation: '',
    organizationId: '',
    evidenceUrl: '',
    reason: '',
  });

  const [instituteForm, setInstituteForm] = useState({
    name: '',
    organizationId: '',
    studentId: '',
    department: '',
    graduationYear: 2026,
  });

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const fetchVerification = async () => {
    if (!token) return;
    try {
      setVerificationLoading(true);
      const res = await fetch(buildApiUrl('/verification/my-status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data);
        if (data.institute) {
          setInstituteForm((prev) => ({
            ...prev,
            name: data.institute.name || '',
            organizationId: data.institute.organizationId?._id || data.institute.organizationId || '',
            studentId: data.institute.studentId || '',
            department: data.institute.department || '',
            graduationYear: data.institute.graduationYear || 2026,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setVerificationLoading(false);
    }
  };

  const fetchApprovedOrgs = async () => {
    try {
      const res = await fetch(buildApiUrl('/organizations'));
      if (res.ok) {
        const data = await res.json();
        setApprovedOrgs(data.organizations || []);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const fetchOfficerApplication = async () => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl('/campuslink/officers/my-status'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOfficerApplication((prev) => ({ ...prev, ...(data.application || {}) }));
      }
    } catch (err) {
      console.error('Failed to load Placement Officer status:', err);
    }
  };

  const handleOfficerApplication = async (event) => {
    event.preventDefault();
    setOfficerSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/campuslink/officers/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: officerApplication.organizationId, statement: officerApplication.statement }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Application failed');
      showToast(data.message);
      setOfficerApplication((prev) => ({ ...prev, ...(data.application || {}), status: 'pending' }));
    } catch (err) {
      showToast(err.message);
    } finally {
      setOfficerSubmitting(false);
    }
  };

  const fetchApplications = async () => {
    if (!token) return;
    try {
      setApplicationsLoading(true);
      const res = await fetch(buildApiUrl('/jobs/my-applications'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleWithdrawApplication = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${jobTitle}"?`)) {
      return;
    }
    try {
      setWithdrawingJobId(jobId);
      const res = await fetch(buildApiUrl(`/jobs/${jobId}/withdraw`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Application withdrawn successfully! 📋');
        setApplications((prev) => prev.filter((a) => a.jobId !== jobId));
      } else {
        showToast(data.error || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      showToast('Network error while withdrawing application');
    } finally {
      setWithdrawingJobId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'applications' || activeTab === 'account') {
      fetchApplications();
    }
    if (activeTab === 'accounts') {
      if (refreshOrganizations) refreshOrganizations();
    }
  }, [activeTab, token]);

  // Load user settings from backend
  useEffect(() => {
    if (!token) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(buildApiUrl('/users/settings'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
            if (data.settings.theme) {
              setTheme(data.settings.theme);
            }
            if (data.settings.language) {
              setSelectedLanguage(data.settings.language);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    };
    fetchSettings();
    fetchVerification();
    fetchApprovedOrgs();
    fetchOfficerApplication();
  }, [token]);

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!verificationForm.fullName || !verificationForm.affiliation || !verificationForm.reason) {
      showToast('Please fill in your name, affiliation, and statement.');
      return;
    }

    try {
      setSubmittingVerification(true);
      const res = await fetch(buildApiUrl('/verification/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(verificationForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Verification request submitted successfully to Arcturus Admin!');
        await fetchVerification();
      } else {
        showToast(data.error || 'Failed to submit verification request');
      }
    } catch (err) {
      console.error('Failed to submit verification:', err);
      showToast('Network error while submitting verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleSaveInstitute = async (e) => {
    e.preventDefault();
    try {
      setSavingInstitute(true);
      const res = await fetch(buildApiUrl('/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ institute: instituteForm }),
      });

      if (res.ok) {
        showToast('Institute credentials saved and linked to your profile badge!');
        await refreshProfile();
        await fetchVerification();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update institute details');
      }
    } catch (err) {
      console.error('Failed to save institute:', err);
      showToast('Network error while saving institute');
    } finally {
      setSavingInstitute(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSettingChange = async (key, val) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    showToast('Settings saved successfully');

    if (token) {
      try {
        await fetch(buildApiUrl('/users/settings'), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [key]: val }),
        });
      } catch (err) {
        console.error('Failed to sync setting with backend:', err);
      }
    }
  };

  const handleToggle = (key) => {
    handleSettingChange(key, !settings[key]);
  };

  const handleLanguageChange = (e) => {
    const code = e.target.value;
    setSelectedLanguage(code);
    localStorage.setItem('arcturus_lang', code);
    handleSettingChange('language', code);
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
                title="Account Preferences"
                aria-label="Account Preferences"
              >
                <FaUserCog className="tabIcon" />
                <span className="tabLabel">Account Preferences</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
                title="Sign in & Security"
                aria-label="Sign in & Security"
              >
                <FaShieldAlt className="tabIcon" />
                <span className="tabLabel">Sign in & Security</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'visibility' ? 'active' : ''}`}
                onClick={() => setActiveTab('visibility')}
                title="Visibility & Privacy"
                aria-label="Visibility & Privacy"
              >
                <FaEye className="tabIcon" />
                <span className="tabLabel">Visibility & Privacy</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'language' ? 'active' : ''}`}
                onClick={() => setActiveTab('language')}
                title="Language & Region"
                aria-label="Language & Region"
              >
                <FaGlobe className="tabIcon" />
                <span className="tabLabel">Language & Region</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
                title="Notifications"
                aria-label="Notifications"
              >
                <FaBell className="tabIcon" />
                <span className="tabLabel">Notifications</span>
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
                title="Job Applications Tracker"
                aria-label="Job Applications Tracker"
              >
                <FaBriefcase className="tabIcon" />
                <span className="tabLabel">Job Applications</span>
                {applications.length > 0 && (
                  <span className="tabCountBadge">{applications.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'accounts' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounts')}
                title="Accounts & Organizations"
                aria-label="Accounts & Organizations"
              >
                <FaBuilding className="tabIcon" />
                <span className="tabLabel">Accounts & Organizations</span>
                {userOrganizations.length > 0 && (
                  <span className="tabCountBadge orgBadge">{userOrganizations.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`settingsTabBtn ${activeTab === 'verification' ? 'active' : ''}`}
                onClick={() => setActiveTab('verification')}
                title="Account Verification & Badges"
                aria-label="Account Verification & Badges"
              >
                <FaCheckCircle className="tabIcon" />
                <span className="tabLabel">Verification & Badges</span>
              </button>
            </nav>
          </aside>

          <main className="settingsContentArea">
            {/* Account Preferences */}
            {activeTab === 'account' && (
              <div className="settingsCard">
                <div className="settingsCardHeader">
                  <h3>Account Preferences</h3>
                  <p>Manage your display options, identity mode, and profile dashboard on Arcturus.</p>
                </div>

                {/* Individual Profile Quick Dashboard Widgets */}
                <div className="profileDashboardWidgets">
                  <div className="dashboardWidgetCard" onClick={() => setActiveTab('applications')}>
                    <div className="widgetIconBox appWidgetIcon">
                      <FaBriefcase size={20} />
                    </div>
                    <div className="widgetDetails">
                      <h4>Job Applications Tracker</h4>
                      <p>
                        {applications.length > 0
                          ? `You have ${applications.length} active application${applications.length > 1 ? 's' : ''} (${applications.filter(a => a.status === 'In Review' || a.status === 'Shortlisted').length} in progress)`
                          : 'Track recruiter review stages and interview status'}
                      </p>
                    </div>
                    <button type="button" className="widgetActionBtn">
                      View Tracker →
                    </button>
                  </div>

                  <div className="dashboardWidgetCard" onClick={() => setActiveTab('accounts')}>
                    <div className="widgetIconBox orgWidgetIcon">
                      <FaBuilding size={20} />
                    </div>
                    <div className="widgetDetails">
                      <h4>Active Identity & Accounts</h4>
                      <p>
                        {activeAccount?.type === 'organization'
                          ? `Acting as ${activeAccount.name} (${activeAccount.role || 'Admin'})`
                          : `Personal Profile (${userOrganizations.length} organization${userOrganizations.length !== 1 ? 's' : ''} connected)`}
                      </p>
                    </div>
                    <button type="button" className="widgetActionBtn">
                      Switch identity →
                    </button>
                  </div>
                </div>

                <div className="settingsRowsList">
                  <div className="settingsRow">
                    <div className="rowInfo">
                      <h4>Dark Mode</h4>
                      <p>Adjust the appearance of Arcturus to reduce glare and optimize for low-light environments.</p>
                    </div>
                    <div className="rowControl">
                      <button 
                        type="button" 
                        className="toggleBtn" 
                        onClick={() => {
                          const nextTheme = theme === 'dark' ? 'light' : 'dark';
                          toggleTheme();
                          handleSettingChange('theme', nextTheme);
                          showToast(`Theme set to ${nextTheme === 'dark' ? 'Dark Mode 🌙' : 'Light Mode ☀️'}`);
                        }}
                        title="Toggle dark mode"
                      >
                        {theme === 'dark' ? (
                          <FaToggleOn size={32} className="toggleActive" />
                        ) : (
                          <FaToggleOff size={32} className="toggleInactive" />
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
                          handleSettingChange('profileViewingMode', e.target.value);
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

            {/* Account Verification & Badges */}
            {activeTab === 'verification' && (
              <div className="settingsVerificationPanel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="settingsCard placementOfficerCard">
                  <div className="settingsCardHeader">
                    <div>
                      <h3>Placement Officer Access</h3>
                      <p>Apply to manage placement drives for a linked educational organization. Arcturus Admin approval is required.</p>
                    </div>
                    <span className={`officerStatusBadge ${officerApplication.status}`}>
                      {officerApplication.status === 'none' ? 'Not applied' : officerApplication.status}
                    </span>
                  </div>

                  {officerApplication.status === 'approved' ? (
                    <div className="officerApprovedNotice">Approved Placement Officer access is active for the linked organization.</div>
                  ) : officerApplication.status === 'pending' ? (
                    <div className="officerPendingNotice">Your application is waiting for Arcturus Admin review.</div>
                  ) : (
                    <form className="officerApplicationForm" onSubmit={handleOfficerApplication}>
                      <div className="formGroup">
                        <label>Linked educational organization *</label>
                        <select
                          className="settingsInput"
                          required
                          value={officerApplication.organizationId || ''}
                          onChange={(event) => setOfficerApplication({ ...officerApplication, organizationId: event.target.value })}
                        >
                          <option value="">Select an approved linked organization</option>
                          {approvedOrgs.map((org) => <option key={org._id} value={org._id}>{org.name}</option>)}
                        </select>
                      </div>
                      <div className="formGroup">
                        <label>Why should you manage placement drives?</label>
                        <textarea
                          className="settingsInput officerStatementInput"
                          rows="3"
                          value={officerApplication.statement || ''}
                          onChange={(event) => setOfficerApplication({ ...officerApplication, statement: event.target.value })}
                          placeholder="Describe your placement-cell responsibility or institutional role."
                        />
                      </div>
                      {officerApplication.rejectionReason && <p className="officerRejectionNotice">Previous review: {officerApplication.rejectionReason}</p>}
                      <button type="submit" className="saveBtn" disabled={officerSubmitting}>
                        {officerSubmitting ? 'Submitting...' : 'Apply for Placement Officer Access'}
                      </button>
                    </form>
                  )}
                </div>
                {/* CARD 1: BLUE TICK VERIFICATION STATUS & REQUEST */}
                <div className="settingsCard">
                  <div className="settingsCardHeader">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MdVerified size={22} color="#0a66c2" />
                      <div>
                        <h3>Arcturus Blue Tick Verification</h3>
                        <p>Authenticate your profile with the official verified badge approved by Arcturus Admin.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settingsCardBody" style={{ padding: '20px' }}>
                    {/* CASE 1: ALREADY VERIFIED */}
                    {(user?.isVerified || verificationStatus?.isVerified) ? (
                      <div className="verificationStatusBox verified" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '18px 20px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                      }}>
                        <MdVerified size={38} color="#0a66c2" style={{ flexShrink: 0 }} />
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontSize: '1.05rem' }}>
                            Your Account is Officially Verified
                          </h4>
                          <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.86rem' }}>
                            Your identity credentials have been authenticated by the Arcturus Administration Team.
                            The blue checkmark is displayed prominently beside your name on your profile, feed publications, and searches.
                          </p>
                        </div>
                      </div>
                    ) : verificationStatus?.request?.status === 'pending' ? (
                      /* CASE 2: PENDING REVIEW */
                      <div className="verificationStatusBox pending" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        padding: '18px 20px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                      }}>
                        <FaHourglassHalf size={32} color="#d97706" style={{ flexShrink: 0 }} />
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: '#92400e', fontSize: '1.05rem' }}>
                            Verification Request Under Review
                          </h4>
                          <p style={{ margin: '0 0 6px 0', color: '#b45309', fontSize: '0.86rem' }}>
                            Your Blue Tick application submitted on {new Date(verificationStatus.request.createdAt).toLocaleDateString()} is currently pending review by Arcturus Governance Admins.
                          </p>
                          <span style={{ fontSize: '0.78rem', color: '#78350f', background: '#fef3c7', padding: '2px 8px', borderRadius: '8px' }}>
                            Category: <strong>{verificationStatus.request.category}</strong> · Affiliation: <strong>{verificationStatus.request.affiliation}</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* CASE 3: NOT VERIFIED OR REJECTED -> SHOW APPLICATION FORM */
                      <div>
                        {verificationStatus?.request?.status === 'rejected' && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '14px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                          }}>
                            <FaExclamationTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                            <div>
                              <strong style={{ color: '#991b1b', display: 'block', fontSize: '0.88rem' }}>
                                Previous Application Not Approved
                              </strong>
                              <span style={{ color: '#b91c1c', fontSize: '0.82rem' }}>
                                Admin Notes: {verificationStatus.request.adminNotes || 'Verification criteria could not be confirmed.'} You may update your evidence and re-apply below.
                              </span>
                            </div>
                          </div>
                        )}

                        <form onSubmit={handleSubmitVerification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="formRowGrid">
                            <div className="formGroup">
                              <label>Legal Full Name *</label>
                              <input
                                type="text"
                                className="settingsInput"
                                required
                                placeholder="Your full name as per official identification"
                                value={verificationForm.fullName}
                                onChange={(e) => setVerificationForm({ ...verificationForm, fullName: e.target.value })}
                              />
                            </div>

                            <div className="formGroup">
                              <label>Verification Category *</label>
                              <select
                                className="settingsInput"
                                value={verificationForm.category}
                                onChange={(e) => setVerificationForm({ ...verificationForm, category: e.target.value })}
                              >
                                <option value="Student / Scholar">Student / Scholar</option>
                                <option value="Academic / Researcher">Academic / Researcher</option>
                                <option value="Software Engineer / Tech">Software Engineer / Tech</option>
                                <option value="Creator / Thought Leader">Creator / Thought Leader</option>
                                <option value="Executive / Business Leader">Executive / Business Leader</option>
                                <option value="Organization Representative">Organization Representative</option>
                                <option value="Public Figure">Public Figure</option>
                              </select>
                            </div>
                          </div>

                          <div className="formRowGrid">
                            <div className="formGroup">
                              <label>Primary Affiliation (University, Company, Institute) *</label>
                              <input
                                type="text"
                                className="settingsInput"
                                required
                                placeholder="e.g. Stanford University, Google, MIT"
                                value={verificationForm.affiliation}
                                onChange={(e) => setVerificationForm({ ...verificationForm, affiliation: e.target.value })}
                              />
                            </div>

                            <div className="formGroup">
                              <label>Link to Arcturus Organization (Optional)</label>
                              <select
                                className="settingsInput"
                                value={verificationForm.organizationId}
                                onChange={(e) => setVerificationForm({ ...verificationForm, organizationId: e.target.value })}
                              >
                                <option value="">-- Select Registered Organization --</option>
                                {approvedOrgs.map((org) => (
                                  <option key={org._id} value={org._id}>
                                    {org.name} ({org.industry})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="formGroup">
                            <label>Verification Proof / Evidence Link (URL)</label>
                            <input
                              type="url"
                              className="settingsInput"
                              placeholder="e.g. Student Portal, LinkedIn, Google Scholar, GitHub, or Portfolio"
                              value={verificationForm.evidenceUrl}
                              onChange={(e) => setVerificationForm({ ...verificationForm, evidenceUrl: e.target.value })}
                            />
                            <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                              Provide a verifiable public link, institutional faculty page, or online credentials verifying your affiliation.
                            </span>
                          </div>

                          <div className="formGroup">
                            <label>Statement / Why should this profile be verified? *</label>
                            <textarea
                              className="settingsInput"
                              rows={3}
                              required
                              placeholder="Briefly state your role, university/company standing, achievements, or justification for Arcturus blue tick verification..."
                              value={verificationForm.reason}
                              onChange={(e) => setVerificationForm({ ...verificationForm, reason: e.target.value })}
                            />
                          </div>

                          <button
                            type="submit"
                            className="saveBtn"
                            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            disabled={submittingVerification}
                          >
                            <MdVerified size={15} />
                            <span>{submittingVerification ? 'Submitting to Admin...' : 'Submit Verification Request to Admin'}</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: INSTITUTE AFFILIATION & LOGO BADGE */}
                <div className="settingsCard">
                  <div className="settingsCardHeader">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FaUniversity size={20} color="#15803d" />
                      <div>
                        <h3>Institute Affiliation & Student Logo Badge</h3>
                        <p>Link your educational institution to receive an official institute logo badge on your profile and feed posts.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settingsCardBody" style={{ padding: '20px' }}>
                    {/* Badge Preview */}
                    {instituteForm.organizationId && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                      }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>Current Badge Preview:</span>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          border: '1px solid #86efac',
                          padding: '3px 10px',
                          borderRadius: '14px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#15803d',
                        }}>
                          {approvedOrgs.find(o => o._id === instituteForm.organizationId)?.logo?.url ? (
                            <img
                              src={approvedOrgs.find(o => o._id === instituteForm.organizationId)?.logo?.url}
                              alt=""
                              style={{ width: '15px', height: '15px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <FaUniversity size={12} />
                          )}
                          <span>{approvedOrgs.find(o => o._id === instituteForm.organizationId)?.name || instituteForm.name || 'Institute'}</span>
                          <span style={{ color: '#16a34a' }}>✓</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSaveInstitute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="formRowGrid">
                        <div className="formGroup">
                          <label>Select Registered Institute Organization *</label>
                          <select
                            className="settingsInput"
                            value={instituteForm.organizationId}
                            onChange={(e) => {
                              const orgId = e.target.value;
                              const selected = approvedOrgs.find(o => o._id === orgId);
                              setInstituteForm({
                                ...instituteForm,
                                organizationId: orgId,
                                name: selected ? selected.name : instituteForm.name,
                              });
                            }}
                          >
                            <option value="">-- Select Educational Organization --</option>
                            {approvedOrgs.map((org) => (
                              <option key={org._id} value={org._id}>
                                {org.name} {org.industry ? `(${org.industry})` : ''}
                              </option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Selecting an approved organization enables the official verified institute logo badge.
                          </span>
                        </div>

                        <div className="formGroup">
                          <label>Institute / College Name</label>
                          <input
                            type="text"
                            className="settingsInput"
                            placeholder="College or University Name"
                            value={instituteForm.name}
                            onChange={(e) => setInstituteForm({ ...instituteForm, name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="formRowGrid">
                        <div className="formGroup">
                          <label>Department / Major</label>
                          <input
                            type="text"
                            className="settingsInput"
                            placeholder="e.g. Computer Science & Engineering"
                            value={instituteForm.department}
                            onChange={(e) => setInstituteForm({ ...instituteForm, department: e.target.value })}
                          />
                        </div>

                        <div className="formGroup">
                          <label>Student Roll / ID Number</label>
                          <input
                            type="text"
                            className="settingsInput"
                            placeholder="e.g. 21CS042"
                            value={instituteForm.studentId}
                            onChange={(e) => setInstituteForm({ ...instituteForm, studentId: e.target.value })}
                          />
                        </div>

                        <div className="formGroup">
                          <label>Graduation Batch / Year</label>
                          <input
                            type="number"
                            className="settingsInput"
                            placeholder="2026"
                            value={instituteForm.graduationYear}
                            onChange={(e) => setInstituteForm({ ...instituteForm, graduationYear: e.target.value })}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="saveBtn"
                        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        disabled={savingInstitute}
                      >
                        <FaCheck size={14} />
                        <span>{savingInstitute ? 'Saving...' : 'Save & Link Institute Badge'}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Job Applications Tracking System */}
            {activeTab === 'applications' && (
              <div className="settingsCard appTrackerCard">
                <div className="settingsCardHeader appTrackerHeader">
                  <div className="appHeaderTitle">
                    <h3>Job Applications Tracking System</h3>
                    <p>Monitor your job submissions, track recruiter review stages in real-time, and manage applications.</p>
                  </div>
                  <button 
                    type="button" 
                    className="appRefreshBtn" 
                    onClick={fetchApplications}
                    disabled={applicationsLoading}
                    title="Refresh application status"
                  >
                    <FaSyncAlt className={applicationsLoading ? 'spinIcon' : ''} />
                    <span>{applicationsLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Application Analytics / KPI Counters */}
                <div className="appKpiGrid">
                  <div 
                    className={`appKpiCard ${appStatusFilter === 'All' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('All')}
                  >
                    <span className="appKpiNumber">{applications.length}</span>
                    <span className="appKpiLabel">Total Applied</span>
                  </div>

                  <div 
                    className={`appKpiCard kpiApplied ${appStatusFilter === 'Applied' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('Applied')}
                  >
                    <span className="appKpiNumber">{applications.filter(a => a.status === 'Applied').length}</span>
                    <span className="appKpiLabel">Submitted</span>
                  </div>

                  <div 
                    className={`appKpiCard kpiReview ${appStatusFilter === 'In Review' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('In Review')}
                  >
                    <span className="appKpiNumber">{applications.filter(a => a.status === 'In Review').length}</span>
                    <span className="appKpiLabel">In Review</span>
                  </div>

                  <div 
                    className={`appKpiCard kpiShortlisted ${appStatusFilter === 'Shortlisted' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('Shortlisted')}
                  >
                    <span className="appKpiNumber">{applications.filter(a => a.status === 'Shortlisted').length}</span>
                    <span className="appKpiLabel">Shortlisted</span>
                  </div>

                  <div 
                    className={`appKpiCard kpiHired ${appStatusFilter === 'Hired' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('Hired')}
                  >
                    <span className="appKpiNumber">{applications.filter(a => a.status === 'Hired').length}</span>
                    <span className="appKpiLabel">Offers / Hired</span>
                  </div>

                  <div 
                    className={`appKpiCard kpiRejected ${appStatusFilter === 'Rejected' ? 'kpiActive' : ''}`}
                    onClick={() => setAppStatusFilter('Rejected')}
                  >
                    <span className="appKpiNumber">{applications.filter(a => a.status === 'Rejected').length}</span>
                    <span className="appKpiLabel">Archived</span>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="appFilterToolbar">
                  <div className="appSearchBox">
                    <FaSearch className="appSearchIcon" />
                    <input
                      type="text"
                      placeholder="Filter by job title, company, or skills..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                    />
                    {appSearchQuery && (
                      <button type="button" className="appClearSearch" onClick={() => setAppSearchQuery('')}>
                        <FaTimesCircle size={14} />
                      </button>
                    )}
                  </div>

                  <div className="appStatusPills">
                    {['All', 'Applied', 'In Review', 'Shortlisted', 'Hired', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`appStatusPill ${appStatusFilter === status ? 'pillActive' : ''}`}
                        onClick={() => setAppStatusFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Applications List */}
                {applicationsLoading && applications.length === 0 ? (
                  <div className="appLoadingState">
                    <div className="appSpinner"></div>
                    <p>Loading your job applications...</p>
                  </div>
                ) : (
                  (() => {
                    const filteredApps = applications.filter((app) => {
                      const q = appSearchQuery.toLowerCase().trim();
                      const matchesSearch =
                        !q ||
                        app.title?.toLowerCase().includes(q) ||
                        app.company?.toLowerCase().includes(q) ||
                        app.location?.toLowerCase().includes(q) ||
                        app.skills?.some((s) => s.toLowerCase().includes(q));

                      const matchesStatus =
                        appStatusFilter === 'All' || app.status?.toLowerCase() === appStatusFilter.toLowerCase();

                      return matchesSearch && matchesStatus;
                    });

                    if (filteredApps.length === 0) {
                      return (
                        <div className="appEmptyState">
                          <div className="appEmptyIcon">
                            <FaBriefcase size={44} />
                          </div>
                          <h4>No applications match your criteria</h4>
                          <p>
                            {applications.length === 0
                              ? "You haven't submitted any job applications on Arcturus yet."
                              : 'Try adjusting your search keywords or status filter.'}
                          </p>
                          <Link to="/jobs" className="browseJobsBtn">
                            Explore Available Jobs →
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div className="applicationsList">
                        {filteredApps.map((app) => {
                          const getStageProgress = (status) => {
                            switch (status) {
                              case 'Applied': return 1;
                              case 'In Review': return 2;
                              case 'Shortlisted': return 3;
                              case 'Hired': return 4;
                              case 'Rejected': return 4;
                              default: return 1;
                            }
                          };

                          const currentStageNum = getStageProgress(app.status);
                          const isRejected = app.status === 'Rejected';
                          const isHired = app.status === 'Hired';

                          return (
                            <div key={app.jobId} className={`appTrackingCard ${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                              {/* Top: Company Logo + Title + Status Pill */}
                              <div className="appCardTop">
                                <div className="appCompanyBlock">
                                  <img
                                    src={app.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                                    alt={app.company}
                                    className="appCompanyLogo"
                                  />
                                  <div className="appTitleInfo">
                                    <h4>{app.title}</h4>
                                    <div className="appCompanyMeta">
                                      <span className="appCompanyName">{app.company}</span>
                                      <span className="appDot">•</span>
                                      <span className="appLocation">
                                        <FaMapMarkerAlt size={11} /> {app.location}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="appStatusTagBlock">
                                  <span className={`appStatusBadge status-${app.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {app.status === 'Hired' ? '🎉 Hired / Offered' : app.status === 'Rejected' ? '✕ Not Selected' : app.status}
                                  </span>
                                </div>
                              </div>

                              {/* Meta Pills: Workplace, Employment Type, Salary, Applied Date */}
                              <div className="appMetaRow">
                                <span className="appMetaPill">{app.workplaceType}</span>
                                <span className="appMetaPill">{app.employmentType}</span>
                                {app.salary && (
                                  <span className="appMetaPill appSalaryPill">
                                    <FaMoneyBillWave size={11} /> {app.salary}
                                  </span>
                                )}
                                <span className="appAppliedTime">
                                  <FaClock size={11} /> Applied {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>

                              {/* Visual 4-Stage Progress Stepper */}
                              <div className="appStepperContainer">
                                <div className="appStepperTrack">
                                  <div 
                                    className={`appStepperBar ${isRejected ? 'stepperRejected' : isHired ? 'stepperHired' : ''}`}
                                    style={{
                                      width: `${((currentStageNum - 1) / 3) * 100}%`
                                    }}
                                  ></div>

                                  {/* Step 1: Applied */}
                                  <div className={`appStepPoint ${currentStageNum >= 1 ? 'stepCompleted' : ''}`}>
                                    <div className="stepCircle">✓</div>
                                    <span className="stepLabel">Applied</span>
                                  </div>

                                  {/* Step 2: In Review */}
                                  <div className={`appStepPoint ${currentStageNum >= 2 ? (currentStageNum === 2 ? 'stepCurrent' : 'stepCompleted') : ''}`}>
                                    <div className="stepCircle">{currentStageNum > 2 ? '✓' : '2'}</div>
                                    <span className="stepLabel">In Review</span>
                                  </div>

                                  {/* Step 3: Shortlisted */}
                                  <div className={`appStepPoint ${currentStageNum >= 3 ? (currentStageNum === 3 ? 'stepCurrent' : 'stepCompleted') : ''}`}>
                                    <div className="stepCircle">{currentStageNum > 3 ? '✓' : '3'}</div>
                                    <span className="stepLabel">Shortlisted</span>
                                  </div>

                                  {/* Step 4: Decision */}
                                  <div className={`appStepPoint ${currentStageNum === 4 ? (isRejected ? 'stepRejected' : 'stepCompleted') : ''}`}>
                                    <div className="stepCircle">
                                      {isRejected ? '✕' : isHired ? '🎉' : '4'}
                                    </div>
                                    <span className="stepLabel">
                                      {isRejected ? 'Not Selected' : isHired ? 'Offer Extended' : 'Decision'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Skills tags */}
                              {app.skills && app.skills.length > 0 && (
                                <div className="appSkillsList">
                                  {app.skills.slice(0, 6).map((skill, idx) => (
                                    <span key={idx} className="appSkillTag">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Footer Actions */}
                              <div className="appCardFooter">
                                <Link to={`/jobs`} className="appActionLink">
                                  <FaExternalLinkAlt size={12} /> View Job Listing
                                </Link>

                                {app.status !== 'Hired' && (
                                  <button
                                    type="button"
                                    className="appWithdrawBtn"
                                    disabled={withdrawingJobId === app.jobId}
                                    onClick={() => handleWithdrawApplication(app.jobId, app.title)}
                                    title="Withdraw your application for this position"
                                  >
                                    <FaTrashAlt size={12} />
                                    <span>{withdrawingJobId === app.jobId ? 'Withdrawing...' : 'Withdraw Application'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Accounts & Organizations View */}
            {activeTab === 'accounts' && (
              <div className="settingsCard accountsCard">
                <div className="settingsCardHeader">
                  <h3>Accounts & Organizations</h3>
                  <p>Manage your account identities, switch active profiles, and manage connected organizations.</p>
                </div>

                {/* Current Active Account Card */}
                <div className="currentAccountCard">
                  <div className="currentAccountLeft">
                    <span className="currentAccountPill">
                      Currently Active
                    </span>
                    <div className="currentAccountBody">
                      {activeAccount?.type === 'organization' ? (
                        activeAccount.logo ? (
                          <img src={activeAccount.logo} alt="" className="currentAccountAvatar orgLogo" />
                        ) : (
                          <div className="currentAccountAvatar orgFallback"><FaBuilding size={24} /></div>
                        )
                      ) : profile?.avatar?.url ? (
                        <img src={profile.avatar.url} alt="" className="currentAccountAvatar" />
                      ) : (
                        <div className="currentAccountAvatar"><FaUserCog size={24} /></div>
                      )}
                      <div>
                        <h4>
                          {activeAccount?.type === 'organization' ? activeAccount.name : profile?.name || user?.name || 'Personal Profile'}
                        </h4>
                        <p>
                          {activeAccount?.type === 'organization'
                            ? `Acting as Organization • ${activeAccount.role || 'Admin'}`
                            : `Personal Profile • ${profile?.headline || 'Arcturus Member'}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="currentAccountRight">
                    {activeAccount?.type === 'organization' ? (
                      <button
                        type="button"
                        className="switchBtnPrimary"
                        onClick={() => {
                          switchAccount('personal');
                          showToast('Switched to Personal Profile!');
                        }}
                      >
                        <FaExchangeAlt size={13} /> Switch to Personal Profile
                      </button>
                    ) : (
                      <span className="actingLabel">Browsing as Personal Profile</span>
                    )}
                  </div>
                </div>

                {/* Managed Organizations List */}
                <div className="organizationsSection">
                  <div className="orgSectionTop">
                    <div>
                      <h4>Your Registered Organizations</h4>
                      <p>Organizations and institutions where you have management or recruiter privileges.</p>
                    </div>
                    <Link to="/company/create" className="createOrgBtn">
                      <FaPlus size={12} /> Register New Organization
                    </Link>
                  </div>

                  {userOrganizations && userOrganizations.length > 0 ? (
                    <div className="orgCardsGrid">
                      {userOrganizations.map((org) => {
                        const isCurrentOrg = activeAccount?.type === 'organization' && (activeAccount.id === org._id || activeAccount.orgId === org._id);
                        const myMembership = org.members?.find((m) => m.userId === user?._id || m.userId?._id === user?._id);
                        const roleTitle = myMembership?.role || (org.adminId === user?._id ? 'Admin' : 'Member');

                        return (
                          <div key={org._id} className={`orgManagedCard ${isCurrentOrg ? 'orgCardActive' : ''}`}>
                            <div className="orgCardMain">
                              <img
                                src={org.logo?.url || org.logo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                                alt={org.name}
                                className="orgCardLogo"
                              />
                              <div className="orgCardDetails">
                                <h5>{org.name}</h5>
                                <span className="orgMetaLine">
                                  {org.industry || 'Business'} • {org.location || 'Headquarters'}
                                </span>
                                <div className="orgStatusBadges">
                                  <span className={`orgStatusPill status-${org.status}`}>
                                    {org.status === 'approved' ? '✓ Verified Organization' : org.status === 'pending' ? '⏳ Pending Approval' : 'Rejected'}
                                  </span>
                                  <span className="orgRolePill">{roleTitle}</span>
                                  {org.activeJobsCount > 0 && (
                                    <span className="orgJobsPill">{org.activeJobsCount} Active Job{org.activeJobsCount > 1 ? 's' : ''}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="orgCardActions">
                              {isCurrentOrg ? (
                                <span className="currentActiveTag">✓ Current Active</span>
                              ) : (
                                <button
                                  type="button"
                                  className="switchOrgBtn"
                                  onClick={() => {
                                    switchAccount(org);
                                    showToast(`Switched account to ${org.name}!`);
                                  }}
                                >
                                  <FaExchangeAlt size={12} /> Switch to this Org
                                </button>
                              )}

                              <Link to="/jobs/manage" className="manageJobsBtn">
                                Talent & Jobs Dashboard →
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="emptyOrgsBox">
                      <FaBuilding size={36} color="#94a3b8" />
                      <h5>No organizations registered yet</h5>
                      <p>Register your company, startup, or educational institution to publish jobs, access recruiter dashboards, and verify students.</p>
                      <Link to="/company/create" className="registerNowBtn">
                        Register Organization Now
                      </Link>
                    </div>
                  )}
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
