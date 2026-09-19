import React from "react";
import ProfileCard from "./ProfileCard";
import AnalyticsCard from "./AnalyticsCard";
import CompanyCard from "./CompanyCard";
import QuickLinksCard from "./QuickLinksCard";
import SidebarAd from "./SidebarAd";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">

      <ProfileCard />

      <AnalyticsCard />

      <CompanyCard />

      <QuickLinksCard />

      <SidebarAd />

    </div>
  );
};

export default Sidebar;