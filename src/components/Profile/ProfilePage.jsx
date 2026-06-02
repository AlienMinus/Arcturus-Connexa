import React, { useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import ProfileHeader from './ProfileHeader';
import ProfileSummary from './ProfileSummary';
import ProfileSection from './ProfileSection';
import ProfileListSection from './ProfileListSection';
import ProfileEditForm from './ProfileEditForm';
import './Profile.css';

const ProfilePage = () => {
  const { profile, loading, error, refreshProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return <div className="profilePage loading">Loading profile…</div>;
  }

  if (error) {
    return <div className="profilePage error">{error}</div>;
  }

  return (
    <div className="profilePage">
      <ProfileHeader profile={profile} onEdit={() => setIsEditing(!isEditing)} />
      {isEditing && (
        <ProfileEditForm profile={profile} onSaved={() => {
          refreshProfile();
          setIsEditing(false);
        }} />
      )}
      <div className="profilePageLayout">
        <main className="profileMainColumn">
          <ProfileSummary summary={profile.summary} />
          <ProfileSection title="Featured" items={profile.featured} type="featured" />
          <ProfileSection title="Activity" items={profile.activity} type="activity" />
          <ProfileListSection title="Experience" items={profile.experience} />
          <ProfileListSection title="Education" items={profile.education} />
          <ProfileListSection title="Licenses & certifications" items={profile.certifications} />
          <ProfileListSection title="Projects" items={profile.projects} />
        </main>

        <aside className="profileSidebarColumn">
          <ProfileSection title="Skills" items={profile.skills?.map((skill) => ({ title: skill }))} />
          <ProfileSection title="Honors & awards" items={profile.honors} />
          <ProfileSection title="Interests" items={profile.interests?.map((interest) => ({ title: interest }))} />
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
