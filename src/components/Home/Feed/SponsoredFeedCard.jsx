import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaExternalLinkAlt, FaEllipsisH, FaBullhorn, FaInfoCircle } from "react-icons/fa";
import { buildApiUrl } from "../../../utils/api";
import "./SponsoredFeedCard.css";

const SponsoredFeedCard = () => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchFeedAd = async () => {
      try {
        const res = await fetch(buildApiUrl('/ads/active?placement=feed&limit=1'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ads && data.ads.length > 0) {
            setAd(data.ads[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load active feed ad:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeedAd();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCtaClick = async (e) => {
    e?.stopPropagation();
    if (!ad) return;

    // Fire click tracking
    try {
      fetch(buildApiUrl(`/ads/${ad._id}/click`), { method: 'POST' }).catch(() => {});
    } catch (e) {}

    const dest = ad.destinationUrl || '/jobs';
    if (dest.startsWith('http://') || dest.startsWith('https://')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
    } else {
      navigate(dest);
    }
  };

  if (loading || !ad) {
    return null;
  }

  return (
    <div className="card postCard sponsoredFeedCard">
      {/* Sponsored Header */}
      <div className="sponsoredFeedHeader">
        <div className="sponsoredOrgMeta">
          <img
            src={ad.organizationLogo || "https://cdn-icons-png.flaticon.com/512/5968/5968705.png"}
            alt={ad.organizationName}
            className="sponsoredOrgLogo"
            onError={(e) => {
              e.target.src = "https://cdn-icons-png.flaticon.com/512/5968/5968705.png";
            }}
          />
          <div className="sponsoredOrgInfo">
            <div className="sponsoredOrgNameRow">
              <span className="sponsoredOrgName">{ad.organizationName}</span>
              <FaCheckCircle size={12} color="#166534" title="Verified Organization" />
            </div>
            <div className="sponsoredTagline">
              <span>Promoted</span>
              {ad.targetIndustry && (
                <>
                  <span className="sponsoredDot">•</span>
                  <span>{ad.targetIndustry}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sponsoredMenuWrapper">
          <button
            type="button"
            className="sponsoredMenuBtn"
            onClick={() => setShowMenu(!showMenu)}
            title="Ad options"
            aria-label="Ad options"
          >
            <FaEllipsisH size={14} />
          </button>

          {showMenu && (
            <div className="sponsoredDropdown">
              <Link to="/advertise" className="sponsoredDropdownItem">
                <FaBullhorn size={13} /> Manage Campaigns
              </Link>
              <Link to="/settings/privacy" className="sponsoredDropdownItem">
                <FaInfoCircle size={13} /> Why am I seeing this ad?
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Ad Body Text / Description */}
      {ad.description && (
        <div className="sponsoredFeedBody">
          <p>{ad.description}</p>
        </div>
      )}

      {/* Ad Media Banner (if provided) */}
      {ad.mediaUrl && (
        <div className="sponsoredMediaContainer" onClick={handleCtaClick}>
          <img
            src={ad.mediaUrl}
            alt={ad.headline || "Campaign promotion"}
            className="sponsoredMediaImg"
          />
        </div>
      )}

      {/* Headline & CTA Action Bar */}
      <div className="sponsoredFeedFooter" onClick={handleCtaClick}>
        <div className="sponsoredHeadlineCol">
          <h4 className="sponsoredHeadline">{ad.headline || ad.name}</h4>
          {ad.destinationUrl && (
            <span className="sponsoredDomain">
              {ad.destinationUrl.replace(/^https?:\/\//i, '').split('/')[0]}
            </span>
          )}
        </div>
        <button
          type="button"
          className="sponsoredCtaButton"
          onClick={handleCtaClick}
        >
          {ad.callToAction || "Learn More"}
          <FaExternalLinkAlt size={11} style={{ marginLeft: 6 }} />
        </button>
      </div>
    </div>
  );
};

export default SponsoredFeedCard;

