import React, { useState } from 'react';
import { FaPlus, FaTrashAlt, FaAward, FaHeart } from 'react-icons/fa';

const HonorsInterestsEditor = ({ honors = [], interests = [], onChange }) => {
  const [interestInput, setInterestInput] = useState('');

  const interestsList = Array.isArray(interests)
    ? interests
    : typeof interests === 'string'
    ? interests.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleAddHonor = () => {
    const newHonors = [
      ...honors,
      {
        title: '',
        issuer: '',
        dateRange: '',
        description: '',
      },
    ];
    onChange('honors', newHonors);
  };

  const handleUpdateHonor = (index, field, value) => {
    const newHonors = honors.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange('honors', newHonors);
  };

  const handleRemoveHonor = (index) => {
    const newHonors = honors.filter((_, i) => i !== index);
    onChange('honors', newHonors);
  };

  const handleAddInterest = () => {
    if (!interestInput.trim()) return;
    const trimmed = interestInput.trim();
    if (!interestsList.includes(trimmed)) {
      onChange('interests', [...interestsList, trimmed]);
    }
    setInterestInput('');
  };

  const handleRemoveInterest = (item) => {
    onChange('interests', interestsList.filter((i) => i !== item));
  };

  return (
    <>
      {/* Honors & Awards */}
      <div className="editorSectionCard">
        <div className="editorSectionHeader between">
          <div>
            <h3>Honors & Awards</h3>
            <p>List competitions, hackathons, academic awards, and achievements.</p>
          </div>
          <button type="button" className="editorAddBtn" onClick={handleAddHonor}>
            <FaPlus size={12} /> Add Award
          </button>
        </div>

        {honors.length === 0 ? (
          <div className="editorEmptyPlaceholder">
            <FaAward size={28} />
            <p>No honors or awards listed yet.</p>
          </div>
        ) : (
          <div className="editorItemsList">
            {honors.map((item, index) => (
              <div key={index} className="editorItemBox">
                <div className="editorItemBoxHeader">
                  <h4>Honor #{index + 1}</h4>
                  <button
                    type="button"
                    className="editorDeleteBtn"
                    onClick={() => handleRemoveHonor(index)}
                  >
                    <FaTrashAlt size={12} /> Remove
                  </button>
                </div>

                <div className="editorFormGrid">
                  <div className="formGroup">
                    <label>Award / Honor Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Place National Hackathon"
                      value={item.title || ''}
                      onChange={(e) => handleUpdateHonor(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Issuer / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. ACM, IEEE, University"
                      value={item.issuer || ''}
                      onChange={(e) => handleUpdateHonor(index, 'issuer', e.target.value)}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Description / Details</label>
                    <textarea
                      rows={2}
                      placeholder="Brief details about the recognition..."
                      value={item.description || ''}
                      onChange={(e) => handleUpdateHonor(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="editorSectionCard">
        <div className="editorSectionHeader">
          <h3>Interests & Topics</h3>
          <p>Add subjects, technologies, industries, and causes you care about.</p>
        </div>

        <div className="skillsInputRow">
          <input
            type="text"
            placeholder="Type an interest (e.g. Open Source, Cloud Architecture, AI)..."
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterest();
              }
            }}
          />
          <button type="button" className="editorAddBtn" onClick={handleAddInterest}>
            <FaPlus size={12} /> Add
          </button>
        </div>

        {interestsList.length === 0 ? (
          <div className="editorEmptyPlaceholder">
            <FaHeart size={28} />
            <p>No interests added yet.</p>
          </div>
        ) : (
          <div className="editorChipsGrid">
            {interestsList.map((interest, index) => (
              <div key={index} className="editorSkillChip">
                <span>{interest}</span>
                <button
                  type="button"
                  className="chipRemoveBtn"
                  onClick={() => handleRemoveInterest(interest)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HonorsInterestsEditor;

