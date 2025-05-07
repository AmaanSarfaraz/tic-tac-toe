import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Game from "./models/Game.js";
import { connectDB } from "./config/DB.js";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

connectDB();

io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ roomId, playerId }) => {
    if (!roomId || !playerId) {
      console.log("roomid is missing");
      return;
    }

    let game = await Game.findOne({ roomId });

    if (!game) {
      game = new Game({
        roomId,
        players: [{ playerId, socketId: socket.id }],
      });
      await game.save();
    } else {
      const existingPlayerIndex = game.players.findIndex(
        (p) => p.playerId === playerId
      );

      if (existingPlayerIndex !== -1) {
        game.players[existingPlayerIndex].socketId = socket.id;
      } else if (game.players.length < 2) {
        game.players.push({ playerId, socketId: socket.id });
      } else {
        console.log(`Room ${roomId} is full.`);
      }
      await game.save();
    }

    socket.join(roomId);

    io.to(roomId).emit("gameState", game);
  });

  socket.on("makeMove", async ({ roomId, index }) => {
    const game = await Game.findOne({ roomId });
    if (!game || game.isPaused || game.winner) return;

    if (game.board[index] === "") {
      game.board[index] = game.currentPlayer;

      const winner = checkWinner(game.board);
      if (winner) {
        game.winner = winner;
      } else {
        game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
      }

      await game.save();
      io.to(roomId).emit("gameState", game);
    }
  });

  socket.on("pauseGame", async (roomId) => {
    const game = await Game.findOne({ roomId });
    if (!game) return;

    game.isPaused = true;
    await game.save();
    io.to(roomId).emit("gameState", game);
  });

  socket.on("resumeGame", async (roomId) => {
    const game = await Game.findOne({ roomId });
    if (!game) return;

    game.isPaused = false;
    await game.save();
    io.to(roomId).emit("gameState", game);
  });

  socket.on("restartGame", async (roomId) => {
    const game = await Game.findOne({ roomId });
    if (!game) return;

    game.board = Array(9).fill("");
    game.currentPlayer = "X";
    game.isPaused = false;
    game.winner = null;
    await game.save();
    io.to(roomId).emit("gameState", game);
  });
});

function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== "")) return "Draw";
  return null;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
