import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';

const ProfileSection = ({ title, items = [], type }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const isSkills = type === 'skills' || title.toLowerCase() === 'skills';
  const hasMore = !isSkills && items.length > 2;
  const displayedItems = (!hasMore || isExpanded) ? items : items.slice(0, 2);

  return (
    <section className={`profileSection ${isSkills ? 'profileSkillsSection' : ''}`}>
      <div className="sectionHeader">
        <h2>{title}</h2>
        {isSkills && items.length > 0 && (
          <span className="sectionHeaderBadge">{items.length} skills</span>
        )}
      </div>

      <div className={isSkills ? 'skillBubbles' : 'sectionList'}>
        {displayedItems.map((item, index) => {
          if (isSkills) {
            return (
              <div className="skillBubble" key={`${title}-${index}`}>
                <span>{item.title || (typeof item === 'string' ? item : '')}</span>
              </div>
            );
          }

          return (
            <div className="sectionItem simpleSectionItem" key={`${title}-${index}`}>
              {item.title && <h3 className="itemTitle">{item.title}</h3>}
              {item.subtitle && <p className="itemSubtitle">{item.subtitle}</p>}
              {item.issuer && <p className="itemMeta">Issued by {item.issuer}</p>}
              {item.date && <p className="itemMeta">{item.date}</p>}
              {item.description && <p className="itemDescription">{item.description}</p>}
              {item.url && (
                <a className="itemLink" href={item.url} rel="noreferrer" target="_blank">
                  View details <FaExternalLinkAlt size={11} style={{ marginLeft: 4 }} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="sectionFooter">
          <button 
            type="button" 
            className="viewAllButton"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Show fewer <FaChevronUp size={12} /></>
            ) : (
              <>Show all {items.length} {title.toLowerCase()} <FaChevronDown size={12} /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
};

export default ProfileSection;
