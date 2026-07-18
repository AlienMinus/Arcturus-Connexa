import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GiEarthAsiaOceania } from "react-icons/gi";
import PostCard from "../../components/Home/Feed/PostCard";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { buildApiUrl } from '../../utils/api';
import { CgProfile } from "react-icons/cg";
import "./PostPage.css";

const PostPage = () => {
  const { username, postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(buildApiUrl(`/posts/${postId}`), { headers });
        if (!response.ok) {
          throw new Error("Post not found");
        }
        
        const data = await response.json();
        const myReaction = data.likes?.find(like => String(like.userId?._id || like.userId || like) === String(profile?._id || profile?.id));
        
        // Format single post data exactly like Feed.jsx
        setPost({
          id: data._id,
          authorName: data.userId?.firstName ? `${data.userId.firstName} ${data.userId.lastName}` : (data.userId?.name || data.userId?.username || data.author || 'Anonymous'),
          authorUsername: data.authorUsername || data.userId?.username || data.userId?.name || '',
          authorHeadline: data.userId?.headline || 'Member',
          time: (
            <>
              {new Date(data.createdAt).toLocaleString()} • <GiEarthAsiaOceania />
            </>
          ),
          avatar: data.userId?.profilePicture?.url || null,
          content: data.content || '',
          image: data.media?.[0]?.url,
          likesCount: data.likes?.length || 0,
          hasLiked: !!myReaction,
          userReactionType: myReaction?.reactionType || 'Like',
          likers: data.likes?.map(like => {
            const user = like.userId || like;
            return user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || user?.username || 'Someone');
          }) || [],
          commentsCount: data.comments?.length || 0,
          repostedFrom: data.repostedFrom ? {
            id: data.repostedFrom._id,
            authorName: data.repostedFrom.userId?.firstName ? `${data.repostedFrom.userId.firstName} ${data.repostedFrom.userId.lastName}` : (data.repostedFrom.userId?.name || data.repostedFrom.userId?.username || data.repostedFrom.author || 'Anonymous'),
            authorUsername: data.repostedFrom.authorUsername || data.repostedFrom.userId?.username || data.repostedFrom.userId?.name || '',
            authorHeadline: data.repostedFrom.userId?.headline || 'Member',
            content: data.repostedFrom.content || '',
            image: data.repostedFrom.media?.[0]?.url,
            authorAvatar: data.repostedFrom.userId?.profilePicture?.url || null
          } : null
        });

        const commentsRes = await fetch(buildApiUrl(`/posts/${postId}/comments`), { headers });
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.comments || []);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, token, profile]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const authToken = token || localStorage.getItem('authToken');
      const res = await fetch(buildApiUrl(`/posts/${postId}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setNewComment('');
        setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (loading) return <div className="post-page-loading">Loading...</div>;
  if (error) return <div className="post-page-error">{error}</div>;
  if (!post) return <div className="post-page-not-found">Post not found</div>;

  return (
    <div className="post-page-container">
      <button onClick={() => navigate(-1)} className="post-page-back-btn">
        &larr; Back
      </button>
      <PostCard post={post} />
      <div className="post-page-comments-section">
        <form onSubmit={submitComment} className="post-page-comment-form">
          <input 
            type="text" 
            placeholder="Add a comment..." 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            className="post-page-comment-input"
          />
          <button type="submit" disabled={!newComment.trim()} className="post-page-comment-submit">Post</button>
        </form>
        <div className="post-page-comments-list">
          {comments.map((c, idx) => (
            <div key={idx} className="post-page-comment-item">
              {c.authorAvatar?.url ? (
                <img src={c.authorAvatar.url} alt={c.authorName} className="post-page-comment-avatar" />
              ) : (
                <CgProfile className="post-page-comment-avatar-fallback" />
              )}
              <div className="post-page-comment-content">
                <div className="post-page-comment-header">
                  <strong className="post-page-comment-author">{c.authorName}</strong>
                  <span className="post-page-comment-time">
                    {new Date(c.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="post-page-comment-text">{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="post-page-no-comments">No comments yet. Be the first to comment!</div>}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
