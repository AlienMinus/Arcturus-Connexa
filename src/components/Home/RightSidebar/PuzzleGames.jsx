import React from "react";
import { FaPuzzlePiece, FaBorderAll, FaBrain, FaChessKnight } from "react-icons/fa";

const PuzzleGames = () => {
  return (
    <div className="card puzzleCard">

      <h4>Today's puzzle games</h4>

      <div className="puzzleItem">
        <FaPuzzlePiece /> Zip #362
      </div>

      <div className="puzzleItem">
        <FaBorderAll /> Mini Sudoku #215
      </div>

      <div className="puzzleItem">
        <FaBrain /> Tango #523
      </div>

      <div className="puzzleItem">
        <FaChessKnight /> Queens #683
      </div>

      <span className="showMore">Show more</span>

    </div>
  );
};

export default PuzzleGames;