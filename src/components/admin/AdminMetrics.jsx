import React from 'react';
import { 
  FaUsers, 
  FaBuilding, 
  FaHourglassHalf, 
  FaBriefcase, 
  FaFileAlt,
  FaBookOpen
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

const AdminMetrics = ({ stats }) => {
  return (
    <section className="adminMetricsGrid">
      <div className="metricCard">
        <div className="metricIconBox users">
          <FaUsers size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Total Users</span>
          <span className="metricValue">{stats?.totalUsers ?? '...'}</span>
          <span className="metricSubtext">{stats?.verifiedUsers ?? 0} verified members</span>
        </div>
      </div>

      <div className="metricCard">
        <div className="metricIconBox organizations">
          <FaBuilding size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Organizations</span>
          <span className="metricValue">{stats?.totalOrganizations ?? '...'}</span>
          <span className="metricSubtext">{stats?.approvedOrganizations ?? 0} verified & active</span>
        </div>
      </div>

      <div className={`metricCard highlight ${(stats?.pendingOrganizations || 0) > 0 ? 'urgent' : ''}`}>
        <div className="metricIconBox pending">
          <FaHourglassHalf size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Pending Orgs</span>
          <span className="metricValue">{stats?.pendingOrganizations ?? 0}</span>
          <span className="metricSubtext">Awaiting org review</span>
        </div>
      </div>

      <div className={`metricCard highlight ${(stats?.pendingVerifications || 0) > 0 ? 'urgent' : ''}`}>
        <div className="metricIconBox" style={{ background: '#e0f2fe', color: '#0a66c2' }}>
          <MdVerified size={24} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Blue Tick Requests</span>
          <span className="metricValue">{stats?.pendingVerifications ?? 0}</span>
          <span className="metricSubtext">Awaiting identity check</span>
        </div>
      </div>

      <div className="metricCard">
        <div className="metricIconBox courses" style={{ background: '#eef2ff', color: '#4f46e5' }}>
          <FaBookOpen size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Masterclasses</span>
          <span className="metricValue">{stats?.totalCourses ?? '...'}</span>
          <span className="metricSubtext">{stats?.totalLearners ?? 0} enrolled learners</span>
        </div>
      </div>

      <div className="metricCard">
        <div className="metricIconBox jobs">
          <FaBriefcase size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Active Jobs</span>
          <span className="metricValue">{stats?.activeJobs ?? '...'}</span>
          <span className="metricSubtext">{stats?.totalApplications ?? 0} applications</span>
        </div>
      </div>

      <div className="metricCard">
        <div className="metricIconBox posts">
          <FaFileAlt size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Community Posts</span>
          <span className="metricValue">{stats?.totalPosts ?? '...'}</span>
          <span className="metricSubtext">Articles & feed updates</span>
        </div>
      </div>
    </section>
  );
};

export default AdminMetrics;

