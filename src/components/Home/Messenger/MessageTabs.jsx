import React from "react";

const MessageTabs = ({ activeTab = "focused", onTabChange }) => {
  return (
    <div className="messageTabs">
      <span
        className={activeTab === "focused" ? "activeTab" : ""}
        onClick={() => onTabChange && onTabChange("focused")}
        role="button"
        tabIndex={0}
      >
        Focused
      </span>
      <span
        className={activeTab === "other" ? "activeTab" : ""}
        onClick={() => onTabChange && onTabChange("other")}
        role="button"
        tabIndex={0}
      >
        Other
      </span>
    </div>
  );
};

export default MessageTabs;