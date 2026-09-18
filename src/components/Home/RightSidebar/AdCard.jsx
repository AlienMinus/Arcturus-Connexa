import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBullhorn, FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { buildApiUrl } from "../../../utils/api";

const AdCard = () => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchActiveAd = async () => {
      try {
        const res = await fetch(buildApiUrl('/ads/active?placement=sidebar&limit=1'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ads && data.ads.length > 0) {
            setAd(data.ads[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load active sidebar ad:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActiveAd();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCtaClick = async () => {
    if (!ad) return;

    // Track ad click
    try {
      fetch(buildApiUrl(`/ads/${ad._id}/click`), { method: 'POST' }).catch(() => {});
    } catch (e) {}

    // Navigate to destination
    const dest = ad.destinationUrl || '/jobs';
    if (dest.startsWith('http://') || dest.startsWith('https://')) {
      window.open(dest, '_blank', 'noopener,noreferrer');
    } else {
      navigate(dest);
    }
  };

  // If active campaign found
  if (ad) {
    return (
      <div className="card adCard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
            Sponsored
          </small>
          <Link to="/advertise" style={{ fontSize: "10px", color: "#0a66c2", textDecoration: "none" }}>
            Ad ···
          </Link>
        </div>

        <img
          src={ad.organizationLogo || "https://cdn-icons-png.flaticon.com/512/5968/5968705.png"}
          className="adLogo"
          alt={ad.organizationName}
        />

        <h4 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {ad.organizationName}
          <FaCheckCircle size={11} color="#166534" />
        </h4>

        <p style={{ fontSize: "12px", color: "#475569", margin: "6px 0 12px" }}>
          {ad.headline || ad.description}
        </p>

        <button className="followBtn" onClick={handleCtaClick}>
          {ad.callToAction || "Learn More"}
        </button>
      </div>
    );
  }

  // Fallback CTA: Promote Your Organization on Arcturus
  return (
    <div className="card adCard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <small style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
          Arcturus Ads
        </small>
        <FaBullhorn size={12} color="#0a66c2" />
      </div>

      <img
        src="/logo.png"
        className="adLogo"
        alt="Arcturus Connexa"
        onError={(e) => {
          e.target.src = "https://cdn-icons-png.flaticon.com/512/5968/5968705.png";
        }}
      />

      <h4>Grow with Arcturus</h4>

      <p>
        Promote your company, recruit top developers, and reach industry decision-makers.
      </p>

      <Link to="/advertise" className="followBtn" style={{ textDecoration: "none", display: "inline-block" }}>
        Launch Campaign
      </Link>
    </div>
  );
};

export default AdCard;