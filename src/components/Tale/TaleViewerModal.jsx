import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
  FaEye,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaComments,
  FaRegCommentDots,
} from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import { getUserFullName } from '../../utils/user';
import './TaleViewerModal.css';

const STORY_DURATION_MS = 5000;
const REACTION_EMOJIS = ['❤️', '🔥', '👏', '💡', '🚀', '😂'];

const TaleViewerModal = ({
  taleGroups,
  initialGroupIndex = 0,
  initialTaleIndex = 0,
  onClose,
  onTaleDeleted,
}) => {
  const { token, user } = useAuth();
  const { profile } = useProfile();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [taleIndex, setTaleIndex] = useState(initialTaleIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [hasReacted, setHasReacted] = useState(null);
  const [localComments, setLocalComments] = useState([]);
  const [localReactions, setLocalReactions] = useState([]);

  const currentGroup = taleGroups[groupIndex] || null;
  const currentTale = currentGroup?.tales?.[taleIndex] || null;
  const myUserId = String(user?._id || user?.id || profile?.userId || profile?._id || '');
  const isMyTale = String(currentGroup?.userId) === myUserId;

  const progressIntervalRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Time format helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return '1d ago';
  };

  // Mark tale as viewed
  const markTaleViewed = useCallback(async (taleId) => {
    if (!token || !taleId) return;
    try {
      await fetch(buildApiUrl(`/tales/${taleId}/view`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to mark tale viewed', err);
    }
  }, [token]);

  // Navigate to Next Tale
  const handleNext = useCallback(() => {
    if (!currentGroup) return;
    if (taleIndex < currentGroup.tales.length - 1) {
      setTaleIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < taleGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setTaleIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentGroup, taleIndex, groupIndex, taleGroups.length, onClose]);

  // Navigate to Previous Tale
  const handlePrev = useCallback(() => {
    if (taleIndex > 0) {
      setTaleIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = taleGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setTaleIndex(prevGroup.tales.length - 1);
      setProgress(0);
    }
  }, [taleIndex, groupIndex, taleGroups]);

  // Handle Current Tale Change
  useEffect(() => {
    if (currentTale?._id) {
      markTaleViewed(currentTale._id);
      setProgress(0);
      setLocalComments(currentTale.comments || []);
      setLocalReactions(currentTale.reactions || []);

      const existingReaction = currentTale.reactions?.find(
        (r) => String(r.userId?._id || r.userId) === myUserId
      );
      setHasReacted(existingReaction ? existingReaction.reaction : null);
    }
  }, [currentTale?._id, markTaleViewed, myUserId]);

  // Auto-advancement timer & progress animation
  useEffect(() => {
    if (isPaused || showViewersModal || showCommentsModal) {
      clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50;
    const progressIncrement = (intervalStep / STORY_DURATION_MS) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          handleNext();
          return 0;
        }
        return prev + progressIncrement;
      });
    }, intervalStep);

    return () => clearInterval(progressIntervalRef.current);
  }, [isPaused, showViewersModal, showCommentsModal, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showCommentsModal || showViewersModal) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose, showCommentsModal, showViewersModal]);

  // Send Reaction
  const handleReaction = async (reactionEmoji) => {
    if (!token || !currentTale?._id) return;
    setHasReacted(reactionEmoji);

    // Optimistic reaction update
    setLocalReactions((prev) => {
      const filtered = prev.filter((r) => String(r.userId?._id || r.userId) !== myUserId);
      return [...filtered, { userId: user || profile, reaction: reactionEmoji, createdAt: new Date() }];
    });

    try {
      const response = await fetch(buildApiUrl(`/tales/${currentTale._id}/react`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction: reactionEmoji }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.reactions) setLocalReactions(json.reactions);
      }
    } catch (err) {
      console.error('Failed to react to tale', err);
    }
  };

  // Submit Comment on Tale (also dispatches DM to author)
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !token || !currentTale?._id) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(buildApiUrl(`/tales/${currentTale._id}/comment`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comments) {
          setLocalComments(data.comments);
        }
        setCommentText('');
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to post comment on tale', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete own Tale
  const handleDeleteTale = async () => {
    if (!window.confirm('Delete this Tale?')) return;
    try {
      await fetch(buildApiUrl(`/tales/${currentTale._id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onTaleDeleted?.();
      handleNext();
    } catch (err) {
      console.error('Failed to delete tale', err);
    }
  };

  // Find reaction for a specific viewer
  const getViewerReaction = (viewerUserId) => {
    if (!viewerUserId) return null;
    const vId = String(viewerUserId._id || viewerUserId);
    const match = localReactions.find((r) => String(r.userId?._id || r.userId) === vId);
    return match ? match.reaction : null;
  };

  if (!currentGroup || !currentTale) return null;

  return (
    <div className="taleViewerOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* PREVIOUS GROUP BUTTON */}
      {groupIndex > 0 && (
        <button
          type="button"
          className="taleNavSideBtn taleNavPrev"
          onClick={handlePrev}
          title="Previous Story"
        >
          <FaChevronLeft />
        </button>
      )}

      {/* MAIN STORY PLAYER CARD */}
      <div
        className="talePlayerCard"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
      >
        {/* PROGRESS BARS */}
        <div className="taleProgressSegments">
          {currentGroup.tales.map((t, idx) => {
            let width = '0%';
            if (idx < taleIndex) width = '100%';
            else if (idx === taleIndex) width = `${progress}%`;
            return (
              <div key={t._id || idx} className="progressSegmentTrack">
                <div className="progressSegmentFill" style={{ width }} />
              </div>
            );
          })}
        </div>

        {/* STORY HEADER */}
        <div className="talePlayerHeader">
          <Link
            to={`/profile/${encodeURIComponent(currentGroup.userUsername || '')}`}
            className="taleAuthorInfo"
            onClick={onClose}
          >
            {currentGroup.userAvatar ? (
              <img src={currentGroup.userAvatar} alt={currentGroup.userName} className="taleAuthorAvatar" />
            ) : (
              <CgProfile className="taleAuthorAvatar fallback" />
            )}
            <div className="taleAuthorMeta">
              <strong>{currentGroup.userName}</strong>
              <span>{formatTimeAgo(currentTale.createdAt)}</span>
            </div>
          </Link>

          <div className="taleHeaderActions">
            {isMyTale && (
              <button
                type="button"
                className="taleHeaderActionBtn"
                onClick={handleDeleteTale}
                title="Delete this Tale"
              >
                <FaTrashAlt />
              </button>
            )}
            <button
              type="button"
              className="taleHeaderActionBtn"
              onClick={() => setIsPaused((p) => !p)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <FaPlay /> : <FaPause />}
            </button>
            <button
              type="button"
              className="taleHeaderActionBtn close"
              onClick={onClose}
              title="Close Viewer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* STORY CONTENT AREA */}
        <div className="taleMainContent">
          {/* TOUCH NAVIGATION OVERLAYS */}
          <div
            className="taleTouchZone left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="taleTouchZone right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />

          {/* STORY DISPLAY */}
          {currentTale.media?.url ? (
            <div className="taleMediaWrapper">
              {currentTale.media.resource_type === 'video' ? (
                <video
                  src={currentTale.media.url}
                  autoPlay
                  playsInline
                  className="taleMediaItem"
                />
              ) : (
                <img
                  src={currentTale.media.url}
                  alt="Tale visual content"
                  className="taleMediaItem"
                />
              )}
              {currentTale.caption && (
                <div className="taleCaptionOverlay">
                  <p>{currentTale.caption}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="taleTextDisplayCanvas"
              style={{
                background: currentTale.background || 'linear-gradient(135deg, #0a66c2, #004182)',
                fontFamily: currentTale.fontFamily || 'system-ui',
                color: currentTale.textColor || '#ffffff',
              }}
            >
              <p className="taleTextStatusContent">{currentTale.text}</p>
            </div>
          )}
        </div>

        {/* STORY FOOTER: REACTIONS BAR & COMMENTS CONTROLS */}
        <div className="talePlayerFooter">
          {/* Quick Reactions Bar */}
          <div className="taleReactionsBar">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`taleReactionBtn ${hasReacted === emoji ? 'reacted' : ''}`}
                onClick={() => handleReaction(emoji)}
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Bottom Actions Row */}
          <div className="taleFooterActionsRow">
            {isMyTale && (
              <button
                type="button"
                className="taleFooterPillBtn"
                onClick={() => {
                  setShowCommentsModal(false);
                  setShowViewersModal(true);
                }}
              >
                <FaEye /> <span>{currentTale.viewers?.length || 0} Viewers</span>
              </button>
            )}

            <button
              type="button"
              className="taleFooterPillBtn commentsPillBtn"
              onClick={() => {
                setShowViewersModal(false);
                setShowCommentsModal(true);
              }}
            >
              <FaComments /> <span>{localComments.length} Comments</span>
            </button>
          </div>

          {/* Quick Comment Input */}
          <form className="taleQuickCommentForm" onSubmit={handleSubmitComment}>
            <input
              type="text"
              placeholder={`Comment on ${currentGroup.userName}'s Tale...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="sendTaleCommentBtn"
              disabled={!commentText.trim() || isSubmittingComment}
              title="Post comment"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>

        {/* 1. VIEWERS MODAL (CONTAINED INSIDE STORY CARD) */}
        {showViewersModal && (
          <div className="taleInnerDrawerOverlay" onClick={() => setShowViewersModal(false)}>
            <div className="taleInnerDrawerCard animateDrawerIn" onClick={(e) => e.stopPropagation()}>
              <div className="taleDrawerHeader">
                <div className="drawerHeaderTitle">
                  <FaEye color="#0a66c2" />
                  <h4>Tale Viewers ({currentTale.viewers?.length || 0})</h4>
                </div>
                <button type="button" className="closeDrawerBtn" onClick={() => setShowViewersModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="taleDrawerScrollableList">
                {currentTale.viewers && currentTale.viewers.length > 0 ? (
                  currentTale.viewers.map((v, idx) => {
                    const viewerReaction = getViewerReaction(v.userId);
                    const viewerName = getUserFullName(v.userId) || 'Arcturus Member';
                    const viewerUsername = v.userId?.username || '';
                    const profileLink = viewerUsername ? `/profile/${encodeURIComponent(viewerUsername)}` : null;

                    return (
                      <div key={idx} className="taleViewerRow">
                        <div className="viewerAvatarWrap">
                          {profileLink ? (
                            <Link to={profileLink} onClick={onClose}>
                              {v.userId?.profilePicture?.url ? (
                                <img src={v.userId.profilePicture.url} alt={viewerName} className="taleViewerAvatar" />
                              ) : (
                                <CgProfile className="taleViewerAvatar fallback" />
                              )}
                            </Link>
                          ) : (
                            v.userId?.profilePicture?.url ? (
                              <img src={v.userId.profilePicture.url} alt={viewerName} className="taleViewerAvatar" />
                            ) : (
                              <CgProfile className="taleViewerAvatar fallback" />
                            )
                          )}
                          {viewerReaction && (
                            <span className="viewerReactionFloatBadge" title={`Reacted ${viewerReaction}`}>
                              {viewerReaction}
                            </span>
                          )}
                        </div>

                        <div className="taleViewerInfo">
                          {profileLink ? (
                            <Link to={profileLink} onClick={onClose} className="viewerNameLink">
                              <strong>{viewerName}</strong>
                            </Link>
                          ) : (
                            <strong>{viewerName}</strong>
                          )}
                          <span className="viewerTimeMeta">{formatTimeAgo(v.viewedAt)}</span>
                        </div>

                        {viewerReaction && (
                          <div className="viewerReactionBadgePill">
                            <span>{viewerReaction}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="emptyDrawerNotice">No views yet. Share with your network!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. COMMENTS MODAL (CONTAINED INSIDE STORY CARD) */}
        {showCommentsModal && (
          <div className="taleInnerDrawerOverlay" onClick={() => setShowCommentsModal(false)}>
            <div className="taleInnerDrawerCard animateDrawerIn" onClick={(e) => e.stopPropagation()}>
              <div className="taleDrawerHeader">
                <div className="drawerHeaderTitle">
                  <FaRegCommentDots color="#0a66c2" />
                  <h4>Tale Comments ({localComments.length})</h4>
                </div>
                <button type="button" className="closeDrawerBtn" onClick={() => setShowCommentsModal(false)}>
                  <FaTimes />
                </button>
              </div>

              {/* EMBEDDED TALE CARD PREVIEW */}
              <div className="embeddedTaleSnippetCard">
                <div
                  className="embeddedTaleSnippetThumbnail"
                  style={{
                    background: currentTale.background || 'linear-gradient(135deg, #0a66c2, #004182)',
                  }}
                >
                  {currentTale.media?.url ? (
                    <img src={currentTale.media.url} alt="Tale Preview" className="embeddedThumbImg" />
                  ) : (
                    <span className="embeddedTextInitial">📖</span>
                  )}
                </div>
                <div className="embeddedTaleSnippetMeta">
                  <span className="embeddedTaleAuthorTag">Replying to {currentGroup.userName}'s Tale</span>
                  <p className="embeddedTaleText">{currentTale.text || currentTale.caption || 'Media story'}</p>
                </div>
              </div>

              {/* COMMENTS LIST */}
              <div className="taleDrawerScrollableList">
                {localComments && localComments.length > 0 ? (
                  localComments.map((c, idx) => {
                    const commenterName = getUserFullName(c.userId) || 'Member';
                    const commenterUsername = c.userId?.username || '';
                    const profileLink = commenterUsername ? `/profile/${encodeURIComponent(commenterUsername)}` : null;

                    return (
                      <div key={idx} className="taleCommentRow">
                        {profileLink ? (
                          <Link to={profileLink} onClick={onClose} style={{ flexShrink: 0 }}>
                            {c.userId?.profilePicture?.url ? (
                              <img src={c.userId.profilePicture.url} alt={commenterName} className="taleCommentAvatar" />
                            ) : (
                              <CgProfile className="taleCommentAvatar fallback" />
                            )}
                          </Link>
                        ) : (
                          c.userId?.profilePicture?.url ? (
                            <img src={c.userId.profilePicture.url} alt={commenterName} className="taleCommentAvatar" />
                          ) : (
                            <CgProfile className="taleCommentAvatar fallback" />
                          )
                        )}

                        <div className="taleCommentBubble">
                          <div className="taleCommentBubbleHeader">
                            {profileLink ? (
                              <Link to={profileLink} onClick={onClose} className="commentAuthorLink">
                                <strong>{commenterName}</strong>
                              </Link>
                            ) : (
                              <strong>{commenterName}</strong>
                            )}
                            <span>{formatTimeAgo(c.createdAt)}</span>
                          </div>
                          <p className="taleCommentTextContent">{c.content}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="emptyDrawerNotice">No comments yet. Be the first to start the conversation!</div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* DRAWER COMMENT INPUT */}
              <form className="taleDrawerInputForm" onSubmit={handleSubmitComment}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="sendDrawerCommentBtn"
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* NEXT GROUP BUTTON */}
      {groupIndex < taleGroups.length - 1 && (
        <button
          type="button"
          className="taleNavSideBtn taleNavNext"
          onClick={handleNext}
          title="Next Story"
        >
          <FaChevronRight />
        </button>
      )}
    </div>
  );
};

export default TaleViewerModal;
