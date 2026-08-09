import React from "react";
import Feed from "../../components/Home/Feed/Feed";
import Sidebar from "../../components/Home/Sidebar/Sidebar";
import RightSidebar from "../../components/Home/RightSidebar/RightSidebar";
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
        {/* Sidebar & RightSidebar render in the layout on large screens only.
            On small screens they are hidden and accessible via the hamburger drawer. */}
        {isLargeScreen && <Sidebar />}
        <Feed />
        {isLargeScreen && <RightSidebar />}
      </div>

      {isLargeScreen && <Messenger />}
    </div>
  );
};

export default Home;
