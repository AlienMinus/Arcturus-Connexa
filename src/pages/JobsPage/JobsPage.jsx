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
  FaClock
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './JobsPage.css';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];

const JobsPage = () => {
  const { user, token } = useAuth();
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
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
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
        if (list.length > 0 && !selectedJob) {
          setSelectedJob(list[0]);
        }

        // Detect if user has already applied
        if (user?._id) {
          const applied = new Set();
          list.forEach((j) => {
            if (j.applicants?.some((a) => (a.applicantId?._id || a.applicantId) === user._id)) {
              applied.add(j._id || j.id);
            }
          });
          setAppliedJobIds(applied);
        }
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (job) => {
    const jobId = job._id || job.id;
    if (appliedJobIds.has(jobId)) {
      showToast('You have already applied to this position');
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
            <p>Explore thousands of tech, engineering, and product roles curated for you.</p>

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
            <Link to="/jobs/manage" className="manageListingsBtn">
              <FaBriefcase size={13} /> <span>Manage Listings</span>
            </Link>
            <Link to="/jobs/post" className="postJobBtn">
              <FaPlus size={12} /> <span>Post a Free Job</span>
            </Link>
          </div>
        </div>

        {/* Jobs Layout: Left Grid + Right Details Pane */}
        <div className="jobsMainLayout">
          <div className="jobsListColumn">
            {loading ? (
              <div className="jobsLoadingCard">
                <div className="jobsSpinner" />
                <p>Loading curated job openings...</p>
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
                  const jobId = job._id || job.id;
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

                        <button
                          type="button"
                          className={`easyApplyBtn ${isApplied ? 'applied' : ''}`}
                          disabled={isApplied || isApplying}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(job);
                          }}
                        >
                          {isApplying ? (
                            'Applying...'
                          ) : isApplied ? (
                            <>
                              <FaCheckCircle size={12} /> Applied
                            </>
                          ) : (
                            <>
                              <FaPaperPlane size={11} /> Easy Apply
                            </>
                          )}
                        </button>
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
                    <button
                      type="button"
                      className={`detailsApplyBtn ${appliedJobIds.has(selectedJob._id || selectedJob.id) ? 'applied' : ''}`}
                      disabled={appliedJobIds.has(selectedJob._id || selectedJob.id)}
                      onClick={() => handleApply(selectedJob)}
                    >
                      {appliedJobIds.has(selectedJob._id || selectedJob.id) ? (
                        <>
                          <FaCheckCircle size={13} /> Applied with Arcturus Profile
                        </>
                      ) : (
                        <>
                          <FaPaperPlane size={12} /> 1-Click Easy Apply
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="detailsSaveBtn"
                      onClick={() => toggleSaveJob(selectedJob._id || selectedJob.id)}
                    >
                      {savedJobs.includes(selectedJob._id || selectedJob.id) ? (
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
                      <span>{selectedJob.applicants.length} candidates have applied</span>
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
    </div>
  );
};

export default JobsPage;

