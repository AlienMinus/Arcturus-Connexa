import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileSummary from '../../components/Profile/ProfileSummary';
import ProfileSection from '../../components/Profile/ProfileSection';
import ProfileListSection from '../../components/Profile/ProfileListSection';
import ProfileConnectionList from '../../components/Profile/ProfileConnectionList';
import ProfileEditForm from '../../components/Profile/ProfileEditForm';
import PostCard from '../../components/Home/Feed/PostCard';
import { FaChevronDown, FaChevronUp, FaArrowRight } from 'react-icons/fa';
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
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [arePostsExpanded, setArePostsExpanded] = useState(false);

  const isOwnProfile = !username || username === currentProfile?.username || username === user?.username;

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      if (isOwnProfile) {
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
  }, [username, currentProfile, currentLoading, currentError, getProfileByUsername, authLoading, isOwnProfile]);

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
      return await response.json().catch(() => ({ success: true }));
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
      updateProfileField({
        hasOutgoingConnectionRequest: true,
        isFollowing: success.isFollowing ?? profile.isFollowing,
        followersCount: success.followersCount ?? profile.followersCount,
      });
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

  if (loading || authLoading || !profile) {
    return (
      <div className="profilePage-wrapper">
        <div className="profilePage loading">
          <div className="profileLoadingSpinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profilePage-wrapper">
        <div className="profilePage error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const postsList = profile.posts || [];
  const hasMorePosts = postsList.length > 2;
  const displayedPosts = (!hasMorePosts || arePostsExpanded) ? postsList : postsList.slice(0, 2);
  const profileUsername = profile.username || username || '';

  return (
    <div className="profilePage-wrapper">
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
          <ProfileEditForm 
            profile={profile} 
            onSaved={(savedData) => {
              if (savedData) {
                setProfile((prev) => ({ ...prev, ...savedData }));
              }
              refreshProfile();
              setIsEditing(false);
            }} 
          />
        )}

        <div className="profilePageLayout">
          {/* Main Column */}
          <main className="profileMainColumn">
            {/* About Section: Full content (no truncation) */}
            <ProfileSummary summary={profile.summary} />

            {/* Featured Section: Limit 2 items with toggle */}
            <ProfileSection title="Featured" items={profile.featured} type="featured" />

            {/* Posts Section: Limit 2 posts with toggle & activity link */}
            {postsList.length > 0 && (
              <section className="profileSection profilePostsSection">
                <div className="sectionHeader">
                  <h2>Posts</h2>
                  {profileUsername && (
                    <Link 
                      to={`/profile/${encodeURIComponent(profileUsername)}/activity`}
                      className="sectionHeaderLink"
                    >
                      View all activity <FaArrowRight size={11} />
                    </Link>
                  )}
                </div>

                <div className="profilePostsList">
                  {displayedPosts.map((post) => (
                    <div key={post.id || post._id} className="profilePostWrapper">
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>

                {hasMorePosts && (
                  <div className="sectionFooter">
                    <button
                      type="button"
                      className="viewAllButton"
                      onClick={() => setArePostsExpanded(!arePostsExpanded)}
                    >
                      {arePostsExpanded ? (
                        <>Show fewer <FaChevronUp size={12} /></>
                      ) : (
                        <>Show all {postsList.length} posts <FaChevronDown size={12} /></>
                      )}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Activity Section: Limit 2 items with toggle */}
            <ProfileSection title="Activity" items={profile.activity} type="activity" />

            {/* Experience Section: Limit 2 items with toggle */}
            <ProfileListSection title="Experience" items={profile.experience} />

            {/* Licenses & certifications Section: Limit 2 items with toggle */}
            <ProfileListSection title="Licenses & certifications" items={profile.certifications} />

            {/* Projects Section: Limit 2 items with toggle */}
            <ProfileListSection title="Projects" items={profile.projects} />
          </main>

          {/* Sidebar Column */}
          <aside className="profileSidebarColumn">
            {/* Skills Section: Full content (no truncation) */}
            <ProfileSection 
              title="Skills" 
              type="skills" 
              items={profile.skills?.map((skill) => ({ title: skill }))} 
            />

            {/* Education Section: Limit 2 items with toggle */}
            <ProfileListSection title="Education" items={profile.education} />

            {/* Achievements / Honors: Limit 2 items with toggle */}
            <ProfileSection title="Achievements" items={profile.honors} />

            {/* Interests: Limit 2 items with toggle */}
            <ProfileSection 
              title="Interests" 
              items={profile.interests?.map((interest) => ({ title: interest }))} 
            />

            {/* Connections: Limit 2 items with toggle */}
            <ProfileConnectionList title="Connections" items={profile.connections} />

            {/* Followers: Limit 2 items with toggle */}
            <ProfileConnectionList title="Followers" items={profile.followers} />

            {/* Following: Limit 2 items with toggle */}
            <ProfileConnectionList title="Following" items={profile.following} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
