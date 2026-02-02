"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ModalExcluirConfirm from "@/components/ModalExcluirConfirm";
import ModalNovaLista from "@/components/ModalNovaLista";
import ModalAdicionarJogador from "@/components/ModalAdicionarJogador";
import ModalEditarLista from "@/components/ModalEditarLista";
import ModalEditarJogador from "@/components/ModalEditarJogador";
import ModalVerJogadores from "@/components/ModalVerJogadores";
import ModalVerJogador from "@/components/ModalVerJogador";
import ExportarResumoStatsPNG from "@/components/ExportarResumoStatsPNG";
import styles from "./listas.module.css";
import { toast } from "react-toastify";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LS_KEY = "equilibrafc:listas:v1";

// =========================
// Helpers local
// =========================
function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function loadListasLocal() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_KEY);
  const data = safeJsonParse(raw, []);
  return Array.isArray(data) ? data : [];
}

function saveListasLocal(listas) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(listas));
}

function makeId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// =========================
// Comparação (local x nuvem)
// =========================
function normalizeListas(listas) {
  const arr = Array.isArray(listas) ? listas : [];

  // ordena listas e jogadores para comparação não variar por ordem
  return arr
    .map((l) => ({
      ...l,
      jogadores: (l.jogadores || [])
        .map((j) => ({ ...j }))
        .sort((a, b) =>
          String(a.idLocal || "").localeCompare(String(b.idLocal || ""))
        ),
    }))
    .sort((a, b) =>
      String(a.idLocal || "").localeCompare(String(b.idLocal || ""))
    );
}

function stableStringify(value) {
  const seen = new WeakSet();

  const sorter = (v) => {
    if (v && typeof v === "object") {
      if (seen.has(v)) return null; // evita loop em caso extremo
      seen.add(v);

      if (Array.isArray(v)) return v.map(sorter);

      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sorter(v[k]);
      return out;
    }
    return v;
  };

  return JSON.stringify(sorter(value));
}

function hashListas(listas) {
  return stableStringify(normalizeListas(listas));
}

function formatDateTimePtBR(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}


// =========================
// API somente para BACKUP
// =========================
async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.msg || "Erro na requisição";
    throw new Error(msg);
  }

  return data;
}

export default function ListasPage() {
  const [listas, setListas] = useState([]);
  const [dirty, setDirty] = useState(false);

  // baseline do banco (último backup salvo)
  const [cloudBaselineHash, setCloudBaselineHash] = useState(null);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // carrega local + baseline nuvem
  useEffect(() => {
    const local = loadListasLocal();
    setListas(local);

    (async () => {
      try {
        const data = await apiFetch("/api/backup/lists", { method: "GET" });
        const backupData = data?.backupData;

        if (backupData && Array.isArray(backupData.listas)) {
          setCloudBaselineHash(hashListas(backupData.listas));
          setLastBackupAt(backupData.updatedAt || data.updatedAt || null);
        } else {
          setCloudBaselineHash(hashListas([]));
          setLastBackupAt(null);
        }
      } catch (err) {
        console.error(err);
        setCloudBaselineHash(hashListas([]));
        setLastBackupAt(null);
      } finally {
        setCloudLoaded(true);
      }
    })();
  }, []);

  function setListasAndPersist(updater) {
    setListas((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveListasLocal(next);
      return next;
    });
  }

  // recalcula dirty sempre que mudar listas OU baseline
  useEffect(() => {
    if (!cloudLoaded) return;
    const localHash = hashListas(listas);
    setDirty(localHash !== cloudBaselineHash);
  }, [listas, cloudBaselineHash, cloudLoaded]);

  // =========================
  // BACKUP MANUAL (NUVEM)
  // =========================
  const backupPayload = useMemo(() => {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      listas,
    };
  }, [listas]);

  async function salvarBackupNaNuvem() {
    try {
      const payload = backupPayload;

      await apiFetch("/api/backup/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupData: payload,
          backupVersion: 1,
        }),
      });

      // baseline passa a ser o que você acabou de salvar
      setCloudBaselineHash(hashListas(payload.listas));
      setLastBackupAt(payload.updatedAt);

      toast.success("Backup salvo na nuvem com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao salvar backup: ${err.message}`);
    }
  }

  async function restaurarBackupDaNuvem() {
    try {
      const data = await apiFetch("/api/backup/lists", { method: "GET" });
      const backupData = data?.backupData;

      if (!backupData || !Array.isArray(backupData.listas)) {
        toast.error("Nenhum backup válido encontrado na nuvem.");
        return;
      }

      setListas(backupData.listas);
      saveListasLocal(backupData.listas);

      setCloudBaselineHash(hashListas(backupData.listas));
      setLastBackupAt(backupData.updatedAt || data.updatedAt || null);

      toast.success("Backup restaurado da nuvem!");
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao restaurar backup: ${err.message}`);
    }
  }

  // =========================
  // EXCLUIR LISTA (LOCAL)
  // =========================
  const [listaSelecionada, setListaSelecionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  function confirmarExclusao(lista) {
    setListaSelecionada(lista);
    setMostrarModal(true);
  }

  function deletarLista() {
    if (!listaSelecionada?.idLocal) return;

    const id = listaSelecionada.idLocal;
    setListasAndPersist((prev) => prev.filter((l) => l.idLocal !== id));

    setMostrarModal(false);
    setListaSelecionada(null);
    toast.success("Lista deletada (local)!");
  }

  // =========================
  // CRIAR NOVA LISTA (LOCAL)
  // =========================
  const [mostrarModalNovaLista, setMostrarModalNovaLista] = useState(false);
  const [nomeNovaLista, setNomeNovaLista] = useState("");

  function criarNovaLista() {
    const nomeTrimado = nomeNovaLista.trim();

    if (!nomeTrimado) {
      toast.error("Informe um nome para a lista.");
      return;
    }

    if (nomeTrimado.length > 26) {
      toast.error("O nome da lista deve ter no máximo 26 caracteres.");
      return;
    }

    const nomeRepetido = listas.some(
      (lista) =>
        (lista.nomeLista || "").trim().toLowerCase() ===
        nomeTrimado.toLowerCase()
    );
    if (nomeRepetido) {
      toast.error("Já existe uma lista com esse nome.");
      return;
    }

    const novaLista = {
      idLocal: makeId("lista"),
      nomeLista: nomeTrimado,
      jogadores: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setListasAndPersist((prev) => [...prev, novaLista]);
    setNomeNovaLista("");
    setMostrarModalNovaLista(false);
    toast.success("Lista criada (local)!");
  }

  // =========================
  // ADICIONAR JOGADOR (LOCAL)
  // =========================
  const [mostrarModalJogador, setMostrarModalJogador] = useState(false);
  const [listaParaAdicionar, setListaParaAdicionar] = useState(null);
  const [novoJogador, setNovoJogador] = useState({
    nome: "",
    perna: "",
    subposicoes: [],
    posicao: [],
    qi: 0,
    finalizacao: 0,
    passes: 0,
    dribles: 0,
    defesa: 0,
    fisico: 0,
    foto: "",
  });

  function abrirModalAdicionarJogador(lista) {
    setListaParaAdicionar(lista);
    setMostrarModalJogador(true);
    setNovoJogador({
      nome: "",
      perna: "",
      subposicoes: [],
      posicao: [],
      qi: 0,
      finalizacao: 0,
      passes: 0,
      dribles: 0,
      defesa: 0,
      fisico: 0,
      foto: "",
    });
  }

  function adicionarJogador() {
    if (!listaParaAdicionar?.idLocal) return;

    if (!novoJogador.nome?.trim()) {
      toast.error("Nome do jogador é obrigatório.");
      return;
    }

    const jogador = {
      idLocal: makeId("player"),
      nome: novoJogador.nome.trim(),
      perna: novoJogador.perna,
      subposicoes: novoJogador.subposicoes || [],
      posicao: novoJogador.posicao || [],
      qi: Number(novoJogador.qi) || 0,
      finalizacao: Number(novoJogador.finalizacao) || 0,
      passes: Number(novoJogador.passes) || 0,
      dribles: Number(novoJogador.dribles) || 0,
      defesa: Number(novoJogador.defesa) || 0,
      fisico: Number(novoJogador.fisico) || 0,
      foto: novoJogador.foto || "",
      vitorias: 0,
      derrotas: 0,
      empates: 0,
      jogosJogados: 0,
      mvps: 0,
      gols: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const listaId = listaParaAdicionar.idLocal;

    setListasAndPersist((prev) =>
      prev.map((l) => {
        if (l.idLocal !== listaId) return l;
        return {
          ...l,
          jogadores: [...(l.jogadores || []), jogador],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // atualizar listaParaAdicionar pra modal refletir
    const listaAtualizada = listas.find((l) => l.idLocal === listaId);
    setListaParaAdicionar(
      listaAtualizada
        ? {
          ...listaAtualizada,
          jogadores: [...(listaAtualizada.jogadores || []), jogador],
        }
        : listaParaAdicionar
    );

    setNovoJogador({
      nome: "",
      perna: "",
      subposicoes: [],
      posicao: [],
      qi: 0,
      finalizacao: 0,
      passes: 0,
      dribles: 0,
      defesa: 0,
      fisico: 0,
      foto: "",
    });

    toast.success("Jogador adicionado (local)!");
  }

  // =========================
  // EDITAR LISTA (LOCAL)
  // =========================
  const [mostrarModalEditarLista, setMostrarModalEditarLista] = useState(false);
  const [listaEditando, setListaEditando] = useState(null);
  const [novoNomeLista, setNovoNomeLista] = useState("");

  function abrirModalEditarLista(lista) {
    setListaEditando(lista);
    setNovoNomeLista(lista.nomeLista);
    setMostrarModalEditarLista(true);
  }

  function salvarEdicaoLista() {
    if (!listaEditando?.idLocal) return;

    const nomeTrimado = novoNomeLista.trim();
    if (!nomeTrimado) {
      toast.error("Nome da lista é obrigatório.");
      return;
    }

    const repetido = listas.some(
      (l) =>
        l.idLocal !== listaEditando.idLocal &&
        (l.nomeLista || "").trim().toLowerCase() === nomeTrimado.toLowerCase()
    );
    if (repetido) {
      toast.error("Já existe uma lista com esse nome.");
      return;
    }

    setListasAndPersist((prev) =>
      prev.map((l) =>
        l.idLocal === listaEditando.idLocal
          ? { ...l, nomeLista: nomeTrimado, updatedAt: new Date().toISOString() }
          : l
      )
    );

    setMostrarModalEditarLista(false);
    setListaEditando(null);
    toast.success("Nome da lista atualizado (local)!");
  }

  // =========================
  // DELETAR JOGADOR (LOCAL)
  // =========================
  function deletarJogadorDaLista(playerIdLocal) {
    if (!listaEditando?.idLocal) return;

    setListasAndPersist((prev) =>
      prev.map((l) => {
        if (l.idLocal !== listaEditando.idLocal) return l;
        return {
          ...l,
          jogadores: (l.jogadores || []).filter(
            (j) => j.idLocal !== playerIdLocal
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setListaEditando((prev) =>
      prev
        ? {
          ...prev,
          jogadores: (prev.jogadores || []).filter(
            (j) => j.idLocal !== playerIdLocal
          ),
        }
        : prev
    );

    toast.success("Jogador deletado (local)!");
  }

  // =========================
  // EDITAR JOGADOR (LOCAL)
  // =========================
  const [mostrarModalEditarJogador, setMostrarModalEditarJogador] =
    useState(false);
  const [jogadorEditando, setJogadorEditando] = useState(null);

  function abrirModalEditarJogador(jogador) {
    setJogadorEditando({
      ...jogador,
      idLocal: jogador.idLocal || jogador._id || jogador.id,
      subposicoes: jogador.subposicoes || [],
      posicao: jogador.posicao || [],
    });
    setMostrarModalEditarJogador(true);
  }

  function salvarEdicaoJogador() {
    if (!jogadorEditando?.idLocal) {
      toast.error("Jogador inválido para editar.");
      return;
    }
    if (!listaEditando?.idLocal) return;

    const subposicaoParaPosicao = {
      CA: "ATA",
      PTA: "ATA",
      SA: "ATA",
      MO: "MOF",
      MC: "MEI",
      VOL: "MEI",
      LE: "LAT",
      LD: "LAT",
      ALA: "LAT",
      ZAG: "ZAG",
      GOL: "GOL",
    };

    const posicoes = [
      ...new Set(
        (jogadorEditando.subposicoes || []).map(
          (sub) => subposicaoParaPosicao[sub]
        )
      ),
    ].filter(Boolean);

    setListasAndPersist((prev) =>
      prev.map((l) => {
        if (l.idLocal !== listaEditando.idLocal) return l;

        return {
          ...l,
          jogadores: (l.jogadores || []).map((j) =>
            j.idLocal === jogadorEditando.idLocal
              ? {
                ...jogadorEditando,
                posicao: posicoes,
                updatedAt: new Date().toISOString(),
              }
              : j
          ),
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setListaEditando((prev) =>
      prev
        ? {
          ...prev,
          jogadores: (prev.jogadores || []).map((j) =>
            j.idLocal === jogadorEditando.idLocal
              ? {
                ...jogadorEditando,
                posicao: posicoes,
                updatedAt: new Date().toISOString(),
              }
              : j
          ),
        }
        : prev
    );

    setMostrarModalEditarJogador(false);
    toast.success("Jogador atualizado (local)!");
  }

  // =========================
  // VER JOGADORES / VER JOGADOR
  // =========================
  const [mostrarModalVerJogadores, setMostrarModalVerJogadores] =
    useState(false);
  const [jogadorParaVer, setJogadorParaVer] = useState(null);
  const [nomeListaParaVer, setNomeListaParaVer] = useState("");
  const [mostrarModalVerJogador, setMostrarModalVerJogador] = useState(false);

  function abrirModalVerJogadores(lista) {
    setListaSelecionada(lista);
    setMostrarModalVerJogadores(true);
  }

  function abrirModalVerJogador(jogador, nomeLista) {
    setJogadorParaVer(jogador);
    setNomeListaParaVer(nomeLista);
    setMostrarModalVerJogador(true);
  }

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <h1 className={styles.titulo}>Listas de jogadores</h1>

          <div className={styles.topActions}>
            <button
              className={styles.addListBtn}
              onClick={() => setMostrarModalNovaLista(true)}
              title="Criar lista"
            >
              <img
                src="/images/mais_branco.png"
                alt="Criar lista"
                className={styles.btnIcon}
              />
              <span className={styles.addText}>Criar Lista</span>
            </button>

            {dirty && (
              <button
                type="button"
                className={styles.dirtyDot}
                title="Seu local está diferente do último backup."
                onClick={() => {
                  if (!lastBackupAt) {
                    toast.info("Ainda não existe backup salvo na nuvem.");
                    return;
                  }
                  toast.info(
                    `Último backup: ${formatDateTimePtBR(lastBackupAt)}`
                  );
                }}
              >
                <img
                  src="/images/aviso.png"
                  className={styles.btnIcon}
                  alt="Aviso"
                />
              </button>
            )}

            <button
              className={styles.iconBtn}
              onClick={restaurarBackupDaNuvem}
              title="Restaurar backup da nuvem"
            >
              <img
                src="/images/recarregar.png"
                alt="Restaurar"
                className={styles.btnIcon}
              />
            </button>

            <button
              className={styles.iconBtn}
              onClick={salvarBackupNaNuvem}
              title="Salvar backup na nuvem"
            >
              <img src="/images/salvar.png" alt="Salvar" className={styles.btnIcon} />
            </button>
          </div>
        </div>

        {listas.length === 0 ? (
          <div className={styles.containerVazio}>
            <p className={styles.vazio}>Nenhuma lista criada ainda.</p>
            <img className={styles.imgVazio} src="/images/vazio.png">
            </img>
          </div>
        ) : (
          listas.map((lista) => (
            <div key={lista.idLocal} className={styles.card}>
              <div className={styles.header}>
                <div className={styles.titleWrap}>
                  <div className={styles.meta}>
                    <div className={styles.nomeLista}>{lista.nomeLista}</div>
                    <span className={styles.badgeAlt}>
                      Jogadores: {lista.jogadores?.length || 0}
                    </span>
                  </div>
                </div>

                <div className={styles.actionsRight}>
                  <div className={styles.actionsInline}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => abrirModalVerJogadores(lista)}
                      title="Ver jogadores"
                    >
                      <img
                        src="/images/detalhes_branco.png"
                        alt="Ver jogadores"
                        className={styles.btnIcon}
                      />
                    </button>

                    <button
                      className={styles.iconBtn}
                      onClick={() => abrirModalAdicionarJogador(lista)}
                      title="Adicionar jogador"
                    >
                      <img
                        src="/images/adicionar_branco.png"
                        alt="Adicionar"
                        className={styles.btnIcon}
                      />
                    </button>

                    <button
                      className={styles.iconBtn}
                      onClick={() => abrirModalEditarLista(lista)}
                      title="Editar lista"
                    >
                      <img
                        src="/images/lapis_branco.png"
                        alt="Editar"
                        className={styles.btnIcon}
                      />
                    </button>

                    <button
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => confirmarExclusao(lista)}
                      title="Excluir lista"
                    >
                      <img
                        src="/images/lixeira_branco.png"
                        alt="Excluir"
                        className={styles.btnIcon}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.exportRow}>
                <ExportarResumoStatsPNG lista={lista} />
              </div>
            </div>
          ))
        )}
      </div>

      {mostrarModal && (
        <ModalExcluirConfirm
          titulo="Deseja excluir esta lista?"
          texto={listaSelecionada?.nomeLista}
          texto2={listaSelecionada?.jogadores?.length}
          onConfirmar={deletarLista}
          onCancelar={() => setMostrarModal(false)}
        />
      )}

      {mostrarModalNovaLista && (
        <ModalNovaLista
          nome={nomeNovaLista}
          setNome={setNomeNovaLista}
          onCriar={criarNovaLista}
          onFechar={() => setMostrarModalNovaLista(false)}
        />
      )}

      <ModalAdicionarJogador
        isOpen={mostrarModalJogador}
        onClose={() => setMostrarModalJogador(false)}
        lista={listaParaAdicionar}
        jogador={novoJogador}
        setJogador={setNovoJogador}
        onSubmit={adicionarJogador}
        jogadoresLista={listaParaAdicionar?.jogadores}
      />

      <ModalEditarLista
        isOpen={mostrarModalEditarLista}
        onClose={() => setMostrarModalEditarLista(false)}
        nome={novoNomeLista}
        setNome={setNovoNomeLista}
        onSalvar={salvarEdicaoLista}
        jogadores={listaEditando?.jogadores || []}
        onEditarJogador={abrirModalEditarJogador}
        onExcluirJogador={(id) => deletarJogadorDaLista(id.idLocal ?? id)}
      />

      <ModalEditarJogador
        isOpen={mostrarModalEditarJogador}
        onClose={() => setMostrarModalEditarJogador(false)}
        jogador={jogadorEditando}
        setJogador={setJogadorEditando}
        onSalvar={salvarEdicaoJogador}
      />

      <ModalVerJogadores
        isOpen={mostrarModalVerJogadores}
        onClose={() => setMostrarModalVerJogadores(false)}
        jogadores={listaSelecionada?.jogadores}
        nomeLista={listaSelecionada?.nomeLista}
        abrirModalVerJogador={abrirModalVerJogador}
      />

      <ModalVerJogador
        isOpen={mostrarModalVerJogador}
        onClose={() => setMostrarModalVerJogador(false)}
        jogador={jogadorParaVer}
        nomeLista={nomeListaParaVer}
      />
    </ProtectedRoute>
  );
}
