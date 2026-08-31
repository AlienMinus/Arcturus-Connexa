import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { CgProfile } from "react-icons/cg";
import PostCard from "../../components/Home/Feed/PostCard";
import { buildApiUrl } from "../../utils/api";
import { getUserFullName } from "../../utils/user";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";
import "./PostPage.css";

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { token } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch(buildApiUrl(`/posts/${postId}`), { headers });
        if (!response.ok) {
          throw new Error("Post not found");
        }
        
        const data = await response.json();
        const currentUserId = profile?.userId || profile?._id || profile?.id;
        const myReaction = data.likes?.find(
          (like) => String(like.userId?._id || like.userId || like) === String(currentUserId)
        );
        
        // Format single post data exactly like Feed.jsx
        setPost({
          id: data._id,
          authorName: getUserFullName(data.userId) || data.author || 'Anonymous',
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
            return getUserFullName(user, 'Someone');
          }) || [],
          commentsCount: data.comments?.length || 0,
          repostedFrom: data.repostedFrom ? {
            id: data.repostedFrom._id,
            authorName: getUserFullName(data.repostedFrom.userId) || data.repostedFrom.author || 'Anonymous',
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
        console.error("Error fetching post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostData();
    }
  }, [postId, profile, token]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(buildApiUrl(`/posts/${postId}/comments`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const data = await response.json();
      setComments(data.comments || []);
      setNewComment("");
      setPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev);
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  if (loading) return <div className="post-page-loading">Loading post...</div>;
  if (error || !post) return <div className="post-page-error">{error || "Post not found"}</div>;

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
          {comments.map((c, idx) => {
            const commentUser = c.userId || {};
            const commentAuthorName = getUserFullName(commentUser) || c.authorName || 'Member';
            const commentUsername = commentUser.username || c.authorUsername || '';
            const profileLink = commentUsername ? `/profile/${encodeURIComponent(commentUsername)}` : null;

            return (
              <div key={idx} className="post-page-comment-item">
                {profileLink ? (
                  <Link to={profileLink} style={{ textDecoration: 'none' }}>
                    {c.authorAvatar?.url ? (
                      <img src={c.authorAvatar.url} alt={commentAuthorName} className="post-page-comment-avatar" />
                    ) : (
                      <CgProfile className="post-page-comment-avatar-fallback" />
                    )}
                  </Link>
                ) : (
                  c.authorAvatar?.url ? (
                    <img src={c.authorAvatar.url} alt={commentAuthorName} className="post-page-comment-avatar" />
                  ) : (
                    <CgProfile className="post-page-comment-avatar-fallback" />
                  )
                )}

                <div className="post-page-comment-content">
                  <div className="post-page-comment-header">
                    {profileLink ? (
                      <Link to={profileLink} style={{ textDecoration: 'none', color: '#0f172a' }}>
                        <strong className="post-page-comment-author">{commentAuthorName}</strong>
                      </Link>
                    ) : (
                      <strong className="post-page-comment-author">{commentAuthorName}</strong>
                    )}
                    <span className="post-page-comment-time">
                      {new Date(c.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="post-page-comment-text">{c.content}</p>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && <div className="post-page-no-comments">No comments yet. Be the first to comment!</div>}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
