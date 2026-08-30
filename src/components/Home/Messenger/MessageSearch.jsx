import React from "react";
import { FaSearch, FaSlidersH } from "react-icons/fa";

const MessageSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="messageSearchWrapper">
      <div className="messageSearch">
        <FaSearch className="messageSearchIcon" size={13} />
        <input
          type="text"
          className="messageSearchInput"
          placeholder="Search messages"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSlidersH className="messageSearchFilterIcon" size={13} />
      </div>
    </div>
  );
};

export default MessageSearch;