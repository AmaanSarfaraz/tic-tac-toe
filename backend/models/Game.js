import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
});

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  board: {
    type: [String],
    default: Array(9).fill(""),
  },
  currentPlayer: {
    type: String,
    default: "X",
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  winner: {
    type: String,
    default: null,
  },
  players: {
    type: [playerSchema],
    default: [],
  },
});

export default mongoose.model("Game", gameSchema);
