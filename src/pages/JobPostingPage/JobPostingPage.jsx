import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  FaTags 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './JobPostingPage.css';

const INITIAL_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer (React & TypeScript)',
    company: 'Arcturus Labs',
    location: 'Bengaluru, India · Hybrid',
    type: 'Full-time',
    salary: '₹22,00,000 - ₹30,00,000 / yr',
    applicants: 18,
    postedDate: '2 days ago',
    status: 'Active',
    skills: ['React', 'TypeScript', 'Redux', 'CSS3', 'WebSockets'],
    description: 'We are looking for an experienced Frontend Architect to build next-generation collaboration and real-time social networking interfaces.',
  },
  {
    id: 'job-2',
    title: 'Full-Stack Developer (Node.js & MongoDB)',
    company: 'Connexa Tech',
    location: 'Remote · India',
    type: 'Full-time',
    salary: '₹16,00,000 - ₹24,00,000 / yr',
    applicants: 34,
    postedDate: '5 days ago',
    status: 'Active',
    skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Cloudinary'],
    description: 'Lead backend microservices development, optimize MongoDB queries, and implement real-time streaming communication architectures.',
  },
];

const JobPostingPage = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'manage'
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    company: '',
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
    setLoading(true);
    try {
      if (token) {
        const res = await fetch(buildApiUrl('/jobs/my-listings'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.jobs && data.jobs.length > 0) {
            setJobListings(data.jobs);
            setLoading(false);
            return;
          }
        }
      }
      setJobListings(INITIAL_JOBS);
    } catch (err) {
      console.error('Failed to fetch job listings:', err);
      setJobListings(INITIAL_JOBS);
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

    setSubmitting(true);
    try {
      if (token) {
        const res = await fetch(buildApiUrl('/jobs'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title,
            company: form.company,
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
          setForm({ title: '', company: '', location: '', type: 'Full-time', salary: '', skills: '', description: '' });
          showToast('Job posting published successfully to Arcturus Jobs! 🎉');
          setActiveTab('manage');
          return;
        }
      }

      // Local fallback if offline/no token
      const newJob = {
        id: `job-${Date.now()}`,
        _id: `job-${Date.now()}`,
        title: form.title,
        company: form.company,
        location: form.location || 'Remote',
        type: form.type,
        salary: form.salary || 'Competitive',
        applicants: 0,
        postedDate: 'Just now',
        status: 'Active',
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        description: form.description,
      };

      setJobListings([newJob, ...jobListings]);
      setForm({ title: '', company: '', location: '', type: 'Full-time', salary: '', skills: '', description: '' });
      showToast('Job posting published successfully! 🎉');
      setActiveTab('manage');
    } catch (err) {
      console.error('Failed to post job:', err);
      showToast('Error publishing job listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      if (token && id && !id.toString().startsWith('job-')) {
        await fetch(buildApiUrl(`/jobs/${id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setJobListings((prev) => prev.filter((j) => (j._id || j.id) !== id));
      showToast('Job listing removed.');
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
            {jobListings.length === 0 ? (
              <div className="emptyJobsBox">
                <FaBriefcase size={36} />
                <h3>No active job listings</h3>
                <p>You haven't posted any jobs yet. Create your first opening to attract applicants.</p>
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
                        <div className="jobPrimary">
                          <h4>{job.title}</h4>
                          <div className="jobMetaRow">
                            <span><FaBuilding /> {job.company}</span>
                            <span><FaMapMarkerAlt /> {job.location}</span>
                            <span><FaClock /> {job.employmentType || job.type}</span>
                            {job.salary && <span><FaMoneyBillWave /> {job.salary}</span>}
                          </div>
                        </div>

                        <div className="jobStatusPill">
                          <span className="statusDot"></span>
                          <span>Active</span>
                        </div>
                      </div>

                      {job.description && (
                        <p className="jobListingDesc">{job.description}</p>
                      )}

                      {job.skills && job.skills.length > 0 && (
                        <div className="jobSkillsRow">
                          {job.skills.map((skill, i) => (
                            <span key={i} className="skillChip">{skill}</span>
                          ))}
                        </div>
                      )}

                      <div className="jobCardBottom">
                        <div className="applicantCount">
                          <FaUsers />
                          <span><strong>{applicantCount}</strong> candidates applied</span>
                        </div>

                        <div className="jobActionBtns">
                          <button
                            type="button"
                            className="jobDeleteBtn"
                            onClick={() => handleDeleteJob(jobId)}
                            title="Close & remove this job"
                          >
                            <FaTrashAlt size={12} /> <span>Close Job</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPostingPage;
