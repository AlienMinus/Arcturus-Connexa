import React from 'react';

const ProfileListSection = ({ title, items = [] }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="profileSection">
      <div className="sectionHeader">
        <h2>{title}</h2>
      </div>
      <div className="sectionList">
        {items.map((item, index) => (
          <div className="sectionItem" key={`${title}-${index}`}>
            {item.image && <img className="profileItemImage" src={item.image} alt={item.title || title} />}
            {item.title && <h3>{item.title}</h3>}
            {item.subtitle && <p className="itemSubtitle">{item.subtitle}</p>}
            {item.location && <p className="itemMeta">{item.location}</p>}
            {item.dateRange && <p className="itemMeta">{item.dateRange}</p>}
            {item.description && <p className="itemDescription">{item.description}</p>}
            {item.issuer && <p className="itemMeta">{item.issuer}</p>}
            {item.techStack?.length > 0 && (
              <div className="techStack">
                {item.techStack.map((tech) => <span key={tech}>{tech}</span>)}
              </div>
            )}
            {item.url && <a className="itemLink" href={item.url} target="_blank" rel="noreferrer">View project</a>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileListSection;
