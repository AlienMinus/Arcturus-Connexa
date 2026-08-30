import mongoose from 'mongoose';

const GameLevelSchema = new mongoose.Schema(
  {
    gameKey: {
      type: String,
      required: true,
      enum: ['sudoku', 'zip', 'tango', 'queens', 'crossclimb', 'pinpoint'],
      index: true,
    },
    levelNumber: { type: Number, required: true },
    puzzleNumber: { type: Number, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, default: 'Medium' },
    puzzleData: { type: mongoose.Schema.Types.Mixed, required: true },
    solutionMeta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const GameScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gameKey: {
      type: String,
      required: true,
      index: true,
    },
    levelNumber: { type: Number, default: 1 },
    puzzleNumber: { type: Number },
    timeSeconds: { type: Number, required: true },
    moves: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GameLevel = mongoose.model('GameLevel', GameLevelSchema);
export const GameScore = mongoose.model('GameScore', GameScoreSchema);

export default { GameLevel, GameScore };

