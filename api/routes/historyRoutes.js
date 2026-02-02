const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/historyController");

router.post("/games", auth, controller.saveFinalizedGame);
router.get("/games", auth, controller.getHistory);
router.delete("/games/:id", auth, controller.deleteHistoryGame);

module.exports = router;
