import React from "react";
import Sidebar from "../components/Home/Sidebar/Sidebar";
import Feed from "../components/Home/Feed/Feed";
import RightSidebar from "../components/Home/RightSidebar/RightSidebar";
import Messenger from "../components/Home/Messenger/Messenger";
import "./Home.css";

const Home = () => {
  return (
    <div>
      <div className="homeLayout">
        <Sidebar />
        <Feed />
        <RightSidebar />
      </div>

      <Messenger />
    </div>
  );
};

export default Home;
