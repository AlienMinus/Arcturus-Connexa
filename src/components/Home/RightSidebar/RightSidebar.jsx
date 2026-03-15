import React from "react";
import LinkedInNews from "./LinkedInNews";
import PuzzleGames from "./PuzzleGames";
import AdCard from "./AdCard";
import FooterLinks from "./FooterLinks";
import "./RightSidebar.css";

const RightSidebar = () => {
  return (
    <div className="rightSidebar">

      <LinkedInNews />

      <PuzzleGames />

      <AdCard />

      <FooterLinks />

    </div>
  );
};

export default RightSidebar;