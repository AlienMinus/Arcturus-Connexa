import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCompass, FaArrowLeft, FaQuestionCircle } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notFoundWrapper">
      <div className="notFoundCard">
        <div className="notFoundBadge">
          <FaQuestionCircle size={40} />
        </div>

        <span className="notFoundCode">Error 404</span>
        <h1 className="notFoundTitle">Page not found</h1>
        <p className="notFoundSubtitle">
          Uh oh, we can't seem to find the page you're looking for. It may have been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="notFoundActions">
          <button
            type="button"
            className="notFoundBtn secondary"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={12} />
            <span>Go Back</span>
          </button>

          <Link to="/" className="notFoundBtn primary">
            <FaHome size={14} />
            <span>Return to Home Feed</span>
          </Link>

          <Link to="/network" className="notFoundBtn outline">
            <FaCompass size={14} />
            <span>My Network</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;