const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  nome: String,
  perna: String,
  posicao: [String],
  subposicoes: [String],
  qi: { type: Number, default: 0 },
  finalizacao: { type: Number, default: 0 },
  passes: { type: Number, default: 0 },
  dribles: { type: Number, default: 0 },
  defesa: { type: Number, default: 0 },
  fisico: { type: Number, default: 0 },
  vitorias: { type: Number, default: 0 },
  derrotas: { type: Number, default: 0 },
  empates: { type: Number, default: 0 },
  jogosJogados: { type: Number, default: 0 },
  mvps: { type: Number, default: 0 },
  foto: String
});

const PlayerListSchema = new mongoose.Schema({
  nomeLista: { type: String, required: true },
  jogadores: [PlayerSchema],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('PlayerList', PlayerListSchema);
