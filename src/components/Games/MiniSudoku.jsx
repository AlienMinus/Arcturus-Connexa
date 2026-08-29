import React, { useState, useEffect } from "react";
import { FaUndo, FaLightbulb, FaTrophy } from "react-icons/fa";

// 4x4 Mini Sudoku Puzzle
const INITIAL_BOARD = [
  [1, 0, 0, 4],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [4, 0, 0, 2],
];

const SOLUTION_BOARD = [
  [1, 3, 2, 4],
  [2, 4, 1, 3],
  [3, 1, 4, 2],
  [4, 2, 3, 1],
];

const MiniSudoku = () => {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selectedCell, setSelectedCell] = useState([0, 1]);
  const [isWon, setIsWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isWon) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isWon]);

  const handleCellClick = (r, c) => {
    if (INITIAL_BOARD[r][c] !== 0) return;
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (INITIAL_BOARD[r][c] !== 0) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Check if board matches solution
    const won = newBoard.every((row, ri) =>
      row.every((val, ci) => val === SOLUTION_BOARD[ri][ci])
    );
    if (won) setIsWon(true);
  };

  const handleReset = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setIsWon(false);
    setSeconds(0);
    setSelectedCell([0, 1]);
  };

  const handleHint = () => {
    if (!selectedCell || isWon) return;
    const [r, c] = selectedCell;
    handleNumberInput(SOLUTION_BOARD[r][c]);
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
          <button type="button" className="gameActionBtn" onClick={handleHint} title="Fill selected cell">
            <FaLightbulb size={12} style={{ marginRight: "4px" }} /> Hint
          </button>
          <button type="button" className="gameActionBtn" onClick={handleReset} title="Restart board">
            <FaUndo size={11} style={{ marginRight: "4px" }} /> Reset
          </button>
        </div>
      </div>

      <div className="sudokuGrid">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isPre = INITIAL_BOARD[r][c] !== 0;
            const isSel = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`sudokuCell ${isPre ? "prefilled" : ""} ${isSel ? "selected" : ""}`}
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
          <h3><FaTrophy style={{ color: "#d97706" }} /> Puzzle Solved!</h3>
          <p>You completed Mini Sudoku #215 in <strong>{formatTimer(seconds)}</strong>!</p>
        </div>
      )}
    </div>
  );
};

export default MiniSudoku;

