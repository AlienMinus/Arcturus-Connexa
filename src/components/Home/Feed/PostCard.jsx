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
import { buildApiUrl } from "../../../utils/api";
import { BiRepost } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { useProfile } from "../../../context/ProfileContext";
import { useReactions } from "../../../context/ReactionContext";

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
  const { reactionsState, setReactionState } = useReactions();
  const navigate = useNavigate();
  const [showReactions, setShowReactions] = useState(false);
  const [hideReactionsTimer, setHideReactionsTimer] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  
  const postId = post.id || post._id;
  const myName = profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "You");

  useEffect(() => {
    let matchedReaction = null;
    if (post.hasLiked) {
      matchedReaction = reactions.find(r => r.name === post.userReactionType) || reactions[0];
    }
    setReactionState(post.id, {
      likesCount: post.likesCount || 0,
      hasLiked: post.hasLiked || false,
      likers: post.likers || [],
      currentReaction: matchedReaction
    });
  }, [post.id, post.likesCount, post.hasLiked, post.likers, post.userReactionType, setReactionState]);

  const reactionData = reactionsState[post.id] || {
    likesCount: post.likesCount || 0,
    hasLiked: post.hasLiked || false,
    likers: post.likers || [],
    currentReaction: post.hasLiked ? (reactions.find(r => r.name === post.userReactionType) || reactions[0]) : null
  };

  const { likesCount, hasLiked, likers, currentReaction } = reactionData;

  const trackActivity = async (activityType) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      await fetch(buildApiUrl('/users/activity'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activityType, postId: post.id || post._id })
      });
    } catch (err) {
      console.error('Failed to track activity', err);
    }
  };

  const getInitials = (name) =>
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '';

  const handleReactionClick = async (e, reaction) => {
    e.stopPropagation();
    const isRemoving = currentReaction?.name === reaction.name;
    
    setShowReactions(false);
    clearTimeout(hideReactionsTimer);

    const prevReaction = currentReaction;
    const prevHasLiked = hasLiked;
    const prevLikesCount = likesCount;
    const prevLikers = [...likers];

    setReactionState(post.id, (curr) => {
      const newHasLiked = !isRemoving;
      let newLikesCount = curr.likesCount;
      let newLikers = [...curr.likers];

      if (!curr.hasLiked && !isRemoving) {
        newLikesCount += 1;
        if (!newLikers.includes(myName)) newLikers.push(myName);
      }
      if (curr.hasLiked && isRemoving) {
        newLikesCount -= 1;
        newLikers = newLikers.filter(n => n !== myName);
      }

      return {
        ...curr,
        currentReaction: isRemoving ? null : reaction,
        hasLiked: newHasLiked,
        likesCount: newLikesCount,
        likers: newLikers
      };
    });

    try {
      const token = localStorage.getItem('authToken');
      const method = isRemoving ? 'DELETE' : 'POST';
      const response = await fetch(buildApiUrl(`/posts/${post.id}/like`), {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isRemoving ? null : JSON.stringify({ reactionType: reaction.name })
      });
      
      if (!response.ok) throw new Error('Reaction failed');
      
      if (!isRemoving) {
        trackActivity('reaction');
      }
    } catch (err) {
      console.error('Reaction failed', err);
      setReactionState(post.id, {
        currentReaction: prevReaction,
        hasLiked: prevHasLiked,
        likesCount: prevLikesCount,
        likers: prevLikers
      });
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
    const prevLikers = [...likers];

    setReactionState(post.id, (curr) => {
      let newLikers = [...curr.likers];
      if (!isRemoving && !newLikers.includes(myName)) {
        newLikers.push(myName);
      } else if (isRemoving) {
        newLikers = newLikers.filter(n => n !== myName);
      }

      return {
        ...curr,
        currentReaction: reactionToSet,
        hasLiked: !isRemoving,
        likesCount: isRemoving ? curr.likesCount - 1 : curr.likesCount + 1,
        likers: newLikers
      };
    });

    try {
      const token = localStorage.getItem('authToken');
      const method = isRemoving ? 'DELETE' : 'POST';
      const response = await fetch(buildApiUrl(`/posts/${post.id}/like`), {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isRemoving ? null : JSON.stringify({ reactionType: 'Like' })
      });
      if (!response.ok) throw new Error('Like failed');
      
      if (!isRemoving) {
        trackActivity('reaction');
      }
    } catch (err) {
      console.error('Like failed', err);
      setReactionState(post.id, {
        currentReaction: prevReaction,
        hasLiked: prevHasLiked,
        likesCount: prevLikesCount,
        likers: prevLikers
      });
    }
  };

  const handleCommentClick = () => {
    const username = post.repostedFrom?.authorUsername || post.repostedFrom?.userId?.username || post.authorUsername || post.userId?.username || '';
    if (!username) return;
    navigate(`/${encodeURIComponent(username)}/posts/${postId}`);
  };

  const handlePostHeaderClick = (e) => {
    if (!displayUsername) return;
    e.stopPropagation();
    navigate(`/profile/${encodeURIComponent(displayUsername)}`);
  };

  const handleRepost = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(buildApiUrl(`/posts/${post.id}/repost`), {
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
  const authorSource = isRepost ? post.repostedFrom : post;
  const displayAvatar = authorSource?.authorAvatar || authorSource?.avatar || authorSource?.userId?.profilePicture?.url || null;
  const displayName = authorSource?.authorName || (authorSource?.userId?.firstName ? `${authorSource.userId.firstName} ${authorSource.userId.lastName}` : (authorSource?.userId?.name || authorSource?.userId?.username || authorSource?.author || 'Anonymous'));
  const displayUsername = authorSource?.authorUsername || authorSource?.userId?.username || authorSource?.userId?.name || '';
  const displayHeadline = authorSource?.authorHeadline || authorSource?.userId?.headline || 'Member';
  const displayContent = (isRepost ? post.repostedFrom.content : post.content) || "";
  const displayImage = isRepost ? post.repostedFrom.image : post.image;

  const handlePostBodyClick = () => {
    if (!displayUsername) return;
    trackActivity('view');
    navigate(`/${displayUsername}/posts/${postId}`);
  };

  const handleSendClick = () => {
    const username = displayUsername || 'user';
    const postUrl = `${window.location.origin}/${username}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: `Post by ${displayName}`, url: postUrl })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(postUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy link', err));
    }
  };

  const handleToggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions((prev) => !prev);
  };

  const handleCopyPostLink = async (e) => {
    e.stopPropagation();
    const username = displayUsername || 'user';
    const postUrl = `${window.location.origin}/${username}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy post link', err);
    }
    setShowOptions(false);
  };

  const handleReportPost = (e) => {
    e.stopPropagation();
    alert('Thanks for reporting this post. Our team will review it.');
    setShowOptions(false);
  };

  const profileLinkTitle = displayUsername ? `View ${displayName}'s profile` : 'View profile';
  const hasProfileLink = Boolean(displayUsername);

  return (
    <div className="card postCard">
      {isRepost && (
        <div className="repostLabel" style={{ padding: "8px 16px", fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "4px", borderBottom: "1px solid #ebebeb" }}>
          <BiRepost size={16} /> <span>{post.authorName} reposted this</span>
        </div>
      )}
      <div className="postHeader">
        {hasProfileLink ? (
          <Link to={`/profile/${encodeURIComponent(displayUsername)}`} className="postHeaderLink" title={profileLinkTitle}>
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
        <div style={{ position: 'relative' }}>
          <FaEllipsisH className="moreIcon" onClick={handleToggleOptions} />
          {showOptions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 20,
              minWidth: '160px',
            }}>
              <button onClick={handleCopyPostLink} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Copy post link
              </button>
              <button onClick={handleReportPost} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Report post
              </button>
            </div>
          )}
        </div>
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
          {likesCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", marginRight: "4px", background: "#fff", borderRadius: "10px", padding: "2px" }}>
              {currentReaction ? (
                 <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", background: "#ebf4fd", border: "1px solid #fff", zIndex: 2 }}>{React.cloneElement(currentReaction.icon, { size: 10 })}</span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", background: "#ebf4fd", border: "1px solid #fff", zIndex: 2 }}><FaThumbsUp color="#0a66c2" size={10} /></span>
              )}
              {likesCount > 1 && (
                 <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", background: "#fdeced", border: "1px solid #fff", marginLeft: "-6px", zIndex: 1 }}><FaHeart color="#df704d" size={10} /></span>
              )}
            </div>
          )}
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
          {likers.length > 0 && (
            <span style={{ fontSize: "11px", color: "#888" }}>
              (Liked by {likers.slice(0, 2).join(", ")}{likers.length > 2 ? ` and ${likers.length - 2} ${likers.length - 2 === 1 ? 'other' : 'others'}` : ''})
            </span>
          )}
        </div>
        <span>{post.commentsCount || 0} Comments</span>
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
        <div className="actionOption" onClick={handleCommentClick}><FaCommentDots /> <span>Comment</span></div>
        <div className="actionOption" onClick={handleRepost}><BiRepost size={24} /> <span>Repost</span></div>
        <div className="actionOption" onClick={handleSendClick}><FaPaperPlane /> <span>Send</span></div>
      </div>
    </div>
  );
};

export default PostCard;