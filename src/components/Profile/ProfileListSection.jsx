import React, { useState } from 'react';
import { 
  FaBriefcase, 
  FaGraduationCap, 
  FaCertificate, 
  FaLaptopCode, 
  FaChevronDown, 
  FaChevronUp, 
  FaExternalLinkAlt 
} from 'react-icons/fa';

const getSectionDefaultIcon = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('experience')) return <FaBriefcase />;
  if (lower.includes('education')) return <FaGraduationCap />;
  if (lower.includes('license') || lower.includes('certification')) return <FaCertificate />;
  if (lower.includes('project')) return <FaLaptopCode />;
  return <FaBriefcase />;
};

const ProfileListSection = ({ title, items = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const hasMore = items.length > 2;
  const displayedItems = (!hasMore || isExpanded) ? items : items.slice(0, 2);
  const defaultIcon = getSectionDefaultIcon(title);

  return (
    <section className="profileSection profileListCard">
      <div className="sectionHeader">
        <h2>{title}</h2>
      </div>

      <div className="sectionList">
        {displayedItems.map((item, index) => (
          <div className="sectionItem" key={`${title}-${index}`}>
            <div className="sectionItemIconCol">
              {item.image ? (
                <img className="profileItemImage" src={item.image} alt={item.title || title} />
              ) : (
                <div className="sectionItemIconPlaceholder">
                  {defaultIcon}
                </div>
              )}
            </div>

            <div className="sectionItemContent">
              {item.title && <h3 className="itemTitle">{item.title}</h3>}
              {item.subtitle && <p className="itemSubtitle">{item.subtitle}</p>}
              {(item.dateRange || item.location) && (
                <p className="itemMeta">
                  {item.dateRange}
                  {item.dateRange && item.location ? ' · ' : ''}
                  {item.location}
                </p>
              )}
              {item.issuer && <p className="itemMeta">Issued by {item.issuer}</p>}
              {item.description && <p className="itemDescription">{item.description}</p>}
              
              {item.techStack?.length > 0 && (
                <div className="techStack">
                  {item.techStack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
              )}

              {item.url && (
                <a 
                  className="itemLink" 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  View credential / project <FaExternalLinkAlt size={11} style={{ marginLeft: 4 }} />
                </a>
              )}
            </div>
          </div>
        ))}
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

export default ProfileListSection;
