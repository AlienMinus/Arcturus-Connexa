import React from 'react';
import { FaBriefcase, FaSyncAlt, FaTrashAlt } from 'react-icons/fa';

const JobModeration = ({ jobs = [], loading, onDeleteJob }) => {
  return (
    <section className="adminSectionPanel">
      <div className="panelHeaderRow">
        <h3>All Published Jobs ({jobs.length})</h3>
        <p>Monitor and moderate job listings posted by verified organization accounts.</p>
      </div>

      {loading ? (
        <div className="adminLoadingState">
          <FaSyncAlt className="spinAnimation" size={24} />
          <p>Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="adminEmptyState">
          <FaBriefcase size={42} />
          <h3>No job listings found</h3>
        </div>
      ) : (
        <div className="adminTableContainer">
          <table className="adminDataTable">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company / Organization</th>
                <th>Location & Type</th>
                <th>Recruiter</th>
                <th>Applicants</th>
                <th>Posted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id}>
                  <td className="jobTitleCell">
                    <strong>{j.title}</strong>
                    <span className="jobSalaryTag">{j.salary || 'Salary undisclosed'}</span>
                  </td>
                  <td>
                    <div className="tableCompanyCol">
                      <img
                        src={j.organizationId?.logo?.url || j.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                        alt={j.company}
                        className="tableLogo"
                      />
                      <span>{j.organizationId?.name || j.company}</span>
                    </div>
                  </td>
                  <td>
                    <span>{j.location}</span>
                    <span className="tableSubtext">{j.workplaceType} · {j.employmentType}</span>
                  </td>
                  <td>
                    <span>{j.recruiterId?.firstName} {j.recruiterId?.lastName}</span>
                    <span className="tableSubtext">{j.recruiterId?.email}</span>
                  </td>
                  <td>
                    <span className="applicantsCountBadge">
                      {j.applicants?.length || 0} applicants
                    </span>
                  </td>
                  <td>{new Date(j.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="tableDeleteBtn"
                      onClick={() => onDeleteJob(j._id, j.title)}
                      title="Delete / Close Job Listing"
                    >
                      <FaTrashAlt size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default JobModeration;

