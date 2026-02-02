const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  status: { type: String, enum: ["Finalizado"], default: "Finalizado" },
  favorito: { type: Boolean, default: false },

  nomeJogo: String,
  dataJogo: String,      // pode ser string, depois se quiser vira Date
  modalidade: String,

  placarTime1: Number,
  placarTime2: Number,
  timeVencedor: Number,  // 1,2,0
  timePerdedor: Number,  // 1,2,0

  mvpTime1: mongoose.Schema.Types.Mixed,
  mvpTime2: mongoose.Schema.Types.Mixed,

  gols: { type: Array, default: [] },

  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Game", GameSchema);
