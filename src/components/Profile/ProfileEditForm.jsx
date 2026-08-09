import React, { useState } from 'react';
import { buildApiUrl } from '../../utils/api';
import './Profile.css';

const StructuredSectionEditor = ({ title, items, fields, onAdd, onChange, onRemove }) => (
  <div className="structuredEditor">
    <div className="structuredEditorHeader">
      <div>
        <label>{title}</label>
        <p>Add one entry at a time. All fields are optional.</p>
      </div>
      <button type="button" className="addEntryButton" onClick={onAdd}>Add {title.slice(0, -1)}</button>
    </div>
    {items.map((item, index) => (
      <div className="structuredEntry" key={`${title}-${index}`}>
        {fields.map((field) => (
          <div className="formRow" key={field.name}>
            <label>{field.label}</label>
            {field.multiline ? (
              <textarea rows={3} value={item[field.name] || ''} onChange={(event) => onChange(index, field.name, event.target.value)} />
            ) : (
              <input type={field.type || 'text'} value={item[field.name] || ''} onChange={(event) => onChange(index, field.name, event.target.value)} placeholder={field.placeholder} />
            )}
          </div>
        ))}
        <button type="button" className="removeEntryButton" onClick={() => onRemove(index)}>Remove</button>
      </div>
    ))}
  </div>
);

const ProfileEditForm = ({ profile, onSaved }) => {
  const [name, setName] = useState(profile?.name || '');
  const [headline, setHeadline] = useState(profile?.headline || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [summary, setSummary] = useState(profile?.summary || '');
  const [skills, setSkills] = useState((profile?.skills || []).join(', '));
  const [education, setEducation] = useState(profile?.education || []);
  const [experience, setExperience] = useState(profile?.experience || []);
  const [projects, setProjects] = useState((profile?.projects || []).map((project) => ({
    ...project,
    techStack: Array.isArray(project.techStack) ? project.techStack.join(', ') : project.techStack || '',
  })));
  const [achievements, setAchievements] = useState(profile?.honors || []);
  const [interests, setInterests] = useState((profile?.interests || []).join(', '));
  const [avatarFile, setAvatarFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const updateEntry = (setEntries, index, field, value) => {
    setEntries((entries) => entries.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )));
  };

  const removeEntry = (setEntries, index) => {
    setEntries((entries) => entries.filter((_, entryIndex) => entryIndex !== index));
  };

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
      formData.append('education', JSON.stringify(education));
      formData.append('experience', JSON.stringify(experience));
      formData.append('projects', JSON.stringify(projects.map((project) => ({
        ...project,
        techStack: project.techStack.split(',').map((tech) => tech.trim()).filter(Boolean),
      }))));
      formData.append('honors', JSON.stringify(achievements));
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
        <StructuredSectionEditor
          title="Education"
          items={education}
          fields={[{ name: 'title', label: 'Institute' }, { name: 'dateRange', label: 'Period', placeholder: '2020 – 2024' }, { name: 'description', label: 'Description', multiline: true }]}
          onAdd={() => setEducation((items) => [...items, {}])}
          onChange={(index, field, value) => updateEntry(setEducation, index, field, value)}
          onRemove={(index) => removeEntry(setEducation, index)}
        />
        <StructuredSectionEditor
          title="Experience"
          items={experience}
          fields={[{ name: 'title', label: 'Organization' }, { name: 'subtitle', label: 'Job title or certificate ID' }, { name: 'dateRange', label: 'Period' }, { name: 'description', label: 'Job description', multiline: true }]}
          onAdd={() => setExperience((items) => [...items, {}])}
          onChange={(index, field, value) => updateEntry(setExperience, index, field, value)}
          onRemove={(index) => removeEntry(setExperience, index)}
        />
        <StructuredSectionEditor
          title="Projects"
          items={projects}
          fields={[{ name: 'title', label: 'Project name' }, { name: 'image', label: 'Image URL', type: 'url' }, { name: 'techStack', label: 'Tech stack', placeholder: 'React, Node.js, MongoDB' }, { name: 'url', label: 'Public link', type: 'url' }, { name: 'description', label: 'Description', multiline: true }]}
          onAdd={() => setProjects((items) => [...items, { techStack: '' }])}
          onChange={(index, field, value) => updateEntry(setProjects, index, field, value)}
          onRemove={(index) => removeEntry(setProjects, index)}
        />
        <StructuredSectionEditor
          title="Achievements"
          items={achievements}
          fields={[{ name: 'title', label: 'Achievement' }, { name: 'issuer', label: 'Issuer' }, { name: 'date', label: 'Date' }]}
          onAdd={() => setAchievements((items) => [...items, {}])}
          onChange={(index, field, value) => updateEntry(setAchievements, index, field, value)}
          onRemove={(index) => removeEntry(setAchievements, index)}
        />
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
