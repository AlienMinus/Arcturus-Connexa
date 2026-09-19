import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaTimesCircle, 
  FaExternalLinkAlt, 
  FaCheck, 
  FaTimes, 
  FaUserGraduate, 
  FaBuilding, 
  FaUniversity,
  FaShieldAlt,
  FaClock
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

const VerificationRequests = ({
  requests = [],
  filter,
  setFilter,
  loading,
  actionLoading,
  onApprove,
  onReject,
  onRevoke,
}) => {
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleStartReject = (id) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = (id) => {
    onReject(id, rejectionReason || 'Verification criteria could not be confirmed.');
    setRejectingId(null);
    setRejectionReason('');
  };

  return (
    <section className="adminSectionPanel">
      {/* Sub-filter Pills */}
      <div className="orgFilterRow">
        <div className="filterPillsGroup">
          <button
            type="button"
            className={`filterPill ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
            title="Pending Review"
          >
            <FaHourglassHalf size={12} />
            <span className="filterText">Pending Review</span>
            <span className="pillCount">({pendingCount})</span>
          </button>

          <button
            type="button"
            className={`filterPill ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
            title="Approved"
          >
            <FaCheckCircle size={12} />
            <span className="filterText">Approved (Blue Tick)</span>
            <span className="pillCount">({approvedCount})</span>
          </button>

          <button
            type="button"
            className={`filterPill ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
            title="Rejected"
          >
            <FaTimesCircle size={12} />
            <span className="filterText">Rejected</span>
            <span className="pillCount">({rejectedCount})</span>
          </button>

          <button
            type="button"
            className={`filterPill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            title="All Requests"
          >
            <span className="filterText">All</span>
            <span className="pillCount">({requests.length})</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="adminLoadingState">
          <FaShieldAlt size={36} className="spinPulse" color="#0a66c2" />
          <p>Loading verification applications...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="adminEmptyState">
          <FaShieldAlt size={48} color="#94a3b8" />
          <h4>No {filter !== 'all' ? filter : ''} verification requests found</h4>
          <p>Applications submitted by students, professionals, and organizations for Blue Tick verification will appear here.</p>
        </div>
      ) : (
        <div className="orgCardsGrid" style={{ gridTemplateColumns: '1fr' }}>
          {requests.map((req) => {
            const user = req.userId;
            const org = req.organizationId;
            const username = user?.username;
            const profileUrl = username ? `/profile/${encodeURIComponent(username)}` : null;
            const avatarUrl = user?.profilePicture?.url;
            const isActing = actionLoading === req._id;

            return (
              <div key={req._id} className="orgCardItem" style={{ borderLeft: `5px solid ${req.status === 'approved' ? '#0a66c2' : req.status === 'rejected' ? '#dc2626' : '#f59e0b'}` }}>
                <div className="orgCardHeader">
                  <div className="orgCardBrand">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={req.fullName} className="orgCardLogo" style={{ borderRadius: '50%' }} />
                    ) : (
                      <div className="orgCardLogoFallback" style={{ borderRadius: '50%' }}>
                        {(req.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="orgCardTitleGroup">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {profileUrl ? (
                          <Link to={profileUrl} className="orgCardNameLink" style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', textDecoration: 'none' }}>
                            {req.fullName}
                          </Link>
                        ) : (
                          <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{req.fullName}</strong>
                        )}
                        {req.status === 'approved' && (
                          <MdVerified size={18} color="#0a66c2" title="Arcturus Verified Account" />
                        )}
                      </div>

                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        @{username || 'user'} · {user?.email}
                      </span>
                    </div>
                  </div>

                  <div className="orgCardStatusBadge">
                    <span className={`statusTag ${req.status}`}>
                      {req.status === 'approved' && <><FaCheckCircle size={11} /> Approved</>}
                      {req.status === 'pending' && <><FaHourglassHalf size={11} /> Pending Review</>}
                      {req.status === 'rejected' && <><FaTimesCircle size={11} /> Rejected</>}
                    </span>
                  </div>
                </div>

                <div className="orgCardDetails">
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '8px 0', fontSize: '0.84rem' }}>
                    <span style={{ background: '#f1f5f9', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, color: '#334155' }}>
                      Category: {req.category}
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f172a', fontWeight: 600 }}>
                      <FaUniversity size={13} color="#64748b" /> Affiliation: {req.affiliation}
                    </span>

                    {org && (
                      <Link
                        to={`/company/${org.slug || org._id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0a66c2', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <FaBuilding size={12} /> Linked Organization: {org.name}
                      </Link>
                    )}

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                      <FaClock size={11} /> Submitted {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Reason & Statement */}
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '4px' }}>Verification Statement:</strong>
                    <p style={{ margin: 0, color: '#1e293b', fontStyle: 'italic' }}>"{req.reason}"</p>
                  </div>

                  {/* Evidence link */}
                  {req.evidenceUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <a
                        href={req.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#0a66c2',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          textDecoration: 'none',
                        }}
                      >
                        <FaExternalLinkAlt size={12} /> View Verification Evidence / Credentials URL
                      </a>
                    </div>
                  )}

                  {/* Admin notes if rejected */}
                  {req.adminNotes && (
                    <div style={{ marginTop: '10px', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#991b1b' }}>
                      <strong>Admin Feedback:</strong> {req.adminNotes}
                    </div>
                  )}
                </div>

                {/* Inline Rejection Reason Prompt */}
                {rejectingId === req._id && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fda4af', padding: '12px 16px', borderRadius: '8px', margin: '12px 0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#9f1239', marginBottom: '6px' }}>
                      Reason for Rejection (Visible to User):
                    </label>
                    <input
                      type="text"
                      className="settingsInput"
                      style={{ width: '100%', marginBottom: '10px' }}
                      placeholder="e.g. Evidence link could not be verified; institutional email required."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="actionBtn reject"
                        disabled={isActing}
                        onClick={() => handleConfirmReject(req._id)}
                      >
                        Confirm Rejection
                      </button>
                      <button
                        type="button"
                        className="actionBtn"
                        style={{ background: '#e2e8f0', color: '#334155' }}
                        onClick={() => setRejectingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="orgCardActions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                  {req.status === 'pending' && rejectingId !== req._id && (
                    <>
                      <button
                        type="button"
                        className="actionBtn approve"
                        disabled={isActing}
                        onClick={() => onApprove(req._id)}
                      >
                        <FaCheck size={12} /> Approve Blue Tick
                      </button>
                      <button
                        type="button"
                        className="actionBtn reject"
                        disabled={isActing}
                        onClick={() => handleStartReject(req._id)}
                      >
                        <FaTimes size={12} /> Reject Application
                      </button>
                    </>
                  )}

                  {req.status === 'approved' && (
                    <button
                      type="button"
                      className="actionBtn reject"
                      disabled={isActing}
                      onClick={() => onRevoke(req._id)}
                      title="Revoke Blue Tick Verification"
                    >
                      <FaTimes size={12} /> Revoke Blue Tick
                    </button>
                  )}

                  {req.status === 'rejected' && rejectingId !== req._id && (
                    <button
                      type="button"
                      className="actionBtn approve"
                      disabled={isActing}
                      onClick={() => onApprove(req._id)}
                    >
                      <FaCheck size={12} /> Re-evaluate & Approve
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default VerificationRequests;

