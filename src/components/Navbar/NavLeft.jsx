import React from "react";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const NavLeft = () => {
  return (
    <div className="navLeft">

      <Link to="/">
        <img
          src="/logo.png"
          className="arcturusLogo"
          alt=""
        />
      </Link>

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