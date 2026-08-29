import React from "react";
import ArcturusNews from "./ArcturusNews";
import PuzzleGames from "./PuzzleGames";
import AdCard from "./AdCard";
import FooterLinks from "./FooterLinks";
import "./RightSidebar.css";

const RightSidebar = () => {
  return (
    <div className="rightSidebar">

      <ArcturusNews />

      <PuzzleGames />

      <AdCard />

      <FooterLinks />

    </div>
  );
};

export default RightSidebar;