import React from 'react';
import { 
  FaUsers, 
  FaBuilding, 
  FaHourglassHalf, 
  FaBriefcase, 
  FaFileAlt 
} from 'react-icons/fa';

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
          <span className="metricSubtext">Platform accounts</span>
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
          <span className="metricLabel">Pending Approvals</span>
          <span className="metricValue">{stats?.pendingOrganizations ?? 0}</span>
          <span className="metricSubtext">Awaiting document review</span>
        </div>
      </div>

      <div className="metricCard">
        <div className="metricIconBox jobs">
          <FaBriefcase size={22} />
        </div>
        <div className="metricContent">
          <span className="metricLabel">Active Jobs</span>
          <span className="metricValue">{stats?.activeJobs ?? '...'}</span>
          <span className="metricSubtext">{stats?.totalApplications ?? 0} applications received</span>
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

