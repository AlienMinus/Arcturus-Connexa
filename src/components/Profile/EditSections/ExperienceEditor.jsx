import React from 'react';
import { FaPlus, FaTrashAlt, FaBriefcase } from 'react-icons/fa';

const ExperienceEditor = ({ items = [], onChange }) => {
  const handleAdd = () => {
    const newItems = [
      ...items,
      {
        title: '',
        subtitle: '',
        location: '',
        dateRange: '',
        description: '',
      },
    ];
    onChange('experience', newItems);
  };

  const handleUpdate = (index, field, value) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange('experience', newItems);
  };

  const handleRemove = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange('experience', newItems);
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader between">
        <div>
          <h3>Experience</h3>
          <p>List your work history, internships, and professional roles.</p>
        </div>
        <button type="button" className="editorAddBtn" onClick={handleAdd}>
          <FaPlus size={12} /> Add Role
        </button>
      </div>

      {items.length === 0 ? (
        <div className="editorEmptyPlaceholder">
          <FaBriefcase size={28} />
          <p>No work experience added yet.</p>
        </div>
      ) : (
        <div className="editorItemsList">
          {items.map((item, index) => (
            <div key={index} className="editorItemBox">
              <div className="editorItemBoxHeader">
                <h4>Role #{index + 1}</h4>
                <button
                  type="button"
                  className="editorDeleteBtn"
                  onClick={() => handleRemove(index)}
                  title="Remove this experience"
                >
                  <FaTrashAlt size={12} /> Remove
                </button>
              </div>

              <div className="editorFormGrid">
                <div className="formGroup">
                  <label>Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={item.title || ''}
                    onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Arcturus, Freelance"
                    value={item.subtitle || ''}
                    onChange={(e) => handleUpdate(index, 'subtitle', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India · Remote"
                    value={item.location || ''}
                    onChange={(e) => handleUpdate(index, 'location', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Date Range / Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2024 - Present"
                    value={item.dateRange || ''}
                    onChange={(e) => handleUpdate(index, 'dateRange', e.target.value)}
                  />
                </div>

                <div className="formGroup fullWidth">
                  <label>Description & Key Achievements</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your responsibilities, achievements, and impact..."
                    value={item.description || ''}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceEditor;

