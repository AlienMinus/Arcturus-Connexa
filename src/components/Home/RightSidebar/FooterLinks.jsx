import React from "react";
import { Link } from "react-router-dom";
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
  const footerLink = (to, icon, label) => (
    <Link to={to} className="quickFooterLink">
      {icon} {label}
    </Link>
  );

  return (
    <div className="footerLinks">

      <div className="linksRow">
        {footerLink('/about', <FaInfoCircle />, 'About')}
        {footerLink('/accessibility', <FaWheelchair />, 'Accessibility')}
        {footerLink('/help', <FaQuestionCircle />, 'Help Center')}
      </div>

      <div className="linksRow">
        {footerLink('/settings/privacy', <FaShieldAlt />, 'Privacy & Terms')}
        {footerLink('/ad-choices', <FaUserShield />, 'Ad Choices')}
      </div>

      <div className="linksRow">
        {footerLink('/advertise', <FaAd />, 'Advertising')}
        {footerLink('/learning', <FaBriefcase />, 'Business Services')}
      </div>

      <div className="linksRow">
        {footerLink('/app', <FaMobileAlt />, 'Get the Arcturus app')}
        {footerLink('/more', <FaEllipsisH />, 'More')}
      </div>

      <p className="copyright">
        Arcturus Corporation © 2026
      </p>

    </div>
  );
};

export default FooterLinks;