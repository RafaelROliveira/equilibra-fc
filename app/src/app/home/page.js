"use client";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./home.module.css";
import { toast } from "react-toastify";
import ModalNovoJogo from "@/components/ModalNovoJogo";
import ModalFinalizarJogo from "@/components/ModalFinalizarJogo";
import ExportarTimesDoJogoPNG from "@/components/ExportarTimesDoJogoPNG";
import ModalExcluirConfirm from "@/components/ModalExcluirConfirm";


const LS_LISTAS = "equilibrafc:listas:v1";
const LS_JOGOS_ABERTOS = "equilibrafc:jogos:abertos:v1";
const LS_JOGOS_HISTORICO = "equilibrafc:jogos:historico:v1";

// >>>>>>> CONFIG BACKEND <<<<<<<
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "token";



function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function loadLocal(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeJsonParse(localStorage.getItem(key), fallback);
}

function saveLocal(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function saveHistoryInDb(payload) {
  const token = getToken();
  if (!token) throw new Error("Token não encontrado. Faça login novamente.");

  const res = await fetch(`${API_BASE}/api/history/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.msg || "Erro ao salvar histórico no banco.");
  }

  return data; // { msg, id }
}

function formatQuando(jogo) {
  if (jogo?.data && jogo?.horaInicio && jogo?.horaFim) {
    return `${jogo.data} ${jogo.horaInicio}–${jogo.horaFim}`;
  }
  if (jogo?.inicioISO) return new Date(jogo.inicioISO).toLocaleString("pt-BR");
  return jogo?.dataJogo || "";
}

// ✅ faltava na Home (por isso deu erro)
function getPlayerName(p) {
  return (
    p?.nome ||
    p?.name ||
    p?.username ||
    p?.apelido ||
    p?.nick ||
    p?.idLocal ||
    p?._id ||
    "Jogador"
  );
}

export default function HomePageProtegida() {
  const [jogos, setJogos] = useState([]);
  const [listas, setListas] = useState([]);
  const [mostrarModalNovoJogo, setMostrarModalNovoJogo] = useState(false);

  // ✅ modal de excluir jogo
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState(null);


  // ✅ modo editar
  const [jogoEditando, setJogoEditando] = useState(null);

  const [jogoFinalizando, setJogoFinalizando] = useState(null);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);

  // ✅ abre/fecha detalhes (ver jogadores)
  const [openMap, setOpenMap] = useState({});

  function toggleOpen(id) {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Carregar tudo LOCAL
  useEffect(() => {
    const jogosLocal = loadLocal(LS_JOGOS_ABERTOS, []);
    setJogos(Array.isArray(jogosLocal) ? jogosLocal : []);

    const listasLocal = loadLocal(LS_LISTAS, []);
    setListas(Array.isArray(listasLocal) ? listasLocal : []);
  }, []);

  // Mapear jogadores por lista (compatível com idLocal)
  const jogadoresPorLista = useMemo(() => {
    const map = {};
    for (const lista of listas || []) {
      const id = lista.idLocal || lista._id || lista.id;
      map[id] = lista.jogadores || [];
    }
    return map;
  }, [listas]);

  const playersById = useMemo(() => {
    const map = new Map();
    for (const lista of listas || []) {
      for (const p of lista.jogadores || []) {
        const id = p.idLocal || p._id || p.id;
        if (id) map.set(id, p);
      }
    }
    return map;
  }, [listas]);

  function hydrateTeam(arr) {
    return (arr || [])
      .map((x) => playersById.get(x?.idLocal || x?._id || x?.id) || x)
      .filter(Boolean);
  }

  function confirmarExclusaoJogo(jogo) {
    setJogoSelecionado(jogo);
    setMostrarModalExcluir(true);
  }

  function cancelarExclusaoJogo() {
    setMostrarModalExcluir(false);
    setJogoSelecionado(null);
  }

  function confirmarExcluirJogo() {
    const id = jogoSelecionado?.idLocal || jogoSelecionado?._id || jogoSelecionado?.id;
    if (!id) {
      toast.error("Não foi possível identificar o jogo.");
      cancelarExclusaoJogo();
      return;
    }

    excluirJogo(id); // usa sua função existente
    cancelarExclusaoJogo();
  }


  // helper: persistir jogos abertos
  function setJogosAndPersist(updater) {
    setJogos((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveLocal(LS_JOGOS_ABERTOS, next);
      return next;
    });
  }

  function abrirFinalizar(jogo) {
    setJogoFinalizando(jogo);
    setMostrarFinalizar(true);
  }

  function abrirEditar(jogo) {
    setJogoEditando(jogo);
    setMostrarModalNovoJogo(true);
  }

  function getId(obj) {
    return obj?.idLocal || obj?._id || obj?.id;
  }

  function atualizarStatsListasAposFinalizar(finalizado) {
    const t1 = finalizado?.snapshot?.teams?.time1 || [];
    const t2 = finalizado?.snapshot?.teams?.time2 || [];

    const idsTime1 = new Set(t1.map(getId).filter(Boolean));
    const idsTime2 = new Set(t2.map(getId).filter(Boolean));

    const mvp1 = finalizado?.mvpTime1Id;
    const mvp2 = finalizado?.mvpTime2Id;

    const vencedor = finalizado?.timeVencedor || 0;

    setListas((prevListas) => {
      const next = (prevListas || []).map((lista) => {
        const jogadores = (lista.jogadores || []).map((j) => {
          const id = getId(j);
          const noTime1 = idsTime1.has(id);
          const noTime2 = idsTime2.has(id);
          if (!noTime1 && !noTime2) return j;

          const jogosJogados = (j.jogosJogados || 0) + 1;

          let vitorias = j.vitorias || 0;
          let derrotas = j.derrotas || 0;
          let empates = j.empates || 0;

          if (vencedor === 0) empates += 1;
          else if (vencedor === 1) (noTime1 ? vitorias++ : derrotas++);
          else if (vencedor === 2) (noTime2 ? vitorias++ : derrotas++);

          const mvps = (j.mvps || 0) + (id === mvp1 || id === mvp2 ? 1 : 0);

          return { ...j, jogosJogados, vitorias, derrotas, empates, mvps };
        });

        return { ...lista, jogadores };
      });

      saveLocal(LS_LISTAS, next);
      return next;
    });
  }

  async function finalizarJogo({ placarTime1, placarTime2, mvpTime1Id, mvpTime2Id }) {
    if (!jogoFinalizando) return;

    const jogoId = jogoFinalizando.idLocal || jogoFinalizando._id;

    let timeVencedor = 0;
    if (Number(placarTime1) > Number(placarTime2)) timeVencedor = 1;
    else if (Number(placarTime2) > Number(placarTime1)) timeVencedor = 2;

    const finalizadoBase = {
      ...jogoFinalizando,
      status: "Finalizado",
      placarTime1: Number(placarTime1),
      placarTime2: Number(placarTime2),
      mvpTime1Id: mvpTime1Id || null,
      mvpTime2Id: mvpTime2Id || null,
      timeVencedor,
      finalizadoEmISO: new Date().toISOString(),
    };

    // 1) remove de abertos
    setJogosAndPersist((prev) => prev.filter((j) => (j.idLocal || j._id) !== jogoId));

    // 2) stats
    atualizarStatsListasAposFinalizar(finalizadoBase);

    // 3) salvar no banco
    let finalizado = finalizadoBase;
    try {
      const resp = await saveHistoryInDb(finalizadoBase);
      finalizado = { ...finalizadoBase, historyDbId: resp?.id };
      toast.success("Jogo finalizado! Histórico salvo no banco.");
    } catch (e) {
      toast.error(`Finalizou local, mas não salvou no banco: ${e?.message || "erro"}`);
    }

    // 4) histórico local
    const historicoAtual = loadLocal(LS_JOGOS_HISTORICO, []);
    const novoHistorico = [finalizado, ...(Array.isArray(historicoAtual) ? historicoAtual : [])];
    saveLocal(LS_JOGOS_HISTORICO, novoHistorico);

    setMostrarFinalizar(false);
    setJogoFinalizando(null);
  }

  function excluirJogo(jogoId) {
    setJogosAndPersist((prev) => prev.filter((j) => (j.idLocal || j._id) !== jogoId));
    toast.success("Jogo removido (local)!");
    setOpenMap((prev) => {
      const copy = { ...prev };
      delete copy[jogoId];
      return copy;
    });
  }

  // ✅ quando modal salvar (criar ou editar)
  function handleSalvarJogo(jogo) {
    if (!jogo) return;

    if (jogoEditando) {
      const idEdit = jogoEditando.idLocal || jogoEditando._id;

      setJogosAndPersist((prev) =>
        (prev || []).map((j) =>
          (j.idLocal || j._id) === idEdit ? jogo : j
        )
      );

      toast.success("Jogo atualizado!");
    } else {
      setJogosAndPersist((prev) => [...(prev || []), jogo]);
      toast.success("Jogo criado (local) com sucesso!");
    }

    setMostrarModalNovoJogo(false);
    setJogoEditando(null);
  }

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <h1 className={styles.titulo}>Jogos em aberto</h1>

          <div className={styles.topActions}>
            <button
              className={styles.addBtn}
              onClick={() => {
                setJogoEditando(null);
                setMostrarModalNovoJogo(true);
              }}
              title="Criar jogo"
            >
              <img
                src="/images/mais_branco.png"
                alt="Criar jogo"
                className={styles.btnIcon}
              />
              <span className={styles.addText}>Criar Jogo</span>
            </button>
          </div>
        </div>

        {Array.isArray(jogos) && jogos.length === 0 && (
          <div className={styles.containerVazio}>
            <p className={styles.vazio}>Nenhum jogo em aberto ainda.</p>
            <img className={styles.imgVazio} src="/images/vazio.png">
            </img>
          </div>

        )}

        {Array.isArray(jogos) &&
          jogos.map((jogo, idx) => {
            const jogoId = jogo.idLocal || jogo._id || String(idx);

            const time1Nome =
              jogo.time1Nome || jogo.nomeTime1 || jogo.capitaoTime1Nome || "Time 1";
            const time2Nome =
              jogo.time2Nome || jogo.nomeTime2 || jogo.capitaoTime2Nome || "Time 2";

            const rawT1 = jogo?.snapshot?.teams?.time1 || [];
            const rawT2 = jogo?.snapshot?.teams?.time2 || [];

            const time1Jogadores = hydrateTeam(rawT1);
            const time2Jogadores = hydrateTeam(rawT2);

            const quando = formatQuando(jogo);
            const modalidade = jogo?.modalidade;

            const aberto = !!openMap[jogoId];

            return (
              <div key={jogoId} className={styles.card}>
                <div className={styles.header}>
                  <div className={styles.titleWrap}>
                    <div className={styles.meta}>
                      <div className={styles.nomeJogo}>
                        {time1Nome} <span className={styles.vs}>x</span> {time2Nome}
                      </div>

                      {modalidade && <span className={styles.badgeAlt}>{modalidade}</span>}
                    </div>

                    <div className={styles.meta}>
                      <span className={styles.when}>Dia: {quando}</span>
                    </div>
                  </div>

                  <div className={styles.actionsRight}>
                    <div className={styles.actionsInline}>
                      <button
                        className={`${styles.iconBtn} ${styles.iconFinalizar}`}
                        title="Finalizar jogo"
                        onClick={() => abrirFinalizar(jogo)}
                      >
                        <img
                          src="/images/finalizar_green.png"
                          alt="Finalizar Jogo"
                          className={`${styles.btnIcon} ${styles.btnFinalizar}`}
                        />
                      </button>



                      {/* ✅ EDITAR */}
                      <button
                        className={styles.iconBtn}
                        title="Editar jogo"
                        onClick={() => abrirEditar(jogo)}
                      >
                        <img
                          src="/images/lapis_branco.png"
                          alt="Editar Jogo"
                          className={styles.btnIcon}
                        />
                      </button>



                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => confirmarExclusaoJogo(jogo)}
                        title="Excluir jogo"
                      >

                        <img
                          src="/images/lixeira_branco.png"
                          alt="Excluir Jogo"
                          className={styles.btnIcon}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPORT */}
                <div className={styles.exportRow}>
                  <ExportarTimesDoJogoPNG
                    jogo={jogo}
                    time1={{ nome: time1Nome, jogadores: time1Jogadores }}
                    time2={{ nome: time2Nome, jogadores: time2Jogadores }}
                  />


                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => toggleOpen(jogoId)}
                    aria-expanded={aberto}
                  >
                    {aberto ? "⏶" : "⏷"}
                  </button>
                </div>

                <div className={`${styles.details} ${aberto ? styles.show : ""}`}>
                  <div className={styles.teamsGrid}>
                    <div className={styles.teamBox}>
                      <div className={styles.teamBoxTitle}>{time1Nome}</div>

                      {time1Jogadores.length === 0 ? (
                        <div className={styles.emptyPlayers}>Sem snapshot de jogadores.</div>
                      ) : (
                        <div className={styles.players}>
                          {time1Jogadores.map((p, i) => (
                            <span
                              key={(p?.idLocal || p?._id || p?.id || i) + "-t1"}
                              className={styles.playerChip}
                            >
                              {getPlayerName(p)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.teamBox}>
                      <div className={styles.teamBoxTitle}>{time2Nome}</div>

                      {time2Jogadores.length === 0 ? (
                        <div className={styles.emptyPlayers}>Sem snapshot de jogadores.</div>
                      ) : (
                        <div className={styles.players}>
                          {time2Jogadores.map((p, i) => (
                            <span
                              key={(p?.idLocal || p?._id || p?.id || i) + "-t2"}
                              className={styles.playerChip}
                            >
                              {getPlayerName(p)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

        {mostrarModalExcluir && (
          <ModalExcluirConfirm
            titulo="Excluir jogo em aberto ?"
            texto={`${(jogoSelecionado?.time1Nome || jogoSelecionado?.nomeTime1 || "Time 1")} x ${(jogoSelecionado?.time2Nome || jogoSelecionado?.nomeTime2 || "Time 2")}`}
            texto2={formatQuando(jogoSelecionado)}
            onConfirmar={confirmarExcluirJogo}
            onCancelar={cancelarExclusaoJogo}
          />
        )}


        <ModalNovoJogo
          open={mostrarModalNovoJogo}
          onClose={() => {
            setMostrarModalNovoJogo(false);
            setJogoEditando(null);
          }}
          listas={listas}
          jogadoresPorLista={jogadoresPorLista}
          initialGame={jogoEditando}     // ✅ novo
          onSalvar={handleSalvarJogo}    // ✅ novo
        />

        <ModalFinalizarJogo
          open={mostrarFinalizar}
          onClose={() => {
            setMostrarFinalizar(false);
            setJogoFinalizando(null);
          }}
          jogo={jogoFinalizando}
          onFinalizar={finalizarJogo}
        />
      </div>
    </ProtectedRoute>
  );
}
