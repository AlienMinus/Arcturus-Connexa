import React, { useEffect, useState, useCallback, useRef } from "react";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import { useProfile } from "../../../context/ProfileContext";
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from "../../../utils/api";
import { getUserFullName } from "../../../utils/user";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import FeedSort from "./FeedSort";
import TaleTray from "../../Tale/TaleTray";
import "./Feed.css";

const POSTS_PER_PAGE = 4;

const Feed = () => {
  const { profile } = useProfile();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(buildApiUrl('/posts'), { headers });
      const data = await response.json();
      const currentUserId = profile?.userId || profile?._id || profile?.id;
      setPosts(
        data.map((post) => {
          const myReaction = post.likes?.find(
            (like) => String(like.userId?._id || like.userId || like) === String(currentUserId)
          );
          
          return {
            id: post._id,
            userId: post.userId,
            authorName: getUserFullName(post.userId) || post.authorName || post.author || 'Member',
            authorUsername: post.authorUsername || post.userId?.username || post.userId?.name || '',
            authorHeadline: post.userId?.headline || 'Member',
            time: (
              <>
                {new Date(post.createdAt).toLocaleString()} • <GiEarthAsiaOceania />
              </>
            ),
            avatar: post.userId?.profilePicture?.url || null,
            content: post.content || '',
            image: post.media?.[0]?.url,
            likesCount: post.likes?.length || 0,
            hasLiked: !!myReaction,
            userReactionType: myReaction?.reactionType || 'Like',
            likers: post.likes?.map(like => {
              const user = like.userId || like;
              return getUserFullName(user, 'Someone');
            }) || [],
            commentsCount: post.comments?.length || 0,
            repostedFrom: post.repostedFrom ? {
              id: post.repostedFrom._id,
              userId: post.repostedFrom.userId,
              authorName: getUserFullName(post.repostedFrom.userId) || post.repostedFrom.authorName || post.repostedFrom.author || 'Member',
              authorUsername: post.repostedFrom.authorUsername || post.repostedFrom.userId?.username || post.repostedFrom.userId?.name || '',
              authorHeadline: post.repostedFrom.userId?.headline || 'Member',
              content: post.repostedFrom.content || '',
              image: post.repostedFrom.media?.[0]?.url,
              authorAvatar: post.repostedFrom.userId?.profilePicture?.url || null
            } : null
          };
        })
      );
    } catch (error) {
      console.error('Failed to load posts', error);
      setPosts([]);
    }
  }, [profile, token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts();
    };

    window.addEventListener('post-created', handlePostCreated);
    return () => {
      window.removeEventListener('post-created', handlePostCreated);
    };
  }, [fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && visibleCount < posts.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, posts.length));
            setLoadingMore(false);
          }, 350);
        }
      },
      { rootMargin: "150px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [visibleCount, posts.length, loadingMore]);

  const displayedPosts = posts.slice(0, visibleCount);

  return (
    <div className="feed">
      <CreatePost onPostCreated={fetchPosts} />
      <TaleTray />
      <FeedSort />

      {displayedPosts.length > 0 ? (
        displayedPosts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="emptyFeedMessage">No posts yet. Create the first post!</div>
      )}

      {/* Progressive scroll loader sentinel */}
      {visibleCount < posts.length && (
        <div ref={sentinelRef} className="feedLoadingSentinel">
          <FaSpinner className="feedLoadingSpinner" />
          <span>Loading more posts...</span>
        </div>
      )}

      {posts.length > 0 && visibleCount >= posts.length && (
        <div className="feedEndOfContent">
          <FaCheckCircle color="#059669" size={16} />
          <span>You're all caught up!</span>
        </div>
      )}
    </div>
  );
};

export default Feed;
