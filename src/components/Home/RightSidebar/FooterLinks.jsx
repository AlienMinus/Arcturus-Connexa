import React from "react";
import {
  FaInfoCircle,
  FaWheelchair,
  FaQuestionCircle,
  FaShieldAlt,
  FaUserShield,
  FaAd,
  FaBriefcase,
  FaMobileAlt,
  FaEllipsisH,
} from "react-icons/fa";

const FooterLinks = () => {
  return (
    <div className="footerLinks">

      <div className="linksRow">
        <span>
          <FaInfoCircle /> About
        </span>
        <span>
          <FaWheelchair /> Accessibility
        </span>
        <span>
          <FaQuestionCircle /> Help Center
        </span>
      </div>

      <div className="linksRow">
        <span>
          <FaShieldAlt /> Privacy & Terms
        </span>
        <span>
          <FaUserShield /> Ad Choices
        </span>
      </div>

      <div className="linksRow">
        <span>
          <FaAd /> Advertising
        </span>
        <span>
          <FaBriefcase /> Business Services
        </span>
      </div>

      <div className="linksRow">
        <span>
          <FaMobileAlt /> Get the LinkedIn app
        </span>
        <span>
          <FaEllipsisH /> More
        </span>
      </div>

      <p className="copyright">
        LinkedIn Corporation © 2026
      </p>

    </div>
  );
};

export default FooterLinks;