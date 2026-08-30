import express from 'express';
import { GameLevel, GameScore } from '../models/Game.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const INITIAL_LEVELS = [
  // Mini Sudoku
  {
    gameKey: 'sudoku',
    levelNumber: 1,
    puzzleNumber: 215,
    title: 'Mini Sudoku #215',
    difficulty: 'Easy',
    puzzleData: {
      board: [
        [1, 0, 0, 4],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
        [4, 0, 0, 2],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'sudoku',
    levelNumber: 2,
    puzzleNumber: 216,
    title: 'Mini Sudoku #216',
    difficulty: 'Medium',
    puzzleData: {
      board: [
        [0, 2, 0, 0],
        [0, 0, 4, 0],
        [0, 4, 0, 0],
        [0, 0, 1, 0],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'sudoku',
    levelNumber: 3,
    puzzleNumber: 217,
    title: 'Mini Sudoku #217',
    difficulty: 'Medium',
    puzzleData: {
      board: [
        [0, 0, 3, 0],
        [3, 0, 0, 2],
        [2, 0, 0, 4],
        [0, 1, 0, 0],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'sudoku',
    levelNumber: 4,
    puzzleNumber: 218,
    title: 'Mini Sudoku #218',
    difficulty: 'Hard',
    puzzleData: {
      board: [
        [0, 1, 0, 0],
        [0, 0, 2, 0],
        [0, 3, 0, 0],
        [0, 0, 4, 0],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'sudoku',
    levelNumber: 5,
    puzzleNumber: 219,
    title: 'Mini Sudoku #219',
    difficulty: 'Hard',
    puzzleData: {
      board: [
        [4, 0, 0, 1],
        [0, 2, 3, 0],
        [0, 3, 2, 0],
        [1, 0, 0, 4],
      ],
      size: 4,
    },
  },

  // Tango
  {
    gameKey: 'tango',
    levelNumber: 1,
    puzzleNumber: 523,
    title: 'Tango #523',
    difficulty: 'Easy',
    puzzleData: {
      grid: [
        [1, 0, 0, 2],
        [0, 0, 1, 0],
        [0, 2, 0, 0],
        [2, 0, 0, 1],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'tango',
    levelNumber: 2,
    puzzleNumber: 524,
    title: 'Tango #524',
    difficulty: 'Medium',
    puzzleData: {
      grid: [
        [0, 1, 0, 0],
        [2, 0, 0, 1],
        [0, 0, 2, 0],
        [1, 0, 0, 2],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'tango',
    levelNumber: 3,
    puzzleNumber: 525,
    title: 'Tango #525',
    difficulty: 'Medium',
    puzzleData: {
      grid: [
        [0, 0, 2, 0],
        [1, 0, 0, 2],
        [0, 2, 0, 1],
        [2, 0, 1, 0],
      ],
      size: 4,
    },
  },
  {
    gameKey: 'tango',
    levelNumber: 4,
    puzzleNumber: 526,
    title: 'Tango #526',
    difficulty: 'Hard',
    puzzleData: {
      grid: [
        [2, 0, 0, 1],
        [0, 1, 2, 0],
        [0, 2, 1, 0],
        [1, 0, 0, 2],
      ],
      size: 4,
    },
  },

  // Queens
  {
    gameKey: 'queens',
    levelNumber: 1,
    puzzleNumber: 683,
    title: 'Queens #683',
    difficulty: 'Medium',
    puzzleData: {
      size: 5,
      regions: [
        [0, 0, 1, 1, 1],
        [0, 2, 2, 1, 3],
        [0, 2, 4, 4, 3],
        [2, 2, 4, 3, 3],
        [2, 4, 4, 3, 3],
      ],
    },
  },
  {
    gameKey: 'queens',
    levelNumber: 2,
    puzzleNumber: 684,
    title: 'Queens #684',
    difficulty: 'Medium',
    puzzleData: {
      size: 5,
      regions: [
        [0, 0, 0, 1, 1],
        [2, 0, 1, 1, 3],
        [2, 2, 4, 3, 3],
        [2, 4, 4, 4, 3],
        [2, 2, 4, 3, 3],
      ],
    },
  },
  {
    gameKey: 'queens',
    levelNumber: 3,
    puzzleNumber: 685,
    title: 'Queens #685',
    difficulty: 'Hard',
    puzzleData: {
      size: 5,
      regions: [
        [0, 1, 1, 2, 2],
        [0, 0, 1, 2, 3],
        [4, 0, 1, 3, 3],
        [4, 4, 1, 3, 3],
        [4, 4, 4, 3, 3],
      ],
    },
  },

  // Zip
  {
    gameKey: 'zip',
    levelNumber: 1,
    puzzleNumber: 362,
    title: 'Zip #362',
    difficulty: 'Easy',
    puzzleData: {
      letters: ['C', 'O', 'D', 'E', 'R'],
      targetWords: ['CODE', 'CORE', 'DOOR', 'RODE', 'CORD'],
    },
  },
  {
    gameKey: 'zip',
    levelNumber: 2,
    puzzleNumber: 363,
    title: 'Zip #363',
    difficulty: 'Medium',
    puzzleData: {
      letters: ['P', 'L', 'A', 'N', 'E'],
      targetWords: ['PLAN', 'LANE', 'LEAN', 'PALE', 'PEAL'],
    },
  },
  {
    gameKey: 'zip',
    levelNumber: 3,
    puzzleNumber: 364,
    title: 'Zip #364',
    difficulty: 'Medium',
    puzzleData: {
      letters: ['S', 'T', 'A', 'R', 'T'],
      targetWords: ['STAR', 'TART', 'ARTS', 'RATS', 'STAT'],
    },
  },
  {
    gameKey: 'zip',
    levelNumber: 4,
    puzzleNumber: 365,
    title: 'Zip #365',
    difficulty: 'Hard',
    puzzleData: {
      letters: ['B', 'R', 'A', 'I', 'N'],
      targetWords: ['RAIN', 'BARN', 'BRAN', 'BAIRN', 'RANI'],
    },
  },

  // Crossclimb
  {
    gameKey: 'crossclimb',
    levelNumber: 1,
    puzzleNumber: 184,
    title: 'Crossclimb #184',
    difficulty: 'Easy',
    puzzleData: {
      steps: [
        { clue: 'Start of life on Earth', word: 'SEED', solved: true },
        { clue: 'To perceive with the eyes', word: 'SEEN', solved: false },
        { clue: 'The past participle of hide', word: 'SEEK', solved: false },
        { clue: 'Fine and smooth soft fabric', word: 'SILK', solved: false },
      ],
    },
  },
  {
    gameKey: 'crossclimb',
    levelNumber: 2,
    puzzleNumber: 185,
    title: 'Crossclimb #185',
    difficulty: 'Medium',
    puzzleData: {
      steps: [
        { clue: 'Cold winter precipitation', word: 'SNOW', solved: true },
        { clue: 'Opposite of fast', word: 'SLOW', solved: false },
        { clue: 'To sparkle with bright light', word: 'GLOW', solved: false },
        { clue: 'To expand in size or maturity', word: 'GROW', solved: false },
      ],
    },
  },
  {
    gameKey: 'crossclimb',
    levelNumber: 3,
    puzzleNumber: 186,
    title: 'Crossclimb #186',
    difficulty: 'Hard',
    puzzleData: {
      steps: [
        { clue: 'Firm ground under feet', word: 'LAND', solved: true },
        { clue: 'Sandy ocean shore', word: 'SAND', solved: false },
        { clue: 'To dispatch mail or a message', word: 'SEND', solved: false },
        { clue: 'To repair or fix a tear', word: 'MEND', solved: false },
      ],
    },
  },

  // Pinpoint
  {
    gameKey: 'pinpoint',
    levelNumber: 1,
    puzzleNumber: 412,
    title: 'Pinpoint #412',
    difficulty: 'Easy',
    puzzleData: {
      clues: ['1. Apple', '2. Microsoft', '3. Google', '4. NVIDIA'],
      category: 'TECH GIANTS',
      acceptedAnswers: ['TECH GIANTS', 'BIG TECH', 'TECH COMPANIES', 'TECH', 'TRILLION DOLLAR COMPANIES'],
    },
  },
  {
    gameKey: 'pinpoint',
    levelNumber: 2,
    puzzleNumber: 413,
    title: 'Pinpoint #413',
    difficulty: 'Medium',
    puzzleData: {
      clues: ['1. Python', '2. JavaScript', '3. Rust', '4. TypeScript'],
      category: 'PROGRAMMING LANGUAGES',
      acceptedAnswers: ['PROGRAMMING LANGUAGES', 'LANGUAGES', 'CODING LANGUAGES', 'CODE', 'PROGRAMMING'],
    },
  },
  {
    gameKey: 'pinpoint',
    levelNumber: 3,
    puzzleNumber: 414,
    title: 'Pinpoint #414',
    difficulty: 'Hard',
    puzzleData: {
      clues: ['1. React', '2. Vue', '3. Angular', '4. Svelte'],
      category: 'FRONTEND FRAMEWORKS',
      acceptedAnswers: ['FRONTEND FRAMEWORKS', 'JAVASCRIPT FRAMEWORKS', 'UI FRAMEWORKS', 'FRAMEWORKS', 'WEB FRAMEWORKS'],
    },
  },
];

// Ensure levels exist in database
async function seedLevelsIfEmpty() {
  try {
    const count = await GameLevel.countDocuments();
    if (count === 0) {
      await GameLevel.insertMany(INITIAL_LEVELS);
      console.log('Seeded game levels into database');
    }
  } catch (err) {
    console.warn('Game levels seeding warning (using in-memory):', err.message);
  }
}

seedLevelsIfEmpty();

// Get random level for a game
router.get('/:gameKey/random', async (req, res) => {
  try {
    const { gameKey } = req.params;
    let levels = await GameLevel.find({ gameKey }).lean();
    if (!levels || levels.length === 0) {
      levels = INITIAL_LEVELS.filter((l) => l.gameKey === gameKey);
    }

    if (!levels || levels.length === 0) {
      return res.status(404).json({ error: 'Game levels not found' });
    }

    const randomIndex = Math.floor(Math.random() * levels.length);
    res.json({
      level: levels[randomIndex],
      totalLevels: levels.length,
    });
  } catch (err) {
    console.error(err);
    const fallback = INITIAL_LEVELS.filter((l) => l.gameKey === req.params.gameKey);
    res.json({
      level: fallback[Math.floor(Math.random() * fallback.length)] || null,
      totalLevels: fallback.length,
    });
  }
});

// Get all levels for a game
router.get('/:gameKey/levels', async (req, res) => {
  try {
    const { gameKey } = req.params;
    let levels = await GameLevel.find({ gameKey }).sort({ levelNumber: 1 }).lean();
    if (!levels || levels.length === 0) {
      levels = INITIAL_LEVELS.filter((l) => l.gameKey === gameKey);
    }
    res.json({ levels });
  } catch (err) {
    console.error(err);
    const fallback = INITIAL_LEVELS.filter((l) => l.gameKey === req.params.gameKey);
    res.json({ levels: fallback });
  }
});

// Record a game completion / win
router.post('/record-win', authMiddleware, async (req, res) => {
  try {
    const { gameKey, levelNumber, puzzleNumber, timeSeconds, moves } = req.body;

    const score = new GameScore({
      userId: req.userId,
      gameKey,
      levelNumber: levelNumber || 1,
      puzzleNumber,
      timeSeconds: timeSeconds || 0,
      moves: moves || 0,
    });

    await score.save();
    res.json({ success: true, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record score' });
  }
});

// Get user game stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const scores = await GameScore.find({ userId: req.userId }).sort({ completedAt: -1 }).lean();
    const stats = {
      totalGamesWon: scores.length,
      byGame: {},
    };

    for (const s of scores) {
      if (!stats.byGame[s.gameKey]) {
        stats.byGame[s.gameKey] = {
          wins: 0,
          bestTime: s.timeSeconds,
        };
      }
      stats.byGame[s.gameKey].wins += 1;
      stats.byGame[s.gameKey].bestTime = Math.min(stats.byGame[s.gameKey].bestTime, s.timeSeconds);
    }

    res.json({ stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

export default router;

