import React, { createContext, useContext, useState, useCallback } from 'react';

const ReactionContext = createContext();

export const useReactions = () => useContext(ReactionContext);

export const ReactionProvider = ({ children }) => {
  const [reactionsState, setReactionsState] = useState({});

  const setReactionState = useCallback((postId, stateUpdater) => {
    setReactionsState(prev => {
      const current = prev[postId] || { 
        likesCount: 0, 
        hasLiked: false, 
        likers: [], 
        currentReaction: null 
      };
      const next = typeof stateUpdater === 'function' ? stateUpdater(current) : stateUpdater;
      
      // Prevent unnecessary updates if state hasn't changed
      if (
        current.likesCount === next.likesCount &&
        current.hasLiked === next.hasLiked &&
        current.currentReaction?.name === next.currentReaction?.name &&
        JSON.stringify(current.likers) === JSON.stringify(next.likers)
      ) {
        return prev;
      }

      return {
        ...prev,
        [postId]: { ...current, ...next }
      };
    });
  }, []);

  return (
    <ReactionContext.Provider value={{ reactionsState, setReactionState }}>
      {children}
    </ReactionContext.Provider>
  );
};
