import React from "react";
import { FaTimes } from "react-icons/fa";
import Sidebar from "../Home/Sidebar/Sidebar";
import RightSidebar from "../Home/RightSidebar/RightSidebar";
import "./Navbar.css";

const MenuDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="menuDrawerOverlay" onClick={onClose}>
      <div className="menuDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="menuDrawerHeader">
          <span>Menu</span>
          <FaTimes onClick={onClose} style={{ cursor: "pointer" }} color="#666" size={20} />
        </div>
        <div className="menuDrawerBody">
          <Sidebar />
          <div className="menuDrawerDivider" />
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default MenuDrawer;
