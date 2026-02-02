const Game = require("../models/Game");

// POST /api/games/finalized
exports.saveFinalizedGame = async (req, res) => {
  try {
    const owner = req.user.id;

    const u = await User.findById(owner).select("isDemo");
    if (!u) return res.status(404).json({ msg: "Usuário não encontrado." });

    if (u.isDemo) {
      return res.status(403).json({ msg: "Conta demo não pode finalizar jogos." });
    }


    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ msg: "Payload inválido (precisa ser um JSON)." });
    }

    const {
      nomeJogo,
      dataJogo,
      modalidade,
      placarTime1,
      placarTime2,
      timeVencedor,
      timePerdedor,
      mvpTime1,
      mvpTime2,
      gols,
      snapshot,
    } = payload;

    if (!snapshot || typeof snapshot !== "object") {
      return res.status(400).json({ msg: "snapshot é obrigatório (objeto)." });
    }

    // salva histórico
    const doc = await Game.create({
      owner,
      status: "Finalizado",
      nomeJogo,
      dataJogo,
      modalidade,
      placarTime1,
      placarTime2,
      timeVencedor,
      timePerdedor,
      mvpTime1,
      mvpTime2,
      gols: Array.isArray(gols) ? gols : [],
      snapshot,
    });

    return res.status(201).json({
      msg: "Jogo finalizado salvo no histórico.",
      id: doc._id,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao salvar histórico.", error: err.message });
  }
};

// GET /api/games  (histórico do usuário)
exports.getFinalizedGames = async (req, res) => {
  try {
    const owner = req.user.id;
    const items = await Game.find({ owner, status: "Finalizado" }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao buscar histórico.", error: err.message });
  }
};
