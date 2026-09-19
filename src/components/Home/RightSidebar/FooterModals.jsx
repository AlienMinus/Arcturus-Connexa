import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTimes,
  FaInfoCircle,
  FaWheelchair,
  FaUserShield,
  FaMobileAlt,
  FaBriefcase,
  FaCheck,
  FaExternalLinkAlt,
  FaGraduationCap,
  FaBookOpen,
  FaBullhorn,
  FaBuilding,
  FaQrcode,
  FaDesktop,
  FaShieldAlt,
  FaLanguage,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { useTheme } from '../../../context/ThemeContext';
import './FooterModals.css';

// 1. ABOUT MODAL
export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard aboutModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaInfoCircle size={20} color="#0a66c2" />
            <h3>About Arcturus Corporation</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <div className="aboutHeroBox">
            <span className="versionBadge">Platform Version 2.4.0 (Enterprise)</span>
            <h4>Connecting Global Talent, Intelligent Careers & Academic Institutions</h4>
            <p>
              Arcturus is the modern professional ecosystem combining social networking,
              verifiable career credentials, enterprise talent acquisition, and AI-driven campus placement solutions.
            </p>
          </div>

          <div className="aboutFeaturesGrid">
            <div className="featureItem">
              <div className="featureIcon"><FaGraduationCap /></div>
              <div>
                <strong>CampusLink AI Engine</strong>
                <p>Real-time placement drive conflict engine, Gemma-3 AI candidate risk diagnosis, and automated offer verification.</p>
              </div>
            </div>

            <div className="featureItem">
              <div className="featureIcon"><FaBriefcase /></div>
              <div>
                <strong>Talent Solutions & Job Tracker</strong>
                <p>Recruiter management portal with applicant screening pipelines, salary benchmarking, and verified institutional badges.</p>
              </div>
            </div>

            <div className="featureItem">
              <div className="featureIcon"><FaShieldAlt /></div>
              <div>
                <strong>Official Verification</strong>
                <p>Cryptographically audited institute badges, document verification workflows, and strict admin approval controls.</p>
              </div>
            </div>

            <div className="featureItem">
              <div className="featureIcon"><FaBuilding /></div>
              <div>
                <strong>Organization Account Switcher</strong>
                <p>1-click identity switching between personal profiles and corporate or institutional brand accounts.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="footerModalFooter">
          <span className="copyrightNote">© 2026 Arcturus Corporation. All rights reserved.</span>
          <button type="button" className="modalPrimaryBtn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. ACCESSIBILITY MODAL
export const AccessibilityModal = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem('arcturus_reduce_motion') === 'true';
  });
  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem('arcturus_large_text') === 'true';
  });

  if (!isOpen) return null;

  const handleToggleMotion = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    localStorage.setItem('arcturus_reduce_motion', String(next));
    document.documentElement.classList.toggle('reduce-motion', next);
  };

  const handleToggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem('arcturus_large_text', String(next));
    document.documentElement.classList.toggle('large-text', next);
  };

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaWheelchair size={20} color="#0a66c2" />
            <h3>Accessibility & Display Preferences</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <p className="modalIntroText">
            Arcturus is built to conform with <strong>WCAG 2.1 Level AA</strong> standards. We are committed
            to providing a barrier-free digital experience for all users regardless of ability.
          </p>

          <div className="a11yOptionsList">
            <div className="a11yOptionRow">
              <div>
                <strong>Dark Mode / High Contrast</strong>
                <p>Optimizes contrast ratios and reduces eye strain in dim environments.</p>
              </div>
              <button type="button" className="a11yToggle" onClick={toggleTheme}>
                {theme === 'dark' ? <FaToggleOn size={30} color="#0a66c2" /> : <FaToggleOff size={30} color="#94a3b8" />}
              </button>
            </div>

            <div className="a11yOptionRow">
              <div>
                <strong>Reduce Animations & Transitions</strong>
                <p>Disables animated banners, sliding drawers, and background pulse effects.</p>
              </div>
              <button type="button" className="a11yToggle" onClick={handleToggleMotion}>
                {reduceMotion ? <FaToggleOn size={30} color="#0a66c2" /> : <FaToggleOff size={30} color="#94a3b8" />}
              </button>
            </div>

            <div className="a11yOptionRow">
              <div>
                <strong>Enhanced Font Readability</strong>
                <p>Increases base font size and improves line-height spacing for content.</p>
              </div>
              <button type="button" className="a11yToggle" onClick={handleToggleLargeText}>
                {largeText ? <FaToggleOn size={30} color="#0a66c2" /> : <FaToggleOff size={30} color="#94a3b8" />}
              </button>
            </div>
          </div>

          <div className="a11yShortcutsBox">
            <strong>Keyboard Navigation Tips:</strong>
            <ul>
              <li><kbd>Tab</kbd> / <kbd>Shift + Tab</kbd> to cycle through interactive controls</li>
              <li><kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons and tabs</li>
              <li><kbd>Esc</kbd> to dismiss open dialogs and popovers</li>
            </ul>
          </div>
        </div>

        <div className="footerModalFooter">
          <Link to="/help" className="learnMoreLink" onClick={onClose}>
            Accessibility Help & Support →
          </Link>
          <button type="button" className="modalPrimaryBtn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. AD CHOICES MODAL
export const AdChoicesModal = ({ isOpen, onClose }) => {
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [sponsoredContent, setSponsoredContent] = useState(true);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaUserShield size={20} color="#0a66c2" />
            <h3>Ad Choices & Commercial Transparency</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <p className="modalIntroText">
            Arcturus respects your commercial privacy. You have full control over how your activity and career interests
            are utilized to show relevant job opportunities and enterprise learning solutions.
          </p>

          <div className="a11yOptionsList">
            <div className="a11yOptionRow">
              <div>
                <strong>Personalized Career & Course Recommendations</strong>
                <p>Use your skills and industry to suggest matching sponsored openings.</p>
              </div>
              <button type="button" className="a11yToggle" onClick={() => setPersonalizedAds(!personalizedAds)}>
                {personalizedAds ? <FaToggleOn size={30} color="#0a66c2" /> : <FaToggleOff size={30} color="#94a3b8" />}
              </button>
            </div>

            <div className="a11yOptionRow">
              <div>
                <strong>Sponsored Updates in Main Feed</strong>
                <p>Show relevant partner announcements and university recruitment notices.</p>
              </div>
              <button type="button" className="a11yToggle" onClick={() => setSponsoredContent(!sponsoredContent)}>
                {sponsoredContent ? <FaToggleOn size={30} color="#0a66c2" /> : <FaToggleOff size={30} color="#94a3b8" />}
              </button>
            </div>
          </div>

          <div className="adTransparencyBox">
            <p>
              Looking to promote your open roles or brand? Explore the{' '}
              <Link to="/advertise" onClick={onClose} style={{ color: '#0a66c2', fontWeight: 700 }}>
                Arcturus Advertising Portal
              </Link>{' '}
              for enterprise reach and transparent ROI analytics.
            </p>
          </div>
        </div>

        <div className="footerModalFooter">
          <Link to="/settings/privacy" className="learnMoreLink" onClick={onClose}>
            Full Privacy & Visibility Settings →
          </Link>
          <button type="button" className="modalPrimaryBtn" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. GET THE ARCTURUS APP MODAL
export const AppDownloadModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard appModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaMobileAlt size={20} color="#0a66c2" />
            <h3>Get the Arcturus App</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <div className="appPromoHeader">
            <h4>Work, Network & Hire From Any Device</h4>
            <p>
              Install the official Arcturus Progressive Web App (PWA) on iOS, Android, macOS, or Windows for instant notifications and offline mode.
            </p>
          </div>

          <div className="appInstallGrid">
            <div className="appPlatformCard">
              <div className="appIconCircle"><FaMobileAlt size={24} /></div>
              <strong>Mobile Installation (iOS / Android)</strong>
              <p>Open Arcturus in Safari or Chrome, tap <strong>Share</strong> or <strong>Options (⋮)</strong>, and choose <strong>"Add to Home Screen"</strong>.</p>
              <span className="installBadge">Instant Install • No App Store Needed</span>
            </div>

            <div className="appPlatformCard">
              <div className="appIconCircle"><FaDesktop size={24} /></div>
              <strong>Desktop App (Windows / macOS)</strong>
              <p>Click the install icon in your browser address bar to run Arcturus as a standalone desktop window with native keyboard shortcuts.</p>
              <span className="installBadge">Fast & Lightweight (0 MB overhead)</span>
            </div>
          </div>

          <div className="appSyncBanner">
            <FaCheck color="#16a34a" size={16} />
            <span>Real-time cloud sync ensures your chats, drives, and job applications update seamlessly across all devices.</span>
          </div>
        </div>

        <div className="footerModalFooter">
          <span className="copyrightNote">Compatible with Chrome, Safari, Edge & Firefox</span>
          <button type="button" className="modalPrimaryBtn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. BUSINESS SERVICES MODAL / POPOVER
export const BusinessServicesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard businessModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaBriefcase size={20} color="#0a66c2" />
            <h3>Arcturus Business Solutions</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <p className="modalIntroText">
            Enterprise platforms designed to accelerate recruitment, upskill employees, and manage university talent pipelines.
          </p>

          <div className="businessServicesGrid">
            <Link to="/jobs/manage" className="businessServiceTile" onClick={onClose}>
              <div className="tileIcon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <FaBriefcase size={22} />
              </div>
              <div className="tileText">
                <strong>Talent Solutions</strong>
                <span>Publish job openings, track candidate applicants, and manage recruitment.</span>
              </div>
              <FaExternalLinkAlt size={12} className="tileArrow" />
            </Link>

            <Link to="/campuslink" className="businessServiceTile" onClick={onClose}>
              <div className="tileIcon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <FaGraduationCap size={22} />
              </div>
              <div className="tileText">
                <strong>CampusLink Platform</strong>
                <span>University placement drives, AI conflict detection, and student readiness.</span>
              </div>
              <FaExternalLinkAlt size={12} className="tileArrow" />
            </Link>

            <Link to="/advertise" className="businessServiceTile" onClick={onClose}>
              <div className="tileIcon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <FaBullhorn size={22} />
              </div>
              <div className="tileText">
                <strong>Advertise Portal</strong>
                <span>Launch targeted sponsored campaigns reaching verified professionals.</span>
              </div>
              <FaExternalLinkAlt size={12} className="tileArrow" />
            </Link>

            <Link to="/learning" className="businessServiceTile" onClick={onClose}>
              <div className="tileIcon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <FaBookOpen size={22} />
              </div>
              <div className="tileText">
                <strong>Learning & Certifications</strong>
                <span>Certified curriculum to upskill engineering and leadership talent.</span>
              </div>
              <FaExternalLinkAlt size={12} className="tileArrow" />
            </Link>

            <Link to="/company/create" className="businessServiceTile createOrgTile" onClick={onClose}>
              <div className="tileIcon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FaBuilding size={22} />
              </div>
              <div className="tileText">
                <strong>Create Company / Institution Page</strong>
                <span>Establish an official verified presence and link employee accounts.</span>
              </div>
              <FaExternalLinkAlt size={12} className="tileArrow" />
            </Link>
          </div>
        </div>

        <div className="footerModalFooter">
          <Link to="/help" className="learnMoreLink" onClick={onClose}>
            Explore Business FAQs & Documentation →
          </Link>
          <button type="button" className="modalPrimaryBtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. MORE POPOVER MODAL
export const MoreModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="footerModalOverlay" onClick={onClose}>
      <div className="footerModalCard moreModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="footerModalHeader">
          <div className="modalHeaderTitle">
            <FaShieldAlt size={20} color="#0a66c2" />
            <h3>More Arcturus Resources</h3>
          </div>
          <button type="button" className="closeModalBtn" onClick={onClose} aria-label="Close modal">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="footerModalBody">
          <div className="moreLinksList">
            <Link to="/settings/language" className="moreLinkItem" onClick={onClose}>
              <FaLanguage size={18} color="#0a66c2" />
              <div>
                <strong>Language & Region Settings</strong>
                <span>Change interface language, locale, and content preferences</span>
              </div>
            </Link>

            <Link to="/settings/verification" className="moreLinkItem" onClick={onClose}>
              <FaShieldAlt size={18} color="#16a34a" />
              <div>
                <strong>Account Verification & Badges</strong>
                <span>Apply for blue check verification or link university badge</span>
              </div>
            </Link>

            <Link to="/settings/applications" className="moreLinkItem" onClick={onClose}>
              <FaBriefcase size={18} color="#7c3aed" />
              <div>
                <strong>Job Applications Tracker</strong>
                <span>View status of all active job applications and interviews</span>
              </div>
            </Link>

            <Link to="/settings/accounts" className="moreLinkItem" onClick={onClose}>
              <FaBuilding size={18} color="#2563eb" />
              <div>
                <strong>Accounts & Organizations Hub</strong>
                <span>Switch between personal profile and organization accounts</span>
              </div>
            </Link>

            <Link to="/help" className="moreLinkItem" onClick={onClose}>
              <FaInfoCircle size={18} color="#0284c7" />
              <div>
                <strong>Help Center & Support Desk</strong>
                <span>Browse guides, tutorials, or submit a support ticket</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="footerModalFooter">
          <span className="copyrightNote">Arcturus Corporation • Build 2026</span>
          <button type="button" className="modalPrimaryBtn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

