import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

const SERVER_URL = "http://localhost:3000";
const initialBoard = Array(9).fill("");

function App() {
  const [playerId] = useState(() => {
    let id = localStorage.getItem("playerId");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("playerId", id);
    }
    return id;
  });

  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (joinedRoom) {
      const socket = io(SERVER_URL);
      socketRef.current = socket;

      socket.emit("joinRoom", { roomId, playerId });

      socket.on("gameState", (gameState) => {
        setBoard(gameState.board);
        setCurrentPlayer(gameState.currentPlayer);
        setIsPaused(gameState.isPaused);
        setWinner(gameState.winner);
        setPlayers(gameState.players || []);

        const idx = (gameState.players || []).findIndex(
          (p) => p.playerId === playerId
        );
        setPlayerSymbol(idx === 0 ? "X" : idx === 1 ? "O" : null);

        if (gameState.winner) {
          setStatus(
            gameState.winner === "Draw"
              ? "It's a Draw!"
              : `You ${
                  gameState.winner === (idx === 0 ? "X" : "O")
                    ? "Win!"
                    : "Lose!"
                }`
          );
        } else {
          setStatus(
            gameState.isPaused
              ? "Game Paused"
              : `${
                  gameState.currentPlayer === (idx === 0 ? "X" : "O")
                    ? "Your"
                    : "Opponent's"
                } turn`
          );
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [joinedRoom, roomId, playerId]);

  const handleCellClick = (index) => {
    if (
      !socketRef.current ||
      isPaused ||
      winner ||
      board[index] !== "" ||
      currentPlayer !== playerSymbol
    )
      return;

    socketRef.current.emit("makeMove", { roomId, index });
  };

  const handlePause = () => socketRef.current?.emit("pauseGame", roomId);
  const handleResume = () => socketRef.current?.emit("resumeGame", roomId);
  const handleRestart = () => socketRef.current?.emit("restartGame", roomId);

  const isPlayerInRoom = players.some((p) => p.playerId === playerId);

  return (
    <div className="App">
      <h1>
        Multiplayer <br /> Tic Tac Toe
      </h1>

      {!joinedRoom ? (
        <div className="join-room">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            onClick={() =>
              roomId.trim()
                ? setJoinedRoom(true)
                : alert("Please enter a room ID")
            }
          >
            Join Room
          </button>
        </div>
      ) : (
        <>
          <div className="board">
            {board.map((cell, i) => (
              <div
                key={i}
                className={`cell ${
                  cell || isPaused || winner || currentPlayer !== playerSymbol
                    ? "disabled"
                    : ""
                } ${cell === "X" ? "x-cell" : cell === "O" ? "o-cell" : ""}`}
                onClick={() => handleCellClick(i)}
              >
                {cell}
              </div>
            ))}
          </div>

          <div
            className={`status ${
              winner === playerSymbol
                ? "status-win"
                : winner && winner !== "Draw"
                ? "status-lose"
                : ""
            }`}
          >
            {status}
          </div>

          <div className="controls">
            <button
              onClick={handlePause}
              disabled={isPaused || winner || !isPlayerInRoom}
            >
              Pause
            </button>
            <button
              onClick={handleResume}
              disabled={!isPaused || winner || !isPlayerInRoom}
            >
              Resume
            </button>
            <button onClick={handleRestart} disabled={!isPlayerInRoom}>
              Restart
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
