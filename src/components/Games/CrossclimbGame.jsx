import React, { useState, useEffect } from "react";
import { FaUndo, FaTrophy, FaCheck, FaRandom } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_CROSSCLIMB_LEVELS = [
  {
    puzzleNumber: 184,
    difficulty: "Easy",
    steps: [
      { clue: "Start of life on Earth", word: "SEED", solved: true },
      { clue: "To perceive with the eyes", word: "SEEN", solved: false },
      { clue: "The past participle of hide", word: "SEEK", solved: false },
      { clue: "Fine and smooth soft fabric", word: "SILK", solved: false },
    ],
  },
  {
    puzzleNumber: 185,
    difficulty: "Medium",
    steps: [
      { clue: "Cold winter precipitation", word: "SNOW", solved: true },
      { clue: "Opposite of fast", word: "SLOW", solved: false },
      { clue: "To sparkle with bright light", word: "GLOW", solved: false },
      { clue: "To expand in size or maturity", word: "GROW", solved: false },
    ],
  },
  {
    puzzleNumber: 186,
    difficulty: "Hard",
    steps: [
      { clue: "Firm ground under feet", word: "LAND", solved: true },
      { clue: "Sandy ocean shore", word: "SAND", solved: false },
      { clue: "To dispatch mail or a message", word: "SEND", solved: false },
      { clue: "To repair or fix a tear", word: "MEND", solved: false },
    ],
  },
];

const CrossclimbGame = () => {
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_CROSSCLIMB_LEVELS[0]);
  const [steps, setSteps] = useState(FALLBACK_CROSSCLIMB_LEVELS[0].steps);
  const [currentInput, setCurrentInput] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const loadRandomLevel = async () => {
    try {
      const res = await fetch(buildApiUrl('/games/crossclimb/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.steps) {
          const l = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(180 + Math.random() * 200),
            difficulty: data.level.difficulty || "Medium",
            steps: data.level.puzzleData.steps,
          };
          setCurrentLevel(l);
          setSteps(l.steps.map((s, i) => ({ ...s, solved: i === 0 })));
          setActiveStep(1);
          setCurrentInput("");
          setIsWon(false);
          setSeconds(0);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend crossclimb fetch notice:", err.message);
    }

    const randIndex = Math.floor(Math.random() * FALLBACK_CROSSCLIMB_LEVELS.length);
    const chosen = FALLBACK_CROSSCLIMB_LEVELS[randIndex];
    setCurrentLevel(chosen);
    setSteps(chosen.steps.map((s, i) => ({ ...s, solved: i === 0 })));
    setActiveStep(1);
    setCurrentInput("");
    setIsWon(false);
    setSeconds(0);
  };

  useEffect(() => {
    loadRandomLevel();
  }, []);

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
        recordWin(seconds);
      }
    } else {
      alert("Try again! Match the clue and change 1 letter from the previous word.");
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
          gameKey: 'crossclimb',
          puzzleNumber: currentLevel.puzzleNumber,
          timeSeconds: timeTaken,
        }),
      });
    } catch (err) {
      console.error('Failed to log crossclimb score:', err);
    }
  };

  const handleReset = () => {
    setSteps(currentLevel.steps.map((s, i) => ({ ...s, solved: i === 0 })));
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
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" className="gameActionBtn" onClick={loadRandomLevel} title="New word ladder">
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

      {!isWon && activeStep < steps.length && (
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
          <p>You climbed Crossclimb #{currentLevel.puzzleNumber} in <strong>{formatTimer(seconds)}</strong>!</p>
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
            <FaCheck /> Play Next Ladder
          </button>
        </div>
      )}
    </div>
  );
};

export default CrossclimbGame;
