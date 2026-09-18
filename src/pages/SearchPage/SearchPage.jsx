import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaBuilding, 
  FaUserFriends, 
  FaBriefcase, 
  FaCheckCircle, 
  FaMapMarkerAlt, 
  FaArrowRight, 
  FaExternalLinkAlt 
} from 'react-icons/fa';
import { buildApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getUserFullName } from '../../utils/user';
import './SearchPage.css';

const SearchPage = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('type') || 'all';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    organizations: [],
    jobs: [],
    total: 0,
  });

  const navigate = useNavigate();

  const performSearch = async (queryText, tabType) => {
    if (!queryText.trim()) {
      setResults({ users: [], organizations: [], jobs: [], total: 0 });
      return;
    }

    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        buildApiUrl(`/search?q=${encodeURIComponent(queryText.trim())}&type=${encodeURIComponent(tabType)}`),
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults({ users: [], organizations: [], jobs: [], total: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch search results:', err);
      setResults({ users: [], organizations: [], jobs: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('type') || 'all';
    setSearchInput(q);
    setActiveTab(t);
    performSearch(q, t);
  }, [searchParams]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim(), type: activeTab });
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ q: searchInput.trim(), type: tabKey });
  };

  const { users = [], organizations = [], jobs = [] } = results;

  const showOrganizations = activeTab === 'all' || activeTab === 'organizations';
  const showUsers = activeTab === 'all' || activeTab === 'users';
  const showJobs = activeTab === 'all' || activeTab === 'jobs';

  const totalMatchingItems = users.length + organizations.length + jobs.length;

  return (
    <div className="searchPageWrapper">
      {/* Top Search Card */}
      <div className="searchHeaderCard">
        <h1 className="searchHeaderTitle">
          <FaSearch size={20} color="#0a66c2" />
          Search Results
          {searchInput && (
            <span style={{ fontWeight: 400, color: '#64748b', fontSize: '1rem' }}>
              for "{searchInput}"
            </span>
          )}
        </h1>

        <form className="searchHeaderForm" onSubmit={handleFormSubmit}>
          <div className="searchHeaderInputWrap">
            <FaSearch className="searchHeaderIcon" size={15} />
            <input
              type="text"
              className="searchHeaderInput"
              placeholder="Search companies, people, or jobs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="searchHeaderBtn">
            Search
          </button>
        </form>

        {/* Tab Filters */}
        <div className="searchTabsBar">
          <button
            type="button"
            className={`searchTabBtn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            All <span className="searchTabCount">{totalMatchingItems}</span>
          </button>

          <button
            type="button"
            className={`searchTabBtn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => handleTabChange('organizations')}
          >
            <FaBuilding size={13} />
            Companies & Organizations{' '}
            <span className="searchTabCount">{organizations.length}</span>
          </button>

          <button
            type="button"
            className={`searchTabBtn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <FaUserFriends size={13} />
            People <span className="searchTabCount">{users.length}</span>
          </button>

          <button
            type="button"
            className={`searchTabBtn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => handleTabChange('jobs')}
          >
            <FaBriefcase size={13} />
            Jobs <span className="searchTabCount">{jobs.length}</span>
          </button>
        </div>
      </div>

      {/* Main Results Container */}
      {loading ? (
        <div className="searchZeroState">
          <p>Searching Arcturus network...</p>
        </div>
      ) : !searchInput.trim() ? (
        <div className="searchZeroState">
          <FaSearch size={42} className="searchZeroIcon" />
          <h3>Find People, Organizations, and Career Opportunities</h3>
          <p>Type a keyword above to search across members, verified companies, and job postings.</p>
        </div>
      ) : totalMatchingItems === 0 ? (
        <div className="searchZeroState">
          <FaSearch size={42} className="searchZeroIcon" />
          <h3>No results found for "{searchInput}"</h3>
          <p>Try searching with different keywords, company names, or job titles.</p>
        </div>
      ) : (
        <div className="searchContentArea">
          {/* 1. Organizations Block */}
          {showOrganizations && organizations.length > 0 && (
            <div className="searchResultsBlock">
              <div className="searchResultsBlockTitle">
                <span>Companies & Organizations ({organizations.length})</span>
              </div>

              <div className="searchGrid">
                {organizations.map((org) => (
                  <div key={org._id} className="searchOrgCard">
                    <div className="searchOrgCardTop">
                      {org.logo?.url ? (
                        <img
                          src={org.logo.url}
                          alt={org.name}
                          className="searchOrgCardLogo"
                        />
                      ) : (
                        <div className="searchOrgCardLogoFallback">
                          <FaBuilding size={22} color="#0a66c2" />
                        </div>
                      )}

                      <div className="searchOrgCardMain">
                        <div className="searchOrgCardNameRow">
                          <Link
                            to={`/company/${encodeURIComponent(org.slug || org._id)}`}
                            className="searchOrgCardName"
                          >
                            {org.name}
                          </Link>
                          {org.status === 'approved' && (
                            <span className="searchVerifiedBadge" title="Verified Organization">
                              <FaCheckCircle size={10} /> Verified
                            </span>
                          )}
                        </div>

                        <p className="searchOrgCardTagline">
                          {org.tagline || `${org.industry || 'Company'} · ${org.organizationSize || '11-50'} employees`}
                        </p>

                        <div className="searchOrgCardMeta">
                          <span>
                            <FaMapMarkerAlt size={10} style={{ marginRight: 3 }} />
                            {org.location || 'Headquarters'}
                          </span>
                          {typeof org.activeJobsCount === 'number' && org.activeJobsCount > 0 && (
                            <span className="searchOrgJobsPill">
                              {org.activeJobsCount} Open Job{org.activeJobsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="searchOrgCardBottom">
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {org.industry || 'Business'}
                      </span>
                      <Link
                        to={`/company/${encodeURIComponent(org.slug || org._id)}`}
                        className="searchViewOrgBtn"
                      >
                        View Company <FaArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. People Block */}
          {showUsers && users.length > 0 && (
            <div className="searchResultsBlock">
              <div className="searchResultsBlockTitle">
                <span>People ({users.length})</span>
              </div>

              <div className="searchGrid">
                {users.map((u) => (
                  <div key={u._id || u.username} className="searchUserCard">
                    <img
                      src={u.profilePicture?.url || '/favicon.png'}
                      alt={u.username}
                      className="searchUserCardAvatar"
                    />
                    <div className="searchUserCardInfo">
                      <Link
                        to={`/profile/${encodeURIComponent(u.username)}`}
                        className="searchUserCardName"
                      >
                        {getUserFullName(u)}
                      </Link>
                      <p className="searchUserCardHeadline">
                        {u.headline || 'Member on Arcturus'}
                      </p>
                      {u.location && (
                        <span className="searchUserCardLocation">
                          <FaMapMarkerAlt size={10} style={{ marginRight: 3 }} />
                          {u.location}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/profile/${encodeURIComponent(u.username)}`}
                      className="searchViewOrgBtn"
                      style={{ padding: '6px 12px' }}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Jobs Block */}
          {showJobs && jobs.length > 0 && (
            <div className="searchResultsBlock">
              <div className="searchResultsBlockTitle">
                <span>Jobs ({jobs.length})</span>
              </div>

              <div className="searchGrid">
                {jobs.map((job) => (
                  <div key={job._id} className="searchJobCard">
                    <div>
                      <Link
                        to={`/jobs?q=${encodeURIComponent(job.title)}`}
                        className="searchJobCardTitle"
                      >
                        {job.title}
                      </Link>
                      <div className="searchJobCardCompany">{job.companyName}</div>
                      <div className="searchJobCardMeta">
                        <span>
                          <FaMapMarkerAlt size={10} style={{ marginRight: 3 }} />
                          {job.location}
                        </span>
                        <span>· {job.type}</span>
                        {job.salaryRange && <span>· {job.salaryRange}</span>}
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <Link
                        to={`/jobs?q=${encodeURIComponent(job.title)}`}
                        className="searchViewOrgBtn"
                      >
                        View Position <FaArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

