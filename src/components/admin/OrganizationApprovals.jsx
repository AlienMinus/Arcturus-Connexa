import React from 'react';
import { 
  FaBuilding, 
  FaHourglassHalf, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSyncAlt, 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaExternalLinkAlt, 
  FaExclamationTriangle, 
  FaFileInvoice, 
  FaEye, 
  FaCheck, 
  FaTimes 
} from 'react-icons/fa';

const OrganizationApprovals = ({
  organizations = [],
  stats,
  statusFilter,
  setStatusFilter,
  loading,
  actionLoading,
  onApprove,
  onOpenRejectModal,
  onOpenLightbox,
}) => {
  return (
    <section className="adminSectionPanel">
      {/* Status Sub-filter Pills */}
      <div className="orgFilterRow">
        <div className="filterPillsGroup">
          <button
            type="button"
            className={`filterPill ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <FaHourglassHalf size={12} /> Pending Review ({stats?.pendingOrganizations || 0})
          </button>
          <button
            type="button"
            className={`filterPill ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            <FaCheckCircle size={12} /> Approved ({stats?.approvedOrganizations || 0})
          </button>
          <button
            type="button"
            className={`filterPill ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <FaTimesCircle size={12} /> Rejected ({stats?.rejectedOrganizations || 0})
          </button>
          <button
            type="button"
            className={`filterPill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Organizations ({stats?.totalOrganizations || 0})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adminLoadingState">
          <FaSyncAlt className="spinAnimation" size={24} />
          <p>Loading organizations...</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="adminEmptyState">
          <FaBuilding size={42} />
          <h3>No organizations found</h3>
          <p>There are currently no organizations matching the "{statusFilter}" status filter.</p>
        </div>
      ) : (
        <div className="organizationsAdminGrid">
          {organizations.map((org) => (
            <div key={org._id} className={`adminOrgCard ${org.status}`}>
              {/* Org Card Header */}
              <div className="adminOrgHeader">
                <div className="adminOrgIdentity">
                  <img
                    src={org.logo?.url || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                    alt={org.name}
                    className="adminOrgLogo"
                  />
                  <div>
                    <div className="orgTitleRow">
                      <h3>{org.name}</h3>
                      <span className={`statusTag ${org.status}`}>
                        {org.status === 'pending' && <><FaHourglassHalf size={11} /> Pending Review</>}
                        {org.status === 'approved' && <><FaCheckCircle size={11} /> Approved</>}
                        {org.status === 'rejected' && <><FaTimesCircle size={11} /> Rejected</>}
                      </span>
                    </div>
                    <p className="orgTagline">{org.tagline || `${org.industry} · ${org.organizationSize} employees`}</p>
                  </div>
                </div>
              </div>

              {/* Company Details Grid */}
              <div className="adminOrgMetaGrid">
                <div className="metaField">
                  <span className="fieldLabel">Industry:</span>
                  <span className="fieldVal">{org.industry}</span>
                </div>
                <div className="metaField">
                  <span className="fieldLabel">Headquarters:</span>
                  <span className="fieldVal"><FaMapMarkerAlt size={11} /> {org.location}</span>
                </div>
                <div className="metaField">
                  <span className="fieldLabel">Type & Size:</span>
                  <span className="fieldVal">{org.organizationType} ({org.organizationSize} emp.)</span>
                </div>
                <div className="metaField">
                  <span className="fieldLabel">Website:</span>
                  {org.website ? (
                    <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="fieldLink">
                      <FaGlobe size={11} /> {org.website.replace(/^https?:\/\//, '')} <FaExternalLinkAlt size={9} />
                    </a>
                  ) : (
                    <span className="fieldVal textMuted">None provided</span>
                  )}
                </div>
                <div className="metaField fullSpan">
                  <span className="fieldLabel">Registered By:</span>
                  <span className="fieldVal">
                    <strong>{org.adminId?.firstName} {org.adminId?.lastName}</strong> ({org.adminId?.email}) · @{org.adminId?.username}
                  </span>
                </div>
                {org.description && (
                  <div className="metaField fullSpan descField">
                    <span className="fieldLabel">About Company:</span>
                    <p className="fieldDescText">{org.description}</p>
                  </div>
                )}
                {org.status === 'rejected' && org.rejectionReason && (
                  <div className="metaField fullSpan rejectionNotice">
                    <span className="fieldLabel"><FaExclamationTriangle size={12} /> Reason for Rejection:</span>
                    <p className="rejectionReasonText">{org.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Submitted Verification Documents Section */}
              <div className="adminDocsSection">
                <div className="docsSectionTitle">
                  <FaFileInvoice size={14} />
                  <h4>Submitted Verification Documents ({org.documents?.length || 0})</h4>
                </div>

                {org.documents && org.documents.length > 0 ? (
                  <div className="docsThumbnailsGrid">
                    {org.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="docThumbnailCard"
                        onClick={() =>
                          onOpenLightbox({
                            url: doc.url,
                            title: `${org.name} - ${doc.documentType}`,
                            documentType: doc.documentType,
                            originalName: doc.originalName,
                          })
                        }
                        title="Click to inspect full-resolution document"
                      >
                        <div className="docImagePreviewBox">
                          <img src={doc.url} alt={doc.documentType} />
                          <div className="docHoverOverlay">
                            <FaEye size={16} /> <span>Inspect</span>
                          </div>
                        </div>
                        <span className="docTypeBadge">{doc.documentType}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="noDocsWarning">
                    <FaExclamationTriangle size={13} /> No documents uploaded for this organization.
                  </p>
                )}
              </div>

              {/* Admin Actions Bar */}
              <div className="adminOrgActions">
                {org.status !== 'approved' && (
                  <button
                    type="button"
                    className="approveBtn"
                    onClick={() => onApprove(org._id, org.name)}
                    disabled={actionLoading === org._id}
                  >
                    <FaCheck size={13} />
                    <span>{actionLoading === org._id ? 'Approving...' : 'Approve Organization'}</span>
                  </button>
                )}

                {org.status !== 'rejected' && (
                  <button
                    type="button"
                    className="rejectBtn"
                    onClick={() => onOpenRejectModal(org)}
                    disabled={actionLoading === org._id}
                  >
                    <FaTimes size={13} />
                    <span>Reject / Request Changes</span>
                  </button>
                )}

                {org.status === 'approved' && (
                  <div className="approvedBadgeInfo">
                    <FaCheckCircle size={14} color="#10b981" />
                    <span>Verified on {org.reviewedAt ? new Date(org.reviewedAt).toLocaleDateString() : 'Active'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default OrganizationApprovals;

