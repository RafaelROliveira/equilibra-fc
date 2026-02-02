"use client";
import { useMemo, useState } from "react";
import styles from "./ModalSelecionarModalidade.module.css";

function toIsoFromDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

export default function ModalSelecionarModalidade({
  onNext,
  onClose,
  nomeJogo,
  onNomeJogoChange,
}) {
  const [selecionada, setSelecionada] = useState("");

  const now = useMemo(() => new Date(), []);
  const pad2 = (n) => String(n).padStart(2, "0");
  const hoje = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;

  const h1 = new Date(now.getTime() + 60 * 60 * 1000);
  const h2 = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const t1 = `${pad2(h1.getHours())}:${pad2(h1.getMinutes())}`;
  const t2 = `${pad2(h2.getHours())}:${pad2(h2.getMinutes())}`;

  const [data, setData] = useState(hoje);
  const [horaInicio, setHoraInicio] = useState(t1);
  const [horaFim, setHoraFim] = useState(t2);

  const modalidades = [
    { id: "FUT7", label: "Fut 7" },
    { id: "FUTSAL", label: "Futsal" },
    { id: "CAMPO", label: "Campo" },
  ];

  const inicioISO = toIsoFromDateTime(data, horaInicio);
  const fimISO = toIsoFromDateTime(data, horaFim);

  // ✅ primeiro define showNome e nomeOk
  const showNome =
    typeof nomeJogo === "string" && typeof onNomeJogoChange === "function";

  const nomeOk = !showNome || (nomeJogo || "").trim().length >= 2;

  // ✅ depois usa no valido (agora não dá erro)
  const valido =
    nomeOk &&
    !!selecionada &&
    !!data &&
    !!horaInicio &&
    !!horaFim &&
    inicioISO &&
    fimISO &&
    new Date(fimISO) > new Date(inicioISO);

  const showHintNome = showNome && !nomeOk;
  const showHintHorario = !showHintNome && !valido; // só mostra 1 hint por vez

  return (
    <div className={styles.wrap}>
      <div className={styles.section}>
        <div className={styles.content}>
          {showNome && (
            <div className={styles.field}>
              <label className={styles.label}>Nome do Jogo</label>
              <input
                value={nomeJogo}
                onChange={(e) => onNomeJogoChange(e.target.value)}
                className={styles.input}
                placeholder="Ex: Racha da Terça"
              />
            </div>
          )}

          {showHintNome && (
            <div className={styles.hint}>
              Digite um nome para o jogo (ex.: “Racha da Terça”).
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Modalidade</label>

            <div className={styles.selectGrid}>
              {modalidades.map((m) => {
                const active = selecionada === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelecionada(m.id)}
                    className={`${styles.option} ${active ? styles.optionActive : ""
                      }`}
                  >
                    <span className={styles.optionLabel}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Horário</label>
              <div className={styles.rowTime}>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className={styles.input}
                />
                <span className={styles.sep}>—</span>
                <input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {showHintHorario && (
            <div className={styles.hint}>
              Preencha tudo e garanta que o horário final seja maior que o início.
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnBack} onClick={onClose}>
            Voltar
          </button>

          <button
            type="button"
            className={styles.btnNext}
            disabled={!valido}
            onClick={() =>
              onNext({
                modalidade: selecionada,
                data,
                horaInicio,
                horaFim,
                inicioISO,
                fimISO,
              })
            }
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
