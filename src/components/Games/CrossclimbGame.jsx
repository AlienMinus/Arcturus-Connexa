import React, { useState, useEffect } from "react";
import { FaUndo, FaTrophy, FaCheck } from "react-icons/fa";

// Word ladder trivia
const LADDER_STEPS = [
  { clue: "Start of life on Earth", word: "SEED", solved: true },
  { clue: "To perceive with the eyes", word: "SEEN", solved: false },
  { clue: "The past participle of hide", word: "SEEK", solved: false },
  { clue: "Fine and smooth soft fabric", word: "SILK", solved: false },
];

const CrossclimbGame = () => {
  const [steps, setSteps] = useState(LADDER_STEPS);
  const [currentInput, setCurrentInput] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleSubmit = () => {
    if (!currentInput || isWon) return;
    const word = currentInput.toUpperCase().trim();

    if (word === steps[activeStep].word) {
      const updated = [...steps];
      updated[activeStep].solved = true;
      setSteps(updated);
      setCurrentInput("");

      if (activeStep + 1 < steps.length) {
        setActiveStep(activeStep + 1);
      } else {
        setIsWon(true);
      }
    } else {
      alert("Try again! Match the clue and change 1 letter.");
    }
  };

  const handleReset = () => {
    setSteps(LADDER_STEPS.map((s, i) => ({ ...s, solved: i === 0 })));
    setActiveStep(1);
    setCurrentInput("");
    setIsWon(false);
    setSeconds(0);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div className="gameControls">
        <div className="gameTimer">⏱️ {formatTimer(seconds)}</div>
        <button type="button" className="gameActionBtn" onClick={handleReset}>
          <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginBottom: "16px" }}>
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "10px",
              background: step.solved ? "#ecfdf5" : idx === activeStep ? "#eff6ff" : "#f8fafc",
              border: `1px solid ${step.solved ? "#a7f3d0" : idx === activeStep ? "#3b82f6" : "#e2e8f0"}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Step {idx + 1}: {step.clue}</div>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "2px", color: step.solved ? "#059669" : "#0f172a" }}>
              {step.solved ? step.word : "_ _ _ _"}
            </div>
          </div>
        ))}
      </div>

      {!isWon && (
        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
          <input
            placeholder={`Guess 4-letter word for Step ${activeStep + 1}`}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={4}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "15px",
              fontWeight: "700",
              letterSpacing: "2px",
              textAlign: "center",
            }}
          />
          <button
            type="button"
            className="gameActionBtn"
            style={{ background: "#0a66c2", color: "#fff", borderColor: "#0a66c2" }}
            onClick={handleSubmit}
          >
            <FaCheck />
          </button>
        </div>
      )}

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Ladder Completed!</h3>
          <p>You climbed Crossclimb #184 in <strong>{formatTimer(seconds)}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default CrossclimbGame;

