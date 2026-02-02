const User = require("../models/User");

// GET /api/backup/lists
exports.getListsBackup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select(
      "listsBackupData listsBackupVersion listsBackupUpdatedAt"
    );

    if (!user) return res.status(404).json({ msg: "Usuário não encontrado." });

    return res.json({
      backupData: user.listsBackupData,
      backupVersion: user.listsBackupVersion,
      backupUpdatedAt: user.listsBackupUpdatedAt,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao buscar backup.", error: err.message });
  }
};

// POST /api/backup/lists
exports.saveListsBackup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { backupData, backupVersion } = req.body;

    if (!backupData || typeof backupData !== "object") {
      return res.status(400).json({ msg: "backupData inválido (precisa ser um JSON)." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado." });

    user.listsBackupData = backupData;
    user.listsBackupVersion = Number.isFinite(backupVersion) ? backupVersion : (user.listsBackupVersion || 1);
    user.listsBackupUpdatedAt = new Date();

    await user.save();

    return res.json({
      msg: "Backup de listas salvo com sucesso.",
      backupUpdatedAt: user.listsBackupUpdatedAt,
    });
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao salvar backup.", error: err.message });
  }
};

// DELETE /api/backup/lists
exports.deleteListsBackup = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado." });

    user.listsBackupData = null;
    user.listsBackupUpdatedAt = null;
    await user.save();

    return res.json({ msg: "Backup de listas removido com sucesso." });
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao remover backup.", error: err.message });
  }
};
