import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";

const NavLeft = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { searchUsers } = useProfile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query) {
        const data = await searchUsers(query);
        setResults(data);
        setIsDropdownVisible(true);
      } else {
        setResults([]);
        setIsDropdownVisible(false);
      }
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query, searchUsers]);

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

  const handleResultClick = (username) => {
    setQuery("");
    setResults([]);
    setIsDropdownVisible(false);
    navigate(`/profile/${username}`);
  };

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
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsDropdownVisible(true)}
        />
        {isDropdownVisible && results.length > 0 && (
          <div className="searchResults">
            <ul>
              {results.map((user) => (
                <li
                  key={user.username}
                  onClick={() => handleResultClick(user.username)}
                >
                  <img
                    src={user.profilePicture?.url || "/favicon.png"}
                    alt={user.username}
                    className="searchResultImage"
                  />
                  <div className="searchResultInfo">
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <small>{user.headline}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavLeft;