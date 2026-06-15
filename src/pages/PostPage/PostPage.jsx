import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GiEarthAsiaOceania } from "react-icons/gi";
import PostCard from "../../components/Home/Feed/PostCard";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { CgProfile } from "react-icons/cg";

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
        
        const response = await fetch(`/api/posts/${postId}`, { headers });
        if (!response.ok) {
          throw new Error("Post not found");
        }
        
        const data = await response.json();
        const myReaction = data.likes?.find(like => String(like.userId?._id || like.userId || like) === String(profile?._id || profile?.id));
        
        // Format single post data exactly like Feed.jsx
        setPost({
          id: data._id,
          authorName: data.userId?.firstName ? `${data.userId.firstName} ${data.userId.lastName}` : (data.userId?.name || data.userId?.username || data.author || 'Anonymous'),
          authorUsername: data.userId?.username || '',
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
            authorUsername: data.repostedFrom.userId?.username || '',
            authorHeadline: data.repostedFrom.userId?.headline || 'Member',
            content: data.repostedFrom.content || '',
            image: data.repostedFrom.media?.[0]?.url,
            authorAvatar: data.repostedFrom.userId?.profilePicture?.url || null
          } : null
        });

        const commentsRes = await fetch(`/api/posts/${postId}/comments`, { headers });
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
      const res = await fetch(`/api/posts/${postId}/comments`, {
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

  if (loading) return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;
  if (error) return <div style={{ textAlign: "center", padding: "20px", color: "red" }}>{error}</div>;
  if (!post) return <div style={{ textAlign: "center", padding: "20px" }}>Post not found</div>;

  return (
    <div className="post-page-container" style={{ maxWidth: "600px", margin: "20px auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "16px", cursor: "pointer", background: "none", border: "none", color: "#0a66c2", fontWeight: "bold" }}>
        &larr; Back
      </button>
      <PostCard post={post} />
      <div className="commentsSection" style={{ padding: "16px", borderTop: "1px solid #ebebeb", background: "#f9fafb", marginTop: "16px", borderRadius: "8px", border: "1px solid #ebebeb" }}>
        <form onSubmit={submitComment} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input 
            type="text" 
            placeholder="Add a comment..." 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            style={{ flex: 1, padding: "8px 12px", borderRadius: "20px", border: "1px solid #ccc", outline: "none" }}
          />
          <button type="submit" disabled={!newComment.trim()} style={{ background: newComment.trim() ? "#0a66c2" : "#ebebeb", color: newComment.trim() ? "white" : "#a8a8a8", border: "none", padding: "0 16px", borderRadius: "20px", fontWeight: "bold", cursor: newComment.trim() ? "pointer" : "not-allowed" }}>Post</button>
        </form>
        <div className="commentsList" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.map((c, idx) => (
            <div key={idx} className="commentItem" style={{ display: "flex", gap: "8px" }}>
              {c.authorAvatar?.url ? (
                <img src={c.authorAvatar.url} alt={c.authorName} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <CgProfile style={{ fontSize: "32px", color: "#666" }} />
              )}
              <div className="commentContent" style={{ background: "#ebebeb", padding: "8px 12px", borderRadius: "0 8px 8px 8px", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "14px" }}>{c.authorName}</strong>
                  <span style={{ fontSize: "10px", color: "#666" }}>
                    {new Date(c.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{c.content}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div style={{ fontSize: "12px", color: "#666", textAlign: "center" }}>No comments yet. Be the first to comment!</div>}
        </div>
      </div>
    </div>
  );
};

export default PostPage;