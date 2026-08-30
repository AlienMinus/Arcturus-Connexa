import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner, 
  FaCheckCircle, 
  FaUser, 
  FaAlignLeft, 
  FaBriefcase, 
  FaGraduationCap, 
  FaLaptopCode, 
  FaCertificate, 
  FaTags, 
  FaAward 
} from 'react-icons/fa';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import BasicInfoEditor from '../../components/Profile/EditSections/BasicInfoEditor';
import AboutEditor from '../../components/Profile/EditSections/AboutEditor';
import ExperienceEditor from '../../components/Profile/EditSections/ExperienceEditor';
import EducationEditor from '../../components/Profile/EditSections/EducationEditor';
import ProjectsEditor from '../../components/Profile/EditSections/ProjectsEditor';
import CertificationsEditor from '../../components/Profile/EditSections/CertificationsEditor';
import SkillsEditor from '../../components/Profile/EditSections/SkillsEditor';
import HonorsInterestsEditor from '../../components/Profile/EditSections/HonorsInterestsEditor';
import './ProfileEditPage.css';

const SECTIONS = [
  { id: 'basic', label: 'Basic Info', icon: <FaUser /> },
  { id: 'about', label: 'About', icon: <FaAlignLeft /> },
  { id: 'experience', label: 'Experience', icon: <FaBriefcase /> },
  { id: 'education', label: 'Education', icon: <FaGraduationCap /> },
  { id: 'projects', label: 'Projects', icon: <FaLaptopCode /> },
  { id: 'certifications', label: 'Certifications', icon: <FaCertificate /> },
  { id: 'skills', label: 'Skills', icon: <FaTags /> },
  { id: 'honors', label: 'Honors & Interests', icon: <FaAward /> },
];

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { profile, loading, refreshProfile } = useProfile();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    headline: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    skills: [],
    honors: [],
    interests: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (profile) {
      // Split name into parts if not separately provided
      let fName = user?.firstName || '';
      let mName = user?.middleName || '';
      let lName = user?.lastName || '';

      if (!fName && profile.name) {
        const parts = profile.name.split(' ');
        if (parts.length === 1) fName = parts[0];
        else if (parts.length === 2) {
          fName = parts[0];
          lName = parts[1];
        } else if (parts.length > 2) {
          fName = parts[0];
          mName = parts.slice(1, -1).join(' ');
          lName = parts[parts.length - 1];
        }
      }

      setFormData({
        username: profile.username || user?.username || '',
        firstName: fName,
        middleName: mName,
        lastName: lName,
        headline: profile.headline || '',
        location: profile.location || '',
        summary: profile.summary || '',
        experience: profile.experience || [],
        education: profile.education || [],
        projects: profile.projects || [],
        certifications: profile.certifications || [],
        skills: profile.skills || [],
        honors: profile.honors || [],
        interests: profile.interests || [],
      });
    }
  }, [profile, user]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to save your profile changes.');
      }

      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');

      const payload = {
        username: formData.username ? formData.username.trim().toLowerCase() : undefined,
        name: fullName,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        headline: formData.headline,
        location: formData.location,
        summary: formData.summary,
        experience: formData.experience,
        education: formData.education,
        projects: formData.projects.map((p) => ({
          ...p,
          techStack: Array.isArray(p.techStack)
            ? p.techStack
            : typeof p.techStack === 'string'
            ? p.techStack.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
        })),
        certifications: formData.certifications,
        skills: formData.skills,
        honors: formData.honors,
        interests: formData.interests,
      };

      const res = await fetch(buildApiUrl('/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Failed to save profile changes');
      }

      await refreshProfile();
      setSuccessMessage('Profile saved successfully! ✨');
      setTimeout(() => {
        navigate('/profile');
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="profileEditPage loading">
        <FaSpinner className="spinAnimation" size={32} />
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="profileEditPageWrapper">
      <div className="profileEditPage">
        {/* Top Navbar Action Bar */}
        <div className="profileEditTopBar">
          <Link to="/profile" className="profileEditBackBtn">
            <FaArrowLeft size={14} /> <span>Back to Profile</span>
          </Link>
          <h2>Edit Profile</h2>
          <button
            type="button"
            className="profileEditSaveBtn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <FaSpinner className="spinAnimation" size={14} /> Saving...
              </>
            ) : (
              <>
                <FaSave size={14} /> Save Changes
              </>
            )}
          </button>
        </div>

        {/* Notifications & Status */}
        {successMessage && (
          <div className="profileEditToast success">
            <FaCheckCircle size={16} /> <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="profileEditToast error">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Content Layout: Left Section Tabs + Right Editor Panel */}
        <div className="profileEditLayout">
          {/* Section Navigation Tabs */}
          <aside className="profileEditSidebar">
            <nav className="profileEditNav">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`profileEditTabBtn ${activeTab === sec.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(sec.id)}
                >
                  <span className="tabIcon">{sec.icon}</span>
                  <span className="tabLabel">{sec.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Editor Body */}
          <main className="profileEditMain">
            {activeTab === 'basic' && (
              <BasicInfoEditor data={formData} profile={profile} onChange={handleFieldChange} />
            )}

            {activeTab === 'about' && (
              <AboutEditor summary={formData.summary} onChange={handleFieldChange} />
            )}

            {activeTab === 'experience' && (
              <ExperienceEditor items={formData.experience} onChange={handleFieldChange} />
            )}

            {activeTab === 'education' && (
              <EducationEditor items={formData.education} onChange={handleFieldChange} />
            )}

            {activeTab === 'projects' && (
              <ProjectsEditor items={formData.projects} onChange={handleFieldChange} />
            )}

            {activeTab === 'certifications' && (
              <CertificationsEditor items={formData.certifications} onChange={handleFieldChange} />
            )}

            {activeTab === 'skills' && (
              <SkillsEditor skills={formData.skills} onChange={handleFieldChange} />
            )}

            {activeTab === 'honors' && (
              <HonorsInterestsEditor
                honors={formData.honors}
                interests={formData.interests}
                onChange={handleFieldChange}
              />
            )}

            {/* Bottom Save Trigger */}
            <div className="profileEditBottomActions">
              <button
                type="button"
                className="profileEditSaveBtn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="spinAnimation" size={14} /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave size={14} /> Save Profile
                  </>
                )}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;

