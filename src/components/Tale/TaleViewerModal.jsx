import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
  FaEye,
  FaPaperPlane,
  FaHeart,
  FaPause,
  FaPlay,
} from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
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
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState('');
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [hasReacted, setHasReacted] = useState(null);

  const currentGroup = taleGroups[groupIndex] || null;
  const currentTale = currentGroup?.tales?.[taleIndex] || null;
  const isMyTale = String(currentGroup?.userId) === String(user?._id || user?.id || profile?.userId);

  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Time format helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Expired soon';
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
      setHasReacted(null);
    }
  }, [currentTale?._id, markTaleViewed]);

  // Auto-advancement timer & progress animation
  useEffect(() => {
    if (isPaused || showViewersModal) {
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
  }, [isPaused, showViewersModal, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [handleNext, handlePrev, onClose]);

  // Send Reaction
  const handleReaction = async (reactionEmoji) => {
    if (!token || !currentTale?._id) return;
    setHasReacted(reactionEmoji);
    try {
      await fetch(buildApiUrl(`/tales/${currentTale._id}/react`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction: reactionEmoji }),
      });
    } catch (err) {
      console.error('Failed to react to tale', err);
    }
  };

  // Send Reply via DM
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !token || !currentTale?._id) return;

    setIsSendingReply(true);
    try {
      const response = await fetch(buildApiUrl(`/tales/${currentTale._id}/reply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (response.ok) {
        setReplyFeedback('Message sent! 💬');
        setReplyText('');
        setTimeout(() => setReplyFeedback(''), 2500);
      }
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setIsSendingReply(false);
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

        {/* STORY FOOTER (REACTIONS & DM REPLY OR VIEWERS COUNT) */}
        <div className="talePlayerFooter">
          {isMyTale ? (
            <div className="myTaleFooterControls">
              <button
                type="button"
                className="viewersCountBtn"
                onClick={() => setShowViewersModal(true)}
              >
                <FaEye /> <span>Seen by {currentTale.viewers?.length || 0} viewers</span>
              </button>
            </div>
          ) : (
            <div className="networkTaleFooterControls">
              {/* Quick Reactions Bar */}
              <div className="taleReactionsBar">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`taleReactionBtn ${hasReacted === emoji ? 'reacted' : ''}`}
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Form */}
              <form className="taleReplyForm" onSubmit={handleSendReply}>
                <input
                  type="text"
                  placeholder={`Reply to ${currentGroup.userName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  type="submit"
                  className="sendReplyBtn"
                  disabled={!replyText.trim() || isSendingReply}
                  title="Send message"
                >
                  <FaPaperPlane />
                </button>
              </form>

              {replyFeedback && <span className="replyFeedbackText">{replyFeedback}</span>}
            </div>
          )}
        </div>
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

      {/* VIEWERS MODAL (FOR AUTHOR) */}
      {showViewersModal && (
        <div className="viewersSheetOverlay" onClick={() => setShowViewersModal(false)}>
          <div className="viewersSheetCard" onClick={(e) => e.stopPropagation()}>
            <div className="viewersSheetHeader">
              <h4>Tale Viewers ({currentTale.viewers?.length || 0})</h4>
              <button type="button" className="closeSheetBtn" onClick={() => setShowViewersModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="viewersList">
              {currentTale.viewers && currentTale.viewers.length > 0 ? (
                currentTale.viewers.map((v, idx) => (
                  <div key={idx} className="viewerItem">
                    {v.userId?.profilePicture?.url ? (
                      <img src={v.userId.profilePicture.url} alt="Viewer" className="viewerAvatar" />
                    ) : (
                      <CgProfile className="viewerAvatar fallback" />
                    )}
                    <div className="viewerInfo">
                      <strong>
                        {v.userId?.firstName
                          ? `${v.userId.firstName} ${v.userId.lastName}`
                          : v.userId?.name || 'Member'}
                      </strong>
                      <span>{formatTimeAgo(v.viewedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="emptyViewersNotice">No views yet. Share with your network!</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaleViewerModal;

