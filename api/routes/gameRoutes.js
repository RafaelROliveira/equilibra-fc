const express = require("express");
const router = express.Router();
const controller = require("../controllers/gameController");
const auth = require("../middleware/authMiddleware");

// Histórico (somente finalizados)
router.post("/finalized", auth, controller.saveFinalizedGame);
router.get("/", auth, controller.getFinalizedGames);

module.exports = router;
