import React, { useState } from 'react';
import {
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaUpload,
  FaFileAlt,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaPlus,
  FaPaperPlane,
  FaExclamationTriangle,
  FaCheck,
  FaAward,
} from 'react-icons/fa';

export const OffersTab = ({
  isArcturusAdmin,
  isPlacementOfficer,
  offers = [],
  students = [],
  drives = [],
  handleOfferResponse,
  onPushOffer,
  onUploadDocument,
  onVerifyOffer,
}) => {
  // Push Offer Modal State (Placement Officer)
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pushForm, setPushForm] = useState({
    driveId: '',
    companyName: '',
    companyLogo: '',
    role: 'Associate Software Engineer',
    ctcLpa: '8.5',
    offerType: 'Full-Time',
    acceptanceDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    joiningDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    bondDetails: 'None / No Service Agreement Bond',
  });
  const [isPushing, setIsPushing] = useState(false);

  // Student Upload Document Modal State
  const [uploadModalOffer, setUploadModalOffer] = useState(null);
  const [docName, setDocName] = useState('Signed Offer Letter');
  const [docUrl, setDocUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Placement Officer Verify Modal State
  const [verifyModalOffer, setVerifyModalOffer] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOpenPushModal = () => {
    if (students.length > 0) {
      setSelectedStudentId(students[0].userId || students[0].profileId || '');
    }
    const initialDrive = drives?.[0] || null;
    setPushForm({
      driveId: initialDrive?._id || '',
      companyName: initialDrive?.companyName || '',
      companyLogo: initialDrive?.companyLogo || '',
      role: initialDrive?.roleTitle || 'Associate Software Engineer',
      ctcLpa: initialDrive?.ctcLpa != null ? String(initialDrive.ctcLpa) : '8.5',
      offerType: 'Full-Time',
      acceptanceDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      joiningDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bondDetails: 'None / No Service Agreement Bond',
    });
    setShowPushModal(true);
  };

  const handlePushSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !onPushOffer) return;
    if (!pushForm.driveId) {
      alert('Please select an existing scheduled recruitment drive.');
      return;
    }
    const targetStudent = students.find(
      (s) => s.userId === selectedStudentId || s.profileId === selectedStudentId
    );
    if (!targetStudent) return;

    setIsPushing(true);
    try {
      const ok = await onPushOffer({
        driveId: pushForm.driveId,
        studentId: targetStudent.userId,
        profileId: targetStudent.profileId,
        companyName: pushForm.companyName.trim(),
        companyLogo: pushForm.companyLogo.trim() || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        role: pushForm.role.trim(),
        ctcLpa: Number(pushForm.ctcLpa),
        offerType: pushForm.offerType,
        acceptanceDeadline: pushForm.acceptanceDeadline,
        joiningDate: pushForm.joiningDate,
        bondDetails: pushForm.bondDetails,
      });
      if (ok) {
        setShowPushModal(false);
      }
    } catch (err) {
      console.error('Push offer error:', err);
    } finally {
      setIsPushing(false);
    }
  };

  const handleOpenUpload = (offer) => {
    setUploadModalOffer(offer);
    setDocName('Signed Offer Letter');
    setDocUrl('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadModalOffer || !docUrl.trim() || !onUploadDocument) return;

    setIsUploading(true);
    try {
      const ok = await onUploadDocument(uploadModalOffer._id, {
        name: docName.trim(),
        url: docUrl.trim(),
        fileType: 'application/pdf',
      });
      if (ok) {
        setUploadModalOffer(null);
      }
    } catch (err) {
      console.error('Upload document error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenVerify = (offer) => {
    setVerifyModalOffer(offer);
    setRejectionReason('');
  };

  const handleExecuteVerify = async (action) => {
    if (!verifyModalOffer || !onVerifyOffer) return;
    setIsVerifying(true);
    try {
      const ok = await onVerifyOffer(verifyModalOffer._id, {
        action,
        rejectionReason: action === 'rejected' ? rejectionReason : undefined,
      });
      if (ok) {
        setVerifyModalOffer(null);
      }
    } catch (err) {
      console.error('Execute verify error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="campusPanel">
      <div className="campusPanelHeader">
        <div>
          <h2>
            <FaFileInvoiceDollar color="#0a66c2" />{' '}
            {isArcturusAdmin
              ? 'Network-Wide Corporate Offers & Compliance'
              : isPlacementOfficer
              ? 'Institutional Placement Offers & Verification'
              : 'My Corporate Placement Offers'}
          </h2>
          <p>
            {isArcturusAdmin
              ? 'Review verified corporate offers across all partner colleges, compensation tiers, and verification hashes.'
              : isPlacementOfficer
              ? 'Monitor offers extended to candidates from your institute, push offers, and verify student compliance documents.'
              : 'Track your personal offer letters, accept offers, and upload required verification documents for institutional placement confirmation.'}
          </p>
        </div>

        {(isPlacementOfficer || isArcturusAdmin) && (
          <button
            type="button"
            className="campusTabBtn active"
            onClick={handleOpenPushModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FaPlus size={12} /> Push New Offer
          </button>
        )}
      </div>

      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <FaFileInvoiceDollar size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3>No Offers Recorded Yet</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: 440, margin: '8px auto 0' }}>
            {isPlacementOfficer
              ? 'No corporate offers have been pushed to students yet. Use the "Push New Offer" button to extend an offer.'
              : 'No corporate recruitment offers have been extended to your profile yet. Once an offer is pushed by your institutional placement cell, it will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {offers.map((o) => {
            const isStudentOwner = !isArcturusAdmin && !isPlacementOfficer;
            return (
              <div
                key={o._id}
                className="offerRowCard"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
                }}
              >
                {/* Top Row: Company, Package, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <img
                      src={o.companyLogo || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png'}
                      alt={o.companyName}
                      className="driveLogo"
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain', border: '1px solid #e2e8f0', background: '#fff' }}
                    />
                    <div>
                      <strong style={{ fontSize: '1.08rem', color: '#0f172a' }}>{o.companyName}</strong>
                      <span style={{ color: '#0a66c2', fontWeight: 600, display: 'block', fontSize: '0.88rem' }}>
                        {o.role} · {o.offerType}
                      </span>
                      <small style={{ color: '#64748b' }}>
                        Candidate: <strong>{o.studentName}</strong> ({o.rollNumber} - {o.branch})
                      </small>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>
                      ₹{o.ctcLpa} LPA
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.packageTier}</span>
                    <div style={{ marginTop: 4 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '20px',
                          background:
                            o.status === 'accepted'
                              ? '#dcfce7'
                              : o.status === 'declined'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            o.status === 'accepted'
                              ? '#166534'
                              : o.status === 'declined'
                              ? '#991b1b'
                              : '#b45309',
                          textTransform: 'capitalize',
                        }}
                      >
                        Status: {o.status === 'offered' ? 'Offer Extended' : o.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta details & cryptographic hash */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 10, fontSize: '0.8rem', color: '#64748b' }}>
                  <div>
                    <span>Deadline: {new Date(o.acceptanceDeadline).toLocaleDateString()}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>Joining: {new Date(o.joiningDate).toLocaleDateString()}</span>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{o.bondDetails}</span>
                  </div>

                  <div className="hashBadge" style={{ fontSize: '0.72rem', background: '#f8fafc', padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', color: '#475569' }}>
                    🔐 Hash: {o.verificationHash || '0xARCTURUS_PENDING'}
                  </div>
                </div>

                {/* Student Decision Action Row (When Offered) */}
                {isStudentOwner && o.status === 'offered' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fffbeb', padding: '12px 16px', borderRadius: 8, border: '1px solid #fef3c7' }}>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#b45309' }}>
                      ⚡ <strong>Decision Required:</strong> Please accept or decline this offer before{' '}
                      <strong>{new Date(o.acceptanceDeadline).toLocaleDateString()}</strong>.
                    </div>
                    <button
                      type="button"
                      className="campusTabBtn"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      onClick={() => handleOfferResponse(o._id, 'declined')}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="campusTabBtn active"
                      style={{ background: '#16a34a' }}
                      onClick={() => handleOfferResponse(o._id, 'accepted')}
                    >
                      Accept Offer
                    </button>
                  </div>
                )}

                {/* POST-ACCEPTANCE WORKFLOW & DOCUMENT PORTAL */}
                {o.status === 'accepted' && (
                  <div
                    style={{
                      background:
                        o.verificationStatus === 'verified'
                          ? '#f0fdf4'
                          : o.verificationStatus === 'rejected'
                          ? '#fef2f2'
                          : '#f8fafc',
                      border:
                        o.verificationStatus === 'verified'
                          ? '1px solid #bbf7d0'
                          : o.verificationStatus === 'rejected'
                          ? '1px solid #fecaca'
                          : '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {o.verificationStatus === 'verified' ? (
                          <FaCheckCircle color="#16a34a" size={18} />
                        ) : o.verificationStatus === 'rejected' ? (
                          <FaExclamationTriangle color="#dc2626" size={18} />
                        ) : (
                          <FaClock color="#0a66c2" size={18} />
                        )}
                        <div>
                          <strong
                            style={{
                              fontSize: '0.88rem',
                              color:
                                o.verificationStatus === 'verified'
                                  ? '#166534'
                                  : o.verificationStatus === 'rejected'
                                  ? '#991b1b'
                                  : '#0f172a',
                            }}
                          >
                            {o.verificationStatus === 'verified'
                              ? 'Official Placement Verified & Confirmed (PLACED)'
                              : o.verificationStatus === 'rejected'
                              ? `Verification Not Approved: ${o.rejectionReason || 'Please re-upload clear documents'}`
                              : 'Offer Accepted · Verification Documents Pending'}
                          </strong>
                          <small style={{ display: 'block', color: '#64748b', fontSize: '0.76rem' }}>
                            {o.verificationStatus === 'verified'
                              ? 'Verified by Institutional Placement Officer. Cryptographic audit trail finalized.'
                              : isStudentOwner
                              ? 'Upload your signed offer acceptance letter, NOC, or transcripts below for verification.'
                              : 'Candidate accepted offer. Review uploaded documents to confirm placed status.'}
                          </small>
                        </div>
                      </div>

                      {/* Action Buttons for Student vs Officer */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isStudentOwner && o.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            className="campusTabBtn active"
                            onClick={() => handleOpenUpload(o)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
                          >
                            <FaUpload size={11} /> Upload Documents
                          </button>
                        )}

                        {(isPlacementOfficer || isArcturusAdmin) && o.verificationStatus === 'pending' && (
                          <button
                            type="button"
                            className="campusTabBtn active"
                            onClick={() => handleOpenVerify(o)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', background: '#16a34a' }}
                          >
                            <FaCheckCircle size={11} /> Verify Documents
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Documents List */}
                    {o.documents && o.documents.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
                        <h6 style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Uploaded Compliance Documents ({o.documents.length}):
                        </h6>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {o.documents.map((doc, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#fff',
                                padding: '5px 10px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                fontSize: '0.78rem',
                              }}
                            >
                              <FaFileAlt color="#0a66c2" size={12} />
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{doc.name}</span>
                              <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                                ({doc.status})
                              </span>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#0a66c2', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}
                                title="View document"
                              >
                                <FaExternalLinkAlt size={10} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Push Corporate Offer Modal (Placement Officer) */}
      {showPushModal && (
        <div
          className="modalOverlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <FaPaperPlane color="#0a66c2" /> Push Corporate Placement Offer
              </h3>
              <FaTimes style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setShowPushModal(false)} />
            </div>

            <form onSubmit={handlePushSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Select Candidate *
                </label>
                <select
                  className="chatInput"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  {students.map((st) => (
                    <option key={st.userId || st.profileId} value={st.userId || st.profileId}>
                      {st.name} ({st.rollNumber} - {st.branch})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recruitment Drive Selector */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Recruitment Drive (from Scheduled Drives) *
                </label>
                {drives && drives.length > 0 ? (
                  <select
                    className="chatInput"
                    value={pushForm.driveId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const driveMatch = drives.find((d) => d._id === selectedId);
                      if (driveMatch) {
                        setPushForm({
                          ...pushForm,
                          driveId: driveMatch._id,
                          companyName: driveMatch.companyName,
                          companyLogo: driveMatch.companyLogo || '',
                          role: driveMatch.roleTitle,
                          ctcLpa: driveMatch.ctcLpa != null ? String(driveMatch.ctcLpa) : pushForm.ctcLpa,
                        });
                      } else {
                        setPushForm({
                          ...pushForm,
                          driveId: '',
                          companyName: '',
                          companyLogo: '',
                          role: '',
                        });
                      }
                    }}
                    required
                  >
                    <option value="">-- Choose from scheduled recruitment drives --</option>
                    {drives.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.companyName} · {d.roleTitle} ({d.ctcLpa} LPA) [{d.status?.toUpperCase() || 'SCHEDULED'}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      padding: '10px 12px',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: '#92400e',
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ <strong>No scheduled drives found:</strong> Corporate offers must be extended from existing recruitment drives scheduled for your institution. Please schedule a drive under the <strong>Recruitment Drives</strong> tab first.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="Auto-filled from drive"
                    value={pushForm.companyName}
                    onChange={(e) => setPushForm({ ...pushForm, companyName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Role Title *
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="Auto-filled from drive"
                    value={pushForm.role}
                    onChange={(e) => setPushForm({ ...pushForm, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    CTC Package (LPA) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="chatInput"
                    placeholder="e.g. 10.5"
                    value={pushForm.ctcLpa}
                    onChange={(e) => setPushForm({ ...pushForm, ctcLpa: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Offer Type
                  </label>
                  <select
                    className="chatInput"
                    value={pushForm.offerType}
                    onChange={(e) => setPushForm({ ...pushForm, offerType: e.target.value })}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Internship + PPO">Internship + PPO</option>
                    <option value="Internship Only">Internship Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Acceptance Deadline
                  </label>
                  <input
                    type="date"
                    className="chatInput"
                    value={pushForm.acceptanceDeadline}
                    onChange={(e) => setPushForm({ ...pushForm, acceptanceDeadline: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Expected Joining Date
                  </label>
                  <input
                    type="date"
                    className="chatInput"
                    value={pushForm.joiningDate}
                    onChange={(e) => setPushForm({ ...pushForm, joiningDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Service Bond / Terms
                </label>
                <input
                  type="text"
                  className="chatInput"
                  value={pushForm.bondDetails}
                  onChange={(e) => setPushForm({ ...pushForm, bondDetails: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="campusTabBtn" onClick={() => setShowPushModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="campusTabBtn active" disabled={isPushing || !pushForm.driveId}>
                  {isPushing ? 'Pushing Offer...' : 'Push Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Student Upload Verification Document Modal */}
      {uploadModalOffer && (
        <div
          className="modalOverlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <FaUpload color="#0a66c2" /> Upload Verification Documents
              </h3>
              <FaTimes style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setUploadModalOffer(null)} />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Offer: <strong>{uploadModalOffer.companyName}</strong> ({uploadModalOffer.role}). Upload your signed offer letter, NOC, or transcripts to confirm placement.
            </p>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Document Type / Title *
                </label>
                <select className="chatInput" value={docName} onChange={(e) => setDocName(e.target.value)}>
                  <option value="Signed Offer Letter Acceptance">Signed Offer Letter Acceptance</option>
                  <option value="Institutional NOC / Clearance">Institutional NOC / Clearance</option>
                  <option value="Final Marksheet & Transcripts">Final Marksheet & Transcripts</option>
                  <option value="Government ID Proof">Government ID Proof</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Document URL / Cloud Link *
                </label>
                <input
                  type="url"
                  className="chatInput"
                  placeholder="https://drive.google.com/... or https://res.cloudinary.com/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.74rem', marginTop: 4, display: 'block' }}>
                  Provide a shareable Google Drive, Dropbox, or Cloudinary URL to your document PDF.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="campusTabBtn" onClick={() => setUploadModalOffer(null)}>
                  Cancel
                </button>
                <button type="submit" className="campusTabBtn active" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Placement Officer Verify Documents Modal */}
      {verifyModalOffer && (
        <div
          className="modalOverlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                <FaCheckCircle color="#16a34a" /> Verify Student Compliance Documents
              </h3>
              <FaTimes style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setVerifyModalOffer(null)} />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Candidate: <strong>{verifyModalOffer.studentName}</strong> ({verifyModalOffer.rollNumber}) · Company:{' '}
              <strong>{verifyModalOffer.companyName}</strong> (₹{verifyModalOffer.ctcLpa} LPA).
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <h5 style={{ margin: '0 0 10px', fontSize: '0.84rem', color: '#334155' }}>Submitted Files:</h5>
              {verifyModalOffer.documents && verifyModalOffer.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {verifyModalOffer.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaFileAlt color="#0a66c2" size={14} />
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{doc.name}</strong>
                          <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#0a66c2', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Open <FaExternalLinkAlt size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : verifyModalOffer.documentUrl ? (
                <a
                  href={verifyModalOffer.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0a66c2', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  View Uploaded Document Link <FaExternalLinkAlt size={11} />
                </a>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  No files submitted yet.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Feedback / Rejection Reason (Required if rejecting)
              </label>
              <input
                type="text"
                className="chatInput"
                placeholder="e.g. Document image is blurry / Missing signature on acceptance page"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="campusTabBtn"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                disabled={isVerifying}
                onClick={() => handleExecuteVerify('rejected')}
              >
                Reject Documents
              </button>
              <button
                type="button"
                className="campusTabBtn active"
                style={{ background: '#16a34a' }}
                disabled={isVerifying}
                onClick={() => handleExecuteVerify('verified')}
              >
                {isVerifying ? 'Verifying...' : 'Approve & Mark Student PLACED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersTab;
