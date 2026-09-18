import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaBuilding, FaCheckCircle, FaBriefcase, FaArrowRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { buildApiUrl } from "../../utils/api";
import { getUserFullName } from "../../utils/user";

const NavLeft = ({ onSearchFocusChange }) => {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [orgResults, setOrgResults] = useState([]);
  const [jobResults, setJobResults] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setUserResults([]);
      setOrgResults([]);
      setJobResults([]);
      setIsDropdownVisible(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(
          buildApiUrl(`/search?q=${encodeURIComponent(query.trim())}`),
          { headers }
        );

        if (res.ok) {
          const data = await res.json();
          setUserResults(data.users || []);
          setOrgResults(data.organizations || []);
          setJobResults(data.jobs || []);
          setIsDropdownVisible(true);
        } else {
          setUserResults([]);
          setOrgResults([]);
          setJobResults([]);
        }
      } catch (err) {
        console.error("Search query error:", err);
      } finally {
        setLoading(false);
      }
    }, 280); // 280ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeDropdown = () => {
    setIsDropdownVisible(false);
  };

  const handleUserClick = (username) => {
    closeDropdown();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const handleOrgClick = (idOrSlug) => {
    closeDropdown();
    navigate(`/company/${encodeURIComponent(idOrSlug)}`);
  };

  const handleJobClick = (jobTitle) => {
    closeDropdown();
    navigate(`/jobs?q=${encodeURIComponent(jobTitle)}`);
  };

  const handleSeeAll = () => {
    if (!query.trim()) return;
    closeDropdown();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSeeAll();
    }
  };

  const hasAnyResults =
    userResults.length > 0 || orgResults.length > 0 || jobResults.length > 0;

  return (
    <div className="navLeft" ref={searchRef}>
      <Link to="/">
        <img src="/logo.png" className="arcturusLogo" alt="Arcturus" />
      </Link>
      <div className="searchBox">
        <span className="searchIcon">
          <FaSearch color="#666" size={14} />
        </span>
        <input
          type="text"
          placeholder="Search people, companies, jobs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            onSearchFocusChange?.(true);
            if (query.trim()) setIsDropdownVisible(true);
          }}
          onBlur={() => onSearchFocusChange?.(false)}
        />

        {isDropdownVisible && (
          <div className="searchResults">
            {loading && !hasAnyResults ? (
              <div className="searchLoadingState">Searching...</div>
            ) : hasAnyResults ? (
              <div className="searchResultsContainer">
                {/* 1. Companies & Organizations Section */}
                {orgResults.length > 0 && (
                  <div className="searchSection">
                    <div className="searchSectionHeader">
                      <FaBuilding size={12} className="searchSectionIcon" />
                      <span>Companies & Organizations</span>
                    </div>
                    <ul className="searchSectionList">
                      {orgResults.slice(0, 4).map((org) => (
                        <li
                          key={org._id}
                          className="searchResultItem searchOrgItem"
                          onClick={() => handleOrgClick(org.slug || org._id)}
                        >
                          {org.logo?.url ? (
                            <img
                              src={org.logo.url}
                              alt={org.name}
                              className="searchOrgLogo"
                            />
                          ) : (
                            <div className="searchOrgLogoFallback">
                              <FaBuilding size={16} color="#0a66c2" />
                            </div>
                          )}
                          <div className="searchResultInfo">
                            <div className="searchOrgTitleRow">
                              <span className="searchOrgName">{org.name}</span>
                              {org.status === "approved" && (
                                <span
                                  className="searchVerifiedBadge"
                                  title="Verified Organization"
                                >
                                  <FaCheckCircle size={10} /> Verified
                                </span>
                              )}
                            </div>
                            <small className="searchOrgMeta">
                              {org.industry || "Company"} · {org.location || "Global"}
                              {typeof org.activeJobsCount === "number" &&
                                org.activeJobsCount > 0 && (
                                  <span className="searchOrgJobsPill">
                                    {org.activeJobsCount} active job
                                    {org.activeJobsCount > 1 ? "s" : ""}
                                  </span>
                                )}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. People Section */}
                {userResults.length > 0 && (
                  <div className="searchSection">
                    <div className="searchSectionHeader">
                      <span>People</span>
                    </div>
                    <ul className="searchSectionList">
                      {userResults.slice(0, 4).map((user) => (
                        <li
                          key={user.username || user._id}
                          className="searchResultItem"
                          onClick={() => handleUserClick(user.username)}
                        >
                          <img
                            src={user.profilePicture?.url || "/favicon.png"}
                            alt={user.username}
                            className="searchResultImage"
                          />
                          <div className="searchResultInfo">
                            <span className="searchUserName">
                              {getUserFullName(user)}
                            </span>
                            <small className="searchUserHeadline">
                              {user.headline || user.location || "Member"}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Jobs Section */}
                {jobResults.length > 0 && (
                  <div className="searchSection">
                    <div className="searchSectionHeader">
                      <FaBriefcase size={12} className="searchSectionIcon" />
                      <span>Jobs</span>
                    </div>
                    <ul className="searchSectionList">
                      {jobResults.slice(0, 3).map((job) => (
                        <li
                          key={job._id}
                          className="searchResultItem searchJobItem"
                          onClick={() => handleJobClick(job.title)}
                        >
                          <div className="searchJobIconBox">
                            <FaBriefcase size={14} color="#0a66c2" />
                          </div>
                          <div className="searchResultInfo">
                            <span className="searchJobTitle">{job.title}</span>
                            <small className="searchJobMeta">
                              {job.companyName} · {job.location} ({job.type})
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Action: See all results */}
                <div className="searchSeeAllFooter" onClick={handleSeeAll}>
                  <span>See all results for "{query}"</span>
                  <FaArrowRight size={11} />
                </div>
              </div>
            ) : (
              <div className="searchEmptyState">
                No matching people, companies, or jobs found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NavLeft;
