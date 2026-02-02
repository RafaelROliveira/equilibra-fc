const PlayerList = require('../models/PlayerList');

// Cria lista vazia ou apenas com nome
exports.createList = async (req, res) => {
  const { nomeLista } = req.body;

  if (!nomeLista)
    return res.status(400).json({ msg: "Nome da lista é obrigatório." });

  const newList = new PlayerList({
    nomeLista,
    jogadores: [],
    owner: req.user.id
  });

  await newList.save();
  res.status(201).json(newList);
};

// Busca todas as listas do usuário
exports.getLists = async (req, res) => {
  const lists = await PlayerList.find({ owner: req.user.id });
  res.json(lists);
};

// Deleta uma lista
exports.deleteList = async (req, res) => {
  await PlayerList.deleteOne({ _id: req.params.id, owner: req.user.id });
  res.json({ msg: "Lista deletada com sucesso." });
};

// Adiciona um jogador em uma lista
exports.addPlayer = async (req, res) => {
  const { id } = req.params; // ID da lista
  const jogador = req.body;

  if (!jogador.nome)
    return res.status(400).json({ msg: "Nome do jogador é obrigatório." });

  const list = await PlayerList.findOne({ _id: id, owner: req.user.id });
  if (!list)
    return res.status(404).json({ msg: "Lista não encontrada." });

  list.jogadores.push(jogador);
  await list.save();

  res.json(list);
};

// Editar nome da lista
exports.renameList = async (req, res) => {
  const { nomeLista } = req.body;

  if (!nomeLista)
    return res.status(400).json({ msg: "Nome da lista é obrigatório." });

  const list = await PlayerList.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { nomeLista },
    { new: true }
  );

  if (!list)
    return res.status(404).json({ msg: "Lista não encontrada." });

  res.json(list);
};

// Editar Jogador da lista 
exports.editPlayer = async (req, res) => {
  const { listId, playerId } = req.params;
  const updates = req.body;

  const list = await PlayerList.findOne({ _id: listId, owner: req.user.id });
  if (!list) return res.status(404).json({ msg: "Lista não encontrada." });

  const player = list.jogadores.id(playerId);
  if (!player) return res.status(404).json({ msg: "Jogador não encontrado." });

  Object.assign(player, updates);
  await list.save();

  res.json(player);
};

// Deletar jogador da lista
exports.deletePlayer = async (req, res) => {
  const { listId, playerId } = req.params;

  const lista = await PlayerList.findOne({ _id: listId, owner: req.user.id });
  if (!lista) return res.status(404).json({ msg: "Lista não encontrada." });

  lista.jogadores = lista.jogadores.filter(j => j._id.toString() !== playerId);
  await lista.save();

  res.json(lista);
};

// Buscar Lista por ID (seguro por owner)
exports.getPlayerListById = async (req, res) => {
  try {
    const list = await PlayerList.findOne({ _id: req.params.id, owner: req.user.id });
    if (!list) return res.status(404).json({ msg: "Lista não encontrada." });

    // se quiser só os jogadores:
    // return res.json(list.jogadores);

    // melhor retornar a lista inteira:
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ msg: "Erro ao buscar a lista.", error: err.message });
  }
};







