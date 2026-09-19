import React from 'react';
import { FaFileInvoiceDollar } from 'react-icons/fa';

export const OffersTab = ({
  isArcturusAdmin,
  offers,
  handleOfferResponse,
}) => {
  return (
    <div className="campusPanel">
      <div className="campusPanelHeader">
        <div>
          <h2><FaFileInvoiceDollar color="#0a66c2" /> Post-Selection Offers & Verification Lifecycle</h2>
          <p>Track student offer letters, CTC packages, acceptance status, and cryptographic verification hashes.</p>
        </div>
      </div>

      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <FaFileInvoiceDollar size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3>No Offers Recorded Yet</h3>
        </div>
      ) : (
        <div>
          {offers.map((o) => (
            <div key={o._id} className="offerRowCard">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <img src={o.companyLogo} alt={o.companyName} className="driveLogo" />
                <div>
                  <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{o.companyName}</strong>
                  <span style={{ color: '#0a66c2', fontWeight: 600, display: 'block', fontSize: '0.88rem' }}>
                    {o.role} · {o.offerType}
                  </span>
                  <small style={{ color: '#64748b' }}>
                    Offered to: <strong>{o.studentName}</strong> ({o.rollNumber} - {o.branch})
                  </small>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{o.ctcLpa} LPA
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.packageTier}</span>
              </div>

              <div>
                <div className="hashBadge" title="Cryptographic verification hash">
                  🔐 Hash: {o.verificationHash || 'Pending Verification'}
                </div>
                <span style={{
                  display: 'inline-block',
                  marginTop: 4,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: o.status === 'accepted' ? '#dcfce7' : o.status === 'declined' ? '#fee2e2' : '#fef3c7',
                  color: o.status === 'accepted' ? '#166534' : o.status === 'declined' ? '#991b1b' : '#b45309',
                  textTransform: 'capitalize',
                }}>
                  Status: {o.status}
                </span>
              </div>

              {o.status === 'offered' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="escalateBtn"
                    style={{ background: '#16a34a' }}
                    onClick={() => handleOfferResponse(o._id, 'accepted')}
                  >
                    Accept Offer
                  </button>
                  <button
                    type="button"
                    className="escalateBtn"
                    style={{ background: '#dc2626' }}
                    onClick={() => handleOfferResponse(o._id, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersTab;

