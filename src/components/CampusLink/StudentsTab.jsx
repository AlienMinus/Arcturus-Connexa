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
  FaFileInvoiceDollar,
  FaPaperPlane,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheck,
  FaExternalLinkAlt,
} from 'react-icons/fa';

export const StudentsTab = ({
  organization,
  students = [],
  stats = {},
  loading = false,
  onRefresh,
  onUpdateStudentStatus,
  onPushOffer,
  offers = [],
  onVerifyOffer,
  setActiveTab,
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

  // Push Offer Modal State
  const [pushOfferStudent, setPushOfferStudent] = useState(null);
  const [offerForm, setOfferForm] = useState({
    companyName: '',
    companyLogo: '',
    role: '',
    ctcLpa: '',
    offerType: 'Full-Time',
    acceptanceDeadline: '',
    joiningDate: '',
    bondDetails: 'None / No Service Agreement Bond',
  });
  const [isPushing, setIsPushing] = useState(false);

  // Document Verification Modal State
  const [verifyOffer, setVerifyOffer] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
    setMentorRecommendation(student.mentorActionRecommendation || '');
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

  const handleOpenPushOffer = (student) => {
    setPushOfferStudent(student);
    setOfferForm({
      companyName: '',
      companyLogo: '',
      role: 'Associate Software Engineer',
      ctcLpa: '8.5',
      offerType: 'Full-Time',
      acceptanceDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      joiningDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bondDetails: 'None / No Service Agreement Bond',
    });
  };

  const handleSubmitPushOffer = async (e) => {
    e.preventDefault();
    if (!pushOfferStudent || !onPushOffer) return;
    if (!offerForm.companyName.trim() || !offerForm.role.trim() || !offerForm.ctcLpa) return;

    setIsPushing(true);
    try {
      const ok = await onPushOffer({
        studentId: pushOfferStudent.userId,
        profileId: pushOfferStudent.profileId,
        companyName: offerForm.companyName.trim(),
        companyLogo: offerForm.companyLogo.trim() || 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
        role: offerForm.role.trim(),
        ctcLpa: Number(offerForm.ctcLpa),
        offerType: offerForm.offerType,
        acceptanceDeadline: offerForm.acceptanceDeadline,
        joiningDate: offerForm.joiningDate,
        bondDetails: offerForm.bondDetails,
      });
      if (ok) {
        setPushOfferStudent(null);
      }
    } catch (err) {
      console.error('Push offer error:', err);
    } finally {
      setIsPushing(false);
    }
  };

  const handleOpenVerifyDocsForStudent = (student) => {
    const matchingOffer = offers.find(
      (o) =>
        (o.studentId === student.userId || o.studentId?._id === student.userId || o.rollNumber === student.rollNumber) &&
        (o.status === 'accepted' || o.verificationStatus === 'pending')
    );
    if (matchingOffer) {
      setVerifyOffer(matchingOffer);
      setRejectionReason('');
    } else if (setActiveTab) {
      setActiveTab('offers');
    }
  };

  const handleExecuteVerification = async (action) => {
    if (!verifyOffer || !onVerifyOffer) return;
    setIsVerifying(true);
    try {
      const ok = await onVerifyOffer(verifyOffer._id, {
        action,
        rejectionReason: action === 'rejected' ? rejectionReason : undefined,
      });
      if (ok) {
        setVerifyOffer(null);
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return (
          <span className="ratePill ratePillHigh" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FaCheckCircle size={10} /> Placed
          </span>
        );
      case 'verification_pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            <FaClock size={10} /> Verify Docs
          </span>
        );
      case 'offer_accepted':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            <FaAward size={10} /> Offer Accepted
          </span>
        );
      case 'offer_pushed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            <FaPaperPlane size={10} /> Offer Pushed
          </span>
        );
      case 'in_interview':
      case 'interviewing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            <FaClock size={10} /> In Interview
          </span>
        );
      case 'shortlisted':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            ⭐ Shortlisted
          </span>
        );
      case 'opted_out':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            Opted Out
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '3px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 700 }}>
            Unplaced
          </span>
        );
    }
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
            <strong>{organization?.name || 'your institution'}</strong>. Push offers, manage status, and audit verification documents.
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
              Eligible for corporate recruitment drives
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
            <option value="shortlisted">Shortlisted</option>
            <option value="in_interview">In Interview</option>
            <option value="offer_pushed">Offer Pushed</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="verification_pending">Verification Pending</option>
            <option value="placed">Placed</option>
            <option value="opted_out">Opted Out</option>
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
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const studentHasPendingDocs =
                    st.placementStatus === 'verification_pending' ||
                    st.placementStatus === 'offer_accepted';
                  return (
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

                      <td>{renderStatusBadge(st.placementStatus)}</td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="campusTabBtn"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: '#0a66c2',
                            }}
                            title="Update placement status & mentor notes"
                            onClick={() => handleOpenEdit(st)}
                          >
                            <FaEdit size={11} /> Status
                          </button>

                          <button
                            type="button"
                            className="campusTabBtn"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: '#0284c7',
                            }}
                            title="Push official corporate placement offer"
                            onClick={() => handleOpenPushOffer(st)}
                          >
                            <FaPaperPlane size={11} /> Offer
                          </button>

                          {studentHasPendingDocs && (
                            <button
                              type="button"
                              className="campusTabBtn"
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                borderRadius: 6,
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#16a34a',
                              }}
                              title="Verify uploaded student documents"
                              onClick={() => handleOpenVerifyDocsForStudent(st)}
                            >
                              <FaCheckCircle size={11} /> Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Update Student Status Modal */}
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
                  <option value="shortlisted">Shortlisted for Drive</option>
                  <option value="in_interview">In Interview / Assessment</option>
                  <option value="offer_pushed">Offer Pushed</option>
                  <option value="offer_accepted">Offer Accepted (Pending Docs)</option>
                  <option value="verification_pending">Verification Pending (Docs Uploaded)</option>
                  <option value="placed">Placed</option>
                  <option value="opted_out">Opted Out / Higher Studies</option>
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

      {/* MODAL 2: Push Corporate Offer Modal */}
      {pushOfferStudent && (
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
                <FaPaperPlane color="#0a66c2" /> Push Corporate Placement Offer
              </h3>
              <FaTimes
                style={{ cursor: 'pointer', color: '#64748b' }}
                onClick={() => setPushOfferStudent(null)}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Push an official recruitment offer to <strong>{pushOfferStudent.name}</strong> ({pushOfferStudent.rollNumber} - {pushOfferStudent.branch}). The student will receive an instant notification to review and accept the offer.
            </p>

            <form onSubmit={handleSubmitPushOffer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="chatInput"
                    placeholder="e.g. Microsoft / TCS Digital"
                    value={offerForm.companyName}
                    onChange={(e) => setOfferForm({ ...offerForm, companyName: e.target.value })}
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
                    placeholder="e.g. SDE - 1"
                    value={offerForm.role}
                    onChange={(e) => setOfferForm({ ...offerForm, role: e.target.value })}
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
                    placeholder="e.g. 12.5"
                    value={offerForm.ctcLpa}
                    onChange={(e) => setOfferForm({ ...offerForm, ctcLpa: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Offer Type
                  </label>
                  <select
                    className="chatInput"
                    value={offerForm.offerType}
                    onChange={(e) => setOfferForm({ ...offerForm, offerType: e.target.value })}
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
                    value={offerForm.acceptanceDeadline}
                    onChange={(e) => setOfferForm({ ...offerForm, acceptanceDeadline: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Expected Joining Date
                  </label>
                  <input
                    type="date"
                    className="chatInput"
                    value={offerForm.joiningDate}
                    onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Service Bond / Compliance Terms
                </label>
                <input
                  type="text"
                  className="chatInput"
                  placeholder="e.g. 1 Year Service Agreement / No Bond"
                  value={offerForm.bondDetails}
                  onChange={(e) => setOfferForm({ ...offerForm, bondDetails: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="campusTabBtn"
                  onClick={() => setPushOfferStudent(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="campusTabBtn active"
                  disabled={isPushing}
                >
                  {isPushing ? 'Pushing Offer...' : 'Push Offer to Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Document Verification Modal */}
      {verifyOffer && (
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
              maxWidth: '540px',
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
                <FaCheckCircle color="#16a34a" /> Verify Student Documents
              </h3>
              <FaTimes
                style={{ cursor: 'pointer', color: '#64748b' }}
                onClick={() => setVerifyOffer(null)}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Candidate: <strong>{verifyOffer.studentName}</strong> ({verifyOffer.rollNumber}) · Company:{' '}
              <strong>{verifyOffer.companyName}</strong> (₹{verifyOffer.ctcLpa} LPA).
            </p>

            <div style={{ marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#334155' }}>Uploaded Documents:</h5>
              {verifyOffer.documents && verifyOffer.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {verifyOffer.documents.map((doc, idx) => (
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
                        <FaFileAlt color="#0a66c2" size={16} />
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{doc.name}</strong>
                          <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} · Status: {doc.status}
                          </small>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.78rem',
                          color: '#0a66c2',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        View File <FaExternalLinkAlt size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : verifyOffer.documentUrl ? (
                <a
                  href={verifyOffer.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0a66c2', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  View Attached Document File <FaExternalLinkAlt size={11} />
                </a>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  No files uploaded yet. Candidate has accepted offer.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                Rejection Feedback (Optional - required only if rejecting documents)
              </label>
              <input
                type="text"
                className="chatInput"
                placeholder="e.g. Unclear document scan / Signature missing on page 2"
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
                onClick={() => handleExecuteVerification('rejected')}
              >
                Reject Documents
              </button>
              <button
                type="button"
                className="campusTabBtn active"
                style={{ background: '#16a34a' }}
                disabled={isVerifying}
                onClick={() => handleExecuteVerification('verified')}
              >
                {isVerifying ? 'Verifying...' : 'Approve & Mark PLACED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsTab;
