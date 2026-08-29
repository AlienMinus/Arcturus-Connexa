import React, { useState, useEffect } from "react";
import { IoNewspaperSharp } from "react-icons/io5";
import { FaChevronDown, FaChevronUp, FaSyncAlt } from "react-icons/fa";
import { buildApiUrl } from "../../../utils/api";

const getTimeAgo = (timestamp) => {
  if (!timestamp) return "Recent";
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ArcturusNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchLiveNewsFromInternet = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Try to fetch from local/configured backend /api/news
      try {
        const res = await fetch(buildApiUrl('/news'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setNews(data);
            setLoading(false);
            return;
          }
        }
      } catch (backendErr) {
        console.warn("Backend /news unavailable, fetching directly from web API:", backendErr.message);
      }

      // 2. Fetch directly from Hacker News public API (CORS enabled)
      const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=15&orderBy=\"$key\"");
      if (topRes.ok) {
        const topIds = await topRes.json();
        if (Array.isArray(topIds) && topIds.length > 0) {
          const storyPromises = topIds.slice(0, 12).map(async (id) => {
            try {
              const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
              if (!itemRes.ok) return null;
              return await itemRes.json();
            } catch {
              return null;
            }
          });

          const rawStories = (await Promise.all(storyPromises)).filter(Boolean);
          const formatted = rawStories
            .filter((s) => s.title && s.type === "story")
            .map((s) => {
              let domain = "Tech News";
              if (s.url) {
                try {
                  domain = new URL(s.url).hostname.replace(/^www\./, "");
                } catch {}
              }
              return {
                id: s.id,
                title: s.title,
                url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
                timeAgo: getTimeAgo(s.time),
                readers: `${((s.score || 10) * 19 + 80).toLocaleString()} readers`,
                source: domain,
              };
            });

          if (formatted.length > 0) {
            setNews(formatted);
            setLoading(false);
            return;
          }
        }
      }

      // 3. Secondary direct web source: Dev.to top articles API (CORS enabled)
      const devToRes = await fetch("https://dev.to/api/articles?per_page=10&top=1");
      if (devToRes.ok) {
        const devToData = await devToRes.json();
        if (Array.isArray(devToData) && devToData.length > 0) {
          const formatted = devToData.map((a) => ({
            id: a.id,
            title: a.title,
            url: a.url,
            timeAgo: a.readable_publish_date || "Recent",
            readers: `${(a.positive_reactions_count * 15 + 150).toLocaleString()} readers`,
            source: "dev.to",
          }));
          setNews(formatted);
          setLoading(false);
          return;
        }
      }

      throw new Error("Unable to reach news feeds");
    } catch (err) {
      console.error("Failed to fetch live internet news:", err);
      setError("Unable to load live stories from the internet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNewsFromInternet();
  }, []);

  const displayedNews = expanded ? news.slice(0, 10) : news.slice(0, 5);

  return (
    <div className="card newsCard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#191919" }}>Arcturus News</h3>
        <button
          type="button"
          onClick={fetchLiveNewsFromInternet}
          title="Refresh live news"
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FaSyncAlt size={12} className={loading ? "spinAnimation" : ""} />
        </button>
      </div>

      <p className="subTitle" style={{ margin: "2px 0 10px 0", fontSize: "12px", color: "#64748b" }}>Top stories</p>

      {loading && (
        <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "3px", background: "#e2e8f0", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "13px", background: "#e2e8f0", borderRadius: "4px", width: "90%", marginBottom: "5px" }} />
                <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "3px", width: "45%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && news.length === 0 && (
        <div style={{ padding: "12px 0", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
          <p style={{ margin: "0 0 8px 0" }}>{error}</p>
          <button
            type="button"
            onClick={fetchLiveNewsFromInternet}
            style={{
              background: "#0a66c2",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && news.length > 0 && (
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {displayedNews.map((item, index) => (
            <li 
              key={item.id || index} 
              style={{ 
                padding: "7px 0",
                borderBottom: index < displayedNews.length - 1 ? "1px solid #f1f5f9" : "none" 
              }}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <IoNewspaperSharp 
                  size={16} 
                  style={{ 
                    marginTop: "3px", 
                    color: "#0a66c2", 
                    flexShrink: 0 
                  }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div 
                    style={{ 
                      fontSize: "13.5px", 
                      fontWeight: "600", 
                      color: "#1e293b",
                      lineHeight: "1.35",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                    className="newsTitleText"
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px", display: "flex", gap: "6px", alignItems: "center" }}>
                    <span>{item.timeAgo || "Recent"}</span>
                    <span>•</span>
                    <span>{item.readers || item.source || "Tech"}</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!loading && news.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="showMore"
          style={{
            background: "none",
            border: "none",
            padding: "8px 0 0 0",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#0a66c2",
            cursor: "pointer",
          }}
        >
          <span>{expanded ? "Show less" : "Show more"}</span>
          {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
        </button>
      )}
    </div>
  );
};

export default ArcturusNews;
