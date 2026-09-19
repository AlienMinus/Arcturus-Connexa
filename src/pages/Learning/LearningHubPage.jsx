import React, { useState, useEffect } from 'react';
import { 
  FaBookOpen, 
  FaGraduationCap, 
  FaSearch, 
  FaStar, 
  FaClock, 
  FaUserGraduate, 
  FaPlayCircle, 
  FaCheckCircle, 
  FaAward, 
  FaFilter, 
  FaLayerGroup, 
  FaExternalLinkAlt, 
  FaTimes, 
  FaCertificate, 
  FaChalkboardTeacher, 
  FaShareAlt,
  FaFilePdf,
  FaCheck
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../utils/api';
import './LearningHubPage.css';

const CATEGORIES = [
  'All',
  'Communication',
  'Vocal Mastery',
  'Public Speaking',
  'Storytelling',
  'Executive Presence',
];

const CAREER_TRACKS = [
  {
    id: 'vocal-mastery',
    title: 'Executive Voice & Public Speaking Track',
    description: 'Master the 5 foundations of human voice: vocal melody, rate of speech, volume, projection, and strategic pausing with Vinh Giang.',
    coursesCount: 1,
    totalHours: '1.5 Hours',
    level: 'All Levels',
    iconColor: '#0284c7',
    iconBg: '#e0f2fe',
    badge: 'Masterclass Track',
    targetRoles: ['Keynote Speaker', 'Engineering Leader', 'Product Executive', 'Startup Founder'],
  },
  {
    id: 'clear-explaining',
    title: 'The CLEAR Explaining & Influence Framework',
    description: 'Simplify complex technical and abstract concepts with structured analogies, contextual anchors, and subtext listening.',
    coursesCount: 1,
    totalHours: '1.2 Hours',
    level: 'All Levels',
    iconColor: '#7e22ce',
    iconBg: '#f3e8ff',
    badge: 'High Impact Track',
    targetRoles: ['Technical Lead', 'Solutions Architect', 'Sales Engineer', 'Consultant'],
  },
  {
    id: 'high-pressure-presence',
    title: 'High-Pressure Presence & Q&A Mastery',
    description: 'Conquer speaking anxiety and imposter syndrome when all eyes are on you. Handle difficult boardroom questions with calm poise.',
    coursesCount: 1,
    totalHours: '1.0 Hours',
    level: 'All Levels',
    iconColor: '#16a34a',
    iconBg: '#dcfce7',
    badge: 'Leadership Mastery',
    targetRoles: ['Senior Manager', 'Director of Engineering', 'Executive', 'Interview Candidate'],
  },
];

const MOCK_QUIZ_QUESTIONS = [
  {
    question: 'According to Vinh Giang, what is the single most powerful vocal tool to build anticipation, project confidence, and eliminate filler words?',
    options: [
      'The strategic and intentional Pause',
      'Speaking as fast as possible to convey urgency',
      'Speaking in a high pitch monotone whisper',
      'Repeating words continuously'
    ],
    correctIndex: 0
  },
  {
    question: 'In Vinh Giang\'s Vocal Instrument concept, why do most people sound monotonous or unengaging?',
    options: [
      'Because they only play 2 or 3 notes on a piano that has 88 keys',
      'Because their microphone volume is too low',
      'Because they speak with too much melody and emotion',
      'Because their rate of speech is constantly changing'
    ],
    correctIndex: 0
  },
  {
    question: 'When asked a high-pressure question during a presentation or interview that you do not immediately know the answer to, what does Vinh Giang recommend?',
    options: [
      'Pause, acknowledge the question calmly, and structure your thought before answering',
      'Make up an immediate answer so there is never silence in the room',
      'Apologize and immediately conclude the meeting',
      'Avoid eye contact and talk faster'
    ],
    correctIndex: 0
  }
];

const LearningHubPage = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'mylearning' | 'tracks'
  const [courses, setCourses] = useState([]);
  const [myLearning, setMyLearning] = useState({ enrolled: [], certificates: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  // Course Player & Quiz Simulator Modals
  const [playerCourse, setPlayerCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizState, setQuizState] = useState({ open: false, currentQ: 0, answers: {}, passed: false });
  const [viewCertificate, setViewCertificate] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(buildApiUrl(`/learning/courses?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const fetchMyLearning = async () => {
    if (!token) return;
    try {
      const res = await fetch(buildApiUrl('/learning/my'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyLearning(data);
      }
    } catch (err) {
      console.error('Failed to load personal learning records:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCourses();
      if (token) await fetchMyLearning();
      setLoading(false);
    };
    init();
  }, [selectedCategory, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleEnroll = async (course) => {
    if (!token) {
      showToast('Please sign in to enroll in courses');
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/learning/enroll/${course._id}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`🎉 Enrolled in "${course.title}"!`);
        fetchMyLearning();
        openCoursePlayer(course);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to enroll');
      }
    } catch (err) {
      console.error('Enroll error:', err);
      showToast('Network error while enrolling');
    }
  };

  const openCoursePlayer = (course) => {
    setPlayerCourse(course);
    const firstLesson = course.modules?.[0]?.lessons?.[0] || { title: 'Welcome & Introduction', duration: '10m', summary: course.description };
    setActiveLesson(firstLesson);
  };

  const handleCompleteLesson = async () => {
    if (!playerCourse || !activeLesson) return;
    if (!token) {
      showToast('Please sign in to save your progress');
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/learning/progress/${playerCourse._id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonTitle: activeLesson.title }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Lesson completed! Course progress: ${data.progress}%`);
        fetchMyLearning();
      }
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  const handleLaunchQuiz = () => {
    setQuizState({ open: true, currentQ: 0, answers: {}, passed: false });
  };

  const handleQuizAnswer = (optionIndex) => {
    setQuizState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentQ]: optionIndex }
    }));
  };

  const handleQuizSubmit = async () => {
    const totalCorrect = MOCK_QUIZ_QUESTIONS.reduce((acc, q, idx) => {
      return acc + (quizState.answers[idx] === q.correctIndex ? 1 : 0);
    }, 0);

    const isPassed = totalCorrect >= 2;

    if (isPassed) {
      setQuizState((prev) => ({ ...prev, passed: true }));
      try {
        const res = await fetch(buildApiUrl(`/learning/progress/${playerCourse._id}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isExamPassed: true }),
        });

        if (res.ok) {
          const data = await res.json();
          showToast('🏆 Congratulations! You passed and earned your verified certificate!');
          fetchMyLearning();
          setViewCertificate({
            certificateId: data.certificateId || `ARC-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            courseTitle: playerCourse.title,
            instructorName: playerCourse.instructor?.name || 'Arcturus Senior Faculty',
            recipientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Verified Scholar',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          });
        }
      } catch (err) {
        console.error('Quiz completion error:', err);
      }
    } else {
      showToast(`Score: ${totalCorrect}/${MOCK_QUIZ_QUESTIONS.length}. Review lessons and retry!`);
    }
  };

  return (
    <div className="learningPageWrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="learningToast">
          <FaBookOpen size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="learningHeroBanner">
        <div className="learningHeroContent">
          <div className="learningHeroBadge">
            <FaGraduationCap size={14} /> Arcturus Executive Masterclasses
          </div>
          <h1>Master Executive Communication, Public Speaking & Vocal Dynamics</h1>
          <p>
            Learn the world-renowned frameworks of Vinh Giang. Master vocal melody, rate of speech, the power of the pause, and storytelling to captivate any audience with authority and warmth.
          </p>

          <form className="learningSearchBox" onSubmit={handleSearchSubmit}>
            <FaSearch className="learningSearchIcon" />
            <input
              type="text"
              placeholder="Search communication skills, vocal techniques, storytelling frameworks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="learningSearchBtn">Find Lessons</button>
          </form>
        </div>

        {/* Hero Highlights */}
        <div className="learningHeroStats">
          <div className="heroStatItem">
            <strong>{courses.length}</strong>
            <span>Active Courses</span>
          </div>
          <div className="heroStatDivider" />
          <div className="heroStatItem">
            <strong>{myLearning.enrolled?.length || 0}</strong>
            <span>Your Enrollments</span>
          </div>
          <div className="heroStatDivider" />
          <div className="heroStatItem">
            <strong>{myLearning.certificates?.length || 0}</strong>
            <span>Certificates Earned</span>
          </div>
          <div className="heroStatDivider" />
          <div className="heroStatItem">
            <strong>100%</strong>
            <span>Verified Credentials</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="learningNavContainer">
        <div className="learningTabsRow">
          <button
            type="button"
            className={`learningTabBtn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <FaBookOpen size={14} /> Explore All Courses
          </button>

          <button
            type="button"
            className={`learningTabBtn ${activeTab === 'mylearning' ? 'active' : ''}`}
            onClick={() => setActiveTab('mylearning')}
          >
            <FaUserGraduate size={14} /> My Learning & Certificates ({myLearning.enrolled?.length || 0})
          </button>

          <button
            type="button"
            className={`learningTabBtn ${activeTab === 'tracks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracks')}
          >
            <FaLayerGroup size={14} /> Structured Career Tracks
          </button>
        </div>
      </div>

      {/* TAB 1: EXPLORE COURSES */}
      {activeTab === 'explore' && (
        <div className="learningMainContent">
          {/* Category Filter Pills */}
          <div className="learningCategoryPills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`categoryPill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="learningLoading">Loading high-impact courses...</div>
          ) : courses.length === 0 ? (
            <div className="learningEmpty">
              <FaBookOpen size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
              <h3>No courses found for this filter</h3>
              <p>Try searching for a different skill or reset the category filter.</p>
              <button
                type="button"
                className="learningSearchBtn"
                style={{ marginTop: 12 }}
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="coursesGrid">
              {courses.map((course) => {
                const enrolledRecord = myLearning.enrolled?.find((e) => e._id === course._id);
                const isEnrolled = Boolean(enrolledRecord);

                return (
                  <div key={course._id} className="courseCard">
                    <div className="courseThumbnailWrapper">
                      <img
                        src={course.thumbnail || 'https://img.youtube.com/vi/FsxorSNJBaA/hqdefault.jpg'}
                        alt={course.title}
                        className="courseThumbnail"
                        onError={(e) => {
                          e.target.src = 'https://img.youtube.com/vi/FsxorSNJBaA/hqdefault.jpg';
                        }}
                      />
                      <span className="courseDurationBadge">
                        <FaClock size={11} /> {course.duration}
                      </span>
                      <span className={`courseLevelBadge ${course.level?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {course.level}
                      </span>
                    </div>

                    <div className="courseCardBody">
                      <div className="courseMetaRow">
                        <span className="courseCategoryTag">{course.category}</span>
                        <div className="courseRating">
                          <FaStar color="#f59e0b" size={13} />
                          <strong>{course.rating}</strong>
                          <span>({course.reviewsCount?.toLocaleString()})</span>
                        </div>
                      </div>

                      <h3 className="courseTitle" title={course.title}>
                        {course.title}
                      </h3>

                      <p className="courseDescription">{course.description}</p>

                      {/* Instructor Info */}
                      <div className="courseInstructorRow">
                        <img
                          src={course.instructor?.avatar}
                          alt={course.instructor?.name}
                          className="courseInstructorAvatar"
                        />
                        <div className="courseInstructorInfo">
                          <span className="instructorName">{course.instructor?.name}</span>
                          <span className="instructorRole">{course.instructor?.role}</span>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div className="courseSkillsRow">
                        {course.skills?.slice(0, 3).map((skill, sIdx) => (
                          <span key={sIdx} className="courseSkillTag">{skill}</span>
                        ))}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="courseCardFooter">
                        {isEnrolled ? (
                          <div style={{ width: '100%' }}>
                            <div className="enrollProgressHeader">
                              <span>Progress</span>
                              <strong>{enrolledRecord.progress || 0}%</strong>
                            </div>
                            <div className="enrollProgressBar">
                              <div
                                className="enrollProgressFill"
                                style={{ width: `${enrolledRecord.progress || 0}%` }}
                              />
                            </div>
                            <button
                              type="button"
                              className="courseEnrollBtn resume"
                              onClick={() => openCoursePlayer(course)}
                            >
                              <FaPlayCircle size={14} /> Resume Course
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="courseEnrollBtn"
                            onClick={() => handleEnroll(course)}
                          >
                            <FaBookOpen size={13} /> Enroll Free
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY LEARNING & CERTIFICATES */}
      {activeTab === 'mylearning' && (
        <div className="learningMainContent">
          <div className="myLearningSection">
            <h2>Enrolled Courses & Active Progress</h2>
            {!token ? (
              <div className="learningEmpty">
                <p>Please sign in to track your learning journey and view earned certificates.</p>
              </div>
            ) : myLearning.enrolled?.length === 0 ? (
              <div className="learningEmpty">
                <FaUserGraduate size={44} color="#94a3b8" style={{ marginBottom: 12 }} />
                <h3>No Active Enrollments</h3>
                <p>Browse our catalog of professional courses and enroll to boost your employability score.</p>
                <button
                  type="button"
                  className="learningSearchBtn"
                  style={{ marginTop: 12 }}
                  onClick={() => setActiveTab('explore')}
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="coursesGrid">
                {myLearning.enrolled.map((course) => (
                  <div key={course._id} className="courseCard">
                    <div className="courseThumbnailWrapper">
                      <img
                        src={course.thumbnail || 'https://img.youtube.com/vi/FsxorSNJBaA/hqdefault.jpg'}
                        alt={course.title}
                        className="courseThumbnail"
                        onError={(e) => {
                          e.target.src = 'https://img.youtube.com/vi/FsxorSNJBaA/hqdefault.jpg';
                        }}
                      />
                      <span className="courseDurationBadge">
                        <FaClock size={11} /> {course.duration}
                      </span>
                    </div>

                    <div className="courseCardBody">
                      <span className="courseCategoryTag">{course.category}</span>
                      <h3 className="courseTitle">{course.title}</h3>
                      <p className="instructorName">By {course.instructor?.name}</p>

                      <div className="enrollProgressHeader" style={{ marginTop: 14 }}>
                        <span>Completion</span>
                        <strong>{course.progress}%</strong>
                      </div>
                      <div className="enrollProgressBar">
                        <div
                          className="enrollProgressFill"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                          type="button"
                          className="courseEnrollBtn resume"
                          style={{ flex: 1 }}
                          onClick={() => {
                            const fullCourse = courses.find((c) => c._id === course._id) || course;
                            openCoursePlayer(fullCourse);
                          }}
                        >
                          <FaPlayCircle size={14} /> Continue
                        </button>

                        {course.progress >= 100 && course.certificateId && (
                          <button
                            type="button"
                            className="courseCertBtn"
                            title="View Certificate"
                            onClick={() => {
                              setViewCertificate({
                                certificateId: course.certificateId,
                                courseTitle: course.title,
                                instructorName: course.instructor?.name || 'Arcturus Learning Faculty',
                                recipientName: user?.name || 'Verified Member',
                                date: new Date(course.completedAt || Date.now()).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }),
                              });
                            }}
                          >
                            <FaAward size={15} color="#d97706" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Earned Certificates Showcase */}
          {token && myLearning.certificates?.length > 0 && (
            <div className="certificatesShowcaseSection">
              <h2>
                <FaAward color="#d97706" /> Verified Professional Credentials ({myLearning.certificates.length})
              </h2>
              <div className="certificatesGrid">
                {myLearning.certificates.map((cert, idx) => (
                  <div key={idx} className="certificateCard">
                    <div className="certCardHeader">
                      <FaCertificate size={24} color="#0a66c2" />
                      <div>
                        <strong>{cert.courseTitle}</strong>
                        <small>ID: {cert.certificateId}</small>
                      </div>
                    </div>
                    <div className="certCardFooter">
                      <span>Completed on {new Date(cert.completedAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        className="viewCertLinkBtn"
                        onClick={() => {
                          setViewCertificate({
                            certificateId: cert.certificateId,
                            courseTitle: cert.courseTitle,
                            instructorName: cert.instructorName,
                            recipientName: user?.name || 'Verified Member',
                            date: new Date(cert.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }),
                          });
                        }}
                      >
                        View Certificate <FaExternalLinkAlt size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAREER TRACKS */}
      {activeTab === 'tracks' && (
        <div className="learningMainContent">
          <div className="tracksIntro">
            <h2>Comprehensive Role-Based Learning Paths</h2>
            <p>
              Hand-crafted learning roadmaps engineered to take you from foundational understanding to senior mastery.
            </p>
          </div>

          <div className="careerTracksGrid">
            {CAREER_TRACKS.map((track) => (
              <div key={track.id} className="careerTrackCard">
                <div className="trackBadgeRow">
                  <span className="trackBadge">{track.badge}</span>
                  <span className="trackLevel">{track.level}</span>
                </div>

                <div className="trackIconBox" style={{ background: track.iconBg, color: track.iconColor }}>
                  <FaGraduationCap size={28} />
                </div>

                <h3>{track.title}</h3>
                <p>{track.description}</p>

                <div className="trackMetaRow">
                  <span><strong>{track.coursesCount}</strong> Courses</span>
                  <span><strong>{track.totalHours}</strong> Content</span>
                </div>

                <div className="targetRolesSection">
                  <strong>Prepares you for:</strong>
                  <div className="rolePillsRow">
                    {track.targetRoles.map((role, rIdx) => (
                      <span key={rIdx} className="rolePill">{role}</span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="startTrackBtn"
                  onClick={() => {
                    setActiveTab('explore');
                    setSelectedCategory('Cloud & DevOps');
                  }}
                >
                  Start Learning Track
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE COURSE PLAYER & SYLLABUS */}
      {playerCourse && (
        <div className="learningModalOverlay" onClick={() => setPlayerCourse(null)}>
          <div className="learningPlayerModal" onClick={(e) => e.stopPropagation()}>
            <div className="playerModalHeader">
              <div>
                <h3>{playerCourse.title}</h3>
                <small>{playerCourse.category} · Instructor: {playerCourse.instructor?.name}</small>
              </div>
              <button
                type="button"
                className="closeModalBtn"
                onClick={() => setPlayerCourse(null)}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="playerModalBody">
              {/* Left Column: Simulated Interactive Player */}
              <div className="playerScreenWrapper">
                <div className="playerSimulatorScreen">
                  {activeLesson?.videoUrl ? (
                    <div className="videoEmbedContainer">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${activeLesson.videoUrl}?autoplay=1&rel=0`}
                        title={activeLesson.title}
                        className="courseVideoIframe"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="videoScreenSimulation">
                      <FaPlayCircle size={54} color="#ffffff" className="playSimulationIcon" />
                      <span className="videoSimulationText">Interactive Course Video Player</span>
                      <span className="currentLessonTitle">Current: {activeLesson?.title}</span>
                    </div>
                  )}
                  <div className="playerControlBar">
                    <div className="playerControlsRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc', fontSize: '0.84rem' }}>
                        <FaPlayCircle size={14} color="#38bdf8" /> Duration: {activeLesson?.duration || '20m'} · Vinh Giang Masterclass
                      </span>
                      <button
                        type="button"
                        className="markCompleteBtn"
                        onClick={handleCompleteLesson}
                      >
                        <FaCheck size={12} /> Mark Lesson Complete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lesson Summary & Notes */}
                <div className="lessonSummaryCard">
                  <h4>Lesson Overview: {activeLesson?.title}</h4>
                  <p>{activeLesson?.summary || playerCourse.description}</p>

                  <div className="interactiveAssessmentTrigger">
                    <div>
                      <strong>Final Certification Assessment</strong>
                      <p>Complete the 3-question knowledge check to earn your verified credential.</p>
                    </div>
                    <button
                      type="button"
                      className="launchQuizBtn"
                      onClick={handleLaunchQuiz}
                    >
                      <FaAward size={14} /> Take Knowledge Quiz
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Syllabus & Modules Accordion */}
              <div className="playerSyllabusSidebar">
                <h4>Course Syllabus ({playerCourse.modules?.length || 1} Modules)</h4>
                <div className="syllabusList">
                  {playerCourse.modules?.map((mod, mIdx) => (
                    <div key={mIdx} className="syllabusModuleCard">
                      <div className="syllabusModuleTitle">
                        <strong>Module {mIdx + 1}:</strong> {mod.title}
                      </div>
                      <div className="moduleLessonsList">
                        {mod.lessons?.map((les, lIdx) => (
                          <div
                            key={lIdx}
                            className={`moduleLessonItem ${activeLesson?.title === les.title ? 'active' : ''}`}
                            onClick={() => setActiveLesson(les)}
                          >
                            <FaPlayCircle size={12} color="#0a66c2" />
                            <div className="lessonMetaText">
                              <span>{les.title}</span>
                              <small>{les.duration}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KNOWLEDGE QUIZ */}
      {quizState.open && (
        <div className="learningModalOverlay" onClick={() => setQuizState({ ...quizState, open: false })}>
          <div className="quizModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="playerModalHeader">
              <h3>Certification Knowledge Check</h3>
              <button
                type="button"
                className="closeModalBtn"
                onClick={() => setQuizState({ ...quizState, open: false })}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="quizModalBody">
              <div className="quizProgress">
                Question {quizState.currentQ + 1} of {MOCK_QUIZ_QUESTIONS.length}
              </div>

              <div className="quizQuestionText">
                {MOCK_QUIZ_QUESTIONS[quizState.currentQ].question}
              </div>

              <div className="quizOptionsList">
                {MOCK_QUIZ_QUESTIONS[quizState.currentQ].options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`quizOptionItem ${quizState.answers[quizState.currentQ] === oIdx ? 'selected' : ''}`}
                    onClick={() => handleQuizAnswer(oIdx)}
                  >
                    <span className="quizOptionLetter">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>

              <div className="quizModalFooter">
                {quizState.currentQ > 0 && (
                  <button
                    type="button"
                    className="learningTabBtn"
                    onClick={() => setQuizState({ ...quizState, currentQ: quizState.currentQ - 1 })}
                  >
                    Previous
                  </button>
                )}

                {quizState.currentQ < MOCK_QUIZ_QUESTIONS.length - 1 ? (
                  <button
                    type="button"
                    className="learningSearchBtn"
                    disabled={quizState.answers[quizState.currentQ] === undefined}
                    onClick={() => setQuizState({ ...quizState, currentQ: quizState.currentQ + 1 })}
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    className="courseEnrollBtn"
                    disabled={quizState.answers[quizState.currentQ] === undefined}
                    onClick={handleQuizSubmit}
                  >
                    Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED CERTIFICATE DISPLAY */}
      {viewCertificate && (
        <div className="learningModalOverlay" onClick={() => setViewCertificate(null)}>
          <div className="certificateModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="certModalHeaderRow">
              <h3>Verified Digital Credential</h3>
              <button
                type="button"
                className="closeModalBtn"
                onClick={() => setViewCertificate(null)}
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Certificate Certificate Canvas Frame */}
            <div className="certificateDiplomaFrame" id="printableCertificate">
              <div className="certInnerBorder">
                <div className="certTopBrand">
                  <FaGraduationCap size={36} color="#0a66c2" />
                  <h2>ARCTURUS LEARNING</h2>
                  <p>CERTIFICATE OF TECHNICAL EXCELLENCE & COMPLETION</p>
                </div>

                <div className="certBodyText">
                  This is to proudly certify that
                  <h3>{viewCertificate.recipientName}</h3>
                  has demonstrated rigorous mastery of engineering competencies and successfully completed all syllabus requirements for
                  <h4>{viewCertificate.courseTitle}</h4>
                </div>

                <div className="certSignaturesRow">
                  <div className="certSignatureBlock">
                    <div className="certSignatureLine">{viewCertificate.instructorName}</div>
                    <span>Course Instructor</span>
                  </div>

                  <div className="certSealBadge">
                    <FaAward size={32} color="#b45309" />
                    <span>VERIFIED</span>
                  </div>

                  <div className="certSignatureBlock">
                    <div className="certSignatureLine">{viewCertificate.date}</div>
                    <span>Date of Completion</span>
                  </div>
                </div>

                <div className="certFooterMeta">
                  <span>Certificate ID: <strong>{viewCertificate.certificateId}</strong></span>
                  <span>Issued by Arcturus Professional Learning Institute</span>
                </div>
              </div>
            </div>

            <div className="certificateActionsRow">
              <button
                type="button"
                className="learningSearchBtn"
                onClick={() => window.print()}
              >
                <FaFilePdf size={14} /> Print / Save as PDF
              </button>
              <button
                type="button"
                className="learningTabBtn"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('📋 Credential link copied to clipboard!');
                }}
              >
                <FaShareAlt size={13} /> Share Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningHubPage;

