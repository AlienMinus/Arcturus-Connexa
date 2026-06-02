import React from 'react';

const ProfileSection = ({ title, items = [], type }) => {
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
            {item.title && <h3>{item.title}</h3>}
            {item.subtitle && <p className="itemSubtitle">{item.subtitle}</p>}
            {item.description && <p className="itemDescription">{item.description}</p>}
            {item.date && <p className="itemMeta">{item.date}</p>}
            {item.url && (
              <a className="itemLink" href={item.url} rel="noreferrer" target="_blank">
                View details
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileSection;
