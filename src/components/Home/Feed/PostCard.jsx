import React, { useState } from "react";
import { 
  FaThumbsUp, 
  FaCommentDots, 
  FaShare, 
  FaPaperPlane, 
  FaEllipsisH,
  FaHeart,
  FaHandsWash,
  FaLightbulb,
  FaLaugh
} from "react-icons/fa";

const PostCard = ({ post }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [hideReactionsTimer, setHideReactionsTimer] = useState(null);
  const [currentReaction, setCurrentReaction] = useState(null);

  const reactions = [
    { name: "Like", icon: <FaThumbsUp color="#0a66c2" /> },
    { name: "Love", icon: <FaHeart color="#df704d" /> },
    { name: "Celebrate", icon: <FaHandsWash color="#44712e" /> },
    { name: "Insightful", icon: <FaLightbulb color="#f5c748" /> },
    { name: "Funny", icon: <FaLaugh color="#4ea1de" /> },
  ];

  const handleReactionClick = (e, reaction) => {
    e.stopPropagation();
    setCurrentReaction(currentReaction?.name === reaction.name ? null : reaction);
    setShowReactions(false);
    clearTimeout(hideReactionsTimer);
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

  const handleDefaultLike = () => setCurrentReaction(currentReaction ? null : reactions[0]);

  const activeLabel = currentReaction ? currentReaction.name : "Like";
  const activeColor = currentReaction ? currentReaction.icon.props.color : "#666";

  return (
    <div className="card postCard">
      <div className="postHeader">
        <img src={post.avatar} alt="Avatar" className="postAvatar" />
        <div className="postInfo">
          <h2>{post.authorName}</h2>
          <p>{post.authorHeadline}</p>
          <p>{post.time}</p>
        </div>
        <FaEllipsisH className="moreIcon" />
      </div>
      <div className="postBody">
        <p>
          {post.content.split(/(#\w+)/g).map((part, index) => 
            part.startsWith("#") ? <span key={index} className="hashtag">{part}</span> : part
          )}
        </p>
      </div>
      {post.image && (
        <img 
          className="postImage" 
          src={post.image} 
          alt="Post visual content" 
        />
      )}
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
        <div className="actionOption"><FaCommentDots /> <span>Comment</span></div>
        <div className="actionOption"><FaShare /> <span>Repost</span></div>
        <div className="actionOption"><FaPaperPlane /> <span>Send</span></div>
      </div>
    </div>
  );
};

export default PostCard;