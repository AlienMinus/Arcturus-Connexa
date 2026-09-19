import React from 'react';
import { FaCalendarAlt, FaTimes, FaPlus } from 'react-icons/fa';
import './ScheduleDriveModal.css';

export const ScheduleDriveModal = ({
  showDriveModal,
  setShowDriveModal,
  driveForm,
  setDriveForm,
  handleScheduleDrive,
}) => {
  if (!showDriveModal) return null;

  return (
    <div
      className="modalOverlay scheduleModalOverlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
    >
      <div
        className="scheduleModalSurface"
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCalendarAlt color="#0a66c2" /> Schedule Campus Recruitment Drive
          </h3>
          <FaTimes style={{ cursor: 'pointer' }} onClick={() => setShowDriveModal(false)} />
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
          Define company details, CTC package, eligibility criteria, date, and venue. Our Conflict Engine will automatically audit schedule clashes.
        </p>

        <form onSubmit={handleScheduleDrive} className="scheduleDriveForm" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Company Name *
            </label>
            <input
              type="text"
              className="chatInput"
              placeholder="e.g. Google, Microsoft, Adobe"
              value={driveForm.companyName}
              onChange={(e) => setDriveForm({ ...driveForm, companyName: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Role Title *
            </label>
            <input
              type="text"
              className="chatInput"
              placeholder="e.g. Software Development Engineer"
              value={driveForm.roleTitle}
              onChange={(e) => setDriveForm({ ...driveForm, roleTitle: e.target.value })}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Company Logo URL
            </label>
            <input
              type="url"
              className="chatInput"
              placeholder="https://example.com/company-logo.png"
              value={driveForm.companyLogo}
              onChange={(e) => setDriveForm({ ...driveForm, companyLogo: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Package CTC (LPA) *
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              className="chatInput"
              placeholder="e.g. 18.5"
              value={driveForm.ctcLpa}
              onChange={(e) => setDriveForm({ ...driveForm, ctcLpa: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Monthly Stipend (₹)
            </label>
            <input
              type="number"
              min="0"
              className="chatInput"
              placeholder="e.g. 50000"
              value={driveForm.baseStipend}
              onChange={(e) => setDriveForm({ ...driveForm, baseStipend: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Job Category
            </label>
            <select
              className="chatInput"
              value={driveForm.jobCategory}
              onChange={(e) => setDriveForm({ ...driveForm, jobCategory: e.target.value })}
            >
              <option value="Core Software">Core Software</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="FinTech & Analytics">FinTech & Analytics</option>
              <option value="AI & Data Science">AI & Data Science</option>
              <option value="Product Engineering">Product Engineering</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Drive Date *
            </label>
            <input
              type="date"
              className="chatInput"
              value={driveForm.driveDate}
              onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Start Time
            </label>
            <input
              type="text"
              className="chatInput"
              placeholder="09:30 AM"
              value={driveForm.startTime}
              onChange={(e) => setDriveForm({ ...driveForm, startTime: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              End Time
            </label>
            <input
              type="text"
              className="chatInput"
              placeholder="01:30 PM"
              value={driveForm.endTime}
              onChange={(e) => setDriveForm({ ...driveForm, endTime: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Campus Venue *
            </label>
            <select
              className="chatInput"
              value={driveForm.venue}
              onChange={(e) => setDriveForm({ ...driveForm, venue: e.target.value })}
            >
              <option value="Campus Auditorium - Hall A">Campus Auditorium - Hall A</option>
              <option value="Campus Auditorium - Hall B">Campus Auditorium - Hall B</option>
              <option value="Seminar Hall B">Seminar Hall B</option>
              <option value="Tech Center Lab 101">Tech Center Lab 101</option>
              <option value="Placement Cell Boardroom">Placement Cell Boardroom</option>
              <option value="Virtual Assessment Lab">Virtual Assessment Lab (Online)</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Job Description (JD) *
            </label>
            <textarea
              className="chatInput"
              rows="5"
              placeholder="Describe responsibilities, qualifications, and interview expectations..."
              value={driveForm.description}
              onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
              required
              style={{ resize: 'vertical', minHeight: 110 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Minimum CGPA Cutoff
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="chatInput"
              value={driveForm.minCgpa}
              onChange={(e) => setDriveForm({ ...driveForm, minCgpa: Number(e.target.value) })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Maximum Allowed Backlogs
            </label>
            <input
              type="number"
              min="0"
              className="chatInput"
              value={driveForm.maxBacklogs}
              onChange={(e) => setDriveForm({ ...driveForm, maxBacklogs: Number(e.target.value) })}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Eligible Branches
            </label>
            <div className="branchCheckboxGrid">
              {[
                'Computer Science & Engineering',
                'Information Technology',
                'Electronics & Communication',
                'Electrical Engineering',
                'Mechanical Engineering',
                'Civil Engineering',
                'Other',
              ].map((branch) => {
                const isChecked = driveForm.allowedBranches.includes(branch);
                return (
                  <label key={branch} className="branchCheckboxItem">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDriveForm({
                            ...driveForm,
                            allowedBranches: [...driveForm.allowedBranches, branch],
                          });
                        } else {
                          setDriveForm({
                            ...driveForm,
                            allowedBranches: driveForm.allowedBranches.filter((b) => b !== branch),
                          });
                        }
                      }}
                    />
                    <span>{branch}</span>
                  </label>
                );
              })}
            </div>
            {driveForm.allowedBranches.includes('Other') && (
              <input
                type="text"
                className="chatInput otherBranchInput"
                placeholder="Specify eligible branch or program"
                value={driveForm.otherBranch}
                onChange={(e) => setDriveForm({ ...driveForm, otherBranch: e.target.value })}
                required
              />
            )}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Required Skills (comma separated)
            </label>
            <input
              type="text"
              className="chatInput"
              placeholder="e.g. React, Node.js, Python, DSA, System Design"
              value={driveForm.requiredSkills}
              onChange={(e) => setDriveForm({ ...driveForm, requiredSkills: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, gridColumn: '1 / -1', marginTop: 12 }}>
            <button
              type="button"
              className="campusTabBtn scheduleCancelBtn"
              onClick={() => setShowDriveModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="campusTabBtn active scheduleSubmitBtn"
            >
              <FaPlus size={12} /> Schedule Drive & Check Conflicts
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleDriveModal;

