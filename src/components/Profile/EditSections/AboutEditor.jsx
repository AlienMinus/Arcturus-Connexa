import React from 'react';

const AboutEditor = ({ summary, onChange }) => {
  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader">
        <h3>About Summary</h3>
        <p>Highlight your background, passions, years of experience, and what drives you.</p>
      </div>

      <div className="formGroup fullWidth">
        <label htmlFor="aboutSummary">About / Bio</label>
        <textarea
          id="aboutSummary"
          rows={6}
          placeholder="Write a brief overview of your professional journey, expertise, and accomplishments..."
          value={summary || ''}
          onChange={(e) => onChange('summary', e.target.value)}
        />
        <span className="fieldCharacterCount">{(summary || '').length} characters</span>
      </div>
    </div>
  );
};

export default AboutEditor;

