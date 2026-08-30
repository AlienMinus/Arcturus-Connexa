import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy, FaRandom, FaCheck } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_TANGO_LEVELS = [
  {
    puzzleNumber: 523,
    difficulty: "Easy",
    grid: [
      [1, 0, 0, 2],
      [0, 0, 1, 0],
      [0, 2, 0, 0],
      [2, 0, 0, 1],
    ],
  },
  {
    puzzleNumber: 524,
    difficulty: "Medium",
    grid: [
      [0, 1, 0, 0],
      [2, 0, 0, 1],
      [0, 0, 2, 0],
      [1, 0, 0, 2],
    ],
  },
  {
    puzzleNumber: 525,
    difficulty: "Medium",
    grid: [
      [0, 0, 2, 0],
      [1, 0, 0, 2],
      [0, 2, 0, 1],
      [2, 0, 1, 0],
    ],
  },
  {
    puzzleNumber: 526,
    difficulty: "Hard",
    grid: [
      [2, 0, 0, 1],
      [0, 1, 2, 0],
      [0, 2, 1, 0],
      [1, 0, 0, 2],
    ],
  },
];

const SYMBOLS = {
  0: "",
  1: "☀️",
  2: "🌙",
};

// True Tango Mathematical Rule Engine
const validateTangoBoard = (grid) => {
  const size = grid.length;
  const targetPerSymbol = size / 2; // e.g. 2 Suns and 2 Moons in 4x4

  // Check all cells filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c] || (grid[r][c] !== 1 && grid[r][c] !== 2)) return false;
    }
  }

  // Check row counts and no 3 in a row
  for (let r = 0; r < size; r++) {
    let suns = 0;
    let moons = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) suns++;
      if (grid[r][c] === 2) moons++;

      // Check 3 consecutive horizontal
      if (c >= 2 && grid[r][c] === grid[r][c - 1] && grid[r][c] === grid[r][c - 2]) {
        return false;
      }
    }
    if (suns !== targetPerSymbol || moons !== targetPerSymbol) return false;
  }

  // Check column counts and no 3 in a column
  for (let c = 0; c < size; c++) {
    let suns = 0;
    let moons = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 1) suns++;
      if (grid[r][c] === 2) moons++;

      // Check 3 consecutive vertical
      if (r >= 2 && grid[r][c] === grid[r - 1][c] && grid[r][c] === grid[r - 2][c]) {
        return false;
      }
    }
    if (suns !== targetPerSymbol || moons !== targetPerSymbol) return false;
  }

  return true;
};

// Backtracking solver for Tango hints
const solveTango = (initial) => {
  const size = initial.length;
  const grid = initial.map(row => [...row]);

  const isValidPlacement = (g, r, c, val) => {
    // Check 3 in a row horizontal
    if (c >= 2 && g[r][c - 1] === val && g[r][c - 2] === val) return false;
    if (c >= 1 && c + 1 < size && g[r][c - 1] === val && g[r][c + 1] === val) return false;
    if (c + 2 < size && g[r][c + 1] === val && g[r][c + 2] === val) return false;

    // Check 3 in a row vertical
    if (r >= 2 && g[r - 1][c] === val && g[r - 2][c] === val) return false;
    if (r >= 1 && r + 1 < size && g[r - 1][c] === val && g[r + 1][c] === val) return false;
    if (r + 2 < size && g[r + 1][c] === val && g[r + 2][c] === val) return false;

    // Count in row
    let rowCount = 0;
    for (let ci = 0; ci < size; ci++) {
      if (ci === c ? val === val : g[r][ci] === val) rowCount++;
    }
    if (rowCount > size / 2) return false;

    // Count in col
    let colCount = 0;
    for (let ri = 0; ri < size; ri++) {
      if (ri === r ? val === val : g[ri][c] === val) colCount++;
    }
    if (colCount > size / 2) return false;

    return true;
  };

  const solve = () => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          for (const val of [1, 2]) {
            if (isValidPlacement(grid, r, c, val)) {
              grid[r][c] = val;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  if (solve()) return grid;
  return null;
};

const TangoGame = () => {
  const [currentLevel, setCurrentLevel] = useState(FALLBACK_TANGO_LEVELS[0]);
  const [initialGrid, setInitialGrid] = useState(FALLBACK_TANGO_LEVELS[0].grid);
  const [grid, setGrid] = useState(FALLBACK_TANGO_LEVELS[0].grid.map(row => [...row]));
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const loadRandomLevel = async () => {
    try {
      const res = await fetch(buildApiUrl('/games/tango/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.grid) {
          const l = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(500 + Math.random() * 500),
            difficulty: data.level.difficulty || "Medium",
            grid: data.level.puzzleData.grid,
          };
          setCurrentLevel(l);
          setInitialGrid(l.grid);
          setGrid(l.grid.map(row => [...row]));
          setIsWon(false);
          setSeconds(0);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend tango fetch notice:", err.message);
    }

    const randIndex = Math.floor(Math.random() * FALLBACK_TANGO_LEVELS.length);
    const chosen = FALLBACK_TANGO_LEVELS[randIndex];
    setCurrentLevel(chosen);
    setInitialGrid(chosen.grid);
    setGrid(chosen.grid.map(row => [...row]));
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
    if (initialGrid[r][c] !== 0 || isWon) return;

    const newGrid = grid.map(row => [...row]);
    // Cycle: 0 -> 1 (Sun) -> 2 (Moon) -> 0
    newGrid[r][c] = (newGrid[r][c] + 1) % 3;
    setGrid(newGrid);

    // True mathematical rule check
    if (validateTangoBoard(newGrid)) {
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
          gameKey: 'tango',
          puzzleNumber: currentLevel.puzzleNumber,
          timeSeconds: timeTaken,
        }),
      });
    } catch (err) {
      console.error('Failed to log tango score:', err);
    }
  };

  const handleReset = () => {
    setGrid(initialGrid.map(row => [...row]));
    setIsWon(false);
    setSeconds(0);
  };

  const handleHint = () => {
    if (isWon) return;
    const solved = solveTango(initialGrid);
    if (!solved) return;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid.length; c++) {
        if (initialGrid[r][c] === 0 && grid[r][c] !== solved[r][c]) {
          const newGrid = grid.map(row => [...row]);
          newGrid[r][c] = solved[r][c];
          setGrid(newGrid);

          if (validateTangoBoard(newGrid)) {
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
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Fill one cell">
            <FaLightbulb size={11} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset} title="Reset current puzzle">
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600" }}>
        Puzzle #{currentLevel.puzzleNumber} · {currentLevel.difficulty}
      </div>

      <div className="tangoGrid">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isPre = initialGrid[r][c] !== 0;
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

      <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center", marginBottom: "10px" }}>
        Tap blank cells to toggle ☀️ and 🌙. No 3 in a row & equal suns and moons per row/col!
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Tango Solved!</h3>
          <p>You completed Tango #{currentLevel.puzzleNumber} in <strong>{formatTimer(seconds)}</strong>!</p>
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

export default TangoGame;
