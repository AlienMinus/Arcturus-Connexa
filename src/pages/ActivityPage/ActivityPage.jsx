import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/Home/Feed/PostCard';
import { CgProfile } from 'react-icons/cg';
import { FaArrowLeft, FaRegNewspaper, FaRegThumbsUp } from 'react-icons/fa';
import './ActivityPage.css';

const ActivityPage = () => {
  const { username: paramUsername } = useParams();
  const { profile: currentUserProfile, loading: profileLoading } = useProfile();
  const { token, loading: authLoading } = useAuth();
  
  const [data, setData] = useState({ user: null, activities: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'all', 'posts', 'activities'

  const targetUsername = paramUsername || currentUserProfile?.username;

  useEffect(() => {
    // If still waiting for auth or profile context to resolve the logged-in user
    if (!paramUsername && (authLoading || profileLoading)) {
      return;
    }

    const loadActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const authToken = token || localStorage.getItem('authToken');
        const endpoint = targetUsername 
          ? `/users/activity/${encodeURIComponent(targetUsername)}`
          : '/users/activity';

        const response = await fetch(buildApiUrl(endpoint), {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || 'Failed to load activity');
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [paramUsername, targetUsername, authLoading, profileLoading, token]);

  if (loading || (!targetUsername && (authLoading || profileLoading))) {
    return (
      <div className="activity-page-container">
        <div className="activity-page loading">
          <div className="activity-loading-spinner"></div>
          <p>Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-page-container">
        <div className="activity-page error">
          <p>{error}</p>
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { activities = [], posts = [], user: activityUser } = data;
  const userProfile = activityUser || currentUserProfile;
  const isOwn = !paramUsername || paramUsername === currentUserProfile?.username;
  const profileUsername = userProfile?.username || targetUsername || '';

  const totalPostsCount = posts.length;
  const totalActivitiesCount = activities.length;

  return (
    <div className="activity-page-container">
      <div className="activity-page">
        {/* Activity User Header Card */}
        <div className="activity-user-header">
          <Link to={profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : '/profile'} className="activity-back-link">
            <FaArrowLeft /> Back to Profile
          </Link>

          <div className="activity-profile-summary">
            {userProfile?.avatar ? (
              <img
                src={typeof userProfile.avatar === 'string' ? userProfile.avatar : userProfile.avatar.url}
                alt={userProfile?.name || 'User'}
                className="activity-user-avatar"
              />
            ) : (
              <CgProfile className="activity-user-avatar activity-user-avatar-fallback" />
            )}
            <div className="activity-user-info">
              <h1>{userProfile?.name || targetUsername || 'Member'}</h1>
              {userProfile?.headline && <p className="activity-user-headline">{userProfile.headline}</p>}
              <p className="activity-user-stats">
                {isOwn ? 'All your posts, reactions, and recent interactions' : `Recent posts and activity by ${userProfile?.name || targetUsername}`}
              </p>
            </div>
          </div>

          <div className="activity-tabs">
            <button 
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
              type="button"
            >
              <FaRegNewspaper /> Posts <span className="tab-count">{totalPostsCount}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
              type="button"
            >
              <FaRegThumbsUp /> Reactions & Views <span className="tab-count">{totalActivitiesCount}</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="activity-content">
          {activeTab === 'posts' && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="activity-empty-state">
                  <FaRegNewspaper className="empty-icon" />
                  <h3>No posts published yet</h3>
                  <p>{isOwn ? "When you publish posts, they will appear here." : `${userProfile?.name || 'This user'} hasn't posted anything yet.`}</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id || post._id} className="activity-post-wrapper">
                    <PostCard post={post} />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="activities-list">
              {activities.length === 0 ? (
                <div className="activity-empty-state">
                  <FaRegThumbsUp className="empty-icon" />
                  <h3>No reactions or recent activity</h3>
                  <p>{isOwn ? "When you react to or view posts, your recent activity will show up here." : "No public activity recorded yet."}</p>
                </div>
              ) : (
                activities.map((activity, index) => {
                  if (!activity.postId) return null;
                  const activityLabel = activity.activityType === 'reaction'
                    ? 'Reacted to this post'
                    : activity.activityType === 'view'
                    ? 'Viewed this post'
                    : activity.activityType === 'comment'
                    ? 'Commented on this post'
                    : 'Interacted with this post';

                  return (
                    <div key={activity.postId.id || activity.postId._id || index} className="activity-item-card">
                      <div className="activity-item-badge">
                        <span className="activity-badge-dot"></span>
                        <span className="activity-badge-text">{activityLabel}</span>
                        {activity.createdAt && (
                          <span className="activity-badge-date">
                            • {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <PostCard post={activity.postId} />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
