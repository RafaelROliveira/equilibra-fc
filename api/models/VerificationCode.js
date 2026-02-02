const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);
