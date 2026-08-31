import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaBuilding, 
  FaBriefcase, 
  FaUsers, 
  FaSearch, 
  FaSyncAlt, 
  FaCheckCircle, 
  FaLock 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import AdminMetrics from '../../components/admin/AdminMetrics';
import OrganizationApprovals from '../../components/admin/OrganizationApprovals';
import JobModeration from '../../components/admin/JobModeration';
import UserModeration from '../../components/admin/UserModeration';
import DocumentLightboxModal from '../../components/admin/DocumentLightboxModal';
import RejectionReasonModal from '../../components/admin/RejectionReasonModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('organizations'); // 'organizations', 'jobs', 'users'
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const [rejectionModalOrg, setRejectionModalOrg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isArcturusAdmin =
    user?.role === 'admin' ||
    user?.isAdmin === true ||
    user?.username?.toLowerCase() === 'arcturus_admin' ||
    user?.email?.toLowerCase()?.includes('admin@arcturus');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const fetchStats = async () => {
    if (!token || !isArcturusAdmin) return;
    try {
      const res = await fetch(buildApiUrl('/admin/stats'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  const fetchOrganizations = async () => {
    if (!token || !isArcturusAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(buildApiUrl(`/admin/organizations?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!token || !isArcturusAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(buildApiUrl(`/admin/jobs?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token || !isArcturusAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(buildApiUrl(`/admin/users?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadData = () => {
    fetchStats();
    if (activeTab === 'organizations') fetchOrganizations();
    if (activeTab === 'jobs') fetchJobs();
    if (activeTab === 'users') fetchUsers();
  };

  useEffect(() => {
    if (isArcturusAdmin) {
      fetchStats();
      if (activeTab === 'organizations') fetchOrganizations();
      if (activeTab === 'jobs') fetchJobs();
      if (activeTab === 'users') fetchUsers();
    }
  }, [token, activeTab, statusFilter]);

  // Action: Approve Organization
  const handleApproveOrg = async (orgId, orgName) => {
    setActionLoading(orgId);
    try {
      const res = await fetch(buildApiUrl(`/admin/organizations/${orgId}/approve`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`🎉 "${orgName}" has been approved! The owner can now post jobs.`);
        fetchStats();
        fetchOrganizations();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error || 'Failed to approve organization'}`);
      }
    } catch (err) {
      showToast('Network error while approving organization');
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Reject Organization Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionModalOrg) return;
    setActionLoading(rejectionModalOrg._id);
    try {
      const res = await fetch(buildApiUrl(`/admin/organizations/${rejectionModalOrg._id}/reject`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (res.ok) {
        showToast(`"${rejectionModalOrg.name}" has been marked as rejected.`);
        setRejectionModalOrg(null);
        setRejectionReason('');
        fetchStats();
        fetchOrganizations();
      } else {
        const data = await res.json();
        showToast(`Error: ${data.error || 'Failed to reject organization'}`);
      }
    } catch (err) {
      showToast('Network error while rejecting organization');
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Delete Job
  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete the job listing "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/admin/jobs/${jobId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Job listing "${title}" removed successfully.`);
        fetchStats();
        fetchJobs();
      }
    } catch (err) {
      showToast('Failed to delete job listing');
    }
  };

  // Action: Toggle User Verification
  const handleToggleUserVerify = async (userId, name) => {
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${userId}/toggle-verify`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`User "${name}" is now ${data.isVerified ? 'Verified ✔️' : 'Unverified'}.`);
        fetchUsers();
      }
    } catch (err) {
      showToast('Failed to toggle verification status');
    }
  };

  if (!isArcturusAdmin) {
    return (
      <div className="adminAccessDeniedPage">
        <div className="accessDeniedCard">
          <FaLock size={48} className="lockIcon" />
          <h2>Restricted Access</h2>
          <p>
            The Arcturus Operations Dashboard is restricted exclusively to authenticated <strong>Arcturus Admin</strong> accounts.
          </p>
          <div className="accessDeniedActions">
            <Link to="/" className="adminPrimaryBtn">
              Return to Feed
            </Link>
            <Link to="/login" className="adminSecondaryBtn">
              Sign in as Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminDashboardWrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="adminToast">
          <FaCheckCircle size={16} /> <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="adminTopHeader">
        <div className="adminHeaderInfo">
          <div className="adminHeaderTitleRow">
            <div className="adminShieldBadge">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <h1>Arcturus Operations Hub</h1>
              <p className="adminSubtitle">
                Full-suite administration, organization verification, and job moderation for <strong>@{user?.username || 'arcturus_admin'}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="adminHeaderActions">
          <button type="button" className="adminRefreshBtn" onClick={reloadData} title="Refresh Live Data">
            <FaSyncAlt size={13} /> <span>Refresh Stats</span>
          </button>
          <Link to="/jobs" className="adminLinkToPortal">
            <FaBriefcase size={13} /> <span>Job Portal</span>
          </Link>
        </div>
      </header>

      {/* KPI Metrics Summary Ribbon */}
      <AdminMetrics stats={stats} />

      {/* Navigation Tabs and Search */}
      <div className="adminTabsContainer">
        <div className="adminTabs">
          <button
            type="button"
            className={`adminTabBtn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('organizations');
              setSearchQuery('');
            }}
          >
            <FaBuilding size={15} />
            <span>Organization Verifications</span>
            {stats?.pendingOrganizations > 0 && (
              <span className="tabCountPill pendingPill">{stats.pendingOrganizations}</span>
            )}
          </button>

          <button
            type="button"
            className={`adminTabBtn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('jobs');
              setSearchQuery('');
            }}
          >
            <FaBriefcase size={15} />
            <span>Job Portal Moderation</span>
            <span className="tabCountPill">{stats?.totalJobs || 0}</span>
          </button>

          <button
            type="button"
            className={`adminTabBtn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSearchQuery('');
            }}
          >
            <FaUsers size={15} />
            <span>User Accounts</span>
            <span className="tabCountPill">{stats?.totalUsers || 0}</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <form
          className="adminSearchForm"
          onSubmit={(e) => {
            e.preventDefault();
            reloadData();
          }}
        >
          <FaSearch size={14} className="adminSearchIcon" />
          <input
            type="text"
            placeholder={
              activeTab === 'organizations'
                ? 'Search company name, industry, location...'
                : activeTab === 'jobs'
                ? 'Search job title, company, skills...'
                : 'Search users by name, username, email...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* TAB 1: ORGANIZATION VERIFICATIONS */}
      {activeTab === 'organizations' && (
        <OrganizationApprovals
          organizations={organizations}
          stats={stats}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loading={loading}
          actionLoading={actionLoading}
          onApprove={handleApproveOrg}
          onOpenRejectModal={(org) => {
            setRejectionModalOrg(org);
            setRejectionReason('');
          }}
          onOpenLightbox={(doc) => setLightboxDoc(doc)}
        />
      )}

      {/* TAB 2: JOB PORTAL MODERATION */}
      {activeTab === 'jobs' && (
        <JobModeration
          jobs={jobs}
          loading={loading}
          onDeleteJob={handleDeleteJob}
        />
      )}

      {/* TAB 3: USER ACCOUNTS MODERATION */}
      {activeTab === 'users' && (
        <UserModeration
          usersList={usersList}
          loading={loading}
          onToggleVerify={handleToggleUserVerify}
        />
      )}

      {/* LIGHTBOX MODAL FOR DOCUMENT INSPECTION */}
      <DocumentLightboxModal
        doc={lightboxDoc}
        onClose={() => setLightboxDoc(null)}
      />

      {/* REJECTION REASON MODAL */}
      <RejectionReasonModal
        organization={rejectionModalOrg}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onSubmit={handleRejectSubmit}
        onClose={() => setRejectionModalOrg(null)}
        loading={actionLoading === rejectionModalOrg?._id}
      />
    </div>
  );
};

export default AdminDashboard;

