import React, { useState } from 'react';
import {
  FaGraduationCap,
  FaSearch,
  FaDownload,
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaTimes,
  FaUserGraduate,
  FaUsers,
  FaAward,
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
    const headers = [
      'Name',
      'Username',
      'Email',
      'Roll Number',
      'Branch',
      'Graduation Year',
      'CGPA',
      'Backlogs',
      'Readiness Score',
      'Readiness Tier',
      'Placement Status',
      'Assigned Mentor',
    ];
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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${(organization?.name || 'institute').replace(/[^a-zA-Z0-9_-]/g, '_')}_students_roster.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="campusPanel">
      {/* Panel Header */}
      <div className="campusPanelHeader">
        <div>
          <h2>
            <FaGraduationCap color="#0a66c2" /> Manage Organization Students
          </h2>
          <p>
            Track and support all students enrolled under{' '}
            <strong>{organization?.name || 'your institution'}</strong>. Audit academic benchmarks,
            readiness tiers, and placement conversions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="campusTabBtn"
            onClick={exportCsv}
            disabled={students.length === 0}
            title="Export CSV roster"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FaDownload size={12} /> Export CSV Roster
          </button>
          {onRefresh && (
            <button
              type="button"
              className="campusTabBtn active"
              onClick={onRefresh}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FaSyncAlt size={12} /> Refresh Roster
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="campusKpiGrid">
        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <FaUsers size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Total Enrolled Students</h5>
            <p>{stats?.totalStudents ?? students.length}</p>
            <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>
              Enrolled in {organization?.name || 'Institution'}
            </small>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#dcfce7', color: '#166534' }}>
            <FaAward size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Placed Students</h5>
            <p style={{ color: '#16a34a' }}>{stats?.placedCount ?? 0}</p>
            <small style={{ color: '#166534', fontWeight: 600, fontSize: '0.75rem', marginTop: 3, display: 'block' }}>
              {stats?.placementRatePercentage ?? 0}% Placement Conversion
            </small>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FaClock size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Unplaced / In-Process</h5>
            <p style={{ color: '#d97706' }}>{stats?.unplacedCount ?? 0}</p>
            <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>
              Eligible for upcoming recruitment drives
            </small>
          </div>
        </div>

        <div className="campusKpiCard">
          <div className="campusKpiIconBox" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <FaChartLine size={22} />
          </div>
          <div className="campusKpiMeta">
            <h5>Average Readiness</h5>
            <p style={{ color: '#7e22ce' }}>{stats?.averageReadiness ?? 50}%</p>
            <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 3, display: 'block' }}>
              {stats?.readyCount ?? 0} students meet ready benchmarks
            </small>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="studentsFilterBar">
        <div className="studentsSearchBox">
          <FaSearch size={14} className="studentsSearchIcon" />
          <input
            type="text"
            className="studentsSearchInput"
            placeholder="Search student by name, roll number, branch, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="studentsClearSearch"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        <div className="studentsSelectGroup">
          <select
            className="studentsSelect"
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
            className="studentsSelect"
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
            className="studentsSelect"
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
      </div>

      {/* Students List / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <FaUserGraduate size={38} color="#0a66c2" style={{ marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
          <h3 style={{ color: '#1e293b' }}>Loading Students Roster...</h3>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="campusSubCard" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <FaUserGraduate size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#1e293b' }}>No Students Found</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: 460, margin: '6px auto 0' }}>
            {searchTerm || statusFilter !== 'all' || readinessFilter !== 'all' || branchFilter !== 'all'
              ? 'No enrolled students match your active search or filter criteria. Try clearing filters.'
              : `No students are currently affiliated with ${organization?.name || 'this organization'}.`}
          </p>
        </div>
      ) : (
        <div className="institutesTableCard">
          <div className="institutesTableCardHeader">
            <h3>
              <FaUserGraduate color="#0a66c2" /> Enrolled Students Directory ({filteredStudents.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredStudents.length} of {students.length} students
            </span>
          </div>

          <div className="institutesTableWrapper">
            <table className="institutesTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Branch & Degree</th>
                  <th>CGPA / Backlogs</th>
                  <th>AI Readiness</th>
                  <th>Placement Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.profileId || st.userId || st.rollNumber}>
                    <td>
                      <div className="instituteMetaCell">
                        {st.avatar ? (
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="instituteMetaLogo"
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              flexShrink: 0,
                            }}
                          >
                            {st.name?.[0]?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '0.92rem', display: 'block' }}>
                            {st.name}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {st.email || `@${st.username}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#1e293b',
                          fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.88rem',
                          background: '#f1f5f9',
                          padding: '3px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        {st.rollNumber}
                      </span>
                    </td>

                    <td>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.86rem' }}>
                        {st.branch}
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.76rem' }}>
                        Graduation {st.graduationYear}
                      </small>
                    </td>

                    <td>
                      <div>
                        <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                          {st.cgpa > 0 ? st.cgpa.toFixed(2) : '—'}
                        </strong>
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: st.activeBacklogs > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {st.activeBacklogs > 0 ? `⚠️ ${st.activeBacklogs} Backlogs` : '0 Backlogs'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className={`ratePill ${
                            st.overallReadiness >= 80
                              ? 'ratePillHigh'
                              : st.overallReadiness >= 65
                              ? 'ratePillMid'
                              : 'ratePillLow'
                          }`}
                        >
                          {st.overallReadiness}%
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                          {st.readinessLevel}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: ['placed', 'offer_accepted'].includes(st.placementStatus)
                            ? '#dcfce7'
                            : st.placementStatus === 'in_interview'
                            ? '#e0f2fe'
                            : '#f1f5f9',
                          color: ['placed', 'offer_accepted'].includes(st.placementStatus)
                            ? '#15803d'
                            : st.placementStatus === 'in_interview'
                            ? '#0369a1'
                            : '#475569',
                        }}
                      >
                        {['placed', 'offer_accepted'].includes(st.placementStatus) && (
                          <FaCheckCircle size={10} />
                        )}
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

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="campusTabBtn"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: '#0a66c2',
                        }}
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
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '1.1rem',
                }}
              >
                <FaEdit color="#0a66c2" /> Update Student Status
              </h3>
              <FaTimes
                style={{ cursor: 'pointer', color: '#64748b' }}
                onClick={() => setSelectedStudent(null)}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Update corporate placement progress and faculty mentor allocation for{' '}
              <strong>{selectedStudent.name}</strong> ({selectedStudent.rollNumber}).
            </p>

            <form onSubmit={handleSaveStatus}>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
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
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
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
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 5,
                  }}
                >
                  Placement Cell Recommendation / Notes
                </label>
                <textarea
                  className="chatInput"
                  rows="3"
                  placeholder="e.g. Recommended for FinTech campus drives; needs DSA brush-up."
                  value={mentorRecommendation}
                  onChange={(e) => setMentorRecommendation(e.target.value)}
                  style={{ resize: 'vertical' }}
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
