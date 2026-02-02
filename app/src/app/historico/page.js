"use client";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import styles from "./historico.module.css";
import ModalExcluirConfirm from "@/components/ModalExcluirConfirm";


const LS_HIST = "equilibrafc:jogos:historico:v1";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "token";


function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function deleteHistoryInDb(historyId) {
  const token = getToken();
  if (!token) throw new Error("Token não encontrado. Faça login novamente.");

  const res = await fetch(`${API_BASE}/api/history/games/${historyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.msg || "Erro ao deletar no banco.");

  return data;
}

async function fetchHistoryFromDb() {
  const token = getToken();
  if (!token) throw new Error("Token não encontrado. Faça login novamente.");

  const res = await fetch(`${API_BASE}/api/history/games`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data?.msg || "Erro ao buscar histórico no banco.");

  // data: [{ _id, owner, payload, createdAt }]
  return (Array.isArray(data) ? data : []).map((doc) => ({
    ...doc.payload,
    historyDbId: doc._id, // ✅ id correto do HistoryGame
  }));
}





function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function loadHistorico() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_HIST);
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function formatQuando(jogo) {
  // ✅ data e horário do jogo (formato BR)
  if (jogo?.data && jogo?.horaInicio && jogo?.horaFim) {
    return `${formatDateBR(jogo.data)} ${jogo.horaInicio}–${jogo.horaFim}`;
  }

  // fallback ISO
  if (jogo?.inicioISO) {
    return new Date(jogo.inicioISO).toLocaleString("pt-BR");
  }

  return "";
}



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

function getListName(jogo) {
  // teu snapshot tem snapshot.listas[0].nomeLista, então vamos tentar isso primeiro
  return (
    jogo?.snapshot?.listas?.[0]?.nomeLista ||
    jogo?.listaNome ||
    jogo?.nomeLista ||
    jogo?.playerListName ||
    jogo?.snapshot?.listaNome ||
    jogo?.snapshot?.lista?.nome ||
    jogo?.snapshot?.listName ||
    jogo?.snapshot?.list?.name ||
    "Lista"
  );
}

export default function HistoricoPage() {
  const [historico, setHistorico] = useState([]);
  const [openMap, setOpenMap] = useState({});

  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState(null);


  useEffect(() => {
    (async () => {
      try {
        const dbItems = await fetchHistoryFromDb();
        setHistorico(dbItems);
        localStorage.setItem(LS_HIST, JSON.stringify(dbItems)); // cache
      } catch {
        // fallback local se der ruim
        setHistorico(loadHistorico());
      }
    })();
  }, []);

  const ordenado = useMemo(() => {
    return [...(historico || [])].sort((a, b) => {
      const da = a?.finalizadoEmISO ? new Date(a.finalizadoEmISO).getTime() : 0;
      const db = b?.finalizadoEmISO ? new Date(b.finalizadoEmISO).getTime() : 0;
      return db - da;
    });
  }, [historico]);

  function confirmarExclusaoJogo(jogo) {
    setJogoSelecionado(jogo);
    setMostrarModalExcluir(true);
  }

  function cancelarExclusaoJogo() {
    setMostrarModalExcluir(false);
    setJogoSelecionado(null);
  }

  async function confirmarDeletarJogo() {
    const jogo = jogoSelecionado;
    const historyId = jogo?.historyDbId;

    if (!historyId) {
      alert("Esse item não tem historyDbId. Recarrega a página pra puxar do banco.");
      cancelarExclusaoJogo();
      return;
    }

    try {
      await deleteHistoryInDb(historyId);
    } catch (e) {
      alert(e?.message || "Erro ao deletar no banco");
      // mantém o modal aberto ou fecha? vou fechar pra não travar
      cancelarExclusaoJogo();
      return;
    }

    setHistorico((prev) => {
      const next = (prev || []).filter((x) => x?.historyDbId !== historyId);
      localStorage.setItem(LS_HIST, JSON.stringify(next));
      return next;
    });

    cancelarExclusaoJogo();
  }




  function toggleOpen(id) {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function deletarJogo(jogo) {
    const historyId = jogo?.historyDbId;

    if (!historyId) {
      alert("Esse item não tem historyDbId. Recarrega a página pra puxar do banco.");
      return;
    }

    try {
      await deleteHistoryInDb(historyId);
    } catch (e) {
      alert(e?.message || "Erro ao deletar no banco");
      return;
    }

    setHistorico((prev) => {
      const next = (prev || []).filter((x) => x?.historyDbId !== historyId);
      localStorage.setItem(LS_HIST, JSON.stringify(next));
      return next;
    });
  }


  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <h1 className={styles.titulo}>Histórico de jogos</h1>

        {ordenado.length === 0 ? (
          <div className={styles.containerVazio}>
            <p className={styles.vazio}>Nenhum jogo finalizado ainda.</p>
            <img className={styles.imgVazio} src="/images/vazio.png">
            </img>
          </div>
        ) : (
          ordenado.map((jogo, idx) => {
            const id =
              jogo?.historyDbId || jogo?.idLocal || jogo?.finalizadoEmISO || String(idx);


            const nomeDoJogo =
              (jogo?.nomeJogo || "").trim() || "Jogo sem nome";

            // ✅ prioriza nome do time, e só usa capitão como fallback final
            const time1Nome =
              jogo?.time1Nome ||
              jogo?.nomeTime1 ||
              jogo?.snapshot?.teamNames?.time1 ||
              jogo?.capitaoTime1Nome ||
              "Time 1";

            const time2Nome =
              jogo?.time2Nome ||
              jogo?.nomeTime2 ||
              jogo?.snapshot?.teamNames?.time2 ||
              jogo?.capitaoTime2Nome ||
              "Time 2";

            const placar1 = jogo?.placarTime1 ?? "-";
            const placar2 = jogo?.placarTime2 ?? "-";

            const listaNome = getListName(jogo);
            const quando = formatQuando(jogo);

            const t1 = jogo?.snapshot?.teams?.time1 || [];
            const t2 = jogo?.snapshot?.teams?.time2 || [];

            const aberto = !!openMap[id];


            return (
              <div key={id} className={styles.card}>
                <div className={styles.header}>
                  <div className={styles.titleWrap}>
                    {/* ✅ NOME DO JOGO PRIMEIRO */}

                    <div className={styles.meta}>

                      <div className={styles.nomeJogo}>{nomeDoJogo}</div>
                      <span className={styles.badge}>{listaNome}</span>
                      {jogo?.modalidade && (
                        <span className={styles.badgeAlt}>{jogo.modalidade}</span>
                      )}
                    </div>

                    <div className={styles.partida}>
                      <span className={styles.teamInline}>
                        <span className={styles.teamText}>{time1Nome}</span>
                        <span className={styles.inlineScore}>{placar1}</span>
                      </span>

                      <span className={styles.vs}>x</span>

                      <span className={styles.teamInline}>
                        <span className={styles.inlineScore}>{placar2}</span>
                        <span className={styles.teamText}>{time2Nome}</span>
                      </span>
                    </div>


                    <div className={styles.meta}>
                      <span className={styles.when}>{quando}</span>
                    </div>
                  </div>

                  <div className={styles.actionsRight}>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => toggleOpen(id)}
                      aria-expanded={aberto}
                    >
                      {aberto ? "⏶" : "⏷"}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => confirmarExclusaoJogo(jogo)}
                      title="Deletar do histórico"
                    >


                      <img
                        src="/images/lixeira_branco.png"
                        title="Excluir"
                        alt="Excluir"
                        className={styles.imgExcluir}
                      />
                    </button>
                  </div>


                </div>

                <div className={`${styles.details} ${aberto ? styles.show : ""}`}>
                  <div className={styles.teamsGrid}>
                    <div className={styles.teamBox}>
                      <div className={styles.teamBoxTitle}>Time 1</div>

                      {t1.length === 0 ? (
                        <div className={styles.emptyPlayers}>Sem snapshot de jogadores.</div>
                      ) : (
                        <div className={styles.players}>
                          {t1.map((p, i) => (
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
                      <div className={styles.teamBoxTitle}>Time 2</div>

                      {t2.length === 0 ? (
                        <div className={styles.emptyPlayers}>Sem snapshot de jogadores.</div>
                      ) : (
                        <div className={styles.players}>
                          {t2.map((p, i) => (
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
          })
        )}
        {mostrarModalExcluir && (
          <ModalExcluirConfirm
            titulo="Excluir do histórico ?"
            texto={`${(jogoSelecionado?.time1Nome || jogoSelecionado?.nomeTime1 || jogoSelecionado?.snapshot?.teamNames?.time1 || "Time 1")} x ${(jogoSelecionado?.time2Nome || jogoSelecionado?.nomeTime2 || jogoSelecionado?.snapshot?.teamNames?.time2 || "Time 2")}`}
            texto2={formatQuando(jogoSelecionado)}
            onConfirmar={confirmarDeletarJogo}
            onCancelar={cancelarExclusaoJogo}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}
