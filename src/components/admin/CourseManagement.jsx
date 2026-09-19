import React, { useState, useEffect } from 'react';
import { 
  FaBookOpen, 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaExternalLinkAlt, 
  FaSearch, 
  FaPlayCircle, 
  FaClock, 
  FaUsers, 
  FaStar, 
  FaCheckCircle, 
  FaGraduationCap, 
  FaTimes, 
  FaLayerGroup, 
  FaVideo, 
  FaSyncAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';

const CATEGORIES = [
  'Communication',
  'Cloud & DevOps',
  'AI & Machine Learning',
  'Full Stack Development',
  'System Design',
  'Leadership & Management',
  'Data Engineering',
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const CourseManagement = ({ token, showToast, onStatsUpdate }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'curriculum'
  const [expandedModules, setExpandedModules] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    slug: '',
    description: '',
    category: 'Communication',
    level: 'All Levels',
    duration: '1h 30m',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    instructor: {
      name: 'Vinh Giang',
      role: 'International Keynote Speaker & Masterclass Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    skills: 'Public Speaking, Vocal Pitch, Executive Presence',
    modules: [
      {
        title: 'Module 1: Foundations',
        lessons: [
          {
            title: 'Lesson 1: Introduction & Vocal Mastery',
            duration: '15m',
            videoUrl: '',
            summary: 'Core techniques and exercises to project your voice with authentic warmth.',
          },
        ],
      },
    ],
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (levelFilter !== 'all') params.append('level', levelFilter);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(buildApiUrl(`/admin/courses?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      } else {
        showToast('Failed to load courses.');
      }
    } catch (err) {
      console.error('Error fetching admin courses:', err);
      showToast('Network error while loading courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [categoryFilter, levelFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setModalTab('details');
    setFormData({
      _id: '',
      title: '',
      slug: '',
      description: '',
      category: 'Communication',
      level: 'All Levels',
      duration: '1h 30m',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      instructor: {
        name: 'Vinh Giang',
        role: 'Keynote Speaker & Communication Coach',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      skills: 'Vocal Clarity, Executive Presence, Influence',
      modules: [
        {
          title: 'Module 1: Foundations',
          lessons: [
            {
              title: 'Lesson 1: Getting Started',
              duration: '15m',
              videoUrl: '',
              summary: 'Overview of the course goals and foundational principles.',
            },
          ],
        },
      ],
    });
    setExpandedModules({ 0: true });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (course) => {
    setModalMode('edit');
    setModalTab('details');
    setFormData({
      _id: course._id,
      title: course.title || '',
      slug: course.slug || '',
      description: course.description || '',
      category: course.category || 'Communication',
      level: course.level || 'All Levels',
      duration: course.duration || '1h 30m',
      thumbnail: course.thumbnail || '',
      instructor: {
        name: course.instructor?.name || '',
        role: course.instructor?.role || '',
        avatar: course.instructor?.avatar || '',
      },
      skills: Array.isArray(course.skills) ? course.skills.join(', ') : (course.skills || ''),
      modules: (course.modules || []).map((m) => ({
        title: m.title || '',
        lessons: (m.lessons || []).map((l) => ({
          title: l.title || '',
          duration: l.duration || '15m',
          videoUrl: l.videoUrl || '',
          summary: l.summary || '',
        })),
      })),
    });

    const initExpanded = {};
    (course.modules || []).forEach((_, idx) => {
      initExpanded[idx] = true;
    });
    setExpandedModules(initExpanded);
    setIsModalOpen(true);
  };

  // Delete Course
  const handleDeleteCourse = async (courseId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setActionLoading(courseId);
    try {
      const res = await fetch(buildApiUrl(`/admin/courses/${courseId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Course deleted successfully.');
        fetchCourses();
        onStatsUpdate?.();
      } else {
        showToast(data.error || 'Failed to delete course.');
      }
    } catch (err) {
      showToast('Network error while deleting course.');
    } finally {
      setActionLoading(null);
    }
  };

  // Re-seed Masterclasses
  const handleSeedMasterclasses = async () => {
    setActionLoading('seed');
    try {
      const res = await fetch(buildApiUrl('/admin/courses/seed-defaults'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      showToast(data.message || 'Seeded masterclasses.');
      fetchCourses();
      onStatsUpdate?.();
    } catch (err) {
      showToast('Failed to seed masterclasses.');
    } finally {
      setActionLoading(null);
    }
  };

  // Form handlers
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstructorChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      instructor: { ...prev.instructor, [field]: value },
    }));
  };

  // Module Management
  const handleAddModule = () => {
    setFormData((prev) => {
      const newModules = [
        ...prev.modules,
        {
          title: `Module ${prev.modules.length + 1}: Core Concepts`,
          lessons: [
            {
              title: `Lesson 1: Introduction`,
              duration: '15m',
              videoUrl: '',
              summary: '',
            },
          ],
        },
      ];
      setExpandedModules((e) => ({ ...e, [newModules.length - 1]: true }));
      return { ...prev, modules: newModules };
    });
  };

  const handleRemoveModule = (mIdx) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== mIdx),
    }));
  };

  const handleModuleTitleChange = (mIdx, title) => {
    setFormData((prev) => {
      const newModules = [...prev.modules];
      newModules[mIdx] = { ...newModules[mIdx], title };
      return { ...prev, modules: newModules };
    });
  };

  const toggleModuleExpand = (mIdx) => {
    setExpandedModules((prev) => ({ ...prev, [mIdx]: !prev[mIdx] }));
  };

  // Lesson Management
  const handleAddLesson = (mIdx) => {
    setFormData((prev) => {
      const newModules = [...prev.modules];
      const lessons = [
        ...(newModules[mIdx].lessons || []),
        {
          title: `Lesson ${(newModules[mIdx].lessons?.length || 0) + 1}`,
          duration: '15m',
          videoUrl: '',
          summary: '',
        },
      ];
      newModules[mIdx] = { ...newModules[mIdx], lessons };
      return { ...prev, modules: newModules };
    });
  };

  const handleRemoveLesson = (mIdx, lIdx) => {
    setFormData((prev) => {
      const newModules = [...prev.modules];
      newModules[mIdx] = {
        ...newModules[mIdx],
        lessons: newModules[mIdx].lessons.filter((_, idx) => idx !== lIdx),
      };
      return { ...prev, modules: newModules };
    });
  };

  const handleLessonFieldChange = (mIdx, lIdx, field, value) => {
    setFormData((prev) => {
      const newModules = [...prev.modules];
      const lessons = [...newModules[mIdx].lessons];
      lessons[lIdx] = { ...lessons[lIdx], [field]: value };
      newModules[mIdx] = { ...newModules[mIdx], lessons };
      return { ...prev, modules: newModules };
    });
  };

  // Extract YouTube ID if full URL pasted
  const sanitizeVideoUrl = (input) => {
    if (!input) return '';
    const trimmed = input.trim();
    // YouTube match: v=ID, youtu.be/ID, embed/ID
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : trimmed;
  };

  // Submit Modal
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a course title.');
      return;
    }
    if (!formData.description.trim()) {
      showToast('Please enter a course description.');
      return;
    }

    // Sanitize lesson video URLs
    const sanitizedModules = formData.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        ...l,
        videoUrl: sanitizeVideoUrl(l.videoUrl),
      })),
    }));

    const payload = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      category: formData.category,
      level: formData.level,
      duration: formData.duration,
      thumbnail: formData.thumbnail,
      instructor: formData.instructor,
      skills: formData.skills,
      modules: sanitizedModules,
    };

    setActionLoading('saving');
    try {
      const url = modalMode === 'create'
        ? buildApiUrl('/admin/courses')
        : buildApiUrl(`/admin/courses/${formData._id}`);
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (modalMode === 'create' ? 'Course created!' : 'Course updated!'));
        setIsModalOpen(false);
        fetchCourses();
        onStatsUpdate?.();
      } else {
        showToast(data.error || 'Failed to save course.');
      }
    } catch (err) {
      showToast('Network error while saving course.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="adminSectionPanel">
      {/* Section Header */}
      <div className="adminSectionHeader courseManagementHeader">
        <div>
          <h2>Course Management & Masterclasses</h2>
          <p>
            Create, curate modules & lessons, upload video references, and monitor learners across Arcturus Learning Hub.
          </p>
        </div>

        <div className="courseHeaderActionGroup">
          <button
            type="button"
            className="adminSecondaryBtn seedBtn"
            onClick={handleSeedMasterclasses}
            disabled={actionLoading === 'seed'}
            title="Seed Vinh Giang Communication Masterclasses"
          >
            <FaSyncAlt size={12} className={actionLoading === 'seed' ? 'spin' : ''} />
            <span>Seed Masterclasses</span>
          </button>

          <button
            type="button"
            className="adminPrimaryBtn createCourseBtn"
            onClick={handleOpenCreate}
          >
            <FaPlus size={13} />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="courseFiltersBar">
        <form className="courseSearchForm" onSubmit={handleSearchSubmit}>
          <FaSearch size={14} className="courseSearchIcon" />
          <input
            type="text"
            placeholder="Search course title, instructor, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="courseSelectFilters">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="adminSelectFilter"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="adminSelectFilter"
            aria-label="Filter by level"
          >
            <option value="all">All Levels</option>
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="adminLoadingState">
          <div className="adminSpinner" />
          <p>Loading course catalog...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="adminEmptyState">
          <FaBookOpen size={48} color="#94a3b8" />
          <h4>No Courses Found</h4>
          <p>
            {searchQuery || categoryFilter !== 'all' || levelFilter !== 'all'
              ? 'No courses match the selected filters. Try clearing your search.'
              : 'There are currently no courses in the catalog. Click "Create Course" or "Seed Masterclasses" to get started.'}
          </p>
          <button
            type="button"
            className="adminPrimaryBtn"
            onClick={handleSeedMasterclasses}
            style={{ marginTop: '14px' }}
          >
            <FaSyncAlt size={13} /> Seed Vinh Giang Masterclasses
          </button>
        </div>
      ) : (
        <div className="adminCoursesGrid">
          {courses.map((course) => (
            <article key={course._id} className="adminCourseCard">
              <div className="courseCardThumbWrapper">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'}
                  alt={course.title}
                  className="courseCardThumb"
                />
                <span className="courseDurationBadge">
                  <FaClock size={11} /> {course.duration || '1h 30m'}
                </span>
                <span className="courseCategoryBadge">
                  {course.category}
                </span>
              </div>

              <div className="adminCourseContent">
                <div className="courseTitleRow">
                  <h3 className="courseCardTitle" title={course.title}>
                    {course.title}
                  </h3>
                  <span className="courseLevelPill">{course.level || 'All Levels'}</span>
                </div>

                <p className="courseCardDesc">
                  {course.description}
                </p>

                {/* Instructor Pill */}
                <div className="courseInstructorRow">
                  <img
                    src={course.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={course.instructor?.name || 'Instructor'}
                    className="courseInstructorAvatar"
                  />
                  <div className="courseInstructorMeta">
                    <strong>{course.instructor?.name || 'Arcturus Masterclass Coach'}</strong>
                    <small>{course.instructor?.role || 'Lead Instructor'}</small>
                  </div>
                </div>

                {/* Metrics ribbon */}
                <div className="courseStatsRibbon">
                  <div className="courseStatItem">
                    <FaLayerGroup size={12} color="#0a66c2" />
                    <span><strong>{course.modulesCount || 0}</strong> modules</span>
                  </div>
                  <div className="courseStatItem">
                    <FaVideo size={12} color="#0a66c2" />
                    <span><strong>{course.lessonsCount || 0}</strong> lessons</span>
                  </div>
                  <div className="courseStatItem">
                    <FaUsers size={12} color="#16a34a" />
                    <span><strong>{course.learnersCount || course.enrolledCount || 0}</strong> learners</span>
                  </div>
                  <div className="courseStatItem">
                    <FaStar size={12} color="#f59e0b" />
                    <span><strong>{course.rating || 4.9}</strong> ({course.reviewsCount || 0})</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="courseCardActions">
                  <button
                    type="button"
                    className="courseEditBtn"
                    onClick={() => handleOpenEdit(course)}
                    title="Edit course curriculum & metadata"
                  >
                    <FaEdit size={13} /> Edit
                  </button>

                  <Link
                    to={`/learning`}
                    target="_blank"
                    rel="noreferrer"
                    className="coursePreviewBtn"
                    title="Open Learning Hub in a new tab"
                  >
                    <FaExternalLinkAlt size={12} /> View in Hub
                  </Link>

                  <button
                    type="button"
                    className="courseDeleteBtn"
                    onClick={() => handleDeleteCourse(course._id, course.title)}
                    disabled={actionLoading === course._id}
                    title="Delete course"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ===================================================
          COURSE CREATE / EDIT MODAL
          =================================================== */}
      {isModalOpen && (
        <div className="adminModalOverlay" onClick={() => setIsModalOpen(false)}>
          <div className="adminModalContainer courseEditorModal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="adminModalHeader">
              <div>
                <h3>{modalMode === 'create' ? 'Create New Course' : `Edit Course: ${formData.title}`}</h3>
                <p>Curate masterclass details, instructor profile, modules, and video lessons.</p>
              </div>
              <button
                type="button"
                className="adminModalCloseBtn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="courseModalTabs">
              <button
                type="button"
                className={`courseModalTabBtn ${modalTab === 'details' ? 'active' : ''}`}
                onClick={() => setModalTab('details')}
              >
                <FaBookOpen size={14} /> Course Details & Instructor
              </button>
              <button
                type="button"
                className={`courseModalTabBtn ${modalTab === 'curriculum' ? 'active' : ''}`}
                onClick={() => setModalTab('curriculum')}
              >
                <FaLayerGroup size={14} /> Curriculum Builder ({formData.modules.length} Modules)
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="courseModalForm">
              <div className="courseModalBody">
                {/* TAB 1: DETAILS & INSTRUCTOR */}
                {modalTab === 'details' && (
                  <div className="courseTabContent">
                    <div className="courseFormGrid">
                      <div className="formGroup fullWidth">
                        <label>Course Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleFormChange('title', e.target.value)}
                          placeholder="e.g. The Art of Communication: Vocal Mastery"
                          required
                        />
                      </div>

                      <div className="formGroup">
                        <label>Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => handleFormChange('category', e.target.value)}
                          required
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="formGroup">
                        <label>Level</label>
                        <select
                          value={formData.level}
                          onChange={(e) => handleFormChange('level', e.target.value)}
                        >
                          {LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>

                      <div className="formGroup">
                        <label>Total Duration</label>
                        <input
                          type="text"
                          value={formData.duration}
                          onChange={(e) => handleFormChange('duration', e.target.value)}
                          placeholder="e.g. 1h 45m"
                        />
                      </div>

                      <div className="formGroup">
                        <label>Custom URL Slug (Optional)</label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => handleFormChange('slug', e.target.value)}
                          placeholder="e.g. vocal-mastery-communication"
                        />
                      </div>

                      <div className="formGroup fullWidth">
                        <label>Thumbnail Image URL</label>
                        <div className="thumbInputRow">
                          <input
                            type="url"
                            value={formData.thumbnail}
                            onChange={(e) => handleFormChange('thumbnail', e.target.value)}
                            placeholder="https://..."
                          />
                          {formData.thumbnail && (
                            <img
                              src={formData.thumbnail}
                              alt="Preview"
                              className="thumbPreviewMini"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="formGroup fullWidth">
                        <label>Description *</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Provide a compelling overview of what students will achieve..."
                          required
                        />
                      </div>

                      <div className="formGroup fullWidth">
                        <label>Skills Taught (comma-separated)</label>
                        <input
                          type="text"
                          value={formData.skills}
                          onChange={(e) => handleFormChange('skills', e.target.value)}
                          placeholder="e.g. Public Speaking, Vocal Clarity, High-Pressure Q&A"
                        />
                      </div>
                    </div>

                    {/* Instructor Section */}
                    <div className="instructorSubSection">
                      <h4>Instructor Profile</h4>
                      <div className="courseFormGrid">
                        <div className="formGroup">
                          <label>Instructor Name</label>
                          <input
                            type="text"
                            value={formData.instructor.name}
                            onChange={(e) => handleInstructorChange('name', e.target.value)}
                            placeholder="e.g. Vinh Giang"
                          />
                        </div>

                        <div className="formGroup">
                          <label>Instructor Headline / Role</label>
                          <input
                            type="text"
                            value={formData.instructor.role}
                            onChange={(e) => handleInstructorChange('role', e.target.value)}
                            placeholder="e.g. Keynote Speaker & Communication Coach"
                          />
                        </div>

                        <div className="formGroup fullWidth">
                          <label>Instructor Avatar URL</label>
                          <div className="thumbInputRow">
                            <input
                              type="url"
                              value={formData.instructor.avatar}
                              onChange={(e) => handleInstructorChange('avatar', e.target.value)}
                              placeholder="https://..."
                            />
                            {formData.instructor.avatar && (
                              <img
                                src={formData.instructor.avatar}
                                alt="Instructor preview"
                                className="instructorAvatarMini"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CURRICULUM BUILDER */}
                {modalTab === 'curriculum' && (
                  <div className="courseTabContent">
                    <div className="curriculumBuilderHeader">
                      <div>
                        <h4>Modules & Video Lessons</h4>
                        <p>Organize lessons into modules. Paste YouTube video IDs (e.g. <code>FsxorSNJBaA</code>) or full YouTube links.</p>
                      </div>
                      <button
                        type="button"
                        className="adminSecondaryBtn addModuleBtn"
                        onClick={handleAddModule}
                      >
                        <FaPlus size={12} /> Add Module
                      </button>
                    </div>

                    <div className="modulesAccordionList">
                      {formData.modules.map((mod, mIdx) => (
                        <div key={mIdx} className="moduleAccordionCard">
                          <div className="moduleAccordionHeader" onClick={() => toggleModuleExpand(mIdx)}>
                            <div className="moduleTitleInputWrapper" onClick={(e) => e.stopPropagation()}>
                              <span className="moduleIndexBadge">{mIdx + 1}</span>
                              <input
                                type="text"
                                value={mod.title}
                                onChange={(e) => handleModuleTitleChange(mIdx, e.target.value)}
                                placeholder="Module title..."
                                className="moduleTitleInput"
                              />
                            </div>

                            <div className="moduleHeaderRight" onClick={(e) => e.stopPropagation()}>
                              <span className="lessonCountPill">{mod.lessons.length} lessons</span>
                              <button
                                type="button"
                                className="removeModuleBtn"
                                onClick={() => handleRemoveModule(mIdx)}
                                title="Delete this module"
                                disabled={formData.modules.length <= 1}
                              >
                                <FaTrash size={12} />
                              </button>
                              <button
                                type="button"
                                className="toggleExpandBtn"
                                onClick={() => toggleModuleExpand(mIdx)}
                              >
                                {expandedModules[mIdx] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          {expandedModules[mIdx] && (
                            <div className="moduleAccordionBody">
                              <div className="lessonsList">
                                {mod.lessons.map((lesson, lIdx) => (
                                  <div key={lIdx} className="lessonBuilderItem">
                                    <div className="lessonItemHeader">
                                      <span className="lessonBulletNumber">{lIdx + 1}</span>
                                      <input
                                        type="text"
                                        value={lesson.title}
                                        onChange={(e) => handleLessonFieldChange(mIdx, lIdx, 'title', e.target.value)}
                                        placeholder="Lesson Title (e.g. How to Speak Better Than 99% of People)"
                                        className="lessonTitleInput"
                                        required
                                      />
                                      <button
                                        type="button"
                                        className="removeLessonBtn"
                                        onClick={() => handleRemoveLesson(mIdx, lIdx)}
                                        title="Remove lesson"
                                        disabled={mod.lessons.length <= 1}
                                      >
                                        <FaTimes size={13} />
                                      </button>
                                    </div>

                                    <div className="lessonFieldsGrid">
                                      <div className="lessonField">
                                        <label>
                                          <FaVideo size={11} /> YouTube Video URL or ID
                                        </label>
                                        <input
                                          type="text"
                                          value={lesson.videoUrl}
                                          onChange={(e) => handleLessonFieldChange(mIdx, lIdx, 'videoUrl', e.target.value)}
                                          placeholder="e.g. FsxorSNJBaA or https://youtu.be/..."
                                        />
                                      </div>

                                      <div className="lessonField">
                                        <label>
                                          <FaClock size={11} /> Duration
                                        </label>
                                        <input
                                          type="text"
                                          value={lesson.duration}
                                          onChange={(e) => handleLessonFieldChange(mIdx, lIdx, 'duration', e.target.value)}
                                          placeholder="e.g. 18m"
                                        />
                                      </div>

                                      <div className="lessonField fullWidth">
                                        <label>Lesson Summary / Takeaways</label>
                                        <input
                                          type="text"
                                          value={lesson.summary}
                                          onChange={(e) => handleLessonFieldChange(mIdx, lIdx, 'summary', e.target.value)}
                                          placeholder="Key concepts covered in this video..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                className="addLessonBtn"
                                onClick={() => handleAddLesson(mIdx)}
                              >
                                <FaPlus size={11} /> Add Lesson to Module {mIdx + 1}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="adminModalFooter">
                <button
                  type="button"
                  className="adminSecondaryBtn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adminPrimaryBtn"
                  disabled={actionLoading === 'saving'}
                >
                  <FaCheckCircle size={13} />
                  <span>{actionLoading === 'saving' ? 'Saving Course...' : modalMode === 'create' ? 'Create Course' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseManagement;
