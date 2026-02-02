const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createList,
  getLists,
  deleteList,
  renameList,
  addPlayer,
  editPlayer,
  deletePlayer,
  getPlayerListById
} = require('../controllers/playerListController');

router.post('/playerList', auth, createList);
router.get('/playerList', auth, getLists);
router.delete('/playerList/:id', auth, deleteList);
router.post('/playerList/:id/addPlayer', auth, addPlayer);
router.put('/playerList/:id', auth, renameList);
router.put('/playerList/:listId/player/:playerId', auth, editPlayer);
router.delete('/playerList/:listId/player/:playerId', auth, deletePlayer);
router.get('/playerList/:id', auth, getPlayerListById);

module.exports = router;
