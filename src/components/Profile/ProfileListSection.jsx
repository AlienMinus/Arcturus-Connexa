import React, { useState } from 'react';
import { 
  FaBriefcase, 
  FaGraduationCap, 
  FaCertificate, 
  FaLaptopCode, 
  FaChevronDown, 
  FaChevronUp, 
  FaExternalLinkAlt,
  FaGithub,
  FaGitlab,
  FaFigma,
  FaYoutube,
  FaDribbble,
  FaMedium,
  FaCodepen,
  FaGlobe
} from 'react-icons/fa';

const getDomainFromUrl = (urlString) => {
  try {
    if (!urlString) return '';
    const formatted = urlString.startsWith('http://') || urlString.startsWith('https://')
      ? urlString
      : `https://${urlString}`;
    const urlObj = new URL(formatted);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (err) {
    return '';
  }
};

const getSectionDefaultIcon = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('experience')) return <FaBriefcase />;
  if (lower.includes('education')) return <FaGraduationCap />;
  if (lower.includes('license') || lower.includes('certification')) return <FaCertificate />;
  if (lower.includes('project')) return <FaLaptopCode />;
  return <FaBriefcase />;
};

const SmartItemIcon = ({ item, defaultIcon, title }) => {
  const [imgError, setImgError] = useState(false);
  const domain = getDomainFromUrl(item.url || item.link);

  // 1. If explicit custom image/logo is provided and hasn't failed
  if (item.image && !imgError) {
    return (
      <img
        className="profileItemImage"
        src={item.image}
        alt={item.title || title}
        onError={() => setImgError(true)}
      />
    );
  }

  // 2. If item has a URL, detect domain brand or fetch favicon
  if (domain && !imgError) {
    const lowerDomain = domain.toLowerCase();
    if (lowerDomain.includes('github.com')) return <FaGithub className="brandProjectIcon github" size={26} />;
    if (lowerDomain.includes('gitlab.com')) return <FaGitlab className="brandProjectIcon gitlab" size={26} />;
    if (lowerDomain.includes('figma.com')) return <FaFigma className="brandProjectIcon figma" size={26} />;
    if (lowerDomain.includes('youtube.com') || lowerDomain.includes('youtu.be')) return <FaYoutube className="brandProjectIcon youtube" size={26} />;
    if (lowerDomain.includes('dribbble.com')) return <FaDribbble className="brandProjectIcon dribbble" size={26} />;
    if (lowerDomain.includes('medium.com')) return <FaMedium className="brandProjectIcon medium" size={26} />;
    if (lowerDomain.includes('codepen.io')) return <FaCodepen className="brandProjectIcon codepen" size={26} />;

    // Use Google high-res favicon service for custom project links
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    return (
      <img
        className="profileItemFavicon"
        src={faviconUrl}
        alt={domain}
        onError={() => setImgError(true)}
      />
    );
  }

  return <div className="sectionItemIconPlaceholder">{defaultIcon}</div>;
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
        {displayedItems.map((item, index) => {
          const itemUrl = item.url || item.link;

          return (
            <div className="sectionItem" key={`${title}-${index}`}>
              <div className="sectionItemIconCol">
                {itemUrl ? (
                  <a
                    href={itemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="sectionItemIconLink"
                    title={`Open ${item.title || 'project'} link`}
                  >
                    <div className="sectionItemIconPlaceholder withLink">
                      <SmartItemIcon item={item} defaultIcon={defaultIcon} title={title} />
                    </div>
                  </a>
                ) : (
                  <div className="sectionItemIconPlaceholder">
                    <SmartItemIcon item={item} defaultIcon={defaultIcon} title={title} />
                  </div>
                )}
              </div>

              <div className="sectionItemContent">
                {item.title && (
                  itemUrl ? (
                    <h3 className="itemTitle">
                      <a href={itemUrl} target="_blank" rel="noreferrer" className="itemTitleLink">
                        {item.title}
                      </a>
                    </h3>
                  ) : (
                    <h3 className="itemTitle">{item.title}</h3>
                  )
                )}
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

                {itemUrl && (
                  <a 
                    className="itemLink" 
                    href={itemUrl} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    View credential / project <FaExternalLinkAlt size={11} style={{ marginLeft: 4 }} />
                  </a>
                )}
              </div>
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

export default ProfileListSection;
