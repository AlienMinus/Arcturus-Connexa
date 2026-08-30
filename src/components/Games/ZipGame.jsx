import React, { useState, useEffect } from "react";
import { FaUndo, FaCheck, FaTrophy, FaBackspace, FaRandom, FaLightbulb } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_ZIP_LEVELS = [
  {
    puzzleNumber: 362,
    difficulty: "Easy",
    letters: ["C", "O", "D", "E", "R"],
    targetWords: ["CODE", "CORE", "DOOR", "RODE", "CORD"],
  },
  {
    puzzleNumber: 363,
    difficulty: "Medium",
    letters: ["P", "L", "A", "N", "E"],
    targetWords: ["PLAN", "LANE", "LEAN", "PALE", "PEAL"],
  },
  {
    puzzleNumber: 364,
    difficulty: "Medium",
    letters: ["S", "T", "A", "R", "T"],
    targetWords: ["STAR", "TART", "ARTS", "RATS", "STAT"],
  },
  {
    puzzleNumber: 365,
    difficulty: "Hard",
    letters: ["B", "R", "A", "I", "N"],
    targetWords: ["RAIN", "BARN", "BRAN", "BAIRN", "RANI"],
  },
];

const ZipGame = () => {
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_ZIP_LEVELS[0]);
  const [letters, setLetters] = useState(FALLBACK_ZIP_LEVELS[0].letters);
  const [currentWord, setCurrentWord] = useState("");
  const [solvedWords, setSolvedWords] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [isWon, setIsWon] = useState(false);

  const loadRandomLevel = async () => {
    try {
      const res = await fetch(buildApiUrl('/games/zip/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.letters) {
          const l = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(300 + Math.random() * 500),
            difficulty: data.level.difficulty || "Medium",
            letters: data.level.puzzleData.letters,
            targetWords: data.level.puzzleData.targetWords,
          };
          setCurrentLevel(l);
          setLetters(l.letters);
          setCurrentWord("");
          setSolvedWords([]);
          setIsWon(false);
          setSeconds(0);
          setMessage("");
          return;
        }
      }
    } catch (err) {
      console.warn("Backend zip fetch notice:", err.message);
    }

    const randIndex = Math.floor(Math.random() * FALLBACK_ZIP_LEVELS.length);
    const chosen = FALLBACK_ZIP_LEVELS[randIndex];
    setCurrentLevel(chosen);
    setLetters(chosen.letters);
    setCurrentWord("");
    setSolvedWords([]);
    setIsWon(false);
    setSeconds(0);
    setMessage("");
  };

  useEffect(() => {
    loadRandomLevel();
  }, []);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleLetterClick = (char) => {
    if (currentWord.length >= 7 || isWon) return;
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

    if (currentLevel.targetWords.includes(word)) {
      const updated = [...solvedWords, word];
      setSolvedWords(updated);
      setCurrentWord("");
      setMessage("Great find! 🎉");

      if (updated.length === currentLevel.targetWords.length) {
        setIsWon(true);
        recordWin(seconds);
      }
    } else {
      setMessage("Not in this puzzle's word list!");
    }
  };

  const recordWin = async (timeTaken) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      await fetch(buildApiUrl('/games/record-win'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameKey: 'zip',
          puzzleNumber: currentLevel.puzzleNumber,
          timeSeconds: timeTaken,
        }),
      });
    } catch (err) {
      console.error('Failed to log zip score:', err);
    }
  };

  const handleReset = () => {
    setCurrentWord("");
    setSolvedWords([]);
    setIsWon(false);
    setSeconds(0);
    setMessage("");
  };

  const handleHint = () => {
    if (isWon) return;
    const remaining = currentLevel.targetWords.filter(w => !solvedWords.includes(w));
    if (remaining.length > 0) {
      const target = remaining[0];
      setMessage(`Hint: Starts with "${target.slice(0, 2)}"`);
    }
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
          Found: {solvedWords.length} / {currentLevel.targetWords.length}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" className="gameActionBtn" onClick={loadRandomLevel} title="New random word puzzle">
            <FaRandom size={11} style={{ marginRight: "4px" }} /> New
          </button>
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Show hint for next word">
            <FaLightbulb size={11} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset}>
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600" }}>
        Puzzle #{currentLevel.puzzleNumber} · {currentLevel.difficulty}
      </div>

      <div className="zipClueWord">
        {currentWord || <span style={{ color: "#94a3b8", fontSize: "16px", letterSpacing: "normal" }}>Tap letters to spell words</span>}
      </div>

      {message && (
        <div style={{ fontSize: "12.5px", fontWeight: "600", color: message.includes("Great") ? "#059669" : message.includes("Hint") ? "#0284c7" : "#dc2626", marginBottom: "10px" }}>
          {message}
        </div>
      )}

      <div className="zipLettersPool">
        {letters.map((letter, idx) => (
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
        {currentLevel.targetWords.map((w, idx) => (
          <span key={idx} className="zipSolvedWord" style={{ opacity: solvedWords.includes(w) ? 1 : 0.4 }}>
            {solvedWords.includes(w) ? w : "• • • •"}
          </span>
        ))}
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> All Words Found!</h3>
          <p>You completed Zip #{currentLevel.puzzleNumber} in <strong>{formatTimer(seconds)}</strong>!</p>
          <button
            type="button"
            onClick={loadRandomLevel}
            style={{
              marginTop: "12px",
              background: "#059669",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "20px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaCheck /> Play Next Puzzle
          </button>
        </div>
      )}
    </div>
  );
};

export default ZipGame;
