const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { user, password, confirmPassword, codVerify } = req.body;

    if (!user || !password || !confirmPassword || !codVerify)
        return res.status(400).json({ msg: "Preencha todos os campos." });

    if (password !== confirmPassword)
        return res.status(400).json({ msg: "As senhas não coincidem." });

    const codeDoc = await VerificationCode.findOne({ code: codVerify });
    if (!codeDoc)
        return res.status(403).json({ msg: "Código de verificação inválido." });

    const existingUser = await User.findOne({ user });
    if (existingUser)
        return res.status(400).json({ msg: "Usuário já existe." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        user,
        password: hashedPassword,
        adm: false,
        vip: false
    });

    await newUser.save();
    await VerificationCode.deleteOne({ _id: codeDoc._id });

    return res.status(201).json({ msg: "Usuário registrado com sucesso." });
};

exports.login = async (req, res) => {
    const { user, password } = req.body;

    if (!user || !password)
        return res.status(400).json({ msg: "Preencha todos os campos." });

    const foundUser = await User.findOne({ user });
    if (!foundUser)
        return res.status(401).json({ msg: "Usuário ou senha inválidos." });

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword)
        return res.status(401).json({ msg: "Usuário ou senha inválidos." });

    const token = jwt.sign(
        { id: foundUser._id, user: foundUser.user, adm: foundUser.adm },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({ token, user: foundUser.user, adm: foundUser.adm });
};

exports.generateCode = async (req, res) => {
    const { adm } = req.user;

    if (!adm) return res.status(403).json({ msg: "Apenas administradores podem gerar códigos." });

    const randomCode = Math.random().toString().slice(2, 12);

    const newCode = new VerificationCode({
        code: randomCode,
        createdBy: req.user.id
    });

    await newCode.save();

    res.status(201).json({ code: randomCode });
};
