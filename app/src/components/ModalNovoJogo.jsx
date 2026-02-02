"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import styles from "./modalNovoJogo.module.css";

import ModalSelecionarModalidade from "./ModalSelecionarModalidade";
import ModalSelecionarListas from "./ModalSelecionarListas";
import ModalSelecionarJogadores from "./ModalSelecionarJogadores";
import ModalConfirmarDivisao from "./ModalConfirmarDivisao";

function getId(obj) {
  return obj?.idLocal || obj?._id || obj?.id;
}

function makeId(prefix = "jogo") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function snapshotJogador(j) {
  if (!j) return null;

  return {
    idLocal: getId(j),
    nome: j.nome,
    foto: j.foto || "",
    posicao: j.posicao || [],
    subposicoes: j.subposicoes || [],
    qi: j.qi || 0,
    finalizacao: j.finalizacao || 0,
    passes: j.passes || 0,
    dribles: j.dribles || 0,
    defesa: j.defesa || 0,
    fisico: j.fisico || 0,
  };
}

function Stepper({ etapa }) {
  return (
    <div className={styles.progress}>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={styles.stepWrap}>
          <div
            className={[
              styles.dot,
              etapa === n ? styles.dotActive : "",
              etapa > n ? styles.dotDone : "",
            ].join(" ")}
          >
            {etapa > n ? "✓" : n}
          </div>

          {n !== 4 && (
            <div
              className={[styles.bar, etapa > n ? styles.barOn : ""].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ModalNovoJogo({
  open,
  onClose,
  listas = [],
  jogadoresPorLista = {},
  // ✅ novos
  initialGame = null,
  onSalvar,
  // (compat) se você ainda usar em algum lugar
  onJogoCriado,
}) {
  const editMode = !!initialGame;

  const [etapa, setEtapa] = useState(1);

  const [nomeJogo, setNomeJogo] = useState("");
  const [modalidadeInfo, setModalidadeInfo] = useState(null);
  const [listasSelecionadas, setListasSelecionadas] = useState([]);
  const [jogadoresSelecionados, setJogadoresSelecionados] = useState([]);

  const resetar = () => {
    setEtapa(1);
    setNomeJogo("");
    setModalidadeInfo(null);
    setListasSelecionadas([]);
    setJogadoresSelecionados([]);
    onClose?.();
  };

  // ✅ quando abrir em modo editar, preenche e vai direto pro passo 4
  useEffect(() => {
    if (!open) return;

    if (initialGame) {
      const idsListas =
        initialGame?.listaUsadaIds ||
        initialGame?.snapshot?.listas?.map((l) => getId(l)).filter(Boolean) ||
        [];

      const modalidade = initialGame?.modalidade || initialGame?.snapshot?.modalidade || null;

      const modalidadeFill = {
        modalidade,
        data: initialGame?.data || null,
        horaInicio: initialGame?.horaInicio || null,
        horaFim: initialGame?.horaFim || null,
        inicioISO: initialGame?.inicioISO || null,
        fimISO: initialGame?.fimISO || null,
      };

      const t1 = initialGame?.snapshot?.teams?.time1 || [];
      const t2 = initialGame?.snapshot?.teams?.time2 || [];

      // jogadores disponíveis pro passo 4: união dos dois times (sem duplicar)
      const map = new Map();
      for (const p of [...t1, ...t2]) {
        const id = getId(p);
        if (!id) continue;
        if (!map.has(id)) map.set(id, p);
      }
      const jogadoresUniq = Array.from(map.values());

      setNomeJogo(initialGame?.nomeJogo || "");
      setModalidadeInfo(modalidadeFill);
      setListasSelecionadas(idsListas);
      setJogadoresSelecionados(jogadoresUniq);

      // vai direto pro confirmar divisão (onde você edita times, capitães, nomes)
      setEtapa(4);
    } else {
      // modo criar
      setEtapa(1);
      setNomeJogo("");
      setModalidadeInfo(null);
      setListasSelecionadas([]);
      setJogadoresSelecionados([]);
    }
  }, [open, initialGame]);

  const handleModalidadeSelecionada = (info) => {
    setModalidadeInfo(info);
    setEtapa(2);
  };

  const handleListasSelecionadas = (ids) => {
    setListasSelecionadas(ids || []);
    setEtapa(3);
  };

  const jogadoresDisponiveis = useMemo(() => {
    const all = (listasSelecionadas || []).flatMap(
      (id) => jogadoresPorLista[id] || []
    );

    const map = new Map();
    for (const j of all) {
      const id = getId(j);
      if (!id) continue;
      if (!map.has(id)) map.set(id, j);
    }
    return Array.from(map.values());
  }, [listasSelecionadas, jogadoresPorLista]);

  const handleJogadoresSelecionados = (jogadores) => {
    setJogadoresSelecionados(jogadores || []);
    setEtapa(4);
  };

  const handleJogoConfirmado = ({
    time1,
    time2,
    capitao1,
    capitao2,
    nomeTime1,
    nomeTime2,
  }) => {
    const time1Ids = (time1 || []).map(getId).filter(Boolean);
    const time2Ids = (time2 || []).map(getId).filter(Boolean);

    const nomeFinalTime1 = (nomeTime1 || "Time 1").trim();
    const nomeFinalTime2 = (nomeTime2 || "Time 2").trim();

    const base = initialGame || {};

    const jogo = {
      // ✅ se estiver editando, mantém idLocal
      idLocal: base?.idLocal || makeId("jogo"),

      // mantém favoritos/status se existir, senão padrão
      status: base?.status || "Aberto",
      favorito: base?.favorito ?? false,

      // campos editáveis
      nomeJogo: nomeJogo || base?.nomeJogo || "",
      modalidade: modalidadeInfo?.modalidade,
      data: modalidadeInfo?.data,
      horaInicio: modalidadeInfo?.horaInicio,
      horaFim: modalidadeInfo?.horaFim,
      inicioISO: modalidadeInfo?.inicioISO,
      fimISO: modalidadeInfo?.fimISO,

      // mantém caso já exista, senão cria
      dataJogo: base?.dataJogo || new Date().toISOString(),

      listaUsadaIds: listasSelecionadas,

      // nomes dos times
      time1Nome: nomeFinalTime1,
      time2Nome: nomeFinalTime2,

      time1Ids,
      time2Ids,

      capitaoTime1Nome: capitao1?.nome || null,
      capitaoTime2Nome: capitao2?.nome || null,

      snapshot: {
        version: base?.snapshot?.version || 1,
        createdAtLocal: base?.snapshot?.createdAtLocal || new Date().toISOString(),
        updatedAtLocal: new Date().toISOString(),

        modalidade: modalidadeInfo?.modalidade,

        listas: (listas || [])
          .filter((l) => (listasSelecionadas || []).includes(getId(l)))
          .map((l) => ({
            idLocal: getId(l),
            nomeLista: l.nomeLista,
          })),

        teams: {
          time1: (time1 || []).map(snapshotJogador),
          time2: (time2 || []).map(snapshotJogador),
        },

        cap: {
          time1: snapshotJogador(capitao1),
          time2: snapshotJogador(capitao2),
        },

        teamNames: {
          time1: nomeFinalTime1,
          time2: nomeFinalTime2,
        },
      },
    };

    // ✅ novo callback (criar/editar)
    onSalvar?.(jogo);

    // compat (se algum lugar ainda depender)
    onJogoCriado?.(jogo);

    resetar();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetar();
      }}
    >
      <DialogContent
        className={styles.content}
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className={styles.srOnly}>
          {editMode ? "Editar Jogo" : "Criar Novo Jogo"}
        </DialogTitle>

        <button className={styles.close} onClick={resetar} type="button">
          ✕
        </button>

        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
            {editMode ? "Editar Jogo" : "Criar Novo Jogo"}
          </h1>

          <div className={styles.headerSub}>Passo {etapa} de 4</div>
          <Stepper etapa={etapa} />
        </div>

        <div className={styles.body}>
          {etapa === 1 && (
            <ModalSelecionarModalidade
              nomeJogo={nomeJogo}
              onNomeJogoChange={setNomeJogo}
              onClose={resetar}
              onNext={handleModalidadeSelecionada}
            />
          )}

          {etapa === 2 && (
            <ModalSelecionarListas
              listas={listas}
              onBack={() => setEtapa(1)}
              onClose={resetar}
              onNext={handleListasSelecionadas}
            />
          )}

          {etapa === 3 && (
            <ModalSelecionarJogadores
              jogadores={jogadoresDisponiveis}
              onBack={() => setEtapa(2)}
              onClose={resetar}
              onNext={handleJogadoresSelecionados}
              minJogadores={4}
            />
          )}

          {etapa === 4 && (
            <ModalConfirmarDivisao
              modalidade={modalidadeInfo?.modalidade}
              jogadores={jogadoresSelecionados}
              onBack={() => setEtapa(3)}
              onClose={resetar}
              onConfirmar={handleJogoConfirmado}
            // ✅ dica: se seu ModalConfirmarDivisao suportar defaults, você pode usar:
            // initialTime1={initialGame?.snapshot?.teams?.time1 || []}
            // initialTime2={initialGame?.snapshot?.teams?.time2 || []}
            // initialTeamName1={initialGame?.time1Nome || "Time 1"}
            // initialTeamName2={initialGame?.time2Nome || "Time 2"}
            // initialCap1={initialGame?.snapshot?.cap?.time1 || null}
            // initialCap2={initialGame?.snapshot?.cap?.time2 || null}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
