import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import NavLeft from "./NavLeft";
import NavCenter from "./NavCenter";
import NavRight from "./NavRight";
import MenuDrawer from "./MenuDrawer";
import useMediaQuery from "../../hooks/useMediaQuery";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Hamburger menu is only needed on small screens (where the sidebar
  // and right sidebar are hidden and accessible via the drawer).
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <div className={`navbar ${isSearchFocused ? "searchFocused" : ""}`}>
      {isSmallScreen && (
        <button
          className="hamburgerMenu"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <FaBars size={22} color="#666" />
        </button>
      )}

      <NavLeft onSearchFocusChange={setIsSearchFocused} />

      <NavCenter />

      <NavRight />

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Navbar;
