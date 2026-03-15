import React from "react";
import { GiEarthAsiaOceania } from "react-icons/gi";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import FeedSort from "./FeedSort";
import "./Feed.css";

const Feed = () => {
  // Array of mock post objects
  const mockPosts = [
    {
      id: 1,
      authorName: "John Doe",
      authorHeadline: "Senior Software Engineer at Tech Corp",
      time: (
        <>
          1h • <GiEarthAsiaOceania />
        </>
      ),
      avatar: "https://i.pravatar.cc/150?u=1",
      content: "Just deployed a massive update to our main application! The performance improvements are incredible. 🚀 #webdev #reactjs",
      image: "https://picsum.photos/600/400?random=1",
    },
    {
      id: 2,
      authorName: "Jane Smith",
      authorHeadline: "Product Designer | UI/UX",
      time: (
        <>
          3h • <GiEarthAsiaOceania />
        </>
      ),
      avatar: "https://i.pravatar.cc/150?u=5",
      content: "Exploring the new design trends for 2026. Minimalist interfaces and micro-interactions are here to stay! ✨",
      image: "https://picsum.photos/600/400?random=2",
    },
  ];

  return (
    <div className="feed">

      <CreatePost />
      <FeedSort />

      {mockPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

    </div>
  );
};

export default Feed;