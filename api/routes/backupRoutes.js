const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const backupController = require("../controllers/backupController");

// /api/backup/lists
router.get("/lists", auth, backupController.getListsBackup);
router.post("/lists", auth, backupController.saveListsBackup);
router.delete("/lists", auth, backupController.deleteListsBackup);

module.exports = router;
