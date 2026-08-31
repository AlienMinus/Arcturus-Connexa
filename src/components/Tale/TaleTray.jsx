import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaCamera, FaFont, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import CreateTaleModal from './CreateTaleModal';
import TaleViewerModal from './TaleViewerModal';
import './TaleTray.css';

// Sample network status tales for instant interactive demo when database is empty
const SAMPLE_DEMO_TALES = [
  {
    userId: 'demo_1',
    userName: 'Elena Rostova',
    userUsername: 'elena_dev',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    userHeadline: 'Staff AI Engineer',
    tales: [
      {
        _id: 'sample_t1',
        text: 'Just deployed our new multi-agent LLM pipeline to production! 🚀 Reduced latency by 45%.',
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        textColor: '#ffffff',
        fontFamily: 'system-ui',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        viewers: [{ viewedAt: new Date() }],
      },
      {
        _id: 'sample_t2',
        media: {
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
          resource_type: 'image',
        },
        caption: 'Team demo day & retrospectives at the engineering lab ☕💡',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        viewers: [],
      },
    ],
  },
  {
    userId: 'demo_2',
    userName: 'Marcus Vance',
    userUsername: 'marcus_v',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    userHeadline: 'Head of Product Design',
    tales: [
      {
        _id: 'sample_t3',
        text: 'Reminder: Good design is as little design as possible. Keep it intuitive, accessible, and fast. ✨',
        background: 'linear-gradient(135deg, #059669, #0284c7)',
        textColor: '#ffffff',
        fontFamily: 'Georgia, serif',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        viewers: [],
      },
    ],
  },
  {
    userId: 'demo_3',
    userName: 'David Kim',
    userUsername: 'david_kim',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    userHeadline: 'Cloud Architect & Founder',
    tales: [
      {
        _id: 'sample_t4',
        text: 'Happy Monday network! 🌟 We are officially opening 3 new senior engineer roles today on Arcturus. DM me for details!',
        background: 'linear-gradient(135deg, #f97316, #ec4899)',
        textColor: '#ffffff',
        fontFamily: 'system-ui',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        viewers: [],
      },
    ],
  },
];

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

  const myUserId = String(user?._id || user?.id || profile?.userId || '');
  const myAvatar = profile?.avatar?.url || profile?.profilePicture?.url || user?.profilePicture?.url || null;
  const myName = profile?.name || (profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'You');

  const fetchTales = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/tales'));
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setTaleGroups(data);
        } else {
          // If no active DB tales exist yet, show demo tales so user immediately sees status tray
          setTaleGroups(SAMPLE_DEMO_TALES);
        }
      } else {
        setTaleGroups(SAMPLE_DEMO_TALES);
      }
    } catch (err) {
      console.error('Error fetching tales', err);
      setTaleGroups(SAMPLE_DEMO_TALES);
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

          {/* 2. NETWORK TALE ITEMS */}
          {taleGroups.map((group, gIdx) => {
            if (String(group.userId) === myUserId) return null; // Already rendered as "Your Tale"

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

