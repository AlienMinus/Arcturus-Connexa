import React, { useState, useEffect, useRef } from 'react';
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
  FaCheck,
  FaPlay,
  FaPause,
  FaUndo,
  FaRedo,
  FaVolumeUp,
  FaVolumeMute,
  FaLock,
  FaUnlock,
  FaStepForward,
  FaStepBackward,
  FaShieldAlt
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
    totalHours: '1.6 Hours',
    level: 'All Levels',
    iconColor: '#0284c7',
    iconBg: '#e0f2fe',
    badge: 'Masterclass Track',
    targetRoles: ['Keynote Speaker', 'Engineering Leader', 'Product Executive', 'Startup Founder'],
    courseSlug: 'vinh-giang-vocal-mastery-communication',
  },
  {
    id: 'effortless-conversation',
    title: 'Effortless Conversation & Subtext Listening Track',
    description: 'Learn how to make every conversation feel natural, break awkward silences, read emotional subtext, and connect authentically with anyone.',
    coursesCount: 1,
    totalHours: '1.25 Hours',
    level: 'Beginner to Intermediate',
    iconColor: '#059669',
    iconBg: '#d1fae5',
    badge: 'Conversational Agility',
    targetRoles: ['Product Manager', 'Client Facing Lead', 'Team Manager', 'Recruiter'],
    courseSlug: 'vinh-giang-effortless-conversation-listening',
  },
  {
    id: 'executive-influence',
    title: 'Executive Influence & Difficult Conversations Track',
    description: 'Command executive respect without arrogance. Master the balance of likeability and authority, navigate confrontation, and persuade stakeholders.',
    coursesCount: 1,
    totalHours: '1.5 Hours',
    level: 'Intermediate to Advanced',
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
    badge: 'Executive Leadership',
    targetRoles: ['VP of Engineering', 'Director', 'Startup Executive', 'Senior Consultant'],
    courseSlug: 'vinh-giang-executive-influence-difficult-conversations',
  },
  {
    id: 'clear-explaining',
    title: 'The CLEAR Explaining & Complex Storytelling Track',
    description: 'Demystify complex technical concepts, eliminate speaking filler habits, and inspire confidence using the CLEAR framework and analogies.',
    coursesCount: 1,
    totalHours: '1.4 Hours',
    level: 'All Levels',
    iconColor: '#7e22ce',
    iconBg: '#f3e8ff',
    badge: 'Technical Communicators',
    targetRoles: ['Solutions Architect', 'Staff Software Engineer', 'Data Scientist', 'Technical Lead'],
    courseSlug: 'vinh-giang-clear-explaining-confidence',
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
  },
  {
    question: 'What is the primary objective of Vinh Giang\'s CLEAR Explaining Framework?',
    options: [
      'Simplify complex or abstract concepts through calibration, analogies, and structured repetition',
      'Speak louder than everyone else in the room',
      'Memorize a rigid script word-for-word without adjusting to the audience',
      'Avoid explaining details to preserve technical mystique'
    ],
    correctIndex: 0
  },
  {
    question: 'In conversational dynamics and active rapport, what does Vinh Giang define as "subtext listening"?',
    options: [
      'Listening beyond the literal words to discern emotional intent, body language, and unspoken needs',
      'Waiting quietly until it is your turn to speak again',
      'Recording the conversation secretly to critique later',
      'Interrupting speakers whenever they take a pause'
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

  // Playback & Strict Progress Monitoring States
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);
  const trackerTimerRef = useRef(null);
  const watchedSecondsSet = useRef(new Set());

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [watchPercent, setWatchPercent] = useState(0);
  const [isEligible, setIsEligible] = useState(false);

  // Time formatter MM:SS or HH:MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
        await fetchMyLearning();
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

  const openCoursePlayer = (course, lessonToOpen = null) => {
    setPlayerCourse(course);
    if (lessonToOpen) {
      setActiveLesson(lessonToOpen);
    } else {
      const firstLesson = course.modules?.[0]?.lessons?.[0] || {
        title: 'Welcome & Introduction',
        duration: '10m',
        summary: course.description,
      };
      setActiveLesson(firstLesson);
    }
  };

  const handleCompleteLesson = async () => {
    if (!playerCourse || !activeLesson) return;
    if (!token) {
      showToast('Please sign in to save your progress');
      return;
    }
    if (!isEligible && !isLessonAlreadyCompleted) {
      showToast(`🔒 Minimum 80% watch time required (Current: ${watchPercent}%). Fast-forwarding does not count.`);
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
        showToast(`🎉 Lesson completed! Course progress: ${data.progress}%`);
        await fetchMyLearning();
        if (data.progress >= 100) {
          showToast('🏆 100% Course Mastery Achieved! Your Verified Certificate is ready!');
        }
      }
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  const handleLaunchQuiz = () => {
    setQuizState({ open: true, currentQ: 0, answers: {}, passed: false });
  };

  // Inject YouTube IFrame API once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.body.appendChild(tag);
      }
    }
  }, []);

  // Compute active course enrollment status
  const activeEnrolledRecord = myLearning.enrolled?.find(
    (e) => String(e._id) === String(playerCourse?._id)
  );
  const isLessonAlreadyCompleted = Boolean(
    activeEnrolledRecord?.completedLessons?.includes(activeLesson?.title)
  );

  const allLessons = playerCourse?.modules?.flatMap((m) => m.lessons || []) || [];
  const currentLessonIndex = allLessons.findIndex((l) => l.title === activeLesson?.title);

  // Strict tracker ticker
  const stopPlaybackTracker = () => {
    if (trackerTimerRef.current) {
      clearInterval(trackerTimerRef.current);
      trackerTimerRef.current = null;
    }
  };

  const startPlaybackTracker = () => {
    stopPlaybackTracker();
    trackerTimerRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      try {
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (dur > 0) setDuration(dur);
        setCurrentTime(cur);

        // Anti-cheat watch time accumulation: only active playback seconds count!
        const sec = Math.floor(cur);
        watchedSecondsSet.current.add(sec);

        const watchedSecs = watchedSecondsSet.current.size;
        const totalSecs = dur > 0 ? dur : 1;
        const pct = Math.min(100, Math.round((watchedSecs / totalSecs) * 100));
        setWatchPercent(pct);

        if (pct >= 80) {
          setIsEligible(true);
        }
      } catch (err) {
        // Player buffering or re-initializing
      }
    }, 500);
  };

  // YouTube player initialization effect on activeLesson change
  useEffect(() => {
    if (!playerCourse || !activeLesson?.videoUrl) return;

    let isMounted = true;
    let pollInterval = null;

    // Reset watch tracking for the newly selected lesson
    if (isLessonAlreadyCompleted) {
      setIsEligible(true);
      setWatchPercent(100);
    } else {
      setIsEligible(false);
      setWatchPercent(0);
    }
    watchedSecondsSet.current = new Set();
    setCurrentTime(0);

    const onPlayerReady = (event) => {
      if (!isMounted) return;
      const dur = event.target.getDuration();
      if (dur > 0) setDuration(dur);
      setPlaybackRate(event.target.getPlaybackRate() || 1);
      setIsMuted(event.target.isMuted?.() || false);
    };

    const onPlayerStateChange = (event) => {
      if (!isMounted) return;
      // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
      if (event.data === 1) {
        setIsPlaying(true);
        startPlaybackTracker();
      } else {
        setIsPlaying(false);
        stopPlaybackTracker();
      }
      if (event.data === 0) {
        // Video finished naturally
        setIsEligible(true);
        setWatchPercent(100);
        showToast('🎉 Masterclass lesson finished! Minimum 80% study requirement met.');
      }
    };

    const initYT = () => {
      if (!playerContainerRef.current) return;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }

      try {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: activeLesson.videoUrl,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            controls: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
      } catch (err) {
        console.error('Error mounting YT Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      pollInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollInterval);
          initYT();
        }
      }, 150);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      stopPlaybackTracker();
    };
  }, [activeLesson?.videoUrl, playerCourse?._id, isLessonAlreadyCompleted]);

  const closeCoursePlayer = () => {
    stopPlaybackTracker();
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try { playerRef.current.destroy(); } catch (e) {}
      playerRef.current = null;
    }
    setPlayerCourse(null);
    setActiveLesson(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setWatchPercent(0);
    setIsEligible(false);
    watchedSecondsSet.current = new Set();
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {}
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (err) {}
  };

  const handleSeekRewind10 = () => {
    if (!playerRef.current) return;
    try {
      const cur = playerRef.current.getCurrentTime() || 0;
      const target = Math.max(0, cur - 10);
      playerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } catch (err) {}
  };

  const handleSeekForward10 = () => {
    if (!playerRef.current) return;
    try {
      const cur = playerRef.current.getCurrentTime() || 0;
      const dur = duration || 100;
      const target = Math.min(dur, cur + 10);
      playerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } catch (err) {}
  };

  const handlePlaybackSpeed = (rate) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
      showToast(`Playback speed set to ${rate}x`);
    } catch (err) {}
  };

  const handleSliderSeek = (e) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(target, true);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLesson(allLessons[currentLessonIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const handleSelectLesson = (les) => {
    if (activeLesson?.title === les.title) return;
    setActiveLesson(les);
  };

  const handleStartTrack = (track) => {
    const matchedCourse = courses.find((c) => c.slug === track.courseSlug);
    if (matchedCourse) {
      handleEnroll(matchedCourse);
    } else {
      setActiveTab('explore');
    }
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
                  onClick={() => handleStartTrack(track)}
                >
                  Start Masterclass Track
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE COURSE PLAYER & SYLLABUS */}
      {playerCourse && (
        <div className="learningModalOverlay" onClick={closeCoursePlayer}>
          <div className="learningPlayerModal" onClick={(e) => e.stopPropagation()}>
            <div className="playerModalHeader">
              <div className="playerHeaderMeta">
                <div className="playerHeaderTitleRow">
                  <span className="playerCategoryTag">{playerCourse.category}</span>
                  <h3>{playerCourse.title}</h3>
                </div>
                <small className="playerInstructorSubtitle">
                  <FaChalkboardTeacher size={12} /> Masterclass Coach: <strong>{playerCourse.instructor?.name}</strong> · Current: {activeLesson?.title}
                </small>
              </div>
              <button
                type="button"
                className="closeModalBtn"
                onClick={closeCoursePlayer}
                title="Close Player"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="playerModalBody">
              {/* Left Column: Real Interactive Player with Strict Progress & Controls */}
              <div className="playerScreenWrapper">
                <div className="playerScreenCard">
                  {/* Real Playable YouTube Video Frame */}
                  <div className="videoEmbedContainer">
                    {activeLesson?.videoUrl ? (
                      <div
                        key={activeLesson.videoUrl}
                        ref={playerContainerRef}
                        id="youtube-player-mount"
                        className="youtubePlayerMount"
                      />
                    ) : (
                      <div className="videoScreenSimulation">
                        <FaPlayCircle size={54} color="#ffffff" className="playSimulationIcon" />
                        <span className="videoSimulationText">Interactive Course Video Player</span>
                        <span className="currentLessonTitle">Current: {activeLesson?.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Strict Progress Indicator Rail */}
                  <div className="strictProgressSection">
                    <div className="strictProgressHeaderRow">
                      <span className="progressHeaderTitle">
                        <FaShieldAlt size={12} color={isEligible || isLessonAlreadyCompleted ? '#10b981' : '#f59e0b'} />
                        Strict Anti-Cheat Progress:
                      </span>
                      <span className="progressHeaderPct">
                        {isLessonAlreadyCompleted ? (
                          <strong style={{ color: '#10b981' }}>100% (Completed)</strong>
                        ) : (
                          <>
                            <strong style={{ color: isEligible ? '#10b981' : '#f59e0b' }}>{watchPercent}% Watched</strong>
                            <span className="progressHeaderGoal"> (80% Required to Unlock)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Dual-Track Visual Progress Bar */}
                    <div className="strictProgressBarTrack">
                      <div
                        className={`strictProgressBarFill ${isEligible || isLessonAlreadyCompleted ? 'unlocked' : ''}`}
                        style={{ width: `${isLessonAlreadyCompleted ? 100 : watchPercent}%` }}
                      />
                      <div className="strictMarker80" title="80% Completion Requirement">
                        <span className="markerPin">80% Target</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Rich Playback Controls Deck */}
                  <div className="playerControlDeck">
                    {/* Scrub / Seek Slider */}
                    <div className="playerSliderRow">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSliderSeek}
                        className="playerTimelineSlider"
                        title="Seek timeline (Note: Scrubbing does not bypass active study requirement)"
                      />
                    </div>

                    {/* Main Controls Row */}
                    <div className="playerControlsMainRow">
                      <div className="playerPlaybackGroup">
                        {/* Prev Lesson */}
                        <button
                          type="button"
                          className="controlIconBtn"
                          onClick={handlePrevLesson}
                          disabled={currentLessonIndex <= 0}
                          title="Previous Lesson"
                        >
                          <FaStepBackward size={13} />
                        </button>

                        {/* Play / Pause */}
                        <button
                          type="button"
                          className="controlPlayPauseBtn"
                          onClick={handleTogglePlay}
                          title={isPlaying ? 'Pause Video' : 'Play Video'}
                        >
                          {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} style={{ marginLeft: 2 }} />}
                        </button>

                        {/* Rewind 10s */}
                        <button
                          type="button"
                          className="controlIconBtn"
                          onClick={handleSeekRewind10}
                          title="Rewind 10 seconds"
                        >
                          <FaUndo size={11} />
                          <span className="btnSecLabel">10s</span>
                        </button>

                        {/* Forward 10s */}
                        <button
                          type="button"
                          className="controlIconBtn"
                          onClick={handleSeekForward10}
                          title="Forward 10 seconds"
                        >
                          <FaRedo size={11} />
                          <span className="btnSecLabel">10s</span>
                        </button>

                        {/* Next Lesson */}
                        <button
                          type="button"
                          className="controlIconBtn"
                          onClick={handleNextLesson}
                          disabled={currentLessonIndex >= allLessons.length - 1}
                          title="Next Lesson"
                        >
                          <FaStepForward size={13} />
                        </button>

                        {/* Mute Toggle */}
                        <button
                          type="button"
                          className="controlIconBtn muteBtn"
                          onClick={handleToggleMute}
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <FaVolumeMute size={13} color="#f87171" /> : <FaVolumeUp size={13} />}
                        </button>

                        {/* Time Counter */}
                        <span className="playerTimeDisplay">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      {/* Speed Selector Chips */}
                      <div className="playerSpeedGroup">
                        <span className="speedLabel">Speed:</span>
                        {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            className={`speedChipBtn ${playbackRate === rate ? 'active' : ''}`}
                            onClick={() => handlePlaybackSpeed(rate)}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>

                      {/* Action: Mark Complete Button */}
                      <div className="playerActionGroup">
                        {isLessonAlreadyCompleted ? (
                          <button type="button" className="markCompleteBtn completed" disabled>
                            <FaCheck size={12} /> Completed ✓
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`markCompleteBtn ${isEligible ? 'eligible' : 'locked'}`}
                            onClick={handleCompleteLesson}
                            disabled={!isEligible}
                            title={isEligible ? 'Claim completion credit' : 'Watch 80% to complete'}
                          >
                            {isEligible ? (
                              <>
                                <FaCheckCircle size={13} /> Complete Lesson
                              </>
                            ) : (
                              <>
                                <FaLock size={12} /> Watch 80% to Unlock
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Anti-Cheat Warning & Verification Banner */}
                  <div className={`antiCheatBanner ${isEligible || isLessonAlreadyCompleted ? 'bannerSuccess' : 'bannerNotice'}`}>
                    <div className="antiCheatBannerIcon">
                      {isEligible || isLessonAlreadyCompleted ? (
                        <FaCheckCircle size={18} color="#10b981" />
                      ) : (
                        <FaShieldAlt size={18} color="#f59e0b" />
                      )}
                    </div>
                    <div className="antiCheatBannerContent">
                      {isLessonAlreadyCompleted ? (
                        <p>
                          <strong>Lesson Verified & Completed:</strong> You have fully met the study requirements for this lecture and course progress is permanently saved.
                        </p>
                      ) : isEligible ? (
                        <p>
                          <strong>80%+ Study Milestone Achieved!</strong> You have verified genuine active watch time. Click <strong>Complete Lesson</strong> above to update your certified progress.
                        </p>
                      ) : (
                        <p>
                          <strong>Strict Progress Verification Active:</strong> You have watched <strong>{watchPercent}%</strong> of this lesson. To maintain accreditation standards, at least <strong>80%</strong> active watch time is required before this lesson can be marked complete. Fast-forwarding or scrubbing without watching does not count toward verified completion.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lesson Summary & Notes */}
                <div className="lessonSummaryCard">
                  <div className="lessonSummaryHeader">
                    <h4>Lesson Overview: {activeLesson?.title}</h4>
                    <span className="lessonDurationBadge"><FaClock size={11} /> {activeLesson?.duration}</span>
                  </div>
                  <p className="lessonSummaryParagraph">{activeLesson?.summary || playerCourse.description}</p>

                  <div className="interactiveAssessmentTrigger">
                    <div>
                      <strong>Final Certification Assessment</strong>
                      <p>Complete the 5-question knowledge check on Vinh Giang's frameworks to earn your verified credential.</p>
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
                <div className="syllabusHeader">
                  <h4>Course Syllabus ({playerCourse.modules?.length || 1} Modules)</h4>
                  <span className="syllabusCourseProgress">
                    Progress: {activeEnrolledRecord?.progress || 0}%
                  </span>
                </div>

                <div className="syllabusList">
                  {playerCourse.modules?.map((mod, mIdx) => (
                    <div key={mIdx} className="syllabusModuleCard">
                      <div className="syllabusModuleTitle">
                        <strong>Module {mIdx + 1}:</strong> {mod.title}
                      </div>
                      <div className="moduleLessonsList">
                        {mod.lessons?.map((les, lIdx) => {
                          const isCompleted = activeEnrolledRecord?.completedLessons?.includes(les.title);
                          const isActive = activeLesson?.title === les.title;
                          return (
                            <div
                              key={lIdx}
                              className={`moduleLessonItem ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                              onClick={() => handleSelectLesson(les)}
                            >
                              {isCompleted ? (
                                <FaCheckCircle size={13} color="#10b981" className="lessonStatusIcon" />
                              ) : isActive ? (
                                <FaPlayCircle size={13} color="#0a66c2" className="lessonStatusIcon" />
                              ) : (
                                <FaPlayCircle size={13} color="#94a3b8" className="lessonStatusIcon" />
                              )}
                              <div className="lessonMetaText">
                                <span className="lessonItemTitle">{les.title}</span>
                                <div className="lessonItemSub">
                                  <small><FaClock size={10} /> {les.duration}</small>
                                  {isCompleted && <span className="lessonItemDoneTag">Done</span>}
                                  {isActive && <span className="lessonItemPlayingTag">Playing</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

