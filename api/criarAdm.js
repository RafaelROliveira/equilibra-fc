const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

async function criarAdm() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = "teste";
        const plainPassword = "123456"; // Defina sua senha
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const existing = await User.findOne({ user });
        if (existing) {
            console.log("Usuário ADM já existe.");
            return process.exit();
        }

        const novoAdm = new User({
            user,
            password: hashedPassword,
            adm: false,
            vip: false,
            cloudBackupEnabled: false,
            isDemo: true
        });

        await novoAdm.save();
        console.log("Usuário criado com sucesso!");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

criarAdm();
