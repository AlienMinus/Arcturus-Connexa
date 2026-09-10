import React from "react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaCheckCircle, FaClock, FaPlus, FaBriefcase, FaCog } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { useProfile } from "../../../context/ProfileContext";
import { buildApiUrl } from "../../../utils/api";

const CompanyCard = () => {
  return (
    <div className="card companyCard">
  const { token } = useAuth();
  const { profile } = useProfile();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

      <img
        src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
        className="companyLogo"
        alt=""
      />
  useEffect(() => {
    let isMounted = true;

      <h4>Aerial.Vue Corporation</h4>
    const fetchUserOrg = async () => {
      // 1. If profile context already has the populated organization, use it immediately
      if (profile?.organization) {
        setOrg(profile.organization);
      }

      <div className="companyStats">
        <div>
          <span>Activity</span>
          <b>0</b>
      // 2. Query /organizations/my to get full details including activeJobsCount
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(buildApiUrl('/organizations/my'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const list = data.organizations || [];
          if (isMounted && list.length > 0) {
            // Prioritize approved organization, otherwise take the first
            const primaryOrg = list.find((o) => o.status === 'approved') || list[0];
            setOrg(primaryOrg);
          }
        }
      } catch (err) {
        console.error("Failed to load user organization for sidebar:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserOrg();

    return () => {
      isMounted = false;
    };
  }, [token, profile?.organization]);

  // Loading state
  if (loading && !org) {
    return (
      <div className="card companyCard">
        <div style={{ padding: "16px 0", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Loading organization...</p>
        </div>
      </div>
    );
  }

        <div>
          <span>Page visitors</span>
          <b>0</b>
  // CASE A: User HAS an associated organization (e.g. Arcturus Connexa)
  if (org) {
    const isVerified = org.status === 'approved';
    const isPending = org.status === 'pending';

    return (
      <div className="card companyCard">
        <div className="companyCardHeader">
          {org.logo?.url ? (
            <img
              src={org.logo.url}
              className="companyLogo"
              alt={org.name}
            />
          ) : (
            <div className="companyLogoFallback">
              <FaBuilding size={24} color="#0a66c2" />
            </div>
          )}

          {isVerified && (
            <span className="orgVerifiedBadge" title="Verified Organization Account">
              <FaCheckCircle size={11} /> Verified
            </span>
          )}
          {isPending && (
            <span className="orgPendingBadge" title="Under Verification Review">
              <FaClock size={11} /> Pending Review
            </span>
          )}
        </div>

        <h4 className="companyName">{org.name}</h4>

        <p className="companyTagline">
          {org.tagline || `${org.industry || 'Software Development'} · ${org.organizationSize || '11-50'} emp.`}
        </p>

        <div className="companyStats">
          <div>
            <span>Active jobs</span>
            <b>{org.activeJobsCount ?? 0}</b>
          </div>

          <div>
            <span>Team members</span>
            <b>{org.members?.length || 1}</b>
          </div>
        </div>

        <Link to="/jobs/manage" className="btn companyActionBtn">
          <FaCog size={12} style={{ marginRight: 6 }} /> Manage Organization
        </Link>

        <Link to="/jobs/post" className="btnOutline companySecondaryBtn">
          <FaPlus size={11} style={{ marginRight: 6 }} /> Post a Job
        </Link>
      </div>
    );
  }

      <button className="btn">Try Premium Page</button>
  // CASE B: User has NO organization registered yet -> Show inviting CTA to create one
  return (
    <div className="card companyCard">
      <div className="companyCardHeader">
        <div className="companyLogoFallback">
          <FaBuilding size={24} color="#0a66c2" />
        </div>
      </div>

      <button className="btnOutline">
        Advertise on Arcturus
      </button>
      <h4 className="companyName">Create Company Page</h4>

      <p className="companyTagline">
        Publish job openings, manage candidates, and verify your organization on Arcturus.
      </p>

      <Link to="/jobs/post" className="btn companyActionBtn">
        <FaPlus size={11} style={{ marginRight: 6 }} /> Register Organization
      </Link>

      <Link to="/jobs" className="btnOutline companySecondaryBtn">
        <FaBriefcase size={11} style={{ marginRight: 6 }} /> Explore Jobs
      </Link>
    </div>
  );
};

export default CompanyCard;