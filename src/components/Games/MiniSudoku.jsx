import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy, FaRandom, FaCheck } from "react-icons/fa";
import { buildApiUrl } from "../../utils/api";

const FALLBACK_PUZZLES = [
  {
    puzzleNumber: 215,
    difficulty: "Easy",
    board: [
      [1, 0, 0, 4],
      [0, 0, 1, 0],
      [0, 1, 0, 0],
      [4, 0, 0, 2],
    ],
  },
  {
    puzzleNumber: 216,
    difficulty: "Medium",
    board: [
      [0, 2, 0, 0],
      [0, 0, 4, 0],
      [0, 4, 0, 0],
      [0, 0, 1, 0],
    ],
  },
  {
    puzzleNumber: 217,
    difficulty: "Medium",
    board: [
      [0, 0, 3, 0],
      [3, 0, 0, 2],
      [2, 0, 0, 4],
      [0, 1, 0, 0],
    ],
  },
  {
    puzzleNumber: 218,
    difficulty: "Hard",
    board: [
      [0, 1, 0, 0],
      [0, 0, 2, 0],
      [0, 3, 0, 0],
      [0, 0, 4, 0],
    ],
  },
  {
    puzzleNumber: 219,
    difficulty: "Hard",
    board: [
      [4, 0, 0, 1],
      [0, 2, 3, 0],
      [0, 3, 2, 0],
      [1, 0, 0, 4],
    ],
  },
];

// Mathematical 4x4 Sudoku Validation Engine
const validateSudokuBoard = (grid) => {
  // Check if fully filled
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c] || grid[r][c] < 1 || grid[r][c] > 4) return false;
    }
  }

  // Check rows
  for (let r = 0; r < 4; r++) {
    const seen = new Set();
    for (let c = 0; c < 4; c++) {
      if (seen.has(grid[r][c])) return false;
      seen.add(grid[r][c]);
    }
  }

  // Check columns
  for (let c = 0; c < 4; c++) {
    const seen = new Set();
    for (let r = 0; r < 4; r++) {
      if (seen.has(grid[r][c])) return false;
      seen.add(grid[r][c]);
    }
  }

  // Check 2x2 quadrants
  const boxes = [
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 2], [0, 3], [1, 2], [1, 3]],
    [[2, 0], [2, 1], [3, 0], [3, 1]],
    [[2, 2], [2, 3], [3, 2], [3, 3]],
  ];

  for (const box of boxes) {
    const seen = new Set();
    for (const [r, c] of box) {
      if (seen.has(grid[r][c])) return false;
      seen.add(grid[r][c]);
    }
  }

  return true;
};

// Check if a cell has conflicts with existing numbers in row, col, or box
const getCellConflicts = (grid, r, c, val) => {
  if (!val) return false;

  // Check row
  for (let ci = 0; ci < 4; ci++) {
    if (ci !== c && grid[r][ci] === val) return true;
  }

  // Check col
  for (let ri = 0; ri < 4; ri++) {
    if (ri !== r && grid[ri][c] === val) return true;
  }

  // Check 2x2 box
  const startRow = Math.floor(r / 2) * 2;
  const startCol = Math.floor(c / 2) * 2;
  for (let ri = startRow; ri < startRow + 2; ri++) {
    for (let ci = startCol; ci < startCol + 2; ci++) {
      if ((ri !== r || ci !== c) && grid[ri][ci] === val) return true;
    }
  }

  return false;
};

// Backtracking solver for 4x4 Sudoku hints
const solveSudoku = (grid) => {
  const board = grid.map(row => [...row]);

  const isValid = (b, r, c, num) => {
    for (let i = 0; i < 4; i++) {
      if (b[r][i] === num || b[i][c] === num) return false;
    }
    const startRow = Math.floor(r / 2) * 2;
    const startCol = Math.floor(c / 2) * 2;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (b[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  };

  const solve = () => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) {
          for (let num = 1; num <= 4; num++) {
            if (isValid(board, r, c, num)) {
              board[r][c] = num;
              if (solve()) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  if (solve()) return board;
  return null;
};

const MiniSudoku = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState(FALLBACK_PUZZLES[0]);
  const [initialBoard, setInitialBoard] = useState(FALLBACK_PUZZLES[0].board);
  const [board, setBoard] = useState(FALLBACK_PUZZLES[0].board.map(row => [...row]));
  const [selectedCell, setSelectedCell] = useState([0, 1]);
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load a new random level
  const loadRandomLevel = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/games/sudoku/random'));
      if (res.ok) {
        const data = await res.json();
        if (data.level?.puzzleData?.board) {
          const p = {
            puzzleNumber: data.level.puzzleNumber || Math.floor(200 + Math.random() * 800),
            difficulty: data.level.difficulty || "Medium",
            board: data.level.puzzleData.board,
          };
          setCurrentPuzzle(p);
          setInitialBoard(p.board);
          setBoard(p.board.map(row => [...row]));
          setIsWon(false);
          setSeconds(0);
          setSelectedCell([0, 0]);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend puzzle fetch notice (using randomized local pool):", err.message);
    } finally {
      setLoading(false);
    }

    // Fallback to random local level
    const randIndex = Math.floor(Math.random() * FALLBACK_PUZZLES.length);
    const chosen = FALLBACK_PUZZLES[randIndex];
    setCurrentPuzzle(chosen);
    setInitialBoard(chosen.board);
    setBoard(chosen.board.map(row => [...row]));
    setIsWon(false);
    setSeconds(0);
    setSelectedCell([0, 0]);
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
    if (initialBoard[r][c] !== 0) return;
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // True mathematical validation: check if ANY valid Sudoku solution is achieved!
    if (validateSudokuBoard(newBoard)) {
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
          gameKey: 'sudoku',
          puzzleNumber: currentPuzzle.puzzleNumber,
          timeSeconds: timeTaken,
        }),
      });
    } catch (err) {
      console.error('Failed to log game score:', err);
    }
  };

  const handleReset = () => {
    setBoard(initialBoard.map(row => [...row]));
    setIsWon(false);
    setSeconds(0);
  };

  const handleHint = () => {
    if (isWon || !selectedCell) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return;

    const solved = solveSudoku(initialBoard);
    if (solved) {
      handleNumberInput(solved[r][c]);
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
          <button type="button" className="gameActionBtn" onClick={loadRandomLevel} title="Load another random puzzle">
            <FaRandom size={11} style={{ marginRight: "4px" }} /> New Game
          </button>
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Fill selected cell with valid number">
            <FaLightbulb size={11} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset} title="Reset current puzzle">
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600" }}>
        Puzzle #{currentPuzzle.puzzleNumber} · {currentPuzzle.difficulty}
      </div>

      <div className="sudokuGrid">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isPre = initialBoard[r][c] !== 0;
            const isSel = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
            const hasConflict = !isPre && val !== 0 && getCellConflicts(board, r, c, val);

            return (
              <div
                key={`${r}-${c}`}
                className={`sudokuCell ${isPre ? "prefilled" : ""} ${isSel ? "selected" : ""} ${hasConflict ? "invalid" : ""}`}
                onClick={() => handleCellClick(r, c)}
              >
                {val !== 0 ? val : ""}
              </div>
            );
          })
        )}
      </div>

      <div className="sudokuKeypad">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            type="button"
            className="sudokuKeyBtn"
            onClick={() => handleNumberInput(num)}
            disabled={isWon}
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          className="sudokuKeyBtn"
          style={{ fontSize: "14px", width: "52px" }}
          onClick={() => handleNumberInput(0)}
          disabled={isWon}
        >
          Clear
        </button>
      </div>

      {isWon && (
        <div className="gameWinBox">
          <h3><FaTrophy style={{ color: "#d97706" }} /> Sudoku Solved!</h3>
          <p>You completed Mini Sudoku #{currentPuzzle.puzzleNumber} in <strong>{formatTimer(seconds)}</strong>!</p>
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

export default MiniSudoku;
