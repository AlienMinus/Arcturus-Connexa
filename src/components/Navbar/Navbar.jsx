import React, { useState, useEffect } from "react";
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isSmallScreen && isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
    }
  }, [isSmallScreen, isMobileSearchOpen]);

  return (
    <div
      className={`navbar ${isSearchFocused ? "searchFocused" : ""} ${
        isMobileSearchOpen ? "mobileSearchActive" : ""
      }`}
    >
      {isSmallScreen && !isMobileSearchOpen && (
        <button
          className="hamburgerMenu"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <FaBars size={22} color="#666" />
        </button>
      )}

      <NavLeft
        onSearchFocusChange={setIsSearchFocused}
        onMobileSearchChange={setIsMobileSearchOpen}
        isMobileSearchOpen={isMobileSearchOpen}
        isSmallScreen={isSmallScreen}
      />

      <NavCenter />

      <NavRight />

      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default Navbar;
