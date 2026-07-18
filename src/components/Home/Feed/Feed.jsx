import React, { useEffect, useState, useCallback } from "react";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { useProfile } from "../../../context/ProfileContext";
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from "../../../utils/api";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import FeedSort from "./FeedSort";
import "./Feed.css";

const Feed = () => {
  const { profile } = useProfile();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);

  const fetchPosts = useCallback(async () => {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(buildApiUrl('/posts'), { headers });
      const data = await response.json();
      setPosts(
        data.map((post) => {
          const myReaction = post.likes?.find(like => String(like.userId?._id || like.userId || like) === String(profile?._id || profile?.id));
          
          return {
            id: post._id,
            authorName: post.userId?.firstName ? `${post.userId.firstName} ${post.userId.lastName}` : (post.userId?.name || post.userId?.username || post.author || 'Anonymous'),
            authorUsername: post.userId?.username || '',
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
              return user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || user?.username || 'Someone');
            }) || [],
            commentsCount: post.comments?.length || 0,
            repostedFrom: post.repostedFrom ? {
            id: post.repostedFrom._id,
            authorName: post.repostedFrom.userId?.firstName ? `${post.repostedFrom.userId.firstName} ${post.repostedFrom.userId.lastName}` : (post.repostedFrom.userId?.name || post.repostedFrom.userId?.username || post.repostedFrom.author || 'Anonymous'),
            authorUsername: post.repostedFrom.userId?.username || '',
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
  }, [token, profile]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="feed">
      <CreatePost onPostCreated={fetchPosts} />
      <FeedSort />

      {posts.length > 0 ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="emptyFeedMessage">No posts yet. Create the first post!</div>
      )}
    </div>
  );
};

export default Feed;