// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configura o Multer para salvar arquivos no diretório /uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// POST /api/player/upload
router.post('/upload', upload.single('foto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Nenhum arquivo enviado.' });
    }

    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });


});

module.exports = router;
