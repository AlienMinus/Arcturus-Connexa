import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import { getUserFullName } from '../../utils/user';
import CreateTaleModal from './CreateTaleModal';
import TaleViewerModal from './TaleViewerModal';
import './TaleTray.css';

const TaleTray = () => {
  const { token, user } = useAuth();
  const { profile } = useProfile();

  const [taleGroups, setTaleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    groupIndex: 0,
    taleIndex: 0,
  });

  const myUserId = String(user?._id || user?.id || profile?.userId || profile?._id || '');
  const myAvatar = profile?.avatar?.url || profile?.profilePicture?.url || user?.profilePicture?.url || null;
  const myName = getUserFullName(profile, 'You');

  const fetchTales = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/tales'));
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTaleGroups(data);
        } else {
          setTaleGroups([]);
        }
      } else {
        setTaleGroups([]);
      }
    } catch (err) {
      console.error('Error fetching tales', err);
      setTaleGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTales();
  }, [fetchTales]);

  // Find current user's tale group
  const myTaleGroupIndex = taleGroups.findIndex(
    (g) => String(g.userId) === myUserId
  );
  const myTaleGroup = myTaleGroupIndex !== -1 ? taleGroups[myTaleGroupIndex] : null;
  const hasMyActiveTale = Boolean(myTaleGroup && myTaleGroup.tales?.length > 0);

  // Open viewer
  const handleOpenViewer = (groupIndex, taleIndex = 0) => {
    setViewerState({
      isOpen: true,
      groupIndex,
      taleIndex,
    });
  };

  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, groupIndex: 0, taleIndex: 0 });
    fetchTales();
  };

  return (
    <>
      <div className="taleTrayCard">
        <div className="taleTrayScroll">
          {/* 1. MY TALE ITEM */}
          <div className="taleItem myTaleItem">
            {hasMyActiveTale ? (
              <div className="myTaleActiveWrap">
                <button
                  type="button"
                  className="taleAvatarRing myActiveStoryRing"
                  onClick={() => handleOpenViewer(myTaleGroupIndex, 0)}
                  title="View your Tale"
                >
                  {myAvatar ? (
                    <img src={myAvatar} alt={myName} className="taleAvatarImg" />
                  ) : (
                    <CgProfile className="taleAvatarImg fallback" />
                  )}
                </button>
                <button
                  type="button"
                  className="myTaleAddBadge"
                  onClick={() => setIsCreateModalOpen(true)}
                  title="Add another Tale"
                >
                  <FaPlus />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="taleAvatarRing addTaleRing"
                onClick={() => setIsCreateModalOpen(true)}
                title="Create a Tale"
              >
                {myAvatar ? (
                  <img src={myAvatar} alt={myName} className="taleAvatarImg" />
                ) : (
                  <CgProfile className="taleAvatarImg fallback" />
                )}
                <div className="addTalePlusBadge">
                  <FaPlus />
                </div>
              </button>
            )}
            <span className="taleUserName">Your Tale</span>
          </div>

          {/* 2. NETWORK TALE ITEMS (FROM DATABASE) */}
          {taleGroups.map((group, gIdx) => {
            if (String(group.userId) === myUserId) return null; // Rendered as "Your Tale"

            const hasUnviewed = group.tales.some(
              (t) => !t.viewers?.some((v) => String(v.userId?._id || v.userId) === myUserId)
            );

            return (
              <div
                key={group.userId || gIdx}
                className="taleItem networkTaleItem"
                onClick={() => handleOpenViewer(gIdx, 0)}
              >
                <div className={`taleAvatarRing ${hasUnviewed ? 'unviewedStoryRing' : 'viewedStoryRing'}`}>
                  {group.userAvatar ? (
                    <img src={group.userAvatar} alt={group.userName} className="taleAvatarImg" />
                  ) : (
                    <CgProfile className="taleAvatarImg fallback" />
                  )}
                </div>
                <span className="taleUserName">{group.userName?.split(' ')[0] || 'Member'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE TALE MODAL */}
      {isCreateModalOpen && (
        <CreateTaleModal
          onClose={() => setIsCreateModalOpen(false)}
          onTaleCreated={fetchTales}
        />
      )}

      {/* TALE VIEWER FULLSCREEN MODAL */}
      {viewerState.isOpen && (
        <TaleViewerModal
          taleGroups={taleGroups}
          initialGroupIndex={viewerState.groupIndex}
          initialTaleIndex={viewerState.taleIndex}
          onClose={handleCloseViewer}
          onTaleDeleted={fetchTales}
        />
      )}
    </>
  );
};

export default TaleTray;
