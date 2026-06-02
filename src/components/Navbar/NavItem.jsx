import React from "react";
import { NavLink } from "react-router-dom";

const NavItem = ({ icon, label, badge, to }) => {
  return (
    <NavLink to={to} className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>

      <div className="iconWrapper">

        <span className="navIcon">{icon}</span>

        {badge && <span className="badge">{badge}</span>}

      </div>

      <span className="navLabel">{label}</span>

    </NavLink>
  );
};

export default NavItem;