import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy } from "react-icons/fa";

// 0: empty, 1: Sun (☀️), 2: Moon (🌙)
const INITIAL_TANGO = [
  [1, 0, 0, 2],
  [0, 0, 1, 0],
  [0, 2, 0, 0],
  [2, 0, 0, 1],
];

const SOLUTION_TANGO = [
  [1, 2, 1, 2],
  [2, 1, 1, 2],
  [1, 2, 2, 1],
  [2, 1, 2, 1],
];

const SYMBOLS = {
  0: "",
  1: "☀️",
  2: "🌙",
};

const TangoGame = () => {
  const [grid, setGrid] = useState(INITIAL_TANGO.map(row => [...row]));
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleCellClick = (r, c) => {
    if (INITIAL_TANGO[r][c] !== 0 || isWon) return;

    const newGrid = grid.map(row => [...row]);
    // Cycle: 0 -> 1 -> 2 -> 0
    newGrid[r][c] = (newGrid[r][c] + 1) % 3;
    setGrid(newGrid);

    // Check if matching solution
    const won = newGrid.every((row, ri) =>
      row.every((val, ci) => val === SOLUTION_TANGO[ri][ci])
    );
    if (won) setIsWon(true);
  };

  const handleReset = () => {
    setGrid(INITIAL_TANGO.map(row => [...row]));
    setIsWon(false);
    setSeconds(0);
  };

  const handleHint = () => {
    if (isWon) return;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (INITIAL_TANGO[r][c] === 0 && grid[r][c] !== SOLUTION_TANGO[r][c]) {
          const newGrid = grid.map(row => [...row]);
          newGrid[r][c] = SOLUTION_TANGO[r][c];
          setGrid(newGrid);

          const won = newGrid.every((row, ri) =>
            row.every((val, ci) => val === SOLUTION_TANGO[ri][ci])
          );
          if (won) setIsWon(true);
          return;
        }
      }
    }
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
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Fill one cell">
            <FaLightbulb size={12} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset}>
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div className="tangoGrid">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isPre = INITIAL_TANGO[r][c] !== 0;
            return (
              <div
                key={`${r}-${c}`}
                className={`tangoCell ${isPre ? "prefilled" : ""}`}
                onClick={() => handleCellClick(r, c)}
                title={isPre ? "Fixed clue" : "Click to cycle (☀️ / 🌙)"}
              >
                {SYMBOLS[val]}
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: "12.5px", color: "#64748b", textAlign: "center", marginBottom: "10px" }}>
        Tap any blank cell to toggle ☀️ and 🌙. Balance each row and column!
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Tango Solved!</h3>
          <p>You completed Tango #523 in <strong>{formatTimer(seconds)}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default TangoGame;

