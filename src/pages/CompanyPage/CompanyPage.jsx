import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaBuilding, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaUsers, 
  FaBriefcase, 
  FaPlus, 
  FaExternalLinkAlt, 
  FaUserCheck, 
  FaUserPlus 
} from 'react-icons/fa';
import { buildApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getUserFullName } from '../../utils/user';
import './CompanyPage.css';

const CompanyPage = () => {
  const { idOrSlug } = useParams();
  const { user, token } = useAuth();
  const [org, setOrg] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', tagline: '', description: '', industry: '', website: '', location: '' });

  useEffect(() => {
    let isMounted = true;
    const fetchOrgData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildApiUrl(`/organizations/${encodeURIComponent(idOrSlug)}`));
        if (!res.ok) {
          throw new Error('Organization not found');
        }
        const data = await res.json();
        if (isMounted) {
          setOrg(data.organization);
          setJobs(data.jobs || []);
          const followerIds = data.organization?.followers || [];
          setFollowersCount(followerIds.length);
          setIsFollowing(Boolean(user?._id && followerIds.some((follower) => (follower?._id || follower) === user._id)));
          setEditForm({
            name: data.organization?.name || '',
            tagline: data.organization?.tagline || '',
            description: data.organization?.description || '',
            industry: data.organization?.industry || '',
            website: data.organization?.website || '',
            location: data.organization?.location || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrgData();
    return () => {
      isMounted = false;
    };
  }, [idOrSlug, user?._id]);

  const toggleFollow = async () => {
    if (!token) return;
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      const response = await fetch(buildApiUrl(`/organizations/${org._id}/follow`), {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setIsFollowing(data.following);
      setFollowersCount(data.followersCount);
    } catch (err) {
      console.error('Failed to update organization follow state:', err);
    }
  };

  const saveOrganization = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(buildApiUrl(`/organizations/${org._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update organization');
      setOrg((current) => ({ ...current, ...data.organization }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update organization profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="companyPageWrapper">
        <div className="companyTabSection" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="companyPageWrapper">
        <div className="companyTabSection" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FaBuilding size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Organization Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: 20 }}>
            The requested organization does not exist or may have been removed.
          </p>
          <Link to="/jobs" className="companyFollowBtn" style={{ textDecoration: 'none' }}>
            Explore Jobs & Companies
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = org.status === 'approved';
  const isPending = org.status === 'pending';
  const isUserAdminOrMember =
    (user?._id && org.adminId?._id === user._id) ||
    org.members?.some((m) => (m.userId?._id || m.userId) === user?._id);

  return (
    <div className="companyPageWrapper">
      {/* Top Hero Banner & Info */}
      <div className="companyHeroCard">
        <div className="companyBanner" />

        <div className="companyHeaderContent">
          <div className="companyLogoWrapper">
            {org.logo?.url ? (
              <img src={org.logo.url} alt={org.name} className="companyHeroLogo" />
            ) : (
              <div className="companyHeroLogoFallback">
                <FaBuilding size={48} color="#0a66c2" />
              </div>
            )}
          </div>

          <div className="companyTitleRow">
            <div>
              <h1 className="companyMainTitle">
                {org.name}
                {isVerified && (
                  <span className="searchVerifiedBadge" title="Verified Organization Account">
                    <FaCheckCircle size={13} /> Verified
                  </span>
                )}
                {isPending && (
                  <span
                    className="searchVerifiedBadge"
                    style={{ background: '#fef3c7', color: '#b45309' }}
                    title="Under Review"
                  >
                    <FaClock size={13} /> Under Review
                  </span>
                )}
              </h1>
              <p className="companyHeroTagline">
                {org.tagline || `${org.industry} company based in ${org.location}`}
              </p>
            </div>

            <div className="companyActionRow">
              <button
                type="button"
                className={`companyFollowBtn ${isFollowing ? 'following' : ''}`}
                onClick={toggleFollow}
              >
                {isFollowing ? (
                  <>
                    <FaUserCheck size={14} /> Following
                  </>
                ) : (
                  <>
                    <FaUserPlus size={14} /> Follow
                  </>
                )}
              </button>

              {org.website && (
                <a
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="companyWebsiteBtn"
                >
                  <FaGlobe size={13} /> Visit Website <FaExternalLinkAlt size={11} />
                </a>
              )}

              {isUserAdminOrMember && (
                <button type="button" className="companyEditBtn" onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? 'Close Editor' : 'Edit Company Page'}
                </button>
              )}

              {isUserAdminOrMember ? (
                <Link to="/jobs/manage" className="companyPostJobBtn">
                  <FaPlus size={12} /> Post a Job
                </Link>
              ) : (
                <Link to="/jobs" className="companyPostJobBtn">
                  <FaBriefcase size={12} /> View All Jobs
                </Link>
              )}
            </div>
          </div>

          <div className="companyHeroMetaList">
            <div className="companyHeroMetaItem">
              <FaBuilding size={13} />
              <span>{org.industry || 'Software & Technology'}</span>
            </div>

            <div className="companyHeroMetaItem">
              <FaMapMarkerAlt size={13} />
              <span>{org.location}</span>
            </div>

            <div className="companyHeroMetaItem">
              <FaUsers size={13} />
              <span>{org.organizationSize || '11-50'} employees · {followersCount} followers</span>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <form className="companyEditPanel" onSubmit={saveOrganization}>
          <div className="companyEditHeader">
            <div>
              <h2>Edit Company Page</h2>
              <p>Update the public organization details shown to candidates and followers.</p>
            </div>
          </div>
          <div className="companyEditGrid">
            {[
              ['name', 'Company name'],
              ['tagline', 'Tagline'],
              ['industry', 'Industry'],
              ['location', 'Location'],
              ['website', 'Website'],
            ].map(([field, label]) => (
              <label key={field}>
                <span>{label}</span>
                <input value={editForm[field]} onChange={(event) => setEditForm({ ...editForm, [field]: event.target.value })} />
              </label>
            ))}
            <label className="companyEditFullWidth">
              <span>Description</span>
              <textarea rows="4" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
            </label>
          </div>
          <button type="submit" className="companyEditSaveBtn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Company Page'}
          </button>
        </form>
      )}

      {/* Navigation Tabs */}
      <div className="companyTabsCard">
        <button
          type="button"
          className={`companyProfileTab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>

        <button
          type="button"
          className={`companyProfileTab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs ({jobs.length})
        </button>

        <button
          type="button"
          className={`companyProfileTab ${activeTab === 'people' ? 'active' : ''}`}
          onClick={() => setActiveTab('people')}
        >
          People ({org.members?.length || 1})
        </button>
      </div>

      {/* Tab 1: About */}
      {activeTab === 'about' && (
        <div className="companyTabSection">
          <h3 className="companySectionHeading">Overview</h3>
          <p className="companyDescriptionText">
            {org.description ||
              `${org.name} is an active organization registered on Arcturus Connexa specializing in ${org.industry}. We are committed to engineering next-generation collaborative workflows and connecting top talent.`}
          </p>

          <div className="companyDetailGrid">
            <div className="companyDetailItem">
              <h5>Website</h5>
              <p>
                {org.website ? (
                  <a
                    href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0a66c2', textDecoration: 'none' }}
                  >
                    {org.website}
                  </a>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>

            <div className="companyDetailItem">
              <h5>Industry</h5>
              <p>{org.industry || 'Software Development'}</p>
            </div>

            <div className="companyDetailItem">
              <h5>Company Size</h5>
              <p>{org.organizationSize || '11-50'} employees</p>
            </div>

            <div className="companyDetailItem">
              <h5>Headquarters</h5>
              <p>{org.location}</p>
            </div>

            <div className="companyDetailItem">
              <h5>Type</h5>
              <p>{org.organizationType || 'Privately Held'}</p>
            </div>

            <div className="companyDetailItem">
              <h5>Account Status</h5>
              <p style={{ textTransform: 'capitalize' }}>
                {org.status === 'approved' ? 'Verified Account' : org.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Jobs */}
      {activeTab === 'jobs' && (
        <div className="companyTabSection">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="companySectionHeading" style={{ margin: 0 }}>
              Open Positions at {org.name} ({jobs.length})
            </h3>
            {isUserAdminOrMember && (
              <Link to="/jobs/post" className="companyFollowBtn" style={{ textDecoration: 'none', fontSize: '0.84rem' }}>
                <FaPlus size={11} /> Post New Opening
              </Link>
            )}
          </div>

          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <FaBriefcase size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0 }}>There are currently no active job postings for {org.name}.</p>
            </div>
          ) : (
            <div className="companyJobsList">
              {jobs.map((job) => (
                <div key={job._id} className="companyJobItemCard">
                  <div>
                    <h4 className="companyJobItemTitle">{job.title}</h4>
                    <div className="companyJobItemMeta">
                      <span>
                        <FaMapMarkerAlt size={11} style={{ marginRight: 4 }} />
                        {job.location}
                      </span>
                      <span>· {job.type}</span>
                      {job.salaryRange && <span>· {job.salaryRange}</span>}
                    </div>
                  </div>

                  <Link
                    to={`/jobs?q=${encodeURIComponent(job.title)}`}
                    className="companyJobApplyBtn"
                  >
                    View & Apply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: People */}
      {activeTab === 'people' && (
        <div className="companyTabSection">
          <h3 className="companySectionHeading">Leadership & Team Members</h3>
          <div className="companyMembersGrid">
            {org.adminId && (
              <div className="companyMemberCard">
                <img
                  src={org.adminId.profilePicture?.url || '/favicon.png'}
                  alt={org.adminId.firstName}
                  className="companyMemberAvatar"
                />
                <div>
                  <Link
                    to={`/profile/${encodeURIComponent(org.adminId.username || '')}`}
                    style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                  >
                    {getUserFullName(org.adminId)}
                  </Link>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#0a66c2', fontWeight: 600 }}>
                    Founder & Administrator
                  </p>
                  <small style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {org.adminId.headline || 'Arcturus Member'}
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;

