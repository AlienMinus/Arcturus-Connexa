import React, { useState, useEffect } from "react";
import { FaUndo, FaTrophy, FaCheck, FaRandom } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_PINPOINT_LEVELS = [
  {
    puzzleNumber: 412,
    difficulty: "Easy",
    clues: [
      "1. Apple",
      "2. Microsoft",
      "3. Google",
      "4. NVIDIA",
    ],
    category: "TECH GIANTS",
    acceptedAnswers: ["TECH GIANTS", "BIG TECH", "TECH COMPANIES", "TECH", "TRILLION DOLLAR COMPANIES"],
  },
  {
    puzzleNumber: 413,
    difficulty: "Medium",
    clues: [
      "1. Python",
      "2. JavaScript",
      "3. Rust",
      "4. TypeScript",
    ],
    category: "PROGRAMMING LANGUAGES",
    acceptedAnswers: ["PROGRAMMING LANGUAGES", "LANGUAGES", "CODING LANGUAGES", "CODE", "PROGRAMMING"],
  },
  {
    puzzleNumber: 414,
    difficulty: "Hard",
    clues: [
      "1. React",
      "2. Vue",
      "3. Angular",
      "4. Svelte",
    ],
    category: "FRONTEND FRAMEWORKS",
    acceptedAnswers: ["FRONTEND FRAMEWORKS", "JAVASCRIPT FRAMEWORKS", "UI FRAMEWORKS", "FRAMEWORKS", "WEB FRAMEWORKS"],
  },
];

const PinpointGame = () => {
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_PINPOINT_LEVELS[0]);
  const [revealedClues, setRevealedClues] = useState(1);
  const [guess, setGuess] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [message, setMessage] = useState("");

  const loadRandomLevel = async () => {
    try {
      const res = await fetch(buildApiUrl('/games/pinpoint/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.clues) {
          const l = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(410 + Math.random() * 400),
            difficulty: data.level.difficulty || "Medium",
            clues: data.level.puzzleData.clues,
            category: data.level.puzzleData.category,
            acceptedAnswers: data.level.puzzleData.acceptedAnswers || [data.level.puzzleData.category],
          };
          setCurrentLevel(l);
          setRevealedClues(1);
          setGuess("");
          setIsWon(false);
          setMessage("");
          return;
        }
      }
    } catch (err) {
      console.warn("Backend pinpoint fetch notice:", err.message);
    }

    const randIndex = Math.floor(Math.random() * FALLBACK_PINPOINT_LEVELS.length);
    const chosen = FALLBACK_PINPOINT_LEVELS[randIndex];
    setCurrentLevel(chosen);
    setRevealedClues(1);
    setGuess("");
    setIsWon(false);
    setMessage("");
  };

  useEffect(() => {
    loadRandomLevel();
  }, []);

  const handleGuess = () => {
    if (!guess.trim() || isWon) return;
    const cleanGuess = guess.toUpperCase().trim();

    const isMatch = currentLevel.acceptedAnswers.some(ans =>
      cleanGuess.includes(ans.toUpperCase()) || ans.toUpperCase().includes(cleanGuess)
    );

    if (isMatch) {
      setIsWon(true);
      setMessage("Correct category pinpointed! 🎉");
      recordWin(revealedClues);
    } else {
      if (revealedClues < currentLevel.clues.length) {
        setRevealedClues(prev => prev + 1);
        setMessage("Incorrect! Next clue revealed.");
      } else {
        setMessage(`Game over! The category was "${currentLevel.category}".`);
      }
    }
  };

  const recordWin = async (cluesUsed) => {
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
          gameKey: 'pinpoint',
          puzzleNumber: currentLevel.puzzleNumber,
          timeSeconds: cluesUsed * 10,
          moves: cluesUsed,
        }),
      });
    } catch (err) {
      console.error('Failed to log pinpoint score:', err);
    }
  };

  const handleReset = () => {
    setRevealedClues(1);
    setGuess("");
    setIsWon(false);
    setMessage("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div className="gameControls">
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5" }}>
          Clue {revealedClues} of {currentLevel.clues.length}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" className="gameActionBtn" onClick={loadRandomLevel} title="New category puzzle">
            <FaRandom size={11} style={{ marginRight: "4px" }} /> New
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset}>
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600" }}>
        Puzzle #{currentLevel.puzzleNumber} · {currentLevel.difficulty}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginBottom: "16px" }}>
        {currentLevel.clues.map((clue, idx) => (
          <div
            key={idx}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: idx < revealedClues ? "#e0e7ff" : "#f1f5f9",
              color: idx < revealedClues ? "#3730a3" : "#94a3b8",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
          >
            {idx < revealedClues ? clue : `Clue ${idx + 1} (Hidden)`}
          </div>
        ))}
      </div>

      {message && (
        <div style={{ fontSize: "12.5px", fontWeight: "600", color: isWon ? "#059669" : "#dc2626", marginBottom: "10px" }}>
          {message}
        </div>
      )}

      {!isWon && revealedClues <= currentLevel.clues.length && (
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <input
            placeholder="Guess the common category..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <button
            type="button"
            className="gameActionBtn"
            style={{ background: "#0a66c2", color: "#fff", borderColor: "#0a66c2" }}
            onClick={handleGuess}
          >
            <FaCheck />
          </button>
        </div>
      )}

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Category Solved!</h3>
          <p>You pinpointed #{currentLevel.puzzleNumber} in <strong>{revealedClues} clue{revealedClues > 1 ? "s" : ""}</strong>!</p>
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
            <FaCheck /> Play Next Category
          </button>
        </div>
      )}
    </div>
  );
};

export default PinpointGame;
