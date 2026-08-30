import React, { useState } from 'react';
import { FaPlus, FaTimes, FaTags } from 'react-icons/fa';

const SkillsEditor = ({ skills = [], onChange }) => {
  const [skillInput, setSkillInput] = useState('');

  const skillsList = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const trimmed = skillInput.trim();
    if (!skillsList.includes(trimmed)) {
      onChange('skills', [...skillsList, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    onChange('skills', updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader">
        <h3>Skills</h3>
        <p>Add technical and interpersonal skills that showcase your proficiencies.</p>
      </div>

      <div className="skillsInputRow">
        <input
          type="text"
          placeholder="Type a skill and press Enter (e.g. React, MongoDB, System Design)..."
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="editorAddBtn" onClick={handleAddSkill}>
          <FaPlus size={12} /> Add
        </button>
      </div>

      {skillsList.length === 0 ? (
        <div className="editorEmptyPlaceholder">
          <FaTags size={28} />
          <p>No skills added yet. Type a skill above to start.</p>
        </div>
      ) : (
        <div className="editorChipsGrid">
          {skillsList.map((skill, index) => (
            <div key={index} className="editorSkillChip">
              <span>{skill}</span>
              <button
                type="button"
                className="chipRemoveBtn"
                onClick={() => handleRemoveSkill(skill)}
                title={`Remove ${skill}`}
              >
                <FaTimes size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsEditor;

