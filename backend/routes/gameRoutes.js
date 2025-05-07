const express = require("express");
const { createGame, getGame } = require("../controllers/gameController");

const router = express.Router();

router.post("/create", createGame);
router.get("/:roomId", getGame);

module.exports = router;
