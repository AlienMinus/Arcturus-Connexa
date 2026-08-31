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
  FaSignInAlt,
  FaHourglassHalf,
  FaTimesCircle,
  FaShieldAlt,
  FaFileUpload,
  FaFileInvoice,
  FaGlobe,
  FaExclamationTriangle,
  FaChevronDown
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './JobPostingPage.css';

const LOGO_PRESETS = [
  {
    label: 'Tech & Software',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%230284c7"/><path d="M18 22h28a2 2 0 012 2v16a2 2 0 01-2 2H18a2 2 0 01-2-2V24a2 2 0 012-2zm4 4v12h20V26H22zm4 18h12v2H26v-2zm-6 4h24v2H20v-2z" fill="%23ffffff"/></svg>',
  },
  {
    label: 'AI & Intelligence',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%237c3aed"/><circle cx="32" cy="32" r="10" fill="%23ffffff"/><circle cx="18" cy="22" r="4" fill="%23ffffff"/><circle cx="46" cy="22" r="4" fill="%23ffffff"/><circle cx="18" cy="42" r="4" fill="%23ffffff"/><circle cx="46" cy="42" r="4" fill="%23ffffff"/><path d="M21 24l8 6m6 0l8-6m-22 16l8-6m6 0l8 6" stroke="%23ffffff" stroke-width="2.5"/></svg>',
  },
  {
    label: 'Cloud & DevOps',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%230a66c2"/><path d="M44 38a8 8 0 00-1.5-15.8A12 12 0 0020 28a7 7 0 000 14h24a8 8 0 000-4z" fill="%23ffffff"/></svg>',
  },
  {
    label: 'Finance & Fintech',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%2316a34a"/><path d="M20 44V34m8 10V26m8 10V20m8 24V16m-24 6l8-6 8 4 8-8" stroke="%23ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    label: 'Startup & Ventures',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%23ea580c"/><path d="M32 16c6 6 10 14 10 20a10 10 0 01-20 0c0-6 4-14 10-20zm0 14a4 4 0 100 8 4 4 0 000-8z" fill="%23ffffff"/><path d="M22 38l-4 4v4l6-2m18-6l4 4v4l-6-2" stroke="%23ffffff" stroke-width="2.5"/></svg>',
  },
  {
    label: 'Enterprise & Corp',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%23334155"/><path d="M20 18h16v28H20V18zm16 10h12v18H36V28zm-10 4h4v4h-4v-4zm0 8h4v4h-4v-4zm16-4h4v4h-4v-4zm0 8h4v4h-4v-4z" fill="%23ffffff"/></svg>',
  },
  {
    label: 'Healthcare & Bio',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%23e11d48"/><path d="M28 18h8v10h10v8H36v10h-8V36H18v-8h10V18z" fill="%23ffffff"/></svg>',
  },
  {
    label: 'Education & EdTech',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%234f46e5"/><path d="M32 18L14 28l18 10 18-10-18-10zm-12 16v8c0 4 5.4 8 12 8s12-4 12-8v-8l-12 6-12-6z" fill="%23ffffff"/></svg>',
  },
];

const INDUSTRIES = [
  'Software Development',
  'Technology & Internet',
  'Financial Services & Fintech',
  'Healthcare & Biotechnology',
  'E-Commerce & Retail',
  'Telecommunications',
  'Media & Entertainment',
  'Education & EdTech',
  'Consulting & Business Services',
  'Design & Creative Agency',
  'Aerospace & Defense',
  'Other',
];

const ORG_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const ORG_TYPES = [
  'Privately Held',
  'Public Company',
  'Startup',
  'Nonprofit',
  'Government Agency',
  'Sole Proprietorship',
  'Partnership',
];

const DOCUMENT_TYPES = [
  'Certificate of Incorporation',
  'Business License',
  'Tax ID / Registration',
  'GST / VAT Certificate',
  'Utility / Proof of Address',
  'Other Verification Document',
];

const JobPostingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('post'); // 'post', 'manage', 'register_org'
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Job Form State
  const [form, setForm] = useState({
    title: '',
    location: '',
    workplaceType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '',
    skills: '',
    description: '',
  });

  // Organization Registration Form State
  const [orgForm, setOrgForm] = useState({
    name: '',
    tagline: '',
    description: '',
    industry: 'Software Development',
    organizationSize: '11-50',
    organizationType: 'Privately Held',
    website: '',
    location: '',
    logoUrl: LOGO_PRESETS[0].url,
    documentType: 'Certificate of Incorporation',
  });
  const [logoMode, setLogoMode] = useState('presets'); // 'presets' | 'upload' | 'url'
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file must be smaller than 5MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleClearCustomLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setOrgForm((prev) => ({
      ...prev,
      logoUrl: LOGO_PRESETS[0].url,
    }));
  };

  const fetchOrganizations = async () => {
    if (!token) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(buildApiUrl('/organizations/my'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.organizations || [];
        setOrganizations(list);
        
        const approved = list.find((o) => o.status === 'approved');
        if (approved) {
          setSelectedOrgId(approved._id);
        } else if (list.length > 0) {
          setSelectedOrgId(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user organizations:', err);
    }
  };

  const fetchMyListings = async () => {
    if (!token) {
      setJobListings([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(buildApiUrl('/jobs/my-listings'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobListings(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch job listings:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOrganizations(), fetchMyListings()]);
      setLoading(false);
    };
    init();
  }, [token]);

  // Handle Document Files selection & local preview
  const handleDocFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setDocumentFiles(files);
    const previews = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      url: URL.createObjectURL(file),
    }));
    setDocumentPreviews(previews);
  };

  // Submit Organization Registration (Multipart form upload to Cloudinary & MongoDB Atlas)
  const handleRegisterOrgSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Please sign in to register an organization');
      return;
    }

    if (!orgForm.name.trim()) {
      showToast('Organization name is required');
      return;
    }

    if (!orgForm.location.trim()) {
      showToast('Headquarters location is required');
      return;
    }

    if (documentFiles.length === 0) {
      showToast('Please attach at least one business verification document image (e.g. Certificate of Incorporation).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', orgForm.name.trim());
      formData.append('tagline', orgForm.tagline.trim());
      formData.append('description', orgForm.description.trim());
      formData.append('industry', orgForm.industry);
      formData.append('organizationSize', orgForm.organizationSize);
      formData.append('organizationType', orgForm.organizationType);
      formData.append('website', orgForm.website.trim());
      formData.append('location', orgForm.location.trim());
      formData.append('documentType', orgForm.documentType);
      formData.append('customLogoUrl', orgForm.logoUrl);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      for (const file of documentFiles) {
        formData.append('documents', file);
      }

      const res = await fetch(buildApiUrl('/organizations'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast('🏢 Organization submitted successfully! Pending Arcturus Admin review.');
        await fetchOrganizations();
        setActiveTab('manage');
      } else {
        showToast(data.error || 'Failed to submit organization registration');
      }
    } catch (err) {
      console.error('Error registering organization:', err);
      showToast('Network error while uploading organization documents');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Job Posting
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim()) {
      showToast('Title and location are required');
      return;
    }

    const selectedOrg = organizations.find((o) => o._id === selectedOrgId);
    if (!selectedOrg || selectedOrg.status !== 'approved') {
      showToast('You must select an approved Organization account to publish jobs.');
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
          ...form,
          organizationId: selectedOrg._id,
          company: selectedOrg.name,
          companyLogo: selectedOrg.logo?.url,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('🎉 Job opening posted successfully on the portal!');
        setForm({
          title: '',
          location: '',
          workplaceType: 'Hybrid',
          employmentType: 'Full-time',
          salary: '',
          skills: '',
          description: '',
        });
        await fetchMyListings();
        setActiveTab('manage');
      } else {
        showToast(data.error || 'Failed to publish job opening');
      }
    } catch (err) {
      console.error('Failed to post job:', err);
      showToast('Network error while posting job');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Job Listing
  const handleDeleteListing = async (id, title) => {
    if (!window.confirm(`Are you sure you want to close and delete "${title}"?`)) return;

    try {
      const res = await fetch(buildApiUrl(`/jobs/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast('Job listing removed successfully');
        await fetchMyListings();
      } else {
        showToast('Failed to delete listing');
      }
    } catch (err) {
      showToast('Error removing job listing');
    }
  };

  const approvedOrgs = organizations.filter((o) => o.status === 'approved');
  const pendingOrgs = organizations.filter((o) => o.status === 'pending');
  const rejectedOrgs = organizations.filter((o) => o.status === 'rejected');
  const selectedOrg = organizations.find((o) => o._id === selectedOrgId) || approvedOrgs[0];

  return (
    <div className="jobPostingPageWrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="jobPostingToast">
          <FaCheckCircle size={16} /> <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation */}
      <div className="jobPostingTopBar">
        <div className="topBarLeft">
          <Link to="/jobs" className="backToJobsBtn" title="Back to Jobs" aria-label="Back to Jobs">
            <FaArrowLeft size={13} /> <span className="btnLabel">Back to Jobs</span>
          </Link>
          <div className="pageTitleGroup">
            <h2>Recruiter & Organization Hub</h2>
            <p>Publish job openings, manage candidates, and verify company credentials.</p>
          </div>
        </div>

        <div className="topBarTabs">
          <button
            type="button"
            className={`tabBtn ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
            title="Post a Job"
            aria-label="Post a Job"
          >
            <FaPlus size={12} /> <span className="tabLabel">Post a Job</span>
          </button>
          <button
            type="button"
            className={`tabBtn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
            title={`Manage Listings (${jobListings.length})`}
            aria-label={`Manage Listings (${jobListings.length})`}
          >
            <FaBriefcase size={12} /> <span className="tabLabel">Manage Listings ({jobListings.length})</span>
          </button>
          <button
            type="button"
            className={`tabBtn ${activeTab === 'register_org' ? 'active' : ''}`}
            onClick={() => setActiveTab('register_org')}
            title="Create Company Page"
            aria-label="Create Company Page"
          >
            <FaBuilding size={12} /> <span className="tabLabel">Create Company Page</span>
          </button>
        </div>
      </div>

      {/* Not Signed In Guard */}
      {!token && (
        <div className="jobPostingAuthPrompt">
          <FaLock size={36} color="#0a66c2" />
          <h3>Authentication Required</h3>
          <p>Sign in to register your Organization account and post job listings on Arcturus.</p>
          <Link to="/login" className="postPrimaryActionBtn">
            <FaSignInAlt size={14} /> <span>Sign In to Continue</span>
          </Link>
        </div>
      )}

      {/* MAIN CONTENT IF AUTHENTICATED */}
      {token && (
        <div className="jobPostingContentLayout">
          {/* TAB 1: POST A JOB */}
          {activeTab === 'post' && (
            <div className="postJobTabPanel">
              {/* CASE A: User has NO approved organization */}
              {approvedOrgs.length === 0 ? (
                <div className="orgRequiredNoticeCard">
                  <div className="orgNoticeIconBox">
                    <FaShieldAlt size={36} />
                  </div>
                  <h3>Organization Account Verification Required</h3>
                  <p>
                    To maintain trusted, legitimate job listings for job seekers on Arcturus, <strong>only verified Organization accounts</strong> are authorized to publish job openings.
                  </p>

                  {pendingOrgs.length > 0 ? (
                    <div className="pendingReviewCallout">
                      <FaHourglassHalf size={16} className="hourglassIcon" />
                      <div>
                        <strong>Verification Under Review</strong>
                        <p>
                          Your Organization "<strong>{pendingOrgs[0].name}</strong>" has been submitted with document proofs and is currently under review by <strong>Arcturus Admin</strong>.
                        </p>
                        <span className="pendingStatusPill">Status: Pending Admin Approval</span>
                      </div>
                    </div>
                  ) : rejectedOrgs.length > 0 ? (
                    <div className="rejectedCallout">
                      <FaTimesCircle size={16} color="#dc2626" />
                      <div>
                        <strong>Registration Action Required</strong>
                        <p>
                          Your submission for "<strong>{rejectedOrgs[0].name}</strong>" was not approved: {rejectedOrgs[0].rejectionReason}
                        </p>
                        <button
                          type="button"
                          className="reSubmitOrgBtn"
                          onClick={() => {
                            setOrgForm((prev) => ({ ...prev, name: rejectedOrgs[0].name }));
                            setActiveTab('register_org');
                          }}
                        >
                          Submit Updated Verification Documents
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="createOrgCtaBox">
                      <p>
                        Create your company profile in under 2 minutes. Submit your incorporation or tax certificate to get verified.
                      </p>
                      <button
                        type="button"
                        className="postPrimaryActionBtn"
                        onClick={() => setActiveTab('register_org')}
                      >
                        <FaBuilding size={14} /> <span>Register Your Organization Account</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* CASE B: User HAS an approved Organization -> Render Posting Form */
                <form className="jobPostingFormCard" onSubmit={handlePostJob}>
                  {/* Organization Selector Header */}
                  <div className="postingAsHeader">
                    <div className="postingAsIdentity">
                      <img
                        src={selectedOrg?.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                        alt={selectedOrg?.name}
                        className="postingAsLogo"
                      />
                      <div>
                        <span className="postingAsLabel">Posting Job As:</span>
                        <div className="postingAsOrgName">
                          <strong>{selectedOrg?.name}</strong>
                          <span className="verifiedCheckTag">
                            <FaCheckCircle size={11} /> Verified Organization
                          </span>
                        </div>
                      </div>
                    </div>

                    {approvedOrgs.length > 1 && (
                      <div className="switchOrgDropdownWrap">
                        <label>Switch Organization:</label>
                        <select
                          value={selectedOrgId}
                          onChange={(e) => setSelectedOrgId(e.target.value)}
                        >
                          {approvedOrgs.map((org) => (
                            <option key={org._id} value={org._id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="formSectionTitle">
                    <h3>1. Job Overview</h3>
                    <p>Specify the role title, workplace mode, and location.</p>
                  </div>

                  <div className="jobFormGrid">
                    <div className="formGroup fullWidth">
                      <label htmlFor="jobTitle">Job Title *</label>
                      <input
                        id="jobTitle"
                        type="text"
                        required
                        placeholder="e.g. Senior Full-Stack Engineer, Lead Product Designer"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="workplaceType">Workplace Type</label>
                      <select
                        id="workplaceType"
                        value={form.workplaceType}
                        onChange={(e) => setForm({ ...form, workplaceType: e.target.value })}
                      >
                        <option value="On-site">On-site (In-office)</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote (Work from home)</option>
                      </select>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="jobLocation">Job Location (City / Country) *</label>
                      <input
                        id="jobLocation"
                        type="text"
                        required
                        placeholder="e.g. San Francisco, CA or Remote, US"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="employmentType">Employment Type</label>
                      <select
                        id="employmentType"
                        value={form.employmentType}
                        onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="salary">Salary Range (Optional)</label>
                      <input
                        id="salary"
                        type="text"
                        placeholder="e.g. $120,000 - $150,000 / yr"
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      />
                    </div>

                    <div className="formGroup fullWidth">
                      <label htmlFor="skills">Required Skills & Technologies (Comma-separated)</label>
                      <input
                        id="skills"
                        type="text"
                        placeholder="e.g. React, Node.js, TypeScript, GraphQL, AWS, Docker"
                        value={form.skills}
                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                      />
                    </div>

                    <div className="formGroup fullWidth">
                      <label htmlFor="description">Job Description & Responsibilities *</label>
                      <textarea
                        id="description"
                        rows={6}
                        required
                        placeholder="Provide details about the role, key responsibilities, team structure, and qualifications..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="formSubmitRow">
                    <button
                      type="submit"
                      className="postPrimaryActionBtn large"
                      disabled={submitting}
                    >
                      <FaBriefcase size={14} />
                      <span>{submitting ? 'Publishing Job...' : 'Publish Job Listing on Arcturus'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE LISTINGS */}
          {activeTab === 'manage' && (
            <div className="manageListingsTabPanel">
              <div className="manageHeaderRow">
                <div>
                  <h3>Your Published Job Listings</h3>
                  <p>Track candidate applications and active status for your company.</p>
                </div>
                {approvedOrgs.length > 0 && (
                  <button
                    type="button"
                    className="postPrimaryActionBtn"
                    onClick={() => setActiveTab('post')}
                  >
                    <FaPlus size={12} /> <span>Create New Job</span>
                  </button>
                )}
              </div>

              {jobListings.length === 0 ? (
                <div className="noListingsCard">
                  <FaBriefcase size={44} color="#94a3b8" />
                  <h4>No job listings posted yet</h4>
                  <p>Create your first job listing to start receiving qualified candidates.</p>
                  {approvedOrgs.length > 0 ? (
                    <button
                      type="button"
                      className="postPrimaryActionBtn"
                      onClick={() => setActiveTab('post')}
                    >
                      <FaPlus size={12} /> <span>Post a Job Opening</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="postPrimaryActionBtn"
                      onClick={() => setActiveTab('register_org')}
                    >
                      <FaBuilding size={12} /> <span>Register Organization First</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="myListingsGrid">
                  {jobListings.map((job) => (
                    <div key={job._id} className="myListingCard">
                      <div className="myListingHeader">
                        <div className="myListingTitleGroup">
                          <h4>{job.title}</h4>
                          <span className="myListingCompany">
                            <FaBuilding size={12} /> {job.organizationId?.name || job.company}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="deleteListingBtn"
                          onClick={() => handleDeleteListing(job._id, job.title)}
                          title="Delete Listing"
                        >
                          <FaTrashAlt size={13} />
                        </button>
                      </div>

                      <div className="myListingMeta">
                        <span><FaMapMarkerAlt size={12} /> {job.location}</span>
                        <span>{job.workplaceType} · {job.employmentType}</span>
                        {job.salary && <span><FaMoneyBillWave size={12} /> {job.salary}</span>}
                      </div>

                      <div className="myListingApplicantsRow">
                        <span className="applicantCountPill">
                          <FaUsers size={12} /> {job.applicants?.length || 0} Applicants
                        </span>
                        <span className="postedDateText">
                          <FaClock size={11} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTER AN ORGANIZATION PAGE */}
          {activeTab === 'register_org' && (
            <div className="registerOrgTabPanel">
              <form className="registerOrgCard" onSubmit={handleRegisterOrgSubmit}>
                <div className="formSectionTitle">
                  <div className="orgTitleBadge">
                    <FaBuilding size={20} />
                  </div>
                  <div>
                    <h3>Create Organization Page</h3>
                    <p>Register your company, business, or agency with verification documents for Arcturus Admin review.</p>
                  </div>
                </div>

                <div className="jobFormGrid">
                  <div className="formGroup">
                    <label htmlFor="orgName">Organization / Company Name *</label>
                    <input
                      id="orgName"
                      type="text"
                      required
                      placeholder="e.g. Acme Technologies Inc."
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label htmlFor="orgIndustry">Industry *</label>
                    <select
                      id="orgIndustry"
                      value={orgForm.industry}
                      onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label htmlFor="orgSize">Organization Size</label>
                    <select
                      id="orgSize"
                      value={orgForm.organizationSize}
                      onChange={(e) => setOrgForm({ ...orgForm, organizationSize: e.target.value })}
                    >
                      {ORG_SIZES.map((sz) => (
                        <option key={sz} value={sz}>{sz} employees</option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label htmlFor="orgType">Organization Type</label>
                    <select
                      id="orgType"
                      value={orgForm.organizationType}
                      onChange={(e) => setOrgForm({ ...orgForm, organizationType: e.target.value })}
                    >
                      {ORG_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label htmlFor="orgWebsite">Website URL</label>
                    <input
                      id="orgWebsite"
                      type="url"
                      placeholder="e.g. https://www.company.com"
                      value={orgForm.website}
                      onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label htmlFor="orgLocation">Headquarters / Primary Office *</label>
                    <input
                      id="orgLocation"
                      type="text"
                      required
                      placeholder="e.g. San Francisco, CA, USA"
                      value={orgForm.location}
                      onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label htmlFor="orgTagline">Tagline / Motto</label>
                    <input
                      id="orgTagline"
                      type="text"
                      placeholder="e.g. Empowering developers worldwide through cloud technology"
                      value={orgForm.tagline}
                      onChange={(e) => setOrgForm({ ...orgForm, tagline: e.target.value })}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label htmlFor="orgDesc">Company Description</label>
                    <textarea
                      id="orgDesc"
                      rows={3}
                      placeholder="Brief overview of the company mission, products, and culture..."
                      value={orgForm.description}
                      onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                    />
                  </div>

                  {/* Company Logo Selection / Custom Upload */}
                  <div className="formGroup fullWidth logoSelectorSection">
                    <div className="logoSectionHeader">
                      <div>
                        <label>Company Logo *</label>
                        <p className="fieldSubLabel">Choose an industry preset icon, upload your company brand logo, or provide an image URL.</p>
                      </div>
                      
                      {/* Active Logo Live Preview */}
                      <div className="activeLogoPreviewBadge">
                        <img
                          src={logoPreview || orgForm.logoUrl || LOGO_PRESETS[0].url}
                          alt="Active Logo Preview"
                          className="activeLogoPreviewImg"
                        />
                        <div>
                          <span className="previewBadgeTitle">Selected Logo</span>
                          <span className="previewBadgeSubtext">{logoFile ? 'Custom Upload' : logoMode === 'url' ? 'Custom URL' : 'Industry Preset'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Logo Mode Navigation */}
                    <div className="logoModeNav">
                      <button
                        type="button"
                        className={`logoModeBtn ${logoMode === 'presets' && !logoFile ? 'active' : ''}`}
                        onClick={() => {
                          setLogoMode('presets');
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        <FaBuilding size={13} /> <span>Industry Presets</span>
                      </button>

                      <button
                        type="button"
                        className={`logoModeBtn ${logoMode === 'upload' || logoFile ? 'active' : ''}`}
                        onClick={() => setLogoMode('upload')}
                      >
                        <FaFileUpload size={13} /> <span>Upload Custom Logo</span>
                      </button>

                      <button
                        type="button"
                        className={`logoModeBtn ${logoMode === 'url' && !logoFile ? 'active' : ''}`}
                        onClick={() => {
                          setLogoMode('url');
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        <FaGlobe size={13} /> <span>Image URL</span>
                      </button>
                    </div>

                    {/* Mode 1: Presets */}
                    {logoMode === 'presets' && !logoFile && (
                      <div className="logoPresetRow">
                        {LOGO_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`logoPresetOption ${orgForm.logoUrl === p.url && !logoFile ? 'active' : ''}`}
                            onClick={() => {
                              setOrgForm({ ...orgForm, logoUrl: p.url });
                              setLogoFile(null);
                              setLogoPreview(null);
                            }}
                          >
                            <img src={p.url} alt={p.label} />
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mode 2: Custom File Upload */}
                    {logoMode === 'upload' && (
                      <div className="customLogoUploadBox">
                        {logoFile && logoPreview ? (
                          <div className="customLogoSelectedCard">
                            <img src={logoPreview} alt="Uploaded logo" className="customLogoThumb" />
                            <div className="customLogoDetails">
                              <strong>{logoFile.name}</strong>
                              <span>{(logoFile.size / 1024).toFixed(1)} KB · Ready to upload</span>
                            </div>
                            <button
                              type="button"
                              className="clearLogoBtn"
                              onClick={handleClearCustomLogo}
                              title="Remove custom logo"
                            >
                              <FaTrashAlt size={12} /> <span>Change</span>
                            </button>
                          </div>
                        ) : (
                          <div className="customLogoDropArea">
                            <label htmlFor="customLogoInput" className="customLogoUploadLabel">
                              <FaFileUpload size={20} color="#0a66c2" />
                              <div className="uploadTextGroup">
                                <strong>Click to browse company logo image</strong>
                                <span>Supports PNG, JPG, SVG, WebP (Max 5MB)</span>
                              </div>
                            </label>
                            <input
                              id="customLogoInput"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              style={{ display: 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mode 3: Image URL */}
                    {logoMode === 'url' && !logoFile && (
                      <div className="customLogoUrlBox">
                        <input
                          type="url"
                          placeholder="https://company.com/assets/logo.png"
                          value={orgForm.logoUrl.startsWith('data:') ? '' : orgForm.logoUrl}
                          onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })}
                        />
                        <span className="inputHelpText">Enter a direct image link to your organization logo.</span>
                      </div>
                    )}
                  </div>

                  {/* REQUIRED DOCUMENT SUBMISSION AREA */}
                  <div className="formGroup fullWidth verificationUploadBox">
                    <div className="verificationUploadHeader">
                      <FaFileInvoice size={18} color="#0a66c2" />
                      <div>
                        <h4>Business Verification Document Proof (Required) *</h4>
                        <p>
                          Attach official documentation (Certificate of Incorporation, Tax Registration, Business License). Files are securely stored on MongoDB Atlas & Cloudinary and reviewed by Arcturus Admin.
                        </p>
                      </div>
                    </div>

                    <div className="docUploadInputsRow">
                      <div className="formGroup docTypeSelectGroup">
                        <label htmlFor="docType">Document Type:</label>
                        <select
                          id="docType"
                          value={orgForm.documentType}
                          onChange={(e) => setOrgForm({ ...orgForm, documentType: e.target.value })}
                        >
                          {DOCUMENT_TYPES.map((dt) => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      </div>

                      <div className="formGroup fileUploadInputWrap">
                        <label htmlFor="docFiles" className="customFileInputLabel">
                          <FaFileUpload size={14} /> <span>Choose Image Files (PNG, JPG, WebP)</span>
                        </label>
                        <input
                          id="docFiles"
                          type="file"
                          accept="image/*"
                          multiple
                          required
                          onChange={handleDocFileChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    {/* Previews of attached document images */}
                    {documentPreviews.length > 0 && (
                      <div className="attachedDocsPreviewGrid">
                        {documentPreviews.map((doc, idx) => (
                          <div key={idx} className="attachedDocItem">
                            <img src={doc.url} alt={doc.name} className="attachedDocThumb" />
                            <div className="attachedDocInfo">
                              <span className="attachedDocName">{doc.name}</span>
                              <span className="attachedDocSize">{doc.size} MB</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="formSubmitRow">
                  <button
                    type="submit"
                    className="postPrimaryActionBtn large"
                    disabled={submitting}
                  >
                    <FaShieldAlt size={14} />
                    <span>{submitting ? 'Uploading Documents to Cloudinary...' : 'Submit Organization for Admin Approval'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobPostingPage;
