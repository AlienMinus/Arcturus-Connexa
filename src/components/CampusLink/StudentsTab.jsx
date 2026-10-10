import React, { useState } from 'react';
import {
  FaGraduationCap,
  FaSearch,
  FaDownload,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaTimes,
  FaUserGraduate,
  FaChartLine,
} from 'react-icons/fa';

export const StudentsTab = ({
  organization,
  students = [],
  stats = {},
  loading = false,
  onRefresh,
  onUpdateStudentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  // Selected student for status update modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStatus, setNewStatus] = useState('unplaced');
  const [assignedMentor, setAssignedMentor] = useState('');
  const [mentorRecommendation, setMentorRecommendation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Extract distinct branches
  const branches = Array.from(new Set(students.map((s) => s.branch).filter(Boolean)));

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const match =
        s.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && s.placementStatus?.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (readinessFilter !== 'all' && s.readinessLevel?.toLowerCase() !== readinessFilter.toLowerCase()) {
      return false;
    }
    if (branchFilter !== 'all' && s.branch?.toLowerCase() !== branchFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setNewStatus(student.placementStatus || 'unplaced');
    setAssignedMentor(student.assignedMentor || '');
    setMentorRecommendation('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsUpdating(true);
    try {
      await onUpdateStudentStatus(selectedStudent.profileId || selectedStudent.userId, {
        placementStatus: newStatus,
        assignedMentor,
        mentorRecommendation,
      });
      setSelectedStudent(null);
    } catch (err) {
      console.error('Failed to update student status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const exportCsv = () => {
    if (!students || students.length === 0) return;
    const headers = ['Name', 'Username', 'Email', 'Roll Number', 'Branch', 'Graduation Year', 'CGPA', 'Backlogs', 'Readiness Score', 'Readiness Tier', 'Placement Status', 'Assigned Mentor'];
    const rows = students.map((s) => [
      `"${s.name || ''}"`,
      `"${s.username || ''}"`,
      `"${s.email || ''}"`,
      `"${s.rollNumber || ''}"`,
      `"${s.branch || ''}"`,
      s.graduationYear || '',
      s.cgpa || 0,
      s.activeBacklogs || 0,
      s.overallReadiness || 0,
      `"${s.readinessLevel || ''}"`,
      `"${s.placementStatus || ''}"`,
      `"${s.assignedMentor || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${organization?.name || 'institute'}_students_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="campusPanel">
      {/* Panel Header */}
      <div className="campusPanelHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>
            <FaGraduationCap color="#0a66c2" /> Manage Organization Students
          </h2>
          <p>
            Track and support all students enrolled under <strong>{organization?.name || 'your institution'}</strong>.
            Audit academic benchmarks, readiness tiers, and placement conversions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="campusTabBtn"
            onClick={exportCsv}
            disabled={students.length === 0}
            title="Export CSV roster"
          >
            <FaDownload size={12} /> Export CSV Roster
          </button>
          {onRefresh && (
            <button type="button" className="campusTabBtn active" onClick={onRefresh}>
              Refresh Roster
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="kpiGrid" style={{ marginBottom: 20 }}>
        <div className="kpiCard">
          <div className="kpiLabel">Total Enrolled Students</div>
          <div className="kpiValue">{stats?.totalStudents ?? students.length}</div>
          <div className="kpiSubtext">Registered under {organization?.name || 'Organization'}</div>
        </div>
        <div className="kpiCard">
          <div className="kpiLabel">Placed Students</div>
          <div className="kpiValue" style={{ color: '#16a34a' }}>
            {stats?.placedCount ?? 0}
          </div>
          <div className="kpiSubtext">
            {stats?.placementRatePercentage ?? 0}% Placement Conversion
          </div>
        </div>
        <div className="kpiCard">
          <div className="kpiLabel">Unplaced / In-Process</div>
          <div className="kpiValue" style={{ color: '#d97706' }}>
            {stats?.unplacedCount ?? 0}
          </div>
          <div className="kpiSubtext">Eligible for upcoming recruitment drives</div>
        </div>
        <div className="kpiCard">
          <div className="kpiLabel">Average Readiness</div>
          <div className="kpiValue" style={{ color: '#0a66c2' }}>
            {stats?.averageReadiness ?? 50}%
          </div>
          <div className="kpiSubtext">
            {stats?.readyCount ?? 0} students meet recruiter ready benchmarks
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div
        style={{
          background: '#f8fafc',
          padding: '14px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <FaSearch
            size={13}
            color="#94a3b8"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="chatInput"
            style={{ paddingLeft: 30 }}
            placeholder="Search name, roll, branch, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="chatInput"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Placement Statuses</option>
          <option value="unplaced">Unplaced</option>
          <option value="placed">Placed</option>
          <option value="offer_accepted">Offer Accepted</option>
          <option value="in_interview">In Interview</option>
        </select>

        <select
          className="chatInput"
          value={readinessFilter}
          onChange={(e) => setReadinessFilter(e.target.value)}
        >
          <option value="all">All Readiness Tiers</option>
          <option value="Highly Employable">Highly Employable (≥ 85%)</option>
          <option value="Ready">Ready (70 - 84%)</option>
          <option value="Developing">Developing (50 - 69%)</option>
          <option value="Not Ready">Not Ready (&lt; 50%)</option>
        </select>

        <select
          className="chatInput"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="all">All Departments / Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Students List / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading students roster...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <FaUserGraduate size={38} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#1e293b' }}>No Students Found</h3>
          <p style={{ fontSize: '0.9rem' }}>
            {searchTerm || statusFilter !== 'all' || readinessFilter !== 'all'
              ? 'No enrolled students match your active search filters.'
              : `No students are currently affiliated with ${organization?.name || 'this organization'}.`}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
              background: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px' }}>Student</th>
                <th style={{ padding: '12px 14px' }}>Roll Number</th>
                <th style={{ padding: '12px 14px' }}>Branch</th>
                <th style={{ padding: '12px 14px' }}>CGPA / Backlogs</th>
                <th style={{ padding: '12px 14px' }}>Readiness</th>
                <th style={{ padding: '12px 14px' }}>Placement Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
                <tr
                  key={st.profileId || st.userId || st.rollNumber}
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontWeight: 700,
                          color: '#0a66c2',
                        }}
                      >
                        {st.avatar ? (
                          <img src={st.avatar} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          st.name?.[0]?.toUpperCase() || 'S'
                        )}
                      </div>
                      <div>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{st.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {st.email || `@${st.username}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                    {st.rollNumber}
                  </td>

                  <td style={{ padding: '12px 14px', color: '#334155' }}>
                    {st.branch}
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <strong>{st.cgpa > 0 ? st.cgpa : '—'}</strong>
                    <span style={{ fontSize: '0.78rem', color: st.activeBacklogs > 0 ? '#dc2626' : '#64748b', display: 'block' }}>
                      {st.activeBacklogs > 0 ? `${st.activeBacklogs} Backlogs` : '0 Backlogs'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background:
                            st.overallReadiness >= 80
                              ? '#dcfce7'
                              : st.overallReadiness >= 65
                              ? '#e0f2fe'
                              : '#fef3c7',
                          color:
                            st.overallReadiness >= 80
                              ? '#15803d'
                              : st.overallReadiness >= 65
                              ? '#0369a1'
                              : '#b45309',
                        }}
                      >
                        {st.overallReadiness}%
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {st.readinessLevel}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background:
                          ['placed', 'offer_accepted'].includes(st.placementStatus)
                            ? '#dcfce7'
                            : st.placementStatus === 'in_interview'
                            ? '#e0f2fe'
                            : '#f1f5f9',
                        color:
                          ['placed', 'offer_accepted'].includes(st.placementStatus)
                            ? '#15803d'
                            : st.placementStatus === 'in_interview'
                            ? '#0369a1'
                            : '#475569',
                      }}
                    >
                      {['placed', 'offer_accepted'].includes(st.placementStatus) && <FaCheckCircle size={10} />}
                      {st.placementStatus === 'in_interview' && <FaClock size={10} />}
                      {st.placementStatus === 'offer_accepted'
                        ? 'Offer Accepted'
                        : st.placementStatus === 'placed'
                        ? 'Placed'
                        : st.placementStatus === 'in_interview'
                        ? 'In Interview'
                        : 'Unplaced'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="campusTabBtn"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      title="Update placement status"
                      onClick={() => handleOpenEdit(st)}
                    >
                      <FaEdit size={11} /> Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Student Status Modal */}
      {selectedStudent && (
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
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaEdit color="#0a66c2" /> Update Student Status
              </h3>
              <FaTimes style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(null)} />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px' }}>
              Update corporate placement progress and faculty mentor allocation for <strong>{selectedStudent.name}</strong> ({selectedStudent.rollNumber}).
            </p>

            <form onSubmit={handleSaveStatus}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Placement Status *
                </label>
                <select
                  className="chatInput"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="unplaced">Unplaced</option>
                  <option value="in_interview">In Interview</option>
                  <option value="placed">Placed</option>
                  <option value="offer_accepted">Offer Accepted</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Assigned Faculty Mentor
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="e.g. Dr. A. Sharma (HOD / Placement Coordinator)"
                  value={assignedMentor}
                  onChange={(e) => setAssignedMentor(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Placement Cell Recommendation / Notes
                </label>
                <textarea
                  className="chatInput"
                  rows="3"
                  placeholder="e.g. Recommended for FinTech campus drives; needs DSA brush-up."
                  value={mentorRecommendation}
                  onChange={(e) => setMentorRecommendation(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="campusTabBtn"
                  onClick={() => setSelectedStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="campusTabBtn active"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;

