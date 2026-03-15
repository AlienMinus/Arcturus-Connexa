import React from "react";
import { FaSearch } from "react-icons/fa";

const NavLeft = () => {
  return (
    <div className="navLeft">

      <img
        src="/logo.png"
        className="arcturusLogo"
        alt=""
      />

      <div className="searchBox">

        <span className="searchIcon">
          <FaSearch color="#666" size={14} />
        </span>

        <input
          type="text"
          placeholder="Search"
        />

      </div>

    </div>
  );
};

export default NavLeft;