import React from 'react';

const ProfileConnectionList = ({ title, items = [] }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="profileSection profileConnectionsSection">
      <div className="sectionHeader">
        <h2>{title}</h2>
      </div>
      <div className="connectionsGrid">
        {items.map((item) => (
          <div className="connectionCard" key={item.id || item.username}>
            {item.avatar?.url ? (
              <img src={item.avatar.url} alt={item.name} className="connectionAvatar" />
            ) : (
              <div className="connectionAvatarFallback">{item.name?.[0] || 'U'}</div>
            )}
            <div>
              <p className="connectionName">{item.name}</p>
              <p className="connectionHeadline">{item.headline}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProfileConnectionList;
