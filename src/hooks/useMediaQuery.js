import { useState, useEffect } from "react";

/**
 * useMediaQuery
 * Reusable hook to subscribe to a CSS media query and return whether it matches.
 * @param {string} query - CSS media query string, e.g. "(min-width: 769px)"
 * @returns {boolean} - true when the query currently matches
 */
const useMediaQuery = (query) => {
  const getMatches = () => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQueryList.matches);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Listen for changes
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
