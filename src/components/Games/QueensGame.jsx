import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy, FaRandom, FaCheck } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_QUEENS_LEVELS = [
  {
    puzzleNumber: 683,
    difficulty: "Medium",
    size: 5,
    regions: [
      [0, 0, 1, 1, 1],
      [0, 2, 2, 1, 3],
      [0, 2, 4, 4, 3],
      [2, 2, 4, 3, 3],
      [2, 4, 4, 3, 3],
    ],
  },
  {
    puzzleNumber: 684,
    difficulty: "Medium",
    size: 5,
    regions: [
      [0, 0, 0, 1, 1],
      [2, 0, 1, 1, 3],
      [2, 2, 4, 3, 3],
      [2, 4, 4, 4, 3],
      [2, 2, 4, 3, 3],
    ],
  },
  {
    puzzleNumber: 685,
    difficulty: "Hard",
    size: 5,
    regions: [
      [0, 1, 1, 2, 2],
      [0, 0, 1, 2, 3],
      [4, 0, 1, 3, 3],
      [4, 4, 1, 3, 3],
      [4, 4, 4, 3, 3],
    ],
  },
];

// True Queens Mathematical Rule Engine
const validateQueensBoard = (board, regions) => {
  const size = board.length;
  const queens = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 1) {
        queens.push({ r, c, region: regions[r][c] });
      }
    }
  }

  // Exactly 'size' queens must be placed
  if (queens.length !== size) return false;

  // Check 1 per row
  const rows = new Set(queens.map(q => q.r));
  if (rows.size !== size) return false;

  // Check 1 per column
  const cols = new Set(queens.map(q => q.c));
  if (cols.size !== size) return false;

  // Check 1 per color region
  const regionSet = new Set(queens.map(q => q.region));
  if (regionSet.size !== size) return false;

  // Check no two queens touch (orthogonal or diagonal adjacency: distance <= 1 in both dx and dy)
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const dr = Math.abs(queens[i].r - queens[j].r);
      const dc = Math.abs(queens[i].c - queens[j].c);
      if (dr <= 1 && dc <= 1) {
        return false;
      }
    }
  }

  return true;
};

// Backtracking solver for 5x5 Queens puzzle hints
const solveQueens = (regions) => {
  const size = regions.length;
  const board = Array(size).fill(null).map(() => Array(size).fill(0));

  const isSafe = (b, row, col) => {
    // Check col
    for (let r = 0; r < row; r++) {
      if (b[r][col] === 1) return false;
    }

    // Check same region
    const currentRegion = regions[row][col];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (b[r][c] === 1 && regions[r][c] === currentRegion) return false;
      }
    }

    // Check adjacency (orthogonally or diagonally adjacent to any placed queen)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && b[nr][nc] === 1) {
          return false;
        }
      }
    }

    return true;
  };

  const solveRow = (row) => {
    if (row === size) return true;
    for (let col = 0; col < size; col++) {
      if (isSafe(board, row, col)) {
        board[row][col] = 1;
        if (solveRow(row + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  };

  if (solveRow(0)) return board;
  return null;
};

const QueensGame = () => {
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_QUEENS_LEVELS[0]);
  const [board, setBoard] = useState(
    Array(5).fill(null).map(() => Array(5).fill(0))
  );
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const loadRandomLevel = async () => {
    try {
      const res = await fetch(buildApiUrl('/games/queens/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.regions) {
          const l = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(600 + Math.random() * 400),
            difficulty: data.level.difficulty || "Medium",
            size: data.level.puzzleData.size || 5,
            regions: data.level.puzzleData.regions,
          };
          setCurrentLevel(l);
          setBoard(Array(l.size).fill(null).map(() => Array(l.size).fill(0)));
          setIsWon(false);
          setSeconds(0);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend queens fetch notice:", err.message);
    }

    const randIndex = Math.floor(Math.random() * FALLBACK_QUEENS_LEVELS.length);
    const chosen = FALLBACK_QUEENS_LEVELS[randIndex];
    setCurrentLevel(chosen);
    setBoard(Array(chosen.size).fill(null).map(() => Array(chosen.size).fill(0)));
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

  const handleCellClick = (r, c) => {
    if (isWon) return;

    const newBoard = board.map(row => [...row]);
    // Cycle: 0 (empty) -> 1 (Queen 👑) -> 2 (Cross ❌) -> 0
    newBoard[r][c] = (newBoard[r][c] + 1) % 3;
    setBoard(newBoard);

    // True mathematical validation
    if (validateQueensBoard(newBoard, currentLevel.regions)) {
      setIsWon(true);
      recordWin(seconds);
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
          gameKey: 'queens',
          puzzleNumber: currentLevel.puzzleNumber,
          timeSeconds: timeTaken,
        }),
      });
    } catch (err) {
      console.error('Failed to log queens score:', err);
    }
  };

  const handleReset = () => {
    setBoard(Array(currentLevel.size).fill(null).map(() => Array(currentLevel.size).fill(0)));
    setIsWon(false);
    setSeconds(0);
  };

  const handleHint = () => {
    if (isWon) return;
    const solved = solveQueens(currentLevel.regions);
    if (!solved) return;

    for (let r = 0; r < currentLevel.size; r++) {
      for (let c = 0; c < currentLevel.size; c++) {
        if (solved[r][c] === 1 && board[r][c] !== 1) {
          const newBoard = board.map(row => [...row]);
          newBoard[r][c] = 1;
          setBoard(newBoard);

          if (validateQueensBoard(newBoard, currentLevel.regions)) {
            setIsWon(true);
            recordWin(seconds);
          }
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
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" className="gameActionBtn" onClick={loadRandomLevel} title="New random puzzle">
            <FaRandom size={11} style={{ marginRight: "4px" }} /> New Game
          </button>
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Place a valid Queen">
            <FaLightbulb size={11} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset} title="Reset board">
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600" }}>
        Puzzle #{currentLevel.puzzleNumber} · {currentLevel.difficulty}
      </div>

      <div className="queensGrid">
        {board.map((row, r) =>
          row.map((val, c) => {
            const colorClass = `color-${currentLevel.regions[r][c]}`;
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
        Place <strong>1 👑 Queen</strong> in each row, column, & color area. Queens cannot touch even diagonally!
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Queens Solved!</h3>
          <p>You crowned Queens #{currentLevel.puzzleNumber} in <strong>{formatTimer(seconds)}</strong>!</p>
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

export default QueensGame;
