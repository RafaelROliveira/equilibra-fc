const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  adm: { type: Boolean, default: false },
  vip: { type: Boolean, default: false },
  userImage: { type: String, default: "" },

  // ==========================
  // BACKUP OPCIONAL NA NUVEM
  // ==========================

  listsBackupData: { type: mongoose.Schema.Types.Mixed, default: null },
  listsBackupVersion: { type: Number, default: 1 },
  listsBackupUpdatedAt: { type: Date, default: null },

});

module.exports = mongoose.model("User", UserSchema);
