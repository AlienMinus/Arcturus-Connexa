import React, { useState } from "react";
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
import {
  AboutModal,
  AccessibilityModal,
  AdChoicesModal,
  AppDownloadModal,
  BusinessServicesModal,
  MoreModal,
} from "./FooterModals";

const FooterLinks = () => {
  const [activeModal, setActiveModal] = useState(null);

  const closeModal = () => setActiveModal(null);

  return (
    <div className="footerLinks">
      <div className="linksRow">
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("about")}
          title="About Arcturus Platform"
        >
          <FaInfoCircle /> About
        </button>
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("a11y")}
          title="Accessibility & Display Settings"
        >
          <FaWheelchair /> Accessibility
        </button>
        <Link to="/help" className="quickFooterLink" title="Arcturus Help Center & FAQs">
          <FaQuestionCircle /> Help Center
        </Link>
      </div>

      <div className="linksRow">
        <Link to="/settings/privacy" className="quickFooterLink" title="Privacy, Visibility & Terms">
          <FaShieldAlt /> Privacy & Terms
        </Link>
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("adchoices")}
          title="Ad Choices & Commercial Transparency"
        >
          <FaUserShield /> Ad Choices
        </button>
      </div>

      <div className="linksRow">
        <Link to="/advertise" className="quickFooterLink" title="Arcturus Advertising Portal">
          <FaAd /> Advertising
        </Link>
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("business")}
          title="Business Services & Enterprise Solutions"
        >
          <FaBriefcase /> Business Services
        </button>
      </div>

      <div className="linksRow">
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("app")}
          title="Install the Arcturus App on Mobile & Desktop"
        >
          <FaMobileAlt /> Get the Arcturus app
        </button>
        <button
          type="button"
          className="quickFooterBtn"
          onClick={() => setActiveModal("more")}
          title="More Resources & Settings"
        >
          <FaEllipsisH /> More
        </button>
      </div>

      <p 
        className="copyright" 
        onClick={() => setActiveModal("about")} 
        style={{ cursor: "pointer" }}
        title="Click to view Arcturus Platform Info"
      >
        Arcturus Corporation © 2026
      </p>

      {/* Interactive Modals */}
      <AboutModal isOpen={activeModal === "about"} onClose={closeModal} />
      <AccessibilityModal isOpen={activeModal === "a11y"} onClose={closeModal} />
      <AdChoicesModal isOpen={activeModal === "adchoices"} onClose={closeModal} />
      <AppDownloadModal isOpen={activeModal === "app"} onClose={closeModal} />
      <BusinessServicesModal isOpen={activeModal === "business"} onClose={closeModal} />
      <MoreModal isOpen={activeModal === "more"} onClose={closeModal} />
    </div>
  );
};

export default FooterLinks;