import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import NavLeft from "./NavLeft";
import NavCenter from "./NavCenter";
import NavRight from "./NavRight";
import MenuDrawer from "./MenuDrawer";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar">
      <button
        className="hamburgerMenu"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
      >
        <FaBars size={22} color="#666" />
      </button>

      <NavLeft />

      <NavCenter />

      <NavRight />

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Navbar;
