import React from "react";

const NavItem = ({ icon, label, badge, active }) => {
  return (
    <div className={`navItem ${active ? "active" : ""}`}>

      <div className="iconWrapper">

        <span className="navIcon">{icon}</span>

        {badge && <span className="badge">{badge}</span>}

      </div>

      <span className="navLabel">{label}</span>

    </div>
  );
};

export default NavItem;