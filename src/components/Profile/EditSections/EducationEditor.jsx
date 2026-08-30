import React from 'react';
import { FaPlus, FaTrashAlt, FaGraduationCap } from 'react-icons/fa';

const EducationEditor = ({ items = [], onChange }) => {
  const handleAdd = () => {
    const newItems = [
      ...items,
      {
        title: '',
        subtitle: '',
        dateRange: '',
        description: '',
      },
    ];
    onChange('education', newItems);
  };

  const handleUpdate = (index, field, value) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange('education', newItems);
  };

  const handleRemove = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange('education', newItems);
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader between">
        <div>
          <h3>Education</h3>
          <p>Add your college degrees, universities, and academic certifications.</p>
        </div>
        <button type="button" className="editorAddBtn" onClick={handleAdd}>
          <FaPlus size={12} /> Add Education
        </button>
      </div>

      {items.length === 0 ? (
        <div className="editorEmptyPlaceholder">
          <FaGraduationCap size={28} />
          <p>No education details added yet.</p>
        </div>
      ) : (
        <div className="editorItemsList">
          {items.map((item, index) => (
            <div key={index} className="editorItemBox">
              <div className="editorItemBoxHeader">
                <h4>School #{index + 1}</h4>
                <button
                  type="button"
                  className="editorDeleteBtn"
                  onClick={() => handleRemove(index)}
                  title="Remove this entry"
                >
                  <FaTrashAlt size={12} /> Remove
                </button>
              </div>

              <div className="editorFormGrid">
                <div className="formGroup">
                  <label>Institution / University</label>
                  <input
                    type="text"
                    placeholder="e.g. ABIT, Stanford University"
                    value={item.title || ''}
                    onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Degree & Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech in Computer Science"
                    value={item.subtitle || ''}
                    onChange={(e) => handleUpdate(index, 'subtitle', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Years Attended / Date Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 2021 - 2025"
                    value={item.dateRange || ''}
                    onChange={(e) => handleUpdate(index, 'dateRange', e.target.value)}
                  />
                </div>

                <div className="formGroup fullWidth">
                  <label>Grade / Activities / Societies</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. CGPA: 8.9/10, Coding Club Lead, Hackathon Winner..."
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

export default EducationEditor;

