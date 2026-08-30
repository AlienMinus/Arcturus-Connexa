import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaHardHat, 
  FaTools, 
  FaArrowLeft, 
  FaHome, 
  FaUserFriends, 
  FaCheckCircle 
} from 'react-icons/fa';
import './UnderConstruction.css';

const DEFAULT_HIGHLIGHTS = [
  'Personalized opportunities & smart recommendations',
  'Direct messaging with hiring managers',
  '1-Click Easy Apply with your Arcturus profile',
];

const UnderConstruction = ({
  title = 'This page is under construction',
  subtitle = "We're crafting an intelligent experience to bring you new tools and opportunities. Check back soon!",
  featureName = 'Coming Soon',
  highlights = DEFAULT_HIGHLIGHTS,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="underConstructionWrapper">
      <div className="underConstructionCard">
        {/* Sleek Icon Badge */}
        <div className="constructionBadge">
          <div className="iconGlow"></div>
          <FaHardHat className="hardhatIcon" size={36} />
          <FaTools className="toolsSubIcon" size={14} />
        </div>

        {/* Feature Status Pill */}
        <div className="statusPill">
          <span className="pulsingDot"></span>
          <span>{featureName}</span>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="constructionTitle">{title}</h1>
        <p className="constructionSubtitle">{subtitle}</p>

        {/* Feature Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="highlightsBox">
            <h3>Upcoming Features:</h3>
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

        {/* Action Controls */}
        <div className="constructionActions">
          <button 
            type="button" 
            className="actionBtn secondary" 
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={12} />
            <span>Go Back</span>
          </button>

          {showHomeButton && (
            <Link to="/" className="actionBtn primary">
              <FaHome size={13} />
              <span>Home Feed</span>
            </Link>
          )}

          <Link to="/network" className="actionBtn outline">
            <FaUserFriends size={13} />
            <span>My Network</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
