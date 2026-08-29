import React from "react";
import { FaTimes, FaPuzzlePiece, FaBorderAll, FaBrain, FaChessKnight, FaLayerGroup, FaBullseye } from "react-icons/fa";
import MiniSudoku from "./MiniSudoku";
import ZipGame from "./ZipGame";
import TangoGame from "./TangoGame";
import QueensGame from "./QueensGame";
import CrossclimbGame from "./CrossclimbGame";
import PinpointGame from "./PinpointGame";
import "./Games.css";

const GAME_CONFIG = {
  zip: {
    title: "Zip #362",
    badge: "Word Game",
    icon: <FaPuzzlePiece color="#d97706" />,
    instructions: "Find all the hidden words that can be made from the letters below.",
    component: <ZipGame />,
  },
  sudoku: {
    title: "Mini Sudoku #215",
    badge: "Number Grid",
    icon: <FaBorderAll color="#0284c7" />,
    instructions: "Fill each row, column, and 2x2 box with numbers 1 to 4 without repeats.",
    component: <MiniSudoku />,
  },
  tango: {
    title: "Tango #523",
    badge: "Sun & Moon Logic",
    icon: <FaBrain color="#7c3aed" />,
    instructions: "Place Suns and Moons so every row and column has 2 Suns and 2 Moons without 3 in a row.",
    component: <TangoGame />,
  },
  queens: {
    title: "Queens #683",
    badge: "Chess Logic",
    icon: <FaChessKnight color="#059669" />,
    instructions: "Place 1 Queen in every row, column, and color area. Queens cannot touch even diagonally.",
    component: <QueensGame />,
  },
  crossclimb: {
    title: "Crossclimb #184",
    badge: "Word Ladder",
    icon: <FaLayerGroup color="#e11d48" />,
    instructions: "Climb the ladder by guessing each 4-letter word following the trivia clues.",
    component: <CrossclimbGame />,
  },
  pinpoint: {
    title: "Pinpoint #412",
    badge: "Category Clues",
    icon: <FaBullseye color="#4f46e5" />,
    instructions: "Guess the single category that links all the revealed clues together.",
    component: <PinpointGame />,
  },
};

const GameModal = ({ gameKey, onClose }) => {
  if (!gameKey || !GAME_CONFIG[gameKey]) return null;

  const config = GAME_CONFIG[gameKey];

  return (
    <div className="gameModalOverlay" onClick={onClose}>
      <div className="gameModalContent" onClick={(e) => e.stopPropagation()}>
        <div className="gameModalHeader">
          <div className="gameHeaderLeft">
            {config.icon}
            <h3 className="gameHeaderTitle">{config.title}</h3>
            <span className="gameHeaderBadge">{config.badge}</span>
          </div>
          <button type="button" className="gameModalCloseBtn" onClick={onClose} aria-label="Close game">
            <FaTimes />
          </button>
        </div>

        <div className="gameModalBody">
          <div className="gameInstructions">{config.instructions}</div>
          {config.component}
        </div>
      </div>
    </div>
  );
};

export default GameModal;

