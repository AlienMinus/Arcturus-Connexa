import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProfileConnectionList = ({ title, items = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const hasMore = items.length > 2;
  const displayedItems = (!hasMore || isExpanded) ? items : items.slice(0, 2);

  return (
    <section className="profileSection profileConnectionsSection">
      <div className="sectionHeader">
        <h2>{title}</h2>
        <span className="sectionHeaderBadge">{items.length}</span>
      </div>

      <div className="connectionsGrid">
        {displayedItems.map((item) => {
          const avatarUrl = item.avatar?.url || (typeof item.avatar === 'string' ? item.avatar : null);
          const linkTarget = item.username ? `/profile/${encodeURIComponent(item.username)}` : null;

          const content = (
            <>
              {avatarUrl ? (
                <img src={avatarUrl} alt={item.name} className="connectionAvatar" />
              ) : (
                <div className="connectionAvatarFallback">{item.name?.[0] || 'U'}</div>
              )}
              <div className="connectionDetails">
                <p className="connectionName">{item.name}</p>
                <p className="connectionHeadline">{item.headline || 'Member'}</p>
              </div>
            </>
          );

          if (linkTarget) {
            return (
              <Link to={linkTarget} className="connectionCard connectionCardLink" key={item.id || item.username}>
                {content}
              </Link>
            );
          }

          return (
            <div className="connectionCard" key={item.id || item.username}>
              {content}
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

export default ProfileConnectionList;
