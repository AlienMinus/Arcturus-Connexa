import React, { useEffect, useState, useCallback } from "react";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { useProfile } from "../../../context/ProfileContext";
import { useAuth } from "../../../context/AuthContext";
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

      const response = await fetch('/api/posts', { headers });
      const data = await response.json();
      setPosts(
        data.map((post) => ({
          id: post._id,
          authorName: post.author || 'Anonymous',
          authorHeadline: post.userId?.headline || 'Member',
          time: (
            <>
              {new Date(post.createdAt).toLocaleString()} • <GiEarthAsiaOceania />
            </>
          ),
          avatar: post.userId?.profilePicture?.url || null,
          content: post.content || '',
          image: post.media?.[0]?.url,
        }))
      );
    } catch (error) {
      console.error('Failed to load posts', error);
      setPosts([]);
    }
  }, [token]);

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