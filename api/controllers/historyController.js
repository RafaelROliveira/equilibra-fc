const HistoryGame = require("../models/HistoryGame");
const User = require("../models/User");

// POST /api/history/games
exports.saveFinalizedGame = async (req, res) => {
  try {
    const owner = req.user.id;

    const u = await User.findById(owner).select("isDemo");
    if (!u) return res.status(404).json({ msg: "Usuário não encontrado." });

    if (u.isDemo) {
      return res.status(403).json({ msg: "Conta demo não pode salvar histórico." });
    }

    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ msg: "Payload inválido (precisa ser um JSON)." });
    }

    const doc = await HistoryGame.create({ owner, payload });
    return res.status(201).json({ msg: "Histórico salvo com sucesso.", id: doc._id });
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao salvar histórico.", error: err.message });
  }
};

// GET /api/history/games
exports.getHistory = async (req, res) => {
  try {
    const owner = req.user.id;
    const items = await HistoryGame.find({ owner }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao buscar histórico.", error: err.message });
  }
};

// DELETE /api/history/games/:id
exports.deleteHistoryGame = async (req, res) => {
  try {
    const owner = req.user.id;

    const u = await User.findById(owner).select("isDemo");
    if (!u) return res.status(404).json({ msg: "Usuário não encontrado." });

    if (u.isDemo) {
      return res.status(403).json({ msg: "Conta demo não pode apagar histórico." });
    }

    const { id } = req.params;

    const deleted = await HistoryGame.findOneAndDelete({ _id: id, owner });

    if (!deleted) {
      return res.status(404).json({ msg: "Histórico não encontrado." });
    }

    return res.json({ msg: "Histórico removido com sucesso." });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Erro ao remover histórico.", error: err.message });
  }
};
