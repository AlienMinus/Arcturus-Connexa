import React, { useState } from "react";
import { FaUndo, FaTrophy, FaCheck } from "react-icons/fa";

const CLUES = [
  "1. Apple",
  "2. Microsoft",
  "3. Google",
  "4. NVIDIA",
];
const CORRECT_CATEGORY = "TECH GIANTS";
const ACCEPTED_ANSWERS = ["TECH GIANTS", "BIG TECH", "TECH COMPANIES", "TECH", "TRILLION DOLLAR COMPANIES"];

const PinpointGame = () => {
  const [revealedClues, setRevealedClues] = useState(1);
  const [guess, setGuess] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [message, setMessage] = useState("");

  const handleGuess = () => {
    if (!guess.trim() || isWon) return;
    const cleanGuess = guess.toUpperCase().trim();

    if (ACCEPTED_ANSWERS.some(ans => cleanGuess.includes(ans) || ans.includes(cleanGuess))) {
      setIsWon(true);
      setMessage("Correct! 🎉");
    } else {
      if (revealedClues < 4) {
        setRevealedClues(prev => prev + 1);
        setMessage("Incorrect! Next clue revealed.");
      } else {
        setMessage(`Game over! The answer was "${CORRECT_CATEGORY}".`);
      }
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
          Clue {revealedClues} of 4
        </div>
        <button type="button" className="gameActionBtn" onClick={handleReset}>
          <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginBottom: "16px" }}>
        {CLUES.map((clue, idx) => (
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

      {!isWon && revealedClues <= 4 && (
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
          <h3><FaTrophy style={{ color: "#d97706" }} /> Spot On!</h3>
          <p>You pinpointed the category in <strong>{revealedClues} clue{revealedClues > 1 ? "s" : ""}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default PinpointGame;

