import React, { useState } from "react";
import { 
  FaPuzzlePiece, 
  FaBorderAll, 
  FaBrain, 
  FaChessKnight, 
  FaLayerGroup, 
  FaBullseye,
  FaChevronDown,
  FaChevronUp,
  FaPlay
} from "react-icons/fa";
import GameModal from "./GameModal";
import "./Games.css";

const ALL_GAMES = [
  {
    key: "zip",
    name: "Zip #362",
    desc: "Match the word tiles",
    icon: <FaPuzzlePiece size={16} />,
    className: "zip",
  },
  {
    key: "sudoku",
    name: "Mini Sudoku #215",
    desc: "4x4 daily number grid",
    icon: <FaBorderAll size={16} />,
    className: "sudoku",
  },
  {
    key: "tango",
    name: "Tango #523",
    desc: "Harmonize the grid",
    icon: <FaBrain size={16} />,
    className: "tango",
  },
  {
    key: "queens",
    name: "Queens #683",
    desc: "Crown each region",
    icon: <FaChessKnight size={16} />,
    className: "queens",
  },
  {
    key: "crossclimb",
    name: "Crossclimb #184",
    desc: "Climb the word ladder",
    icon: <FaLayerGroup size={16} />,
    className: "crossclimb",
  },
  {
    key: "pinpoint",
    name: "Pinpoint #412",
    desc: "Guess the category",
    icon: <FaBullseye size={16} />,
    className: "pinpoint",
  },
];

const PuzzleGames = () => {
  const [expanded, setExpanded] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const displayedGames = expanded ? ALL_GAMES : ALL_GAMES.slice(0, 4);

  return (
    <>
      <div className="card puzzleCard">
        <h4>Today's puzzle games</h4>

        <div className="puzzleList">
          {displayedGames.map((game) => (
            <button
              key={game.key}
              type="button"
              className={`puzzleItem ${game.className}`}
              onClick={() => setSelectedGame(game.key)}
              title={`Play ${game.name}`}
            >
              <div className="puzzleIconWrapper">
                {game.icon}
              </div>
              <div className="puzzleItemInfo">
                <div className="puzzleItemName">{game.name}</div>
                <div className="puzzleItemDesc">{game.desc}</div>
              </div>
              <div className="puzzlePlayBtn">
                <FaPlay size={9} style={{ marginRight: "3px" }} /> Play
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="puzzleShowMoreBtn"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? "Show less" : "Show more"}</span>
          {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
        </button>
      </div>

      {/* Interactive Game Modal */}
      {selectedGame && (
        <GameModal
          gameKey={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
};

export default PuzzleGames;

