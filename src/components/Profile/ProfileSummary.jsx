import React from 'react';

const ProfileSummary = ({ summary }) => {
  return (
    <section className="profileSection">
      <div className="sectionHeader">
        <h2>About</h2>
      </div>
      <p className="summaryText">{summary || 'Add a summary to your profile so people can learn more about you.'}</p>
    </section>
  );
};

export default ProfileSummary;
