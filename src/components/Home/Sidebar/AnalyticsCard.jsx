import React from "react";
import { Link } from "react-router-dom";
import { useProfile } from "../../../context/ProfileContext";

const AnalyticsCard = () => {
  const { profile } = useProfile();

  const profileViewers = profile?.profileViewers ?? profile?.profileViewsCount ?? 0;
  const postImpressions = profile?.postImpressions ?? profile?.postImpressionsCount ?? 0;
  const profileUsername = profile?.username || '';

  return (
    <div className="card analyticsCard">
      <Link 
        to={profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : '/profile'} 
        className="stat"
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Profile viewers</span>
        <b style={{ color: '#0a66c2' }}>{profileViewers}</b>
      </Link>

      <Link 
        to={profileUsername ? `/profile/${encodeURIComponent(profileUsername)}/activity` : '/profile/activity'} 
        className="stat"
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Post impressions</span>
        <b style={{ color: '#0a66c2' }}>{postImpressions}</b>
      </Link>
    </div>
  );
};

export default AnalyticsCard;