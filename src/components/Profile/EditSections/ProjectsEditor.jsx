import React from 'react';
import { FaPlus, FaTrashAlt, FaLaptopCode } from 'react-icons/fa';

const ProjectsEditor = ({ items = [], onChange }) => {
  const handleAdd = () => {
    const newItems = [
      ...items,
      {
        title: '',
        description: '',
        techStack: '',
        url: '',
      },
    ];
    onChange('projects', newItems);
  };

  const handleUpdate = (index, field, value) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange('projects', newItems);
  };

  const handleRemove = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange('projects', newItems);
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader between">
        <div>
          <h3>Projects</h3>
          <p>Showcase personal projects, open-source work, and software apps you built.</p>
        </div>
        <button type="button" className="editorAddBtn" onClick={handleAdd}>
          <FaPlus size={12} /> Add Project
        </button>
      </div>

      {items.length === 0 ? (
        <div className="editorEmptyPlaceholder">
          <FaLaptopCode size={28} />
          <p>No projects listed yet.</p>
        </div>
      ) : (
        <div className="editorItemsList">
          {items.map((item, index) => {
            const techString = Array.isArray(item.techStack)
              ? item.techStack.join(', ')
              : item.techStack || '';

            return (
              <div key={index} className="editorItemBox">
                <div className="editorItemBoxHeader">
                  <h4>Project #{index + 1}</h4>
                  <button
                    type="button"
                    className="editorDeleteBtn"
                    onClick={() => handleRemove(index)}
                    title="Remove this project"
                  >
                    <FaTrashAlt size={12} /> Remove
                  </button>
                </div>

                <div className="editorFormGrid">
                  <div className="formGroup">
                    <label>Project Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Arcturus Social Network, Camera AI App"
                      value={item.title || ''}
                      onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Project / Demo URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://github.com/username/project"
                      value={item.url || ''}
                      onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Technologies / Skills (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Node.js, MongoDB, WebSockets, Docker"
                      value={techString}
                      onChange={(e) => handleUpdate(index, 'techStack', e.target.value)}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Project Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what the project does, key features, and performance metrics..."
                      value={item.description || ''}
                      onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsEditor;

