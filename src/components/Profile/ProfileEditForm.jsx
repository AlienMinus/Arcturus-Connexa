import React, { useState } from 'react';
import './Profile.css';

const ProfileEditForm = ({ profile, onSaved }) => {
  const [name, setName] = useState(profile?.name || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [summary, setSummary] = useState(profile?.summary || '');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [honors, setHonors] = useState((profile?.honors || []).map((item) => item.title).join(', '));
  const [interests, setInterests] = useState((profile?.interests || []).join(', '));
  const [avatarFile, setAvatarFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('headline', headline);
      formData.append('location', location);
      formData.append('summary', summary);
      formData.append('skills', skills);
      formData.append('honors', honors);
      formData.append('interests', interests);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (backgroundFile) {
        formData.append('backgroundImage', backgroundFile);
      }

      const response = await fetch(buildApiUrl('/profile'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Failed to save profile');
      }

      await response.json();
      setSuccess('Profile updated successfully.');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profileSection profileEditSection">
      <div className="sectionHeader">
        <h2>Edit Profile</h2>
      </div>

      <form className="profileEditForm" onSubmit={handleSubmit}>
        <div className="formRow">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="formRow">
          <label>Headline</label>
          <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div className="formRow">
          <label>Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="formRow">
          <label>Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
        </div>
        <div className="formRow">
          <label>Skills</label>
          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, MongoDB" />
        </div>
        <div className="formRow">
          <label>Honors</label>
          <input type="text" value={honors} onChange={(e) => setHonors(e.target.value)} placeholder="Award1, Award2" />
        </div>
        <div className="formRow">
          <label>Interests</label>
          <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="AI, Web Development" />
        </div>
        <div className="formRow">
          <label>Avatar image</label>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0] || null)} />
        </div>
        <div className="formRow">
          <label>Background image</label>
          <input type="file" accept="image/*" onChange={(e) => setBackgroundFile(e.target.files[0] || null)} />
        </div>

        {error && <div className="formError">{error}</div>}
        {success && <div className="formSuccess">{success}</div>}

        <div className="formActions">
          <button type="submit" className="saveButton" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProfileEditForm;
