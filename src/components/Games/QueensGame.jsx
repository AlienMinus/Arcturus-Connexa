import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy } from "react-icons/fa";

// 5x5 color region grid (0 to 4)
const REGIONS = [
  [0, 0, 1, 1, 1],
  [0, 2, 2, 1, 3],
  [0, 2, 4, 4, 3],
  [2, 2, 4, 3, 3],
  [2, 4, 4, 3, 3],
];

// Target Queens positions: (r, c)
const SOLUTION_QUEENS = [
  [0, 1], // Row 0
  [1, 3], // Row 1
  [2, 0], // Row 2
  [3, 4], // Row 3
  [4, 2], // Row 4
];

// Cell states: 0: empty, 1: Queen 👑, 2: Cross ❌
const QueensGame = () => {
  const [board, setBoard] = useState(
    Array(5).fill(null).map(() => Array(5).fill(0))
  );
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleCellClick = (r, c) => {
    if (isWon) return;

    const newBoard = board.map(row => [...row]);
    // Cycle: 0 (empty) -> 1 (Queen) -> 2 (Cross) -> 0
    newBoard[r][c] = (newBoard[r][c] + 1) % 3;
    setBoard(newBoard);

    // Check victory: exactly 5 queens placed on the solution coordinates
    const placedQueens = [];
    for (let ri = 0; ri < 5; ri++) {
      for (let ci = 0; ci < 5; ci++) {
        if (newBoard[ri][ci] === 1) {
          placedQueens.push([ri, ci]);
        }
      }
    }

    if (placedQueens.length === 5) {
      const allCorrect = placedQueens.every(([qr, qc]) =>
        SOLUTION_QUEENS.some(([sr, sc]) => sr === qr && sc === qc)
      );
      if (allCorrect) setIsWon(true);
    }
  };

  const handleReset = () => {
    setBoard(Array(5).fill(null).map(() => Array(5).fill(0)));
    setIsWon(false);
    setSeconds(0);
  };

  const handleHint = () => {
    if (isWon) return;
    for (const [sr, sc] of SOLUTION_QUEENS) {
      if (board[sr][sc] !== 1) {
        const newBoard = board.map(row => [...row]);
        newBoard[sr][sc] = 1;
        setBoard(newBoard);

        const placed = [];
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (newBoard[r][c] === 1) placed.push([r, c]);
          }
        }
        if (placed.length === 5 && placed.every(([qr, qc]) => SOLUTION_QUEENS.some(([sr, sc]) => sr === qr && sc === qc))) {
          setIsWon(true);
        }
        return;
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
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Place a Queen">
            <FaLightbulb size={12} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset}>
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div className="queensGrid">
        {board.map((row, r) =>
          row.map((val, c) => {
            const colorClass = `color-${REGIONS[r][c]}`;
            return (
              <div
                key={`${r}-${c}`}
                className={`queensCell ${colorClass}`}
                onClick={() => handleCellClick(r, c)}
                title="Tap to toggle (👑 / ❌)"
              >
                {val === 1 && "👑"}
                {val === 2 && <span style={{ color: "#64748b", fontSize: "16px" }}>❌</span>}
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginBottom: "8px", lineHeight: "1.4" }}>
        Place <strong>1 👑 Queen</strong> in each row, column, & color area. Queens cannot touch each other!
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Queens Crowned!</h3>
          <p>You solved Queens #683 in <strong>{formatTimer(seconds)}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default QueensGame;

