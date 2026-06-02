import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileSummary from '../../components/Profile/ProfileSummary';
import ProfileSection from '../../components/Profile/ProfileSection';
import ProfileListSection from '../../components/Profile/ProfileListSection';
import ProfileEditForm from '../../components/Profile/ProfileEditForm';
import '../../components/Profile/Profile.css';

const ProfilePage = () => {
  const { username } = useParams();
  const { profile: currentProfile, loading: currentLoading, error: currentError, refreshProfile } = useProfile();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const isOwnProfile = !username || username === currentProfile?.username;

  useEffect(() => {
    if (!username) {
      setProfile(currentProfile);
      setLoading(currentLoading);
      setError(currentError);
      return;
    }

    if (currentProfile && username === currentProfile.username) {
      setProfile(currentProfile);
      setLoading(currentLoading);
      setError(currentError);
      return;
    }

    const loadProfileByUsername = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/profile/${encodeURIComponent(username)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const json = await response.json().catch(() => null);
          throw new Error(json?.error || 'Failed to load profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfileByUsername();
  }, [username, currentProfile, currentLoading, currentError]);

  if (loading) {
    return <div className="profilePage loading">Loading profile…</div>;
  }

  if (error) {
    return <div className="profilePage error">{error}</div>;
  }

  return (
    <div className="profilePage">
      <ProfileHeader
        profile={profile}
        onEdit={isOwnProfile ? () => setIsEditing(!isEditing) : undefined}
      />
      {isEditing && isOwnProfile && (
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
