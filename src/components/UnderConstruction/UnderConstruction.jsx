import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaHardHat, 
  FaTools, 
  FaRocket, 
  FaArrowLeft, 
  FaHome, 
  FaCompass, 
  FaCheckCircle 
} from 'react-icons/fa';
import './UnderConstruction.css';

const DEFAULT_HIGHLIGHTS = [
  'Advanced search and curated opportunity matching',
  'Real-time notifications and status updates',
  'Seamless integration with your Arcturus profile',
  'High-speed responsive experience across all devices',
];

const UnderConstruction = ({
  title = 'This page is under construction',
  subtitle = 'We are working hard to bring you exciting new features, integrations, and opportunities. Stay tuned for upcoming updates!',
  featureName = 'Feature in Progress',
  highlights = DEFAULT_HIGHLIGHTS,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="underConstructionWrapper">
      <div className="underConstructionCard">
        {/* Animated Construction Badge */}
        <div className="constructionBadge">
          <div className="iconGlow"></div>
          <FaHardHat className="hardhatIcon" size={44} />
          <FaTools className="toolsSubIcon" size={20} />
        </div>

        {/* Status Pill */}
        <div className="statusPill">
          <span className="pulsingDot"></span>
          <span>{featureName}</span>
        </div>

        {/* Heading & Description */}
        <h1 className="constructionTitle">{title}</h1>
        <p className="constructionSubtitle">{subtitle}</p>

        {/* Feature Preview Checklist */}
        {highlights && highlights.length > 0 && (
          <div className="highlightsBox">
            <h3>What to expect:</h3>
            <ul className="highlightsList">
              {highlights.map((item, index) => (
                <li key={index}>
                  <FaCheckCircle className="highlightCheck" size={14} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="constructionActions">
          <button 
            type="button" 
            className="actionBtn secondary" 
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={13} />
            <span>Go Back</span>
          </button>

          {showHomeButton && (
            <Link to="/" className="actionBtn primary">
              <FaHome size={14} />
              <span>Back to Home Feed</span>
            </Link>
          )}

          <Link to="/network" className="actionBtn outline">
            <FaCompass size={14} />
            <span>Explore Network</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;

