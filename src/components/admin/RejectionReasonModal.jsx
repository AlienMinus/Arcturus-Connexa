import React from 'react';
import { FaTimes } from 'react-icons/fa';

const REJECTION_PRESETS = [
  'Illegible or low-resolution document image. Please upload a clear scan.',
  'Organization name does not match submitted business registration certificate.',
  'Expired or invalid tax registration / incorporation certificate.',
  'Missing official government seal or registration authority stamp.',
  'Duplicate or unauthorized company representation claim.',
];

const RejectionReasonModal = ({
  organization,
  rejectionReason,
  setRejectionReason,
  onSubmit,
  onClose,
  loading,
}) => {
  if (!organization) return null;

  return (
    <div className="adminModalOverlay" onClick={onClose}>
      <div className="adminRejectionCard" onClick={(e) => e.stopPropagation()}>
        <div className="rejectionModalHeader">
          <div>
            <h3>Reject Organization Registration</h3>
            <p>Provide feedback for <strong>{organization.name}</strong></p>
          </div>
          <button type="button" className="lightboxCloseBtn" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="rejectionPresetGroup">
            <label>Quick Reasons:</label>
            <div className="presetChips">
              {REJECTION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="presetChipBtn"
                  onClick={() => setRejectionReason(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="formGroup fullWidth">
            <label>Custom Feedback / Reason for Rejection</label>
            <textarea
              rows={4}
              required
              placeholder="Explain why the registration was rejected and what documents the owner needs to provide..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div className="rejectionModalActions">
            <button type="button" className="adminSecondaryBtn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="confirmRejectBtn" disabled={loading}>
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionReasonModal;

