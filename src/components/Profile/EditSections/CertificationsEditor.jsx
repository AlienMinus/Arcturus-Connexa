import React from 'react';
import { FaPlus, FaTrashAlt, FaCertificate } from 'react-icons/fa';

const CertificationsEditor = ({ items = [], onChange }) => {
  const handleAdd = () => {
    const newItems = [
      ...items,
      {
        title: '',
        issuer: '',
        dateRange: '',
        url: '',
      },
    ];
    onChange('certifications', newItems);
  };

  const handleUpdate = (index, field, value) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange('certifications', newItems);
  };

  const handleRemove = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange('certifications', newItems);
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader between">
        <div>
          <h3>Licenses & Certifications</h3>
          <p>Add credentials, professional licenses, and course completion certificates.</p>
        </div>
        <button type="button" className="editorAddBtn" onClick={handleAdd}>
          <FaPlus size={12} /> Add Certification
        </button>
      </div>

      {items.length === 0 ? (
        <div className="editorEmptyPlaceholder">
          <FaCertificate size={28} />
          <p>No certifications added yet.</p>
        </div>
      ) : (
        <div className="editorItemsList">
          {items.map((item, index) => (
            <div key={index} className="editorItemBox">
              <div className="editorItemBoxHeader">
                <h4>Certification #{index + 1}</h4>
                <button
                  type="button"
                  className="editorDeleteBtn"
                  onClick={() => handleRemove(index)}
                  title="Remove this certification"
                >
                  <FaTrashAlt size={12} /> Remove
                </button>
              </div>

              <div className="editorFormGrid">
                <div className="formGroup">
                  <label>Certification Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={item.title || ''}
                    onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Issuing Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services, Coursera, Meta"
                    value={item.issuer || ''}
                    onChange={(e) => handleUpdate(index, 'issuer', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Issue Date / Expiry</label>
                  <input
                    type="text"
                    placeholder="e.g. Issued May 2024"
                    value={item.dateRange || ''}
                    onChange={(e) => handleUpdate(index, 'dateRange', e.target.value)}
                  />
                </div>

                <div className="formGroup">
                  <label>Credential URL / ID</label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.credly.com/badges/..."
                    value={item.url || ''}
                    onChange={(e) => handleUpdate(index, 'url', e.target.value)}
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

export default CertificationsEditor;

