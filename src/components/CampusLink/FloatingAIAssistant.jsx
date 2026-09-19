import React from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import TypewriterMarkdown from './TypewriterMarkdown';

export const FloatingAIAssistant = ({
  isChatFloatingOpen,
  setIsChatFloatingOpen,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  isChatSending,
  handleChatSend,
  chatScrollRef,
  messagesEndRef,
}) => {
  return (
    <div className="campusFloatingAssistantContainer">
      {isChatFloatingOpen && (
        <div className="campusFloatingChatWidget">
          <div className="floatingChatHeader">
            <div className="floatingChatTitle">
              <div className="floatingChatHeaderAvatar">
                <FaRobot size={18} color="#0a66c2" />
              </div>
              <div>
                <strong>CampusLink AI Assistant</strong>
                <small>Online · Powered by Hugging Face Gemma</small>
              </div>
            </div>
            <button
              type="button"
              className="floatingChatCloseBtn"
              onClick={() => setIsChatFloatingOpen(false)}
              title="Minimize AI Assistant"
              aria-label="Close Assistant"
            >
              <FaTimes size={15} />
            </button>
          </div>

          <div className="campusChatMessages floatingChatScroll" ref={chatScrollRef}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chatMsg ${msg.sender}`}>
                {msg.sender === 'assistant' ? (
                  <TypewriterMarkdown
                    text={msg.text}
                    isTyping={Boolean(msg.isTyping)}
                    scrollRef={chatScrollRef}
                    onComplete={() => {
                      setChatMessages((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, isTyping: false } : m))
                      );
                    }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
              </div>
            ))}
            {isChatSending && (
              <div className="chatMsg assistant typingLoaderMsg">
                <div className="typingDots">
                  <span />
                  <span />
                  <span />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  CampusLink AI (Gemma) is analyzing placement data...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="chatQuickPrompts floatingPrompts">
            {[
              'Evaluate my placement risk & recommendations',
              'Am I eligible for current active drives?',
              'Diagnose my skill gaps for target roles',
              'Top technical interview questions',
              'Check drive schedule conflicts',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                className="quickPromptChip"
                onClick={() => setChatInput(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form className="chatInputBar floatingInputBar" onSubmit={handleChatSend}>
            <input
              type="text"
              className="chatInput"
              placeholder="Ask about drives, skill gaps, or prep..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="chatSendBtn" disabled={isChatSending}>
              <FaPaperPlane size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Round Floating AI Launcher Button */}
      <button
        type="button"
        className={`campusFloatingRoundBtn ${isChatFloatingOpen ? 'active' : ''}`}
        title={isChatFloatingOpen ? "Close AI Assistant" : "CampusLink AI Placement Assistant"}
        onClick={() => setIsChatFloatingOpen((prev) => !prev)}
        aria-label="Toggle CampusLink AI Assistant"
      >
        <div className="floatingIconBadge">
          {isChatFloatingOpen ? (
            <FaTimes size={20} />
          ) : (
            <FaRobot size={24} color="#38bdf8" />
          )}
          {!isChatFloatingOpen && <span className="floatingPulseDot" />}
        </div>
      </button>
    </div>
  );
};

export default FloatingAIAssistant;

