import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaBriefcase, 
  FaPlus, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaMoneyBillWave, 
  FaUsers, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaClock, 
  FaTrashAlt, 
  FaTags,
  FaImage,
  FaLock,
  FaSignInAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './JobPostingPage.css';

const LOGO_PRESETS = [
  { label: 'Tech / Figma', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png' },
  { label: 'React / Web', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png' },
  { label: 'AI / Innovation', url: 'https://cdn-icons-png.flaticon.com/512/8637/8637105.png' },
  { label: 'Cloud / DevOps', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968853.png' },
  { label: 'Finance / Business', url: 'https://cdn-icons-png.flaticon.com/512/5968/5968381.png' },
];

const JobPostingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manage'); // 'post' or 'manage'
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    company: '',
    companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
    location: '',
    type: 'Full-time',
    salary: '',
    skills: '',
    description: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchMyListings = async () => {
    if (!token) {
      setJobListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/jobs/my-listings'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setJobListings(data.jobs || []);
      } else {
        setJobListings([]);
      }
    } catch (err) {
      console.error('Failed to fetch job listings:', err);
      setJobListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [token]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!form.title || !form.company) return;

    if (!token) {
      showToast('Please sign in to publish a job listing');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/jobs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          companyLogo: form.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
          location: form.location || 'Remote',
          employmentType: form.type,
          salary: form.salary,
          skills: form.skills,
          description: form.description,
        }),
      });

      const data = await res.json();
      if (res.ok && data.job) {
        setJobListings([data.job, ...jobListings]);
        setForm({
          title: '',
          company: '',
          companyLogo: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
          location: '',
          type: 'Full-time',
          salary: '',
          skills: '',
          description: '',
        });
        showToast('Job posting published successfully to Arcturus Jobs! 🎉');
        setActiveTab('manage');
        return;
      } else {
        showToast(data.error || 'Failed to publish job.');
      }
    } catch (err) {
      console.error('Failed to post job:', err);
      showToast('Error publishing job listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!token) {
      showToast('Please sign in to manage listings');
      return;
    }

    if (!window.confirm('Are you sure you want to close and delete this job listing?')) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/jobs/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setJobListings((prev) => prev.filter((j) => (j._id || j.id) !== id));
        showToast('Job listing closed and deleted successfully.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete listing.');
      }
    } catch (err) {
      console.error('Delete job error:', err);
      showToast('Failed to delete listing.');
    }
  };

  return (
    <div className="jobPostingWrapper">
      <div className="jobPostingContainer">
        {/* Top Navigation */}
        <div className="jobPostingTopBar">
          <div className="topBarLeft">
            <Link to="/jobs" className="jobBackBtn">
              <FaArrowLeft size={13} /> <span>Back to Jobs</span>
            </Link>
            <h2>Job Posting & Recruiter Account</h2>
          </div>

          <div className="jobPostingTabs">
            <button
              type="button"
              className={`jobTabBtn ${activeTab === 'post' ? 'active' : ''}`}
              onClick={() => setActiveTab('post')}
            >
              <FaPlus size={12} /> <span>Post a Job</span>
            </button>
            <button
              type="button"
              className={`jobTabBtn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              <FaBriefcase size={13} /> <span>Manage Listings ({jobListings.length})</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="jobToast">
            <FaCheckCircle size={15} /> <span>{toastMessage}</span>
          </div>
        )}

        {/* Unauthorized State */}
        {!token ? (
          <div className="unauthorizedJobsCard">
            <FaLock size={44} className="lockIcon" />
            <h3>Recruiter Authentication Required</h3>
            <p>You must be signed in with your Arcturus account to publish openings and manage your active job listings.</p>
            <Link to="/login" className="authLoginBtn">
              <FaSignInAlt size={14} /> <span>Sign In to Continue</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Tab 1: Post a Job Form */}
            {activeTab === 'post' && (
              <div className="jobPostCard">
                <div className="jobCardHeader">
                  <h3>Create a New Job Opening</h3>
                  <p>Reach thousands of qualified professionals across the Arcturus network.</p>
                </div>

                <form onSubmit={handlePostJob} className="jobForm">
                  <div className="jobFormGrid">
                    <div className="formGroup">
                      <label>Job Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead React Engineer, Cloud Architect"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="formGroup">
                      <label>Company / Organization *</label>
                      <input
                        type="text"
                        placeholder="e.g. Arcturus Labs"
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>

                    {/* Company Logo / Icon Field */}
                    <div className="formGroup fullWidth">
                      <label>Company Logo / Icon URL</label>
                      <div className="logoInputWrapper">
                        <div className="logoPreviewContainer">
                          <img
                            src={form.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                            alt="Company Logo Preview"
                            className="logoPreviewImg"
                            onError={(e) => {
                              e.target.src = 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png';
                            }}
                          />
                        </div>
                        <div className="logoInputRight">
                          <input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={form.companyLogo}
                            onChange={(e) => setForm({ ...form, companyLogo: e.target.value })}
                          />
                          <div className="presetLogosRow">
                            <span className="presetLabel">Presets:</span>
                            {LOGO_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`presetLogoBtn ${form.companyLogo === preset.url ? 'active' : ''}`}
                                onClick={() => setForm({ ...form, companyLogo: preset.url })}
                                title={preset.label}
                              >
                                <img src={preset.url} alt={preset.label} />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="formGroup">
                      <label>Work Location & Workplace Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru, India · Hybrid / Remote"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>

                    <div className="formGroup">
                      <label>Employment Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>

                    <div className="formGroup">
                      <label>Estimated Compensation / Salary Range</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹18,00,000 - ₹25,00,000 / yr"
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      />
                    </div>

                    <div className="formGroup">
                      <label>Required Skills (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. React, Node.js, MongoDB, TypeScript"
                        value={form.skills}
                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                      />
                    </div>

                    <div className="formGroup fullWidth">
                      <label>Job Description & Responsibilities</label>
                      <textarea
                        rows={5}
                        placeholder="Outline the responsibilities, qualifications, requirements, and benefits..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="jobFormActions">
                    <button type="submit" className="publishJobBtn" disabled={submitting}>
                      <FaPlus size={13} /> <span>{submitting ? 'Publishing...' : 'Publish Job Listing'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Manage Active Listings */}
            {activeTab === 'manage' && (
              <div className="jobManageContainer">
                {loading ? (
                  <div className="manageLoadingBox">
                    <div className="jobsSpinner" />
                    <p>Loading your job listings from database...</p>
                  </div>
                ) : jobListings.length === 0 ? (
                  <div className="emptyJobsBox">
                    <FaBriefcase size={36} />
                    <h3>No active job listings</h3>
                    <p>You haven't posted any jobs yet. Create your first opening to attract candidates.</p>
                    <button type="button" className="publishJobBtn" onClick={() => setActiveTab('post')}>
                      <FaPlus size={12} /> Post a Job
                    </button>
                  </div>
                ) : (
                  <div className="jobCardsList">
                    {jobListings.map((job) => {
                      const jobId = job._id || job.id;
                      const applicantCount = Array.isArray(job.applicants) ? job.applicants.length : (job.applicants || 0);

                      return (
                        <div key={jobId} className="jobListingCard">
                          <div className="jobCardTop">
                            <img
                              src={job.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                              alt={job.company}
                              className="manageCompanyLogo"
                            />
                            <div className="jobPrimary">
                              <h4>{job.title}</h4>
                              <div className="jobMetaRow">
                                <span><FaBuilding size={11} /> {job.company}</span>
                                <span><FaMapMarkerAlt size={11} /> {job.location}</span>
                                <span><FaClock size={11} /> {job.employmentType || job.type}</span>
                                {job.salary && <span><FaMoneyBillWave size={11} /> {job.salary}</span>}
                              </div>
                            </div>

                            <span className="statusBadge active">
                              <span className="statusDot" /> {job.status || 'Active'}
                            </span>
                          </div>

                          <p className="jobDescSnippet">{job.description}</p>

                          {job.skills && job.skills.length > 0 && (
                            <div className="jobSkillsPills">
                              {(Array.isArray(job.skills) ? job.skills : job.skills.split(',')).map((s, idx) => (
                                <span key={idx} className="skillPill">{typeof s === 'string' ? s.trim() : s}</span>
                              ))}
                            </div>
                          )}

                          <div className="jobCardFooter">
                            <div className="applicantCountBadge">
                              <FaUsers size={13} /> <span>{applicantCount} candidates applied</span>
                            </div>

                            <button
                              type="button"
                              className="closeJobBtn"
                              onClick={() => handleDeleteJob(jobId)}
                              title="Close and delete job"
                            >
                              <FaTrashAlt size={12} /> <span>Close Job</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobPostingPage;
