import React, { useState, useEffect } from 'react';
import { FaChevronUp } from 'react-icons/fa';
import './BackToTop.css';

const RADIUS = 18.5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollTop > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const strokeDashoffset = CIRCUMFERENCE - (scrollProgress / 100) * CIRCUMFERENCE;

  return (
    <button
      type="button"
      className={`backToTopFloatingBtn ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg className="backToTopProgressRing" viewBox="0 0 44 44" width="44" height="44">
        {/* Background track */}
        <circle
          className="progressRingBackground"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="3"
          fill="none"
          r={RADIUS}
          cx="22"
          cy="22"
        />
        {/* Animated Progress Ring - Rotated around exact center (22, 22) */}
        <circle
          className="progressRingBar"
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          r={RADIUS}
          cx="22"
          cy="22"
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="backToTopIcon">
        <FaChevronUp />
      </span>
    </button>
  );
};

export default BackToTop;
