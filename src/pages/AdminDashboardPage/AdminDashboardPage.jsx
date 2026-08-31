import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaBuilding, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf, 
  FaUsers, 
  FaBriefcase, 
  FaFileAlt, 
  FaSearch, 
  FaSyncAlt, 
  FaExternalLinkAlt, 
  FaEye, 
  FaTrashAlt, 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle,
  FaFileInvoice,
  FaGlobe,
  FaMapMarkerAlt,
  FaUserCheck,
  FaLock
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './AdminDashboardPage.css';

const REJECTION_PRESETS = [
  'Illegible or low-resolution document image. Please upload a clear scan.',
  'Organization name does not match submitted business registration certificate.',
  'Expired or invalid tax registration / incorporation certificate.',
  'Missing official government seal or registration authority stamp.',
  'Duplicate or unauthorized company representation claim.',
];

const AdminDashboardPage = () => {
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
  const [lightboxDoc, setLightboxDoc] = useState(null); // { url, title, documentType, originalName }
  const [rejectionModalOrg, setRejectionModalOrg] = useState(null); // org object
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

  // Action: Reject Organization
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
      <section className="adminMetricsGrid">
        <div className="metricCard">
          <div className="metricIconBox users">
            <FaUsers size={22} />
          </div>
          <div className="metricContent">
            <span className="metricLabel">Total Users</span>
            <span className="metricValue">{stats?.totalUsers ?? '...'}</span>
            <span className="metricSubtext">Platform accounts</span>
          </div>
        </div>

        <div className="metricCard">
          <div className="metricIconBox organizations">
            <FaBuilding size={22} />
          </div>
          <div className="metricContent">
            <span className="metricLabel">Organizations</span>
            <span className="metricValue">{stats?.totalOrganizations ?? '...'}</span>
            <span className="metricSubtext">{stats?.approvedOrganizations ?? 0} verified & active</span>
          </div>
        </div>

        <div className={`metricCard highlight ${(stats?.pendingOrganizations || 0) > 0 ? 'urgent' : ''}`}>
          <div className="metricIconBox pending">
            <FaHourglassHalf size={22} />
          </div>
          <div className="metricContent">
            <span className="metricLabel">Pending Approvals</span>
            <span className="metricValue">{stats?.pendingOrganizations ?? 0}</span>
            <span className="metricSubtext">Awaiting document review</span>
          </div>
        </div>

        <div className="metricCard">
          <div className="metricIconBox jobs">
            <FaBriefcase size={22} />
          </div>
          <div className="metricContent">
            <span className="metricLabel">Active Jobs</span>
            <span className="metricValue">{stats?.activeJobs ?? '...'}</span>
            <span className="metricSubtext">{stats?.totalApplications ?? 0} applications received</span>
          </div>
        </div>

        <div className="metricCard">
          <div className="metricIconBox posts">
            <FaFileAlt size={22} />
          </div>
          <div className="metricContent">
            <span className="metricLabel">Community Posts</span>
            <span className="metricValue">{stats?.totalPosts ?? '...'}</span>
            <span className="metricSubtext">Articles & feed updates</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
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
        <section className="adminSectionPanel">
          {/* Status Sub-filter Pills */}
          <div className="orgFilterRow">
            <div className="filterPillsGroup">
              <button
                type="button"
                className={`filterPill ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                <FaHourglassHalf size={12} /> Pending Review ({stats?.pendingOrganizations || 0})
              </button>
              <button
                type="button"
                className={`filterPill ${statusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                <FaCheckCircle size={12} /> Approved ({stats?.approvedOrganizations || 0})
              </button>
              <button
                type="button"
                className={`filterPill ${statusFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setStatusFilter('rejected')}
              >
                <FaTimesCircle size={12} /> Rejected ({stats?.rejectedOrganizations || 0})
              </button>
              <button
                type="button"
                className={`filterPill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Organizations ({stats?.totalOrganizations || 0})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="adminLoadingState">
              <FaSyncAlt className="spinAnimation" size={24} />
              <p>Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="adminEmptyState">
              <FaBuilding size={42} />
              <h3>No organizations found</h3>
              <p>There are currently no organizations matching the "{statusFilter}" status filter.</p>
            </div>
          ) : (
            <div className="organizationsAdminGrid">
              {organizations.map((org) => (
                <div key={org._id} className={`adminOrgCard ${org.status}`}>
                  {/* Org Card Header */}
                  <div className="adminOrgHeader">
                    <div className="adminOrgIdentity">
                      <img
                        src={org.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                        alt={org.name}
                        className="adminOrgLogo"
                      />
                      <div>
                        <div className="orgTitleRow">
                          <h3>{org.name}</h3>
                          <span className={`statusTag ${org.status}`}>
                            {org.status === 'pending' && <><FaHourglassHalf size={11} /> Pending Review</>}
                            {org.status === 'approved' && <><FaCheckCircle size={11} /> Approved</>}
                            {org.status === 'rejected' && <><FaTimesCircle size={11} /> Rejected</>}
                          </span>
                        </div>
                        <p className="orgTagline">{org.tagline || `${org.industry} · ${org.organizationSize} employees`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Company Details Grid */}
                  <div className="adminOrgMetaGrid">
                    <div className="metaField">
                      <span className="fieldLabel">Industry:</span>
                      <span className="fieldVal">{org.industry}</span>
                    </div>
                    <div className="metaField">
                      <span className="fieldLabel">Headquarters:</span>
                      <span className="fieldVal"><FaMapMarkerAlt size={11} /> {org.location}</span>
                    </div>
                    <div className="metaField">
                      <span className="fieldLabel">Type & Size:</span>
                      <span className="fieldVal">{org.organizationType} ({org.organizationSize} emp.)</span>
                    </div>
                    <div className="metaField">
                      <span className="fieldLabel">Website:</span>
                      {org.website ? (
                        <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="fieldLink">
                          <FaGlobe size={11} /> {org.website.replace(/^https?:\/\//, '')} <FaExternalLinkAlt size={9} />
                        </a>
                      ) : (
                        <span className="fieldVal textMuted">None provided</span>
                      )}
                    </div>
                    <div className="metaField fullSpan">
                      <span className="fieldLabel">Registered By:</span>
                      <span className="fieldVal">
                        <strong>{org.adminId?.firstName} {org.adminId?.lastName}</strong> ({org.adminId?.email}) · @{org.adminId?.username}
                      </span>
                    </div>
                    {org.description && (
                      <div className="metaField fullSpan descField">
                        <span className="fieldLabel">About Company:</span>
                        <p className="fieldDescText">{org.description}</p>
                      </div>
                    )}
                    {org.status === 'rejected' && org.rejectionReason && (
                      <div className="metaField fullSpan rejectionNotice">
                        <span className="fieldLabel"><FaExclamationTriangle size={12} /> Reason for Rejection:</span>
                        <p className="rejectionReasonText">{org.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Submitted Verification Documents Section */}
                  <div className="adminDocsSection">
                    <div className="docsSectionTitle">
                      <FaFileInvoice size={14} />
                      <h4>Submitted Verification Documents ({org.documents?.length || 0})</h4>
                    </div>

                    {org.documents && org.documents.length > 0 ? (
                      <div className="docsThumbnailsGrid">
                        {org.documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="docThumbnailCard"
                            onClick={() =>
                              setLightboxDoc({
                                url: doc.url,
                                title: `${org.name} - ${doc.documentType}`,
                                documentType: doc.documentType,
                                originalName: doc.originalName,
                              })
                            }
                            title="Click to view full-resolution document"
                          >
                            <div className="docImagePreviewBox">
                              <img src={doc.url} alt={doc.documentType} />
                              <div className="docHoverOverlay">
                                <FaEye size={16} /> <span>Inspect</span>
                              </div>
                            </div>
                            <span className="docTypeBadge">{doc.documentType}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="noDocsWarning">
                        <FaExclamationTriangle size={13} /> No documents uploaded for this organization.
                      </p>
                    )}
                  </div>

                  {/* Admin Actions Bar */}
                  <div className="adminOrgActions">
                    {org.status !== 'approved' && (
                      <button
                        type="button"
                        className="approveBtn"
                        onClick={() => handleApproveOrg(org._id, org.name)}
                        disabled={actionLoading === org._id}
                      >
                        <FaCheck size={13} />
                        <span>{actionLoading === org._id ? 'Approving...' : 'Approve Organization'}</span>
                      </button>
                    )}

                    {org.status !== 'rejected' && (
                      <button
                        type="button"
                        className="rejectBtn"
                        onClick={() => {
                          setRejectionModalOrg(org);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading === org._id}
                      >
                        <FaTimes size={13} />
                        <span>Reject / Request Changes</span>
                      </button>
                    )}

                    {org.status === 'approved' && (
                      <div className="approvedBadgeInfo">
                        <FaCheckCircle size={14} color="#10b981" />
                        <span>Verified on {org.reviewedAt ? new Date(org.reviewedAt).toLocaleDateString() : 'Active'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: JOB PORTAL MODERATION */}
      {activeTab === 'jobs' && (
        <section className="adminSectionPanel">
          <div className="panelHeaderRow">
            <h3>All Published Jobs ({jobs.length})</h3>
            <p>Monitor and moderate job listings posted by verified organization accounts.</p>
          </div>

          {loading ? (
            <div className="adminLoadingState">
              <FaSyncAlt className="spinAnimation" size={24} />
              <p>Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="adminEmptyState">
              <FaBriefcase size={42} />
              <h3>No job listings found</h3>
            </div>
          ) : (
            <div className="adminTableContainer">
              <table className="adminDataTable">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company / Organization</th>
                    <th>Location & Type</th>
                    <th>Recruiter</th>
                    <th>Applicants</th>
                    <th>Posted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j._id}>
                      <td className="jobTitleCell">
                        <strong>{j.title}</strong>
                        <span className="jobSalaryTag">{j.salary || 'Salary undisclosed'}</span>
                      </td>
                      <td>
                        <div className="tableCompanyCol">
                          <img
                            src={j.organizationId?.logo?.url || j.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                            alt={j.company}
                            className="tableLogo"
                          />
                          <span>{j.organizationId?.name || j.company}</span>
                        </div>
                      </td>
                      <td>
                        <span>{j.location}</span>
                        <span className="tableSubtext">{j.workplaceType} · {j.employmentType}</span>
                      </td>
                      <td>
                        <span>{j.recruiterId?.firstName} {j.recruiterId?.lastName}</span>
                        <span className="tableSubtext">{j.recruiterId?.email}</span>
                      </td>
                      <td>
                        <span className="applicantsCountBadge">
                          {j.applicants?.length || 0} applicants
                        </span>
                      </td>
                      <td>{new Date(j.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="tableDeleteBtn"
                          onClick={() => handleDeleteJob(j._id, j.title)}
                          title="Delete / Close Job Listing"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: USER ACCOUNTS MODERATION */}
      {activeTab === 'users' && (
        <section className="adminSectionPanel">
          <div className="panelHeaderRow">
            <h3>Registered Members ({usersList.length})</h3>
            <p>Manage user accounts, roles, and verification badges.</p>
          </div>

          {loading ? (
            <div className="adminLoadingState">
              <FaSyncAlt className="spinAnimation" size={24} />
              <p>Loading users...</p>
            </div>
          ) : usersList.length === 0 ? (
            <div className="adminEmptyState">
              <FaUsers size={42} />
              <h3>No users found</h3>
            </div>
          ) : (
            <div className="adminTableContainer">
              <table className="adminDataTable">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email & Handle</th>
                    <th>Role</th>
                    <th>Organizations</th>
                    <th>Verified Badge</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="tableUserCol">
                          {u.profilePicture?.url ? (
                            <img src={u.profilePicture.url} alt={u.firstName} className="tableAvatar" />
                          ) : (
                            <div className="tableAvatarFallback">{u.firstName?.[0] || 'U'}</div>
                          )}
                          <div>
                            <strong>{u.firstName} {u.lastName}</strong>
                            <p className="tableUserHeadline">{u.headline || 'Member'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>{u.email}</span>
                        <span className="tableSubtext">@{u.username || 'user'}</span>
                      </td>
                      <td>
                        <span className={`roleTag ${u.role || 'user'}`}>
                          {u.role === 'admin' || u.username === 'arcturus_admin' ? '🛡️ Admin' : 'Member'}
                        </span>
                      </td>
                      <td>
                        {u.organizations?.length > 0 ? (
                          <span className="orgCountPill">
                            {u.organizations.length} company
                          </span>
                        ) : (
                          <span className="textMuted">None</span>
                        )}
                      </td>
                      <td>
                        <span className={`verifiedBadgeTag ${u.isVerified ? 'verified' : 'unverified'}`}>
                          {u.isVerified ? '✔️ Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="tableActionBtn"
                          onClick={() => handleToggleUserVerify(u._id, `${u.firstName} ${u.lastName}`)}
                          title="Toggle Verification Badge"
                        >
                          <FaUserCheck size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* LIGHTBOX MODAL FOR HIGH-RES DOCUMENT INSPECTION */}
      {lightboxDoc && (
        <div className="adminModalOverlay" onClick={() => setLightboxDoc(null)}>
          <div className="adminLightboxCard" onClick={(e) => e.stopPropagation()}>
            <div className="lightboxHeader">
              <div>
                <h3>{lightboxDoc.title}</h3>
                <p>{lightboxDoc.documentType} · {lightboxDoc.originalName}</p>
              </div>
              <button type="button" className="lightboxCloseBtn" onClick={() => setLightboxDoc(null)}>
                <FaTimes size={18} />
              </button>
            </div>
            <div className="lightboxBody">
              <img src={lightboxDoc.url} alt={lightboxDoc.title} className="lightboxImage" />
            </div>
            <div className="lightboxFooter">
              <a href={lightboxDoc.url} target="_blank" rel="noreferrer" className="adminPrimaryBtn">
                <FaExternalLinkAlt size={12} /> Open Full Size in New Tab
              </a>
              <button type="button" className="adminSecondaryBtn" onClick={() => setLightboxDoc(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalOrg && (
        <div className="adminModalOverlay" onClick={() => setRejectionModalOrg(null)}>
          <div className="adminRejectionCard" onClick={(e) => e.stopPropagation()}>
            <div className="rejectionModalHeader">
              <div>
                <h3>Reject Organization Registration</h3>
                <p>Provide feedback for <strong>{rejectionModalOrg.name}</strong></p>
              </div>
              <button type="button" className="lightboxCloseBtn" onClick={() => setRejectionModalOrg(null)}>
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="rejectionPresetGroup">
                <label>Quick Reasons:</label>
                <div className="presetChips">
                  {REJECTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="presetChipBtn"
                      onClick={() => setRejectionReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="formGroup fullWidth">
                <label>Custom Feedback / Reason for Rejection</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why the registration was rejected and what documents the owner needs to provide..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="rejectionModalActions">
                <button type="button" className="adminSecondaryBtn" onClick={() => setRejectionModalOrg(null)}>
                  Cancel
                </button>
                <button type="submit" className="confirmRejectBtn" disabled={actionLoading === rejectionModalOrg._id}>
                  {actionLoading === rejectionModalOrg._id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

