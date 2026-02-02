const mongoose = require("mongoose");

const HistoryGameSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // snapshot do jogo finalizado
  payload: { type: mongoose.Schema.Types.Mixed, required: true },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HistoryGame", HistoryGameSchema);
