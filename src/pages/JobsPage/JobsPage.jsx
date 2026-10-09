import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaBriefcase, 
  FaBuilding, 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaPlus, 
  FaBookmark, 
  FaRegBookmark,
  FaTimes, 
  FaPaperPlane,
  FaClock,
  FaClipboardCheck
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './JobsPage.css';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];

const JobsPage = () => {
  const { user, token, activeAccount } = useAuth();
  const canManageJobs = activeAccount?.type === 'organization';
  const currentUserId = (user?._id || user?.id)?.toString();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('arcturus_saved_jobs')) || [];
    } catch {
      return [];
    }
  });
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applicationsMap, setApplicationsMap] = useState({});
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [trackingModalJob, setTrackingModalJob] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchMyApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl('/jobs/my-applications'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const apps = data.applications || [];
        const map = {};
        const appliedSet = new Set();
        apps.forEach((app) => {
          const jid = (app.jobId?._id || app.jobId)?.toString();
          if (jid) {
            map[jid] = app;
            appliedSet.add(jid);
          }
        });
        setApplicationsMap(map);
        setAppliedJobIds((prev) => new Set([...prev, ...appliedSet]));
      }
    } catch (err) {
      console.error('Failed to load candidate applications:', err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (searchLocation) params.append('location', searchLocation);
      if (selectedType && selectedType !== 'All') params.append('type', selectedType);

      const res = await fetch(buildApiUrl(`/jobs?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        const list = data.jobs || [];
        setJobs(list);
        if (list.length > 0) {
          setSelectedJob((prev) => {
            const stillExists = list.find((j) => (j._id || j.id) === (prev?._id || prev?.id));
            return stillExists || list[0];
          });
        } else {
          setSelectedJob(null);
        }

        // Detect if user has already applied via applicant records
        if (currentUserId) {
          const applied = new Set();
          list.forEach((j) => {
            const jid = (j._id || j.id)?.toString();
            if (
              j.applicants?.some((a) => {
                const aid = (a.applicantId?._id || a.applicantId || a.userId)?.toString();
                return aid === currentUserId;
              })
            ) {
              applied.add(jid);
            }
          });
          setAppliedJobIds((prev) => new Set([...prev, ...applied]));
        }
      } else {
        setJobs([]);
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Failed to fetch jobs from database:', err);
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    if (token) {
      fetchMyApplications();
    }
  }, [selectedType, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (job) => {
    const jobId = (job._id || job.id)?.toString();
    if (appliedJobIds.has(jobId)) {
      setTrackingModalJob(job);
      return;
    }

    if (!token) {
      showToast('Please sign in to apply with your profile');
      return;
    }

    setApplyingJobId(jobId);
    try {
      const res = await fetch(buildApiUrl(`/jobs/${jobId}/apply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setAppliedJobIds((prev) => new Set([...prev, jobId]));
        showToast(`Application submitted to ${job.company}! 🎉`);
        fetchMyApplications();
        fetchJobs();
      } else {
        showToast(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Apply error:', err);
      showToast('Network error while applying');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleWithdrawApplication = async (jobId) => {
    if (!token || !jobId) return;
    if (!window.confirm('Are you sure you want to withdraw your application for this position?')) {
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch(buildApiUrl(`/jobs/${jobId}/withdraw`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Application withdrawn successfully');
        setTrackingModalJob(null);
        setAppliedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId.toString());
          return next;
        });
        setApplicationsMap((prev) => {
          const next = { ...prev };
          delete next[jobId.toString()];
          return next;
        });
        fetchMyApplications();
        fetchJobs();
      } else {
        showToast(data.error || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Withdraw application error:', err);
      showToast('Error withdrawing application');
    } finally {
      setWithdrawing(false);
    }
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs((prev) => {
      let updated;
      if (prev.includes(jobId)) {
        updated = prev.filter((id) => id !== jobId);
        showToast('Job removed from saved list');
      } else {
        updated = [...prev, jobId];
        showToast('Job saved to your bookmarks 📌');
      }
      localStorage.setItem('arcturus_saved_jobs', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="jobsPortalWrapper">
      <div className="jobsPortalContainer">
        <div className={`workspaceIdentityStrip ${activeAccount?.type === 'organization' ? 'organization-context' : ''}`}>
          <div className="workspaceIdentityCopy">
            <span className="workspaceIdentityEyebrow">Browsing as</span>
            <strong>{activeAccount?.type === 'organization' ? activeAccount.name : 'Personal profile'}</strong>
          </div>
          <Link to="/settings/accounts" className="workspaceIdentityLink">Switch identity</Link>
        </div>
        {/* Toast Alert */}
        {toastMessage && (
          <div className="jobsToast">
            <FaCheckCircle size={15} /> <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Banner & Search */}
        <div className="jobsHeroBanner">
          <div className="jobsHeroContent">
            <h1>Find your next career opportunity</h1>
            <p>Explore curated tech, engineering, and product roles straight from the database.</p>

            <form onSubmit={handleSearchSubmit} className="jobsSearchForm">
              <div className="jobsSearchInputGroup">
                <FaSearch className="searchFieldIcon" />
                <input
                  type="text"
                  placeholder="Job title, skill, or company (e.g. React, Engineer)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="jobsSearchInputGroup">
                <FaMapMarkerAlt className="searchFieldIcon" />
                <input
                  type="text"
                  placeholder="Location or 'Remote'"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>

              <button type="submit" className="jobsSearchBtn">
                Search Jobs
              </button>
            </form>
          </div>
        </div>

        {/* Quick Nav & Filter Bar */}
        <div className="jobsFilterBar">
          <div className="jobsTypeChips">
            {JOB_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`typeChip ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="jobsRecruiterActions">
            {canManageJobs ? (
              <>
                <Link to="/jobs/manage" className="manageListingsBtn">
                  <FaBriefcase size={13} /> <span>Manage Listings</span>
                </Link>
                <Link to="/jobs/post" className="postJobBtn">
                  <FaPlus size={12} /> <span>Post a Free Job</span>
                </Link>
              </>
            ) : (
              <Link to="/settings/applications" className="manageListingsBtn applicationTrackerBtn">
                <FaBriefcase size={13} /> <span>Application Tracker</span>
              </Link>
            )}
          </div>
        </div>

        {/* Jobs Layout: Left Grid + Right Details Pane */}
        <div className="jobsMainLayout">
          <div className="jobsListColumn">
            {loading ? (
              <div className="jobsLoadingCard">
                <div className="jobsSpinner" />
                <p>Fetching jobs from database...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="jobsEmptyCard">
                <FaBriefcase size={40} className="emptyJobsIcon" />
                <h3>No job openings found</h3>
                <p>Try adjusting your search keywords or location filters.</p>
                <button
                  type="button"
                  className="resetFilterBtn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchLocation('');
                    setSelectedType('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="jobsGrid">
                {jobs.map((job) => {
                  const jobId = (job._id || job.id)?.toString();
                  const isApplied = appliedJobIds.has(jobId);
                  const isSaved = savedJobs.includes(jobId);
                  const isApplying = applyingJobId === jobId;

                  return (
                    <div
                      key={jobId}
                      className={`jobCard ${selectedJob?._id === jobId ? 'selected' : ''}`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="jobCardTop">
                        <img
                          src={job.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                          alt={job.company}
                          className="jobCompanyLogo"
                        />
                        <div className="jobCardInfo">
                          <h3 className="jobCardTitle">{job.title}</h3>
                          <div className="jobCompanyName">{job.company}</div>
                          <div className="jobCardMeta">
                            <span><FaMapMarkerAlt size={11} /> {job.location}</span>
                            <span>•</span>
                            <span className="workplaceBadge">{job.workplaceType || 'Hybrid'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="saveJobBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveJob(jobId);
                          }}
                          title={isSaved ? 'Remove bookmark' : 'Save job'}
                        >
                          {isSaved ? <FaBookmark size={15} color="#0a66c2" /> : <FaRegBookmark size={15} />}
                        </button>
                      </div>

                      {job.salary && (
                        <div className="jobCardSalary">
                          <FaMoneyBillWave size={12} /> {job.salary}
                        </div>
                      )}

                      {job.skills && job.skills.length > 0 && (
                        <div className="jobCardSkills">
                          {job.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="jobSkillTag">{skill}</span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="jobSkillMore">+{job.skills.length - 4}</span>
                          )}
                        </div>
                      )}

                      <div className="jobCardBottom">
                        <span className="jobPostedTime">
                          <FaClock size={11} /> Active Opening
                        </span>

                        {isApplied ? (
                          <button
                            type="button"
                            className="trackApplicationBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackingModalJob(job);
                            }}
                          >
                            <FaClipboardCheck size={12} /> Track Application
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="easyApplyBtn"
                            disabled={isApplying}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(job);
                            }}
                          >
                            {isApplying ? (
                              'Applying...'
                            ) : (
                              <>
                                <FaPaperPlane size={11} /> Easy Apply
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Job Details Sidebar Panel (Sticky on large screens) */}
          <div className="jobDetailsColumn">
            {selectedJob ? (
              <div className="jobDetailsCard">
                <div className="jobDetailsHeader">
                  <div className="detailsCompanyRow">
                    <img
                      src={selectedJob.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                      alt={selectedJob.company}
                      className="detailsLogo"
                    />
                    <div>
                      <h2>{selectedJob.title}</h2>
                      <div className="detailsCompanyName">{selectedJob.company}</div>
                      <div className="detailsMetaRow">
                        <span>{selectedJob.location}</span>
                        <span>•</span>
                        <span className="workplaceBadge">{selectedJob.workplaceType || 'Hybrid'}</span>
                        <span>•</span>
                        <span>{selectedJob.employmentType || 'Full-time'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detailsActionRow">
                    {appliedJobIds.has((selectedJob._id || selectedJob.id)?.toString()) ? (
                      <button
                        type="button"
                        className="detailsTrackBtn"
                        onClick={() => setTrackingModalJob(selectedJob)}
                      >
                        <FaClipboardCheck size={14} /> Track Application
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="detailsApplyBtn"
                        disabled={applyingJobId === (selectedJob._id || selectedJob.id)?.toString()}
                        onClick={() => handleApply(selectedJob)}
                      >
                        {applyingJobId === (selectedJob._id || selectedJob.id)?.toString() ? (
                          'Applying...'
                        ) : (
                          <>
                            <FaPaperPlane size={12} /> 1-Click Easy Apply
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      className="detailsSaveBtn"
                      onClick={() => toggleSaveJob(selectedJob._id || selectedJob.id)}
                    >
                      {savedJobs.includes((selectedJob._id || selectedJob.id)?.toString()) ? (
                        <FaBookmark size={15} color="#0a66c2" />
                      ) : (
                        <FaRegBookmark size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="jobDetailsBody">
                  {selectedJob.salary && (
                    <div className="detailsSection">
                      <h4>Estimated Compensation</h4>
                      <p className="salaryText">{selectedJob.salary}</p>
                    </div>
                  )}

                  <div className="detailsSection">
                    <h4>Required Skills & Tools</h4>
                    <div className="detailsSkillsList">
                      {(selectedJob.skills || []).map((s, idx) => (
                        <span key={idx} className="detailsSkillPill">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="detailsSection">
                    <h4>About the Role</h4>
                    <div className="detailsDescriptionText">
                      {selectedJob.description}
                    </div>
                  </div>

                  {selectedJob.applicants && (
                    <div className="detailsSection applicantsCount">
                      <span>{(selectedJob.applicants || []).length} candidates have applied</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="jobDetailsPlaceholder">
                <FaBriefcase size={36} className="placeholderIcon" />
                <h3>Select a job opening</h3>
                <p>Click on any job listing on the left to inspect requirements, skills, and submit a 1-click application.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track Application Modal */}
      {trackingModalJob && (() => {
        const trkId = (trackingModalJob._id || trackingModalJob.id)?.toString();
        const currentApp = applicationsMap[trkId];
        const statusStr = currentApp?.status || 'Applied';
        const stLower = statusStr.toLowerCase();
        const isUnderReview = stLower.includes('review') || stLower.includes('shortlist') || stLower.includes('interview') || stLower.includes('hire') || stLower.includes('offer');
        const isShortlisted = stLower.includes('shortlist') || stLower.includes('interview') || stLower.includes('hire') || stLower.includes('offer');
        const isDecision = stLower.includes('hire') || stLower.includes('offer') || stLower.includes('placed') || stLower.includes('reject');

        return (
          <div className="trackModalOverlay" onClick={() => setTrackingModalJob(null)}>
            <div className="trackModalContent" onClick={(e) => e.stopPropagation()}>
              <div className="trackModalHeader">
                <div className="trackModalHeaderTitle">
                  <FaClipboardCheck size={20} color="#0a66c2" />
                  <h3>Application Status Tracker</h3>
                </div>
                <button
                  type="button"
                  className="trackModalCloseBtn"
                  onClick={() => setTrackingModalJob(null)}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="trackModalBody">
                <div className="trackJobSummary">
                  <img
                    src={trackingModalJob.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                    alt={trackingModalJob.company}
                    className="trackCompanyLogo"
                  />
                  <div>
                    <h4>{trackingModalJob.title}</h4>
                    <div className="trackCompanyName">{trackingModalJob.company}</div>
                    <div className="trackJobMeta">
                      <span><FaMapMarkerAlt size={11} /> {trackingModalJob.location}</span>
                      <span>•</span>
                      <span className="workplaceBadge">{trackingModalJob.workplaceType || 'Hybrid'}</span>
                      <span>•</span>
                      <span>{trackingModalJob.employmentType || 'Full-time'}</span>
                    </div>
                  </div>
                </div>

                <div className="trackStatusBanner">
                  <span className="trackStatusLabel">Current Status:</span>
                  <span className={`trackStatusBadge status-${statusStr.toLowerCase().replace(' ', '-')}`}>
                    <FaCheckCircle size={13} /> {statusStr}
                  </span>
                </div>

                <div className="trackTimeline">
                  <div className="trackTimelineTitle">Hiring Process & Timeline</div>
                  <div className="trackTimelineSteps">
                    <div className="timelineStep completed">
                      <div className="stepDot"><FaCheckCircle size={12} /></div>
                      <div className="stepContent">
                        <strong>Application Submitted</strong>
                        <span>Submitted with verified Arcturus candidate profile</span>
                        {currentApp?.appliedAt && (
                          <span className="stepTime">
                            {new Date(currentApp.appliedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`timelineStep ${isUnderReview ? 'active' : ''}`}>
                      <div className="stepDot">2</div>
                      <div className="stepContent">
                        <strong>Under Review</strong>
                        <span>Hiring team is evaluating candidate credentials and background</span>
                      </div>
                    </div>

                    <div className={`timelineStep ${isShortlisted ? 'active' : ''}`}>
                      <div className="stepDot">3</div>
                      <div className="stepContent">
                        <strong>Interview & Assessment</strong>
                        <span>Shortlisted for technical assessment or round discussion</span>
                      </div>
                    </div>

                    <div className={`timelineStep ${isDecision ? 'active' : ''}`}>
                      <div className="stepDot">4</div>
                      <div className="stepContent">
                        <strong>Offer Decision</strong>
                        <span>Final decision and formal employment proposal</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="trackCandidateInfo">
                  <div className="trackCandidateInfoTitle">Candidate Profile Attached</div>
                  <div className="trackCandidateDetails">
                    <div>
                      <strong>Applicant: </strong>
                      <span>{currentApp?.candidateName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Arcturus Member'}</span>
                    </div>
                    {(currentApp?.candidateHeadline || user?.headline) && (
                      <div>
                        <strong>Headline: </strong>
                        <span>{currentApp?.candidateHeadline || user?.headline}</span>
                      </div>
                    )}
                    {user?.email && (
                      <div>
                        <strong>Email: </strong>
                        <span>{user?.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="trackModalFooter">
                <button
                  type="button"
                  className="withdrawAppBtn"
                  disabled={withdrawing}
                  onClick={() => handleWithdrawApplication(trkId)}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                </button>

                <button
                  type="button"
                  className="trackCloseActionBtn"
                  onClick={() => setTrackingModalJob(null)}
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    
  );
};

export default JobsPage;
