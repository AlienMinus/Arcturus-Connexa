import React from "react";
import Feed from "../../components/Home/Feed/Feed";
import Messenger from "../../components/Home/Messenger/Messenger";
import useMediaQuery from "../../hooks/useMediaQuery";
import "./Home.css";

const Home = () => {
  // Messenger is only shown on large screens (>=769px).
  // On small screens it's available via the dedicated Messaging page.
  const isLargeScreen = useMediaQuery("(min-width: 769px)");

  return (
    <div>
      <div className="homeLayout">
        <Feed />
      </div>

      {isLargeScreen && <Messenger />}
    </div>
  );
};

export default Home;
