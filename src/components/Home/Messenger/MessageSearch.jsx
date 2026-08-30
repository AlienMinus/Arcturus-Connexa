import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaSlidersH, FaCheck } from "react-icons/fa";

const MessageSearch = ({ searchTerm, setSearchTerm, filterMode, setFilterMode }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectFilter = (mode) => {
    if (setFilterMode) setFilterMode(mode);
    setFilterOpen(false);
  };

  return (
    <div className="messageSearchWrapper" ref={filterRef} style={{ position: "relative" }}>
      <div className="messageSearch">
        <FaSearch className="messageSearchIcon" size={13} />
        <input
          type="text"
          className="messageSearchInput"
          placeholder="Search messages"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          className="messageSearchFilterBtn"
          onClick={() => setFilterOpen(!filterOpen)}
          title="Filter conversations"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            color: filterMode && filterMode !== "all" ? "#0a66c2" : "inherit"
          }}
        >
          <FaSlidersH className="messageSearchFilterIcon" size={13} />
        </button>
      </div>

      {filterOpen && (
        <div
          className="messengerFilterDropdown"
          style={{
            position: "absolute",
            top: "100%",
            right: "12px",
            marginTop: "4px",
            background: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e0dfdc)",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            zIndex: 9999,
            minWidth: "160px",
            padding: "4px 0",
            fontSize: "12.5px"
          }}
        >
          <button
            type="button"
            onClick={() => selectFilter("all")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary, #1e293b)",
              textAlign: "left"
            }}
          >
            <span>All Messages</span>
            {(!filterMode || filterMode === "all") && <FaCheck size={10} color="#0a66c2" />}
          </button>

          <button
            type="button"
            onClick={() => selectFilter("unread")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary, #1e293b)",
              textAlign: "left"
            }}
          >
            <span>Unread Only</span>
            {filterMode === "unread" && <FaCheck size={10} color="#0a66c2" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;