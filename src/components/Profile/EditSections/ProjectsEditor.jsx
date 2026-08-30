import React from 'react';
import { 
  FaPlus, 
  FaTrashAlt, 
  FaLaptopCode,
  FaGithub,
  FaGitlab,
  FaFigma,
  FaYoutube,
  FaDribbble,
  FaMedium,
  FaCodepen,
  FaImage,
  FaLink
} from 'react-icons/fa';

const getDomain = (url) => {
  try {
    if (!url) return '';
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return new URL(formatted).hostname.replace(/^www\./, '');
  } catch (err) {
    return '';
  }
};

const ProjectIconPreview = ({ item }) => {
  // If custom direct image/icon URL is provided
  if (item?.image) {
    return (
      <img
        src={item.image}
        alt="Custom icon"
        className="projectFaviconPreview"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }

  const url = item?.url || item?.link || '';
  const domain = getDomain(url);
  if (!domain) {
    return <FaLaptopCode size={18} className="projectDefaultIcon" />;
  }

  const lower = domain.toLowerCase();
  if (lower.includes('github.com')) return <FaGithub size={18} className="brandIcon github" />;
  if (lower.includes('gitlab.com')) return <FaGitlab size={18} className="brandIcon gitlab" />;
  if (lower.includes('figma.com')) return <FaFigma size={18} className="brandIcon figma" />;
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return <FaYoutube size={18} className="brandIcon youtube" />;
  if (lower.includes('dribbble.com')) return <FaDribbble size={18} className="brandIcon dribbble" />;
  if (lower.includes('medium.com')) return <FaMedium size={18} className="brandIcon medium" />;
  if (lower.includes('codepen.io')) return <FaCodepen size={18} className="brandIcon codepen" />;

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  return (
    <img
      src={faviconUrl}
      alt={domain}
      className="projectFaviconPreview"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
};

const ProjectsEditor = ({ items = [], onChange }) => {
  const handleAdd = () => {
    const newItems = [
      ...items,
      {
        title: '',
        description: '',
        techStack: '',
        url: '',
        image: '',
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
          <p>Showcase personal projects, repositories, and software applications you built.</p>
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
                  <div className="projectHeaderTitleWrap">
                    <div className="projectHeaderIconBadge">
                      <ProjectIconPreview item={item} />
                    </div>
                    <h4>Project #{index + 1}: {item.title || 'Untitled Project'}</h4>
                  </div>
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
                      placeholder="e.g. Arcturus Connexa"
                      value={item.title || ''}
                      onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Project / Demo URL (Auto-embeds icon)</label>
                    <div className="projectUrlInputWrap">
                      <input
                        type="url"
                        placeholder="e.g. https://github.com/AlienMinus/Arcturus-Connexa"
                        value={item.url || ''}
                        onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                      />
                      <div className="projectUrlPreviewBadge" title="Live icon embedded from link">
                        <ProjectIconPreview item={item} />
                      </div>
                    </div>
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Custom Project Icon / Logo URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://example.com/logo.png or image link (overrides auto-embedded icon)"
                      value={item.image || ''}
                      onChange={(e) => handleUpdate(index, 'image', e.target.value)}
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
