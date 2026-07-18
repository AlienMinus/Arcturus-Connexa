import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileSummary from '../../components/Profile/ProfileSummary';
import ProfileSection from '../../components/Profile/ProfileSection';
import ProfileListSection from '../../components/Profile/ProfileListSection';
import ProfileConnectionList from '../../components/Profile/ProfileConnectionList';
import ProfileEditForm from '../../components/Profile/ProfileEditForm';
import PostCard from '../../components/Home/Feed/PostCard';
import '../../components/Profile/Profile.css';

const ProfilePage = () => {
  const { username } = useParams();
  const {
    profile: currentProfile,
    loading: currentLoading,
    error: currentError,
    refreshProfile,
    getProfileByUsername,
  } = useProfile();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = !username || username === currentProfile?.username;

  useEffect(() => {
    const loadProfile = async () => {
      if (!username || username === currentProfile?.username) {
        setProfile(currentProfile);
        setLoading(currentLoading);
        setError(currentError);
      } else {
        setLoading(true);
        setError(null);
        const data = await getProfileByUsername(username);
        if (data) {
          setProfile(data);
        } else {
          setError('Failed to load profile');
        }
        setLoading(false);
      }
    };
    loadProfile();
  }, [username, currentProfile, currentLoading, currentError, getProfileByUsername]);

  const updateProfileField = (changes) => {
    setProfile((current) => ({ ...current, ...changes }));
  };

  const performAction = async (path, method = 'POST') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl(path), {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Action failed');
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile?.userId) return;
    const nextAction = profile.isFollowing ? 'DELETE' : 'POST';
    const success = await performAction(`/users/${profile.userId}/follow`, nextAction);
    if (success) {
      updateProfileField({
        isFollowing: !profile.isFollowing,
        followersCount: profile.isFollowing ? Math.max(0, (profile.followersCount || 1) - 1) : (profile.followersCount || 0) + 1,
      });
    }
  };

  const handleConnectRequest = async () => {
    if (!profile?.userId) return;
    const success = await performAction(`/users/${profile.userId}/connect/request`);
    if (success) {
      updateProfileField({ hasOutgoingConnectionRequest: true });
    }
  };

  const handleAcceptConnection = async () => {
    if (!profile?.userId) return;
    const success = await performAction(`/users/${profile.userId}/connect/accept`);
    if (success) {
      updateProfileField({
        isConnected: true,
        hasIncomingConnectionRequest: false,
        connectionsCount: (profile.connectionsCount || 0) + 1,
      });
    }
  };

  const handleDeclineConnection = async () => {
    if (!profile?.userId) return;
    const success = await performAction(`/users/${profile.userId}/connect/decline`);
    if (success) {
      updateProfileField({ hasIncomingConnectionRequest: false });
    }
  };

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
        onFollow={!isOwnProfile ? handleFollowToggle : undefined}
        onConnectRequest={!isOwnProfile ? handleConnectRequest : undefined}
        onAcceptConnection={!isOwnProfile ? handleAcceptConnection : undefined}
        onDeclineConnection={!isOwnProfile ? handleDeclineConnection : undefined}
        actionState={{
          isFollowing: profile?.isFollowing,
          isConnected: profile?.isConnected,
          hasOutgoingConnectionRequest: profile?.hasOutgoingConnectionRequest,
          hasIncomingConnectionRequest: profile?.hasIncomingConnectionRequest,
          loading: actionLoading,
        }}
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
          {profile.posts && profile.posts.length > 0 && (
            <div className="profile-posts">
              <h3>Posts</h3>
              {profile.posts.map((post) => (
                <PostCard post={post} key={post.id} />
              ))}
            </div>
          )}
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
          <ProfileConnectionList title="Connections" items={profile.connections} />
          <ProfileConnectionList title="Followers" items={profile.followers} />
          <ProfileConnectionList title="Following" items={profile.following} />
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
