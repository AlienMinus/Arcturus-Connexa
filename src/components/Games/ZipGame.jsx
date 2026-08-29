import React, { useState, useEffect } from "react";
import { FaUndo, FaCheck, FaTrophy, FaBackspace } from "react-icons/fa";

const TARGET_WORDS = ["CODE", "CORE", "DOOR", "RODE", "CORD"];
const LETTERS = ["C", "O", "D", "E", "R"];

const ZipGame = () => {
  const [currentWord, setCurrentWord] = useState("");
  const [solvedWords, setSolvedWords] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleLetterClick = (char) => {
    if (currentWord.length >= 6 || isWon) return;
    setCurrentWord(prev => prev + char);
    setMessage("");
  };

  const handleDelete = () => {
    setCurrentWord(prev => prev.slice(0, -1));
    setMessage("");
  };

  const handleSubmit = () => {
    if (!currentWord || isWon) return;
    const word = currentWord.toUpperCase();

    if (solvedWords.includes(word)) {
      setMessage("Already found!");
      return;
    }

    if (TARGET_WORDS.includes(word)) {
      const updated = [...solvedWords, word];
      setSolvedWords(updated);
      setCurrentWord("");
      setMessage("Great find! 🎉");

      if (updated.length === TARGET_WORDS.length) {
        setIsWon(true);
      }
    } else {
      setMessage("Not in today's word list!");
    }
  };

  const handleReset = () => {
    setCurrentWord("");
    setSolvedWords([]);
    setIsWon(false);
    setSeconds(0);
    setMessage("");
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="zipGameContainer">
      <div className="gameControls">
        <div className="gameTimer">⏱️ {formatTimer(seconds)}</div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#d97706" }}>
          Found: {solvedWords.length} / {TARGET_WORDS.length}
        </div>
        <button type="button" className="gameActionBtn" onClick={handleReset}>
          <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
        </button>
      </div>

      <div className="zipClueWord">
        {currentWord || <span style={{ color: "#94a3b8", fontSize: "16px", letterSpacing: "normal" }}>Tap letters to spell words</span>}
      </div>

      {message && (
        <div style={{ fontSize: "12.5px", fontWeight: "600", color: message.includes("Great") ? "#059669" : "#dc2626", marginBottom: "10px" }}>
          {message}
        </div>
      )}

      <div className="zipLettersPool">
        {LETTERS.map((letter, idx) => (
          <button
            key={idx}
            type="button"
            className="zipLetterBtn"
            onClick={() => handleLetterClick(letter)}
            disabled={isWon}
          >
            {letter}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          type="button"
          className="gameActionBtn"
          onClick={handleDelete}
          disabled={!currentWord || isWon}
        >
          <FaBackspace size={13} style={{ marginRight: "4px" }} /> Back
        </button>
        <button
          type="button"
          className="gameActionBtn"
          style={{ background: "#0a66c2", color: "#fff", borderColor: "#0a66c2" }}
          onClick={handleSubmit}
          disabled={!currentWord || isWon}
        >
          <FaCheck size={12} style={{ marginRight: "4px" }} /> Enter
        </button>
      </div>

      <div className="zipWordList">
        {TARGET_WORDS.map((w, idx) => (
          <span key={idx} className="zipSolvedWord" style={{ opacity: solvedWords.includes(w) ? 1 : 0.4 }}>
            {solvedWords.includes(w) ? w : "• • • •"}
          </span>
        ))}
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> All Words Found!</h3>
          <p>You completed Zip #362 in <strong>{formatTimer(seconds)}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default ZipGame;

