import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// Real React Markdown Typewriter Component
export const TypewriterMarkdown = ({ text, isTyping, scrollRef, onComplete }) => {
  const [displayedText, setDisplayedText] = useState(() => (isTyping ? '' : text));
  const [isFinished, setIsFinished] = useState(!isTyping);

  useEffect(() => {
    if (!isTyping || isFinished) {
      setDisplayedText(text);
      setIsFinished(true);
      return;
    }

    let currentIdx = 0;
    const step = 3; // reveals 3 chars per tick for smooth, fast streaming
    const speed = 14; // 14ms per tick

    const timer = setInterval(() => {
      currentIdx += step;
      if (currentIdx >= text.length) {
        setDisplayedText(text);
        setIsFinished(true);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, currentIdx));
      }

      if (scrollRef?.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isTyping, isFinished, onComplete, scrollRef]);

  const handleSkip = () => {
    if (!isFinished) {
      setDisplayedText(text);
      setIsFinished(true);
      onComplete?.();
      if (scrollRef?.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  };

  return (
    <div
      className={`chatMsgMarkdown ${!isFinished ? 'isTypingActive' : ''}`}
      onClick={handleSkip}
      title={!isFinished ? 'Click to reveal full response' : undefined}
      style={{ cursor: !isFinished ? 'pointer' : 'default' }}
    >
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isFinished && <span className="typewriterCursor" aria-hidden="true" />}
    </div>
  );
};

export default TypewriterMarkdown;

