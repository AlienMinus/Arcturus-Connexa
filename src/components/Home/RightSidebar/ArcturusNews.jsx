import React, { useState, useEffect } from "react";
import { IoNewspaperSharp } from "react-icons/io5";
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from "react-icons/fa";
import { buildApiUrl } from "../../../utils/api";

const ArcturusNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchNews = async () => {
      try {
        const res = await fetch(buildApiUrl('/news'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setNews(data);
          }
        }
      } catch (err) {
        console.warn("News fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedNews = expanded ? news.slice(0, 10) : news.slice(0, 5);

  return (
    <div className="card newsCard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#191919" }}>Arcturus News</h3>
      </div>

      <p className="subTitle" style={{ margin: "2px 0 10px 0", fontSize: "12px", color: "#64748b" }}>Top stories</p>

      {loading ? (
        <div style={{ padding: "12px 0", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
          Loading top stories...
        </div>
      ) : (
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

      {news.length > 5 && (
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
