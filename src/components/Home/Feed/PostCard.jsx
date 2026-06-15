import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaThumbsUp, 
  FaCommentDots, 
  FaPaperPlane, 
  FaEllipsisH,
  FaHeart,
  FaHandsWash,
  FaLightbulb,
  FaLaugh,
  FaHandHoldingHeart
} from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { useProfile } from "../../../context/ProfileContext";

const reactions = [
  { name: "Like", icon: <FaThumbsUp color="#0a66c2" /> },
  { name: "Love", icon: <FaHeart color="#df704d" /> },
  { name: "Celebrate", icon: <FaHandsWash color="#44712e" /> },
  { name: "Support", icon: <FaHandHoldingHeart color="#8a63d2" /> },
  { name: "Insightful", icon: <FaLightbulb color="#f5c748" /> },
  { name: "Funny", icon: <FaLaugh color="#4ea1de" /> },
];

const PostCard = ({ post }) => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [showReactions, setShowReactions] = useState(false);
  const [hideReactionsTimer, setHideReactionsTimer] = useState(null);
  const [currentReaction, setCurrentReaction] = useState(post.hasLiked ? { name: "Like", icon: <FaThumbsUp color="#0a66c2" /> } : null);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [likers, setLikers] = useState(post.likers || []);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const myName = profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "You");

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  useEffect(() => {
    setHasLiked(post.hasLiked || false);
    setLikesCount(post.likesCount || 0);
    setLikers(post.likers || []);
    if (post.hasLiked) {
      const matched = reactions.find(r => r.name === post.userReactionType) || reactions[0];
      setCurrentReaction(matched);
    } else {
      setCurrentReaction(null);
    }
  }, [post.hasLiked, post.likesCount, post.likers, post.userReactionType]);

  const handleReactionClick = async (e, reaction) => {
    e.stopPropagation();
    const isRemoving = currentReaction?.name === reaction.name;
    
    setShowReactions(false);
    clearTimeout(hideReactionsTimer);

    const prevReaction = currentReaction;
    const prevHasLiked = hasLiked;
    const prevLikesCount = likesCount;
    const prevLikers = likers;

    setCurrentReaction(isRemoving ? null : reaction);
    if (!hasLiked && !isRemoving) {
      setLikesCount(prev => prev + 1);
      if (!likers.includes(myName)) setLikers(prev => [...prev, myName]);
    }
    if (hasLiked && isRemoving) {
      setLikesCount(prev => prev - 1);
      setLikers(prev => prev.filter(n => n !== myName));
    }
    setHasLiked(!isRemoving);

    try {
      const token = localStorage.getItem('authToken');
      const method = isRemoving ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isRemoving ? null : JSON.stringify({ reactionType: reaction.name })
      });
      
      if (!response.ok) throw new Error('Reaction failed');
    } catch (err) {
      console.error('Reaction failed', err);
      setCurrentReaction(prevReaction);
      setHasLiked(prevHasLiked);
      setLikesCount(prevLikesCount);
      setLikers(prevLikers);
    }
  };

  const showReactionsPopup = () => {
    clearTimeout(hideReactionsTimer);
    setShowReactions(true);
  };

  const hideReactionsPopup = () => {
    const timer = setTimeout(() => {
      setShowReactions(false);
    }, 500);
    setHideReactionsTimer(timer);
  };

  const handleDefaultLike = async (e) => {
    e.stopPropagation();
    const isRemoving = hasLiked;
    const reactionToSet = hasLiked ? null : reactions[0];
    
    const prevReaction = currentReaction;
    const prevHasLiked = hasLiked;
    const prevLikesCount = likesCount;
    const prevLikers = likers;

    setHasLiked(!isRemoving);
    setLikesCount(prev => isRemoving ? prev - 1 : prev + 1);
    setCurrentReaction(reactionToSet);

    if (!isRemoving && !likers.includes(myName)) {
      setLikers(prev => [...prev, myName]);
    } else if (isRemoving) {
      setLikers(prev => prev.filter(n => n !== myName));
    }

    try {
      const token = localStorage.getItem('authToken');
      const method = isRemoving ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isRemoving ? null : JSON.stringify({ reactionType: 'Like' })
      });
      if (!response.ok) throw new Error('Like failed');
    } catch (err) {
      console.error('Like failed', err);
      setCurrentReaction(prevReaction);
      setHasLiked(prevHasLiked);
      setLikesCount(prevLikesCount);
      setLikers(prevLikers);
    }
  };

  const handleCommentToggle = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Failed to load comments', err);
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleRepost = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Post reposted successfully!");
      }
    } catch (err) {
      console.error('Failed to repost', err);
    }
  };

  const activeLabel = currentReaction ? currentReaction.name : "Like";
  const activeColor = currentReaction ? currentReaction.icon.props.color : "#666";

  const isRepost = !!post.repostedFrom;
  const displayAvatar = isRepost ? post.repostedFrom.authorAvatar : post.avatar;
  const displayName = isRepost ? post.repostedFrom.authorName : post.authorName;
  const displayUsername = isRepost ? post.repostedFrom.authorUsername : post.authorUsername;
  const displayHeadline = isRepost ? post.repostedFrom.authorHeadline : post.authorHeadline;
  const displayContent = (isRepost ? post.repostedFrom.content : post.content) || "";
  const displayImage = isRepost ? post.repostedFrom.image : post.image;

  const handlePostBodyClick = () => {
    navigate(`/user/posts/${post.id}`);
  };

  const profileUrl = displayUsername ? `/profile/${encodeURIComponent(displayUsername)}` : null;

  return (
    <div className="card postCard">
      {isRepost && (
        <div className="repostLabel" style={{ padding: "8px 16px", fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "4px", borderBottom: "1px solid #ebebeb" }}>
          <BiRepost size={16} /> <span>{post.authorName} reposted this</span>
        </div>
      )}
      <div className="postHeader">
        {profileUrl ? (
          <Link to={profileUrl} className="postHeaderLink">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="postAvatar" />
            ) : (
              <CgProfile className="postAvatar postAvatarFallback" />
            )}
            <div className="postInfo">
              <h2>{displayName}</h2>
              <p>{displayHeadline}</p>
              <p>{post.time}</p>
            </div>
          </Link>
        ) : (
          <div className="postHeaderLink">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="postAvatar" />
            ) : (
              <CgProfile className="postAvatar postAvatarFallback" />
            )}
            <div className="postInfo">
              <h2>{displayName}</h2>
              <p>{displayHeadline}</p>
              <p>{post.time}</p>
            </div>
          </div>
        )}
        <FaEllipsisH className="moreIcon" />
      </div>
      <div className="postBody" onClick={handlePostBodyClick} style={{ cursor: "pointer" }}>
        <p>
          {displayContent.split(/(#\w+)/g).map((part, index) => 
            part.startsWith("#") ? <span key={index} className="hashtag">{part}</span> : part
          )}
        </p>
      </div>
      {displayImage && (
        <img 
          className="postImage" 
          src={displayImage} 
          alt="Post visual content" 
        />
      )}
      <div className="postStats" style={{ padding: "0 16px 8px", fontSize: "12px", color: "#666", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ebebeb" }}>
        <div className="likesDisplay" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
          {likers.length > 0 && (
            <span style={{ fontSize: "11px", color: "#888" }}>
              (Liked by {likers.slice(0, 2).join(", ")}{likers.length > 2 ? ` and ${likers.length - 2} ${likers.length - 2 === 1 ? 'other' : 'others'}` : ''})
            </span>
          )}
        </div>
        <span>{post.commentsCount || comments.length} Comments</span>
      </div>
      <div className="postActionOptions">
        <div 
          className="actionOption likeContainer"
          onMouseEnter={showReactionsPopup}
          onMouseLeave={hideReactionsPopup}
          onClick={handleDefaultLike}
          style={{ color: activeColor }}
        >
          {showReactions && (
            <div 
              className="reactionsPopup"
              onMouseEnter={showReactionsPopup}
              onMouseLeave={hideReactionsPopup}
            >
              {reactions.map((r, idx) => (
                <span key={idx} className="reactionIcon" onClick={(e) => handleReactionClick(e, r)} title={r.name}>
                  {r.icon}
                </span>
              ))}
            </div>
          )}
          {currentReaction ? currentReaction.icon : <FaThumbsUp />} 
          <span>{activeLabel}</span>
        </div>
        <div className="actionOption" onClick={handleCommentToggle}><FaCommentDots /> <span>Comment</span></div>
        <div className="actionOption" onClick={handleRepost}><BiRepost size={24} /> <span>Repost</span></div>
        <div className="actionOption" onClick={() => alert('Send post feature via Messenger coming soon!')}><FaPaperPlane /> <span>Send</span></div>
      </div>
      {showComments && (
        <div className="commentsSection" style={{ padding: "16px", borderTop: "1px solid #ebebeb", background: "#f9fafb" }}>
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
      )}
    </div>
  );
};

export default PostCard;