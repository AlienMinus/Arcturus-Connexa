import React, { useState, useRef, useEffect } from "react";
import {
  FaImage,
  FaCalendarAlt,
  FaTrophy,
  FaBriefcase,
  FaPoll,
  FaFileAlt,
  FaCamera,
  FaMagic,
  FaCaretDown,
  FaTimes,
  FaPlus,
  FaTrashAlt,
  FaCheck,
  FaUndo,
  FaSpinner,
  FaGlobeAmericas,
  FaUserFriends,
  FaLock,
  FaSmile,
  FaVideo
} from "react-icons/fa";
import { BsEmojiSmile, BsClockHistory } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { useAuth } from "../../../context/AuthContext";
import { buildApiUrl } from "../../../utils/api";
import { getUserFullName } from "../../../utils/user";
import "./Feed.css";

const EMOJI_CATEGORIES = {
  "Popular": ["🚀", "💡", "🔥", "👍", "👏", "🎉", "❤️", "✨", "🎯", "🤝", "🙌", "💼"],
  "Faces": ["😊", "😃", "🤔", "😎", "🤩", "🙌", "🥳", "😇", "🧠", "👀", "💯", "🌟"],
  "Work & Tech": ["💻", "📊", "📈", "📱", "🌐", "⚙️", "🤖", "📚", "🖊️", "🏆", "🥇", "🛠️"],
  "Office": ["🏢", "📁", "📅", "📌", "✉️", "📣", "📢", "🏷️", "🔗", "⏳", "⏰", "🔍"]
};

const AI_STARTER_PROMPTS = [
  {
    title: "🚀 Project Launch",
    text: "Excited to officially launch our latest project! 🚀\n\nWe built this to solve key developer workflow challenges with modern speed and simplicity.\n\nKey Highlights:\n🔹 Blazing fast performance\n🔹 Clean and intuitive developer experience\n🔹 Built with React & Node.js\n\nCheck it out and let me know your thoughts in the comments! 👇\n\n#WebDev #SoftwareEngineering #TechInnovation #Launch"
  },
  {
    title: "💡 Tech Insight",
    text: "Here is one crucial lesson I've learned after scaling modern full-stack web applications:\n\nArchitecture simplicity beats over-engineering every single time.\n\n3 principles I always follow:\n1️⃣ Optimize for readability first\n2️⃣ Measure before premature optimizations\n3️⃣ Design with modular component boundaries\n\nWhat is your #1 golden rule for clean code?\n\n#SoftwareArchitecture #WebDev #Engineering #BestPractices"
  },
  {
    title: "🏆 Milestone & Growth",
    text: "Reflecting on a proud milestone today! 🌟\n\nConsistency and teamwork turn ambitious visions into reality. Grateful to everyone who supported this journey so far.\n\nHere is to the next chapter of building impactful products! 🚀\n\n#CareerGrowth #Leadership #Milestone #Gratitude"
  }
];

const PostModal = ({ closeModal, onPostCreated, profile, initialTool = null }) => {
  const { token } = useAuth();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Audience State
  const [isAudienceMenuOpen, setIsAudienceMenuOpen] = useState(false);
  const [audience, setAudience] = useState("Anyone");

  // Content & Media State
  const [content, setContent] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video' | 'document'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Active Tool Panel State
  const [activeTool, setActiveTool] = useState(null); // 'emoji' | 'ai' | 'event' | 'celebrate' | 'hiring' | 'poll' | 'document' | 'schedule'
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState("Popular");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Scheduling State
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  // Sub-Tool Forms
  const [pollForm, setPollForm] = useState({
    question: "",
    options: ["", ""],
    duration: "1 week"
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "10:00 AM",
    isOnline: true,
    location: ""
  });

  const [celebrateForm, setCelebrateForm] = useState({
    type: "kudos",
    name: "",
    message: ""
  });

  const [hiringForm, setHiringForm] = useState({
    role: "",
    company: profile?.headline || "Our Team",
    location: "Remote / Hybrid",
    applyUrl: ""
  });

  // Audience Handlers
  const toggleAudienceMenu = () => setIsAudienceMenuOpen(!isAudienceMenuOpen);
  const selectAudience = (selectedAudience) => {
    setAudience(selectedAudience);
    setIsAudienceMenuOpen(false);
  };

  // Tool Toggle Helper
  const toggleTool = (toolName) => {
    setActiveTool((prev) => (prev === toolName ? null : toolName));
  };

  // Trigger quick access tool if specified from CreatePost bar
  useEffect(() => {
    if (initialTool === 'media' || initialTool === 'video') {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } else if (initialTool === 'event') {
      setActiveTool('event');
    } else if (initialTool === 'article') {
      setContent(
        "📰 [Article Title: Deep Dive & Industry Perspective]\n\n" +
        "### Introduction\nShare your core thesis, background, and why this topic matters today.\n\n" +
        "### Key Insights & Lessons Learned\n• Point 1: Key architectural or business insight\n• Point 2: Data-driven takeaways\n• Point 3: Best practices and actionable advice\n\n" +
        "### Conclusion & Discussion\nWhat are your thoughts on this? Join the discussion below! 👇\n\n" +
        "#ThoughtLeadership #IndustryInsights #Technology #Architecture"
      );
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [initialTool]);

  // Insert text into textarea at cursor
  const insertTextAtCursor = (textToInsert) => {
    if (!textareaRef.current) {
      setContent((prev) => prev + textToInsert);
      return;
    }
    const cursorStart = textareaRef.current.selectionStart || content.length;
    const cursorEnd = textareaRef.current.selectionEnd || content.length;
    const newText = content.substring(0, cursorStart) + textToInsert + content.substring(cursorEnd);
    setContent(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          cursorStart + textToInsert.length,
          cursorStart + textToInsert.length
        );
      }
    }, 50);
  };

  // Emoji Click Handler
  const handleEmojiClick = (emoji) => {
    insertTextAtCursor(emoji);
  };

  // File Upload Handlers
  const handleFileChange = (event, type = "image") => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return;
    }

    setMediaFile(file);
    setMediaType(type);
    setError("");

    if (type === "document") {
      setMediaPreview(file.name);
    } else {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  // AI Assistant Rewrite Handlers
  const handleAiRewrite = (style) => {
    if (!content.trim()) {
      setError("Please type some thoughts first or choose an AI prompt below.");
      return;
    }

    setPreviousContent(content);
    setIsAiGenerating(true);
    setError("");

    setTimeout(() => {
      let polished = "";
      const base = content.trim();

      switch (style) {
        case "professional":
          polished = `📌 Key Professional Reflection:\n\n${base}\n\nBy focusing on sustainable execution, collaborative excellence, and clear measurable outcomes, we continue to drive meaningful impact.\n\n#Leadership #ProfessionalExcellence #Strategy #ArcturusNetwork`;
          break;
        case "catchy":
          polished = `🚀 Game-changing insight for you today:\n\n${base}\n\nKey Takeaways:\n🔹 Focus on high-leverage outcomes\n🔹 Embrace continuous learning & iteration\n🔹 Build systems that scale\n\nWhat are your thoughts on this? Let's discuss in the comments below! 👇\n\n#TechTrends #Innovation #GrowthMindset #WebDev`;
          break;
        case "concise":
          polished = `💡 Summary & Key Takeaways:\n\n• ${base.replace(/\n+/g, '\n• ')}\n\nBottom Line: Simple, focused execution always wins.\n\n#Engineering #Productivity #Insights`;
          break;
        case "story":
          polished = `A moment of reflection from this week:\n\n${base}\n\nIt taught me that the best breakthroughs often happen when we step back, listen to our team, and refine our approach.\n\nNever stop learning. Onward and upward! 🌟\n\n#Storytelling #CareerJourney #LifeLessons #TechCommunity`;
          break;
        case "hashtags":
          polished = `${base}\n\n#WebDev #SoftwareEngineering #TechInnovation #Leadership #CareerGrowth #Arcturus`;
          break;
        default:
          polished = base;
      }

      setContent(polished);
      setIsAiGenerating(false);
    }, 600);
  };

  const handleUndoAi = () => {
    if (previousContent) {
      setContent(previousContent);
      setPreviousContent("");
    }
  };

  // Event Tool Handler
  const handleAttachEvent = (e) => {
    e.preventDefault();
    if (!eventForm.title) {
      setError("Please enter an event title.");
      return;
    }
    const eventSnippet = `\n\n📅 Upcoming Event: ${eventForm.title}\n🗓️ Date & Time: ${eventForm.date || "TBA"} at ${eventForm.time}\n📍 Mode: ${eventForm.isOnline ? "🌐 Online Event" : "🏢 In-Person"}${eventForm.location ? ` (${eventForm.location})` : ""}\n👉 Save the date and join us!`;
    insertTextAtCursor(eventSnippet);
    setActiveTool(null);
    setError("");
  };

  // Celebration Tool Handler
  const handleAttachCelebration = (e) => {
    e.preventDefault();
    let badge = "👏 Kudos & Appreciation";
    if (celebrateForm.type === "milestone") badge = "🎉 Work Milestone / Anniversary";
    if (celebrateForm.type === "new_role") badge = "🚀 New Role & Exciting Beginning";
    if (celebrateForm.type === "project") badge = "🏆 Project Launch & Success";

    const snippet = `\n\n${badge}\n${celebrateForm.name ? `Shoutout to ${celebrateForm.name}! ` : ""}${celebrateForm.message || "Celebrating dedication, growth, and teamwork."}\n\n#Celebration #Achievement #Teamwork #Milestone`;
    insertTextAtCursor(snippet);
    setActiveTool(null);
  };

  // Hiring Tool Handler
  const handleAttachHiring = (e) => {
    e.preventDefault();
    if (!hiringForm.role) {
      setError("Please enter a role title.");
      return;
    }
    const snippet = `\n\n💼 We are Hiring: ${hiringForm.role}!\n🏢 Company: ${hiringForm.company}\n📍 Location: ${hiringForm.location}\n${hiringForm.applyUrl ? `🔗 Apply Here: ${hiringForm.applyUrl}\n` : ""}🚀 Feel free to reach out or share with anyone in your network who would be a great fit!\n\n#Hiring #JobOpportunity #TechJobs #CareerOpportunity`;
    insertTextAtCursor(snippet);
    setActiveTool(null);
    setError("");
  };

  // Poll Tool Handler
  const handleAttachPoll = (e) => {
    e.preventDefault();
    if (!pollForm.question.trim()) {
      setError("Please enter a poll question.");
      return;
    }
    const validOptions = pollForm.options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError("Please provide at least 2 poll options.");
      return;
    }

    const optionsText = validOptions.map((opt, i) => `${i + 1}️⃣ ${opt}`).join("\n");
    const snippet = `\n\n📊 Community Poll: ${pollForm.question}\n${optionsText}\n\n⏳ Poll Duration: ${pollForm.duration}\nVote and share your perspective in the comments! 👇\n\n#Poll #CommunityDiscussion #TechCommunity`;
    insertTextAtCursor(snippet);
    setActiveTool(null);
    setError("");
  };

  // Schedule Handler
  const handleSetSchedule = (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError("Please select a date to schedule.");
      return;
    }
    setIsScheduled(true);
    setActiveTool(null);
    setError("");
  };

  const handleClearSchedule = () => {
    setIsScheduled(false);
    setScheduledDate("");
    setScheduledTime("");
  };

  // Main Submit Handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim() && !mediaFile) {
      setError("Please add text or select media before posting.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      let finalContent = content;
      if (isScheduled && scheduledDate) {
        finalContent = `[Scheduled for ${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}]\n\n` + finalContent;
      }
      formData.append("content", finalContent);
      formData.append("audience", audience);

      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      const response = await fetch(buildApiUrl('/posts'), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || "Failed to create post.");
      }

      await response.json();
      onPostCreated?.();
      closeModal();
    } catch (submitError) {
      setError(submitError.message || "Unable to submit post.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <form className="postModal enhancedPostModal" onSubmit={handleSubmit}>
        {/* HEADER */}
        <div className="postHeader">
          <div className="postUser">
            {profile?.avatar?.url ? (
              <img
                src={profile.avatar.url}
                alt={profile?.name || "Avatar"}
                className="postAvatar"
              />
            ) : (
              <CgProfile className="postAvatar postAvatarFallback" />
            )}
            <div>
              <h4>{getUserFullName(profile, "Member")}</h4>
              <div className="audience-dropdown">
                <button className="audience-button" type="button" onClick={toggleAudienceMenu}>
                  {audience === "Anyone" && <FaGlobeAmericas size={11} />}
                  {audience === "Connections only" && <FaUserFriends size={11} />}
                  {audience === "Only me" && <FaLock size={11} />}
                  <span>{audience}</span>
                  <FaCaretDown />
                </button>
                {isAudienceMenuOpen && (
                  <ul className="audience-menu">
                    <li onClick={() => selectAudience("Anyone")}>
                      <FaGlobeAmericas size={13} /> <span>Anyone (Public)</span>
                    </li>
                    <li onClick={() => selectAudience("Connections only")}>
                      <FaUserFriends size={13} /> <span>Connections only</span>
                    </li>
                    <li onClick={() => selectAudience("Group")}>
                      <FaBriefcase size={13} /> <span>Group Members</span>
                    </li>
                    <li onClick={() => selectAudience("Only me")}>
                      <FaLock size={13} /> <span>Only me (Draft)</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          <button className="closeBtn" type="button" onClick={closeModal} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* SCHEDULE NOTIFICATION BANNER */}
        {isScheduled && (
          <div className="scheduleBanner">
            <div className="scheduleBannerText">
              <BsClockHistory />
              <span>
                Scheduled for <strong>{scheduledDate}</strong> {scheduledTime && `at ${scheduledTime}`}
              </span>
            </div>
            <button type="button" className="clearScheduleBtn" onClick={handleClearSchedule}>
              Cancel Schedule
            </button>
          </div>
        )}

        {/* MAIN TEXT EDITOR */}
        <textarea
          ref={textareaRef}
          className="postInputArea"
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
        />

        {error && <div className="formError postFormError">{error}</div>}

        {/* MEDIA PREVIEW CARD */}
        {mediaFile && (
          <div className="mediaPreviewCard">
            {mediaType === "video" ? (
              <video src={mediaPreview} controls className="mediaPreviewMedia" />
            ) : mediaType === "document" ? (
              <div className="docPreviewBadge">
                <FaFileAlt size={28} color="#0a66c2" />
                <div>
                  <strong>{mediaFile.name}</strong>
                  <span>{(mediaFile.size / 1024 / 1024).toFixed(2)} MB · Document attached</span>
                </div>
              </div>
            ) : (
              <img src={mediaPreview} alt="Upload preview" className="mediaPreviewMedia" />
            )}
            <button
              type="button"
              className="removeMediaBtn"
              onClick={handleRemoveMedia}
              title="Remove media"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* EMOJI PICKER PANEL */}
        {activeTool === "emoji" && (
          <div className="postToolDrawer emojiDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaSmile /> Insert Emoji</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="emojiCategoryTabs">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`emojiCategoryTab ${selectedEmojiCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedEmojiCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="emojiGrid">
              {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="emojiBtn"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI REWRITE ASSISTANT PANEL */}
        {activeTool === "ai" && (
          <div className="postToolDrawer aiDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaMagic /> Rewrite & Enhance with AI</span>
              <div className="drawerHeaderActions">
                {previousContent && (
                  <button type="button" className="undoAiBtn" onClick={handleUndoAi}>
                    <FaUndo size={11} /> Undo
                  </button>
                )}
                <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
              </div>
            </div>

            {isAiGenerating ? (
              <div className="aiGeneratingBox">
                <FaSpinner className="spin" size={24} color="#0a66c2" />
                <p>Generating polished post...</p>
              </div>
            ) : (
              <>
                <div className="aiStyleButtonsRow">
                  <button type="button" className="aiStyleBtn" onClick={() => handleAiRewrite("professional")}>
                    💼 Professional
                  </button>
                  <button type="button" className="aiStyleBtn" onClick={() => handleAiRewrite("catchy")}>
                    🚀 Catchy Hook
                  </button>
                  <button type="button" className="aiStyleBtn" onClick={() => handleAiRewrite("concise")}>
                    📝 Concise
                  </button>
                  <button type="button" className="aiStyleBtn" onClick={() => handleAiRewrite("story")}>
                    🌟 Storytelling
                  </button>
                  <button type="button" className="aiStyleBtn" onClick={() => handleAiRewrite("hashtags")}>
                    🏷️ Hashtags
                  </button>
                </div>

                {!content.trim() && (
                  <div className="aiPromptTemplates">
                    <span className="promptTemplatesTitle">Or start with a topic template:</span>
                    <div className="promptChipsList">
                      {AI_STARTER_PROMPTS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="promptChip"
                          onClick={() => {
                            setContent(p.text);
                            setActiveTool(null);
                          }}
                        >
                          <strong>{p.title}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* EVENT BUILDER PANEL */}
        {activeTool === "event" && (
          <div className="postToolDrawer eventDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaCalendarAlt /> Create an Event Announcement</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="drawerForm">
              <input
                type="text"
                placeholder="Event Title (e.g. React 19 Workshop & Demo)"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                required
              />
              <div className="drawerRow">
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Time (e.g. 5:00 PM EST)"
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                />
              </div>
              <input
                type="text"
                placeholder="Event Link or Venue Address"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
              <div className="drawerRowBtns">
                <button type="button" className="drawerSubmitBtn" onClick={handleAttachEvent}>
                  <FaPlus size={12} /> Add Event to Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CELEBRATION PANEL */}
        {activeTool === "celebrate" && (
          <div className="postToolDrawer celebrateDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaTrophy /> Celebrate an Occasion</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="drawerForm">
              <select
                value={celebrateForm.type}
                onChange={(e) => setCelebrateForm({ ...celebrateForm, type: e.target.value })}
              >
                <option value="kudos">👏 Kudos / Give Appreciation</option>
                <option value="milestone">🎉 Work Anniversary / Milestone</option>
                <option value="new_role">🚀 New Role / Promotion</option>
                <option value="project">🏆 Project Launch & Success</option>
              </select>
              <input
                type="text"
                placeholder="Recipient or Team Name (optional)"
                value={celebrateForm.name}
                onChange={(e) => setCelebrateForm({ ...celebrateForm, name: e.target.value })}
              />
              <textarea
                placeholder="Write a congratulatory message or reflection..."
                rows={2}
                value={celebrateForm.message}
                onChange={(e) => setCelebrateForm({ ...celebrateForm, message: e.target.value })}
              />
              <button type="button" className="drawerSubmitBtn" onClick={handleAttachCelebration}>
                <FaCheck size={12} /> Add Celebration
              </button>
            </div>
          </div>
        )}

        {/* HIRING PANEL */}
        {activeTool === "hiring" && (
          <div className="postToolDrawer hiringDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaBriefcase /> Share that You're Hiring</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="drawerForm">
              <input
                type="text"
                placeholder="Job Role Title (e.g. Senior Frontend Engineer)"
                value={hiringForm.role}
                onChange={(e) => setHiringForm({ ...hiringForm, role: e.target.value })}
                required
              />
              <div className="drawerRow">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={hiringForm.company}
                  onChange={(e) => setHiringForm({ ...hiringForm, company: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Remote / San Francisco)"
                  value={hiringForm.location}
                  onChange={(e) => setHiringForm({ ...hiringForm, location: e.target.value })}
                />
              </div>
              <input
                type="url"
                placeholder="Application URL or Contact Link"
                value={hiringForm.applyUrl}
                onChange={(e) => setHiringForm({ ...hiringForm, applyUrl: e.target.value })}
              />
              <button type="button" className="drawerSubmitBtn" onClick={handleAttachHiring}>
                <FaPlus size={12} /> Add Hiring Post
              </button>
            </div>
          </div>
        )}

        {/* POLL BUILDER PANEL */}
        {activeTool === "poll" && (
          <div className="postToolDrawer pollDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><FaPoll /> Create a Community Poll</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="drawerForm">
              <input
                type="text"
                placeholder="Your question (e.g. Which frontend framework will you use in 2026?)"
                value={pollForm.question}
                onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                required
              />
              {pollForm.options.map((opt, idx) => (
                <div key={idx} className="pollOptionRow">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1} *`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollForm.options];
                      updated[idx] = e.target.value;
                      setPollForm({ ...pollForm, options: updated });
                    }}
                  />
                  {pollForm.options.length > 2 && (
                    <button
                      type="button"
                      className="removePollOptBtn"
                      onClick={() => {
                        const updated = pollForm.options.filter((_, i) => i !== idx);
                        setPollForm({ ...pollForm, options: updated });
                      }}
                      title="Remove option"
                    >
                      <FaTrashAlt size={12} />
                    </button>
                  )}
                </div>
              ))}
              {pollForm.options.length < 4 && (
                <button
                  type="button"
                  className="addPollOptionBtn"
                  onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })}
                >
                  <FaPlus size={11} /> Add Option
                </button>
              )}
              <div className="drawerRow">
                <label className="pollDurationLabel">Poll duration:</label>
                <select
                  value={pollForm.duration}
                  onChange={(e) => setPollForm({ ...pollForm, duration: e.target.value })}
                >
                  <option value="1 day">1 day</option>
                  <option value="3 days">3 days</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                </select>
              </div>
              <button type="button" className="drawerSubmitBtn" onClick={handleAttachPoll}>
                <FaCheck size={12} /> Attach Poll
              </button>
            </div>
          </div>
        )}

        {/* SCHEDULE POST PANEL */}
        {activeTool === "schedule" && (
          <div className="postToolDrawer scheduleDrawer">
            <div className="drawerHeader">
              <span className="drawerTitle"><BsClockHistory /> Schedule Post</span>
              <button type="button" className="drawerCloseBtn" onClick={() => setActiveTool(null)}><FaTimes /></button>
            </div>
            <div className="drawerForm">
              <p className="scheduleDesc">Select the date and time you want this post to be published.</p>
              <div className="drawerRow">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div className="drawerRowBtns">
                <button type="button" className="drawerSubmitBtn" onClick={handleSetSchedule}>
                  <FaCheck size={12} /> Confirm Schedule
                </button>
                {isScheduled && (
                  <button type="button" className="clearScheduleBtn" onClick={handleClearSchedule}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EMOJI SHORTCUT ROW */}
        <div className="emojiRow">
          <button
            type="button"
            className={`emojiQuickTrigger ${activeTool === 'emoji' ? 'active' : ''}`}
            onClick={() => toggleTool("emoji")}
            title="Add Emoji"
          >
            <BsEmojiSmile />
          </button>
        </div>

        {/* TOOLBAR ICONS */}
        <div className="postTools">
          {/* AI Rewrite Button */}
          <button
            type="button"
            className={`aiButton ${activeTool === 'ai' ? 'active' : ''}`}
            onClick={() => toggleTool("ai")}
            title="Rewrite & Enhance with AI"
          >
            <FaMagic /> <span>Rewrite with AI</span>
          </button>

          {/* Media File Upload (Images & Videos) */}
          <label className="mediaInputLabel" title="Add photo / image">
            <FaImage />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "image")}
            />
          </label>

          {/* Event Tool */}
          <button
            type="button"
            className={`toolIconBtn ${activeTool === 'event' ? 'active' : ''}`}
            onClick={() => toggleTool("event")}
            title="Create an event"
          >
            <FaCalendarAlt />
          </button>

          {/* Celebrate Tool */}
          <button
            type="button"
            className={`toolIconBtn ${activeTool === 'celebrate' ? 'active' : ''}`}
            onClick={() => toggleTool("celebrate")}
            title="Celebrate an occasion"
          >
            <FaTrophy />
          </button>

          {/* Hiring Tool */}
          <button
            type="button"
            className={`toolIconBtn ${activeTool === 'hiring' ? 'active' : ''}`}
            onClick={() => toggleTool("hiring")}
            title="Share that you're hiring"
          >
            <FaBriefcase />
          </button>

          {/* Poll Tool */}
          <button
            type="button"
            className={`toolIconBtn ${activeTool === 'poll' ? 'active' : ''}`}
            onClick={() => toggleTool("poll")}
            title="Create a poll"
          >
            <FaPoll />
          </button>

          {/* Document Upload */}
          <label className="mediaInputLabel" title="Add document / PDF">
            <FaFileAlt />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileChange(e, "document")}
            />
          </label>

          {/* Camera Capture */}
          <label className="mediaInputLabel" title="Take photo with camera">
            <FaCamera />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, "image")}
            />
          </label>
        </div>

        {/* FOOTER */}
        <div className="postFooter">
          <button
            type="button"
            className={`schedule ${isScheduled ? 'scheduledActive' : ''} ${activeTool === 'schedule' ? 'active' : ''}`}
            onClick={() => toggleTool("schedule")}
            title="Schedule post for later"
          >
            <BsClockHistory />
          </button>

          <button
            className={`postButton ${isScheduled ? 'scheduledPostBtn' : ''}`}
            type="submit"
            disabled={isLoading || (!content.trim() && !mediaFile)}
          >
            {isLoading
              ? "Posting..."
              : isScheduled
              ? "Schedule Post"
              : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostModal;
