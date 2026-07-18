import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import PostCard from '../../components/Home/Feed/PostCard';
import './ActivityPage.css';

const ActivityPage = () => {
  const { username: paramUsername } = useParams();
  const { profile: currentUserProfile } = useProfile();
  
  const [data, setData] = useState({ activities: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'activities'

  const targetUsername = paramUsername || currentUserProfile?.username;

  useEffect(() => {
    if (!targetUsername) return;

    const loadActivity = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/users/activity/${encodeURIComponent(targetUsername)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('Failed to load activity');
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
  }, [targetUsername]);

  if (loading) return <div className="activity-page loading">Loading activity...</div>;
  if (error) return <div className="activity-page error">{error}</div>;

  const { activities, posts } = data;

  return (
    <div className="activity-page">
      <div className="activity-header">
        <Link to={`/profile/${targetUsername}`} className="back-link">← Back to Profile</Link>
        <h2>{targetUsername === currentUserProfile?.username ? 'Your Activity' : `${targetUsername}'s Activity`}</h2>
        <div className="activity-tabs">
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Reactions & Views
          </button>
        </div>
      </div>

      <div className="activity-content">
        {activeTab === 'posts' && (
          <div className="posts-list">
            {posts.length === 0 ? (
              <p className="no-data">No posts yet.</p>
            ) : (
              posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="activities-list">
            {activities.length === 0 ? (
              <p className="no-data">No activity yet.</p>
            ) : (
              activities.map((activity, index) => {
                if (!activity.postId) return null;
                return (
                  <div key={index} className="activity-item">
                    <p className="activity-meta">
                      {activity.activityType === 'reaction' ? 'Reacted to a post' : 'Viewed a post'} 
                      {' • '}
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    <PostCard post={activity.postId} />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
