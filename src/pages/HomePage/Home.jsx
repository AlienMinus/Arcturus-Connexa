import React from "react";
import Feed from "../../components/Home/Feed/Feed";
import Messenger from "../../components/Home/Messenger/Messenger";
import "./Home.css";

const Home = () => {
  return (
    <div>
      <div className="homeLayout">
        <Feed />
      </div>

      <Messenger />
    </div>
  );
};

export default Home;
