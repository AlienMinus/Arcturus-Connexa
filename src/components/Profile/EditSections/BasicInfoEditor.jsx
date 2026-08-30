import React from 'react';

const BasicInfoEditor = ({ data, onChange }) => {
  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader">
        <h3>Basic Information</h3>
        <p>Edit your name, professional headline, and current location.</p>
      </div>

      <div className="editorFormGrid">
        <div className="formGroup">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            placeholder="e.g. Manas"
            value={data.firstName || ''}
            onChange={(e) => onChange('firstName', e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="middleName">Middle Name (Optional)</label>
          <input
            id="middleName"
            type="text"
            placeholder="e.g. Ranjan"
            value={data.middleName || ''}
            onChange={(e) => onChange('middleName', e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            placeholder="e.g. Das"
            value={data.lastName || ''}
            onChange={(e) => onChange('lastName', e.target.value)}
          />
        </div>

        <div className="formGroup fullWidth">
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            type="text"
            placeholder="e.g. Full-Stack Developer | React & Node.js"
            value={data.headline || ''}
            onChange={(e) => onChange('headline', e.target.value)}
          />
        </div>

        <div className="formGroup fullWidth">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="e.g. Bhubaneswar, Odisha, India"
            value={data.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoEditor;

