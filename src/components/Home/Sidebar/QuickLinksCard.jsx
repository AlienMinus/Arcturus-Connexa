import React from "react";
import { FaBookmark, FaUsers, FaNewspaper, FaCalendarAlt } from "react-icons/fa";

const QuickLinksCard = () => {
  return (
    <div className="card quickLinks">

      <div className="linkItem">
        <FaBookmark /> Saved items
      </div>

      <div className="linkItem">
        <FaUsers /> Groups
      </div>

      <div className="linkItem">
        <FaNewspaper /> Newsletters
      </div>

      <div className="linkItem">
        <FaCalendarAlt /> Events
      </div>

    </div>
  );
};

export default QuickLinksCard;