const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // ou 5mb, dependendo do que for subir
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const backupRoutes = require("./routes/backupRoutes");
app.use("/api/backup", backupRoutes);
app.use("/api/history", require("./routes/historyRoutes"));





// Conecta ao MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("🟢 MongoDB conectado com sucesso"))
.catch(err => console.error("🔴 Erro ao conectar ao MongoDB:", err));

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lists', require('./routes/playerListRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/player', require('./routes/uploadRoutes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
