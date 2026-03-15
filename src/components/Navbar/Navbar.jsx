import React from "react";
import NavLeft from "./NavLeft";
import NavCenter from "./NavCenter";
import NavRight from "./NavRight";
import "./Navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">

      <NavLeft />

      <NavCenter />

      <NavRight />

    </div>
  );
};

export default Navbar;
