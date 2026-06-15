import React from "react";
import { FaSearch, FaSlidersH } from "react-icons/fa";

const MessageSearch = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="messageSearch" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px" }}>

      <FaSearch color="#666" size={14} />

      <input
        type="text"
        placeholder="Search messages"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ border: "none", outline: "none", flex: 1, background: "transparent", padding: "8px 0" }}
      />

      <FaSlidersH color="#666" size={14} style={{ cursor: "pointer" }} />

    </div>
  );
};

export default MessageSearch;