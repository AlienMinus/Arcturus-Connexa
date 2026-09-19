import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const MockAssessmentModal = ({
  showAssessmentModal,
  setShowAssessmentModal,
  handleAssessmentSubmit,
}) => {
  if (!showAssessmentModal) return null;

  return (
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
        zIndex: 10000,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '540px',
          width: '90%',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>🎯 Quick Readiness Assessment Simulator</h3>
          <FaTimes style={{ cursor: 'pointer' }} onClick={() => setShowAssessmentModal(false)} />
        </div>

        <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
          Answer these 3 quick technical & aptitude questions to update and boost your 4-tier Employability Readiness Score.
        </p>

        <div style={{ margin: '16px 0', fontSize: '0.88rem', color: '#1e293b' }}>
          <p><strong>1. Technical:</strong> What is the time complexity of searching in a balanced BST?</p>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input type="radio" name="q1" defaultChecked /> O(log N)
          </label>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input type="radio" name="q1" /> O(N)
          </label>

          <p style={{ marginTop: 12 }}><strong>2. System Design:</strong> Which mechanism prevents single points of failure in cloud backends?</p>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input type="radio" name="q2" defaultChecked /> Multi-AZ Redundancy & Load Balancing
          </label>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input type="radio" name="q2" /> Single Large Virtual Machine
          </label>

          <p style={{ marginTop: 12 }}><strong>3. Aptitude:</strong> A train crosses a 300m platform in 30 seconds at 54 km/h. Length of train?</p>
          <label style={{ display: 'block', margin: '4px 0' }}>
            <input type="radio" name="q3" defaultChecked /> 150 meters
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            className="campusTabBtn"
            onClick={() => setShowAssessmentModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="campusTabBtn active"
            onClick={handleAssessmentSubmit}
          >
            Submit & Boost Readiness
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockAssessmentModal;

