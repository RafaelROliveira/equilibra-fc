"use client";
import { useMemo, useState } from "react";
import styles from "./ModalSelecionarListas.module.css";

function getListaId(lista) {
  return lista?.idLocal || lista?._id || lista?.id;
}

export default function ModalSelecionarListas({
  listas = [],
  onNext,
  onClose,
  onBack,
}) {
  const [selecionadas, setSelecionadas] = useState([]);

  const toggleLista = (id) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const podeContinuar = selecionadas.length > 0;

  const listasOrdenadas = useMemo(() => {
    return [...listas].sort((a, b) =>
      (a.nomeLista || "").localeCompare(b.nomeLista || "")
    );
  }, [listas]);

  return (
    <div className={styles.wrap}>
      <div className={styles.titleOnly}>Selecionar listas</div>

      <div className={styles.list}>
        {listasOrdenadas.map((lista) => {
          const id = getListaId(lista);
          const checked = selecionadas.includes(id);

          return (
            <div
              key={id}
              className={`${styles.item} ${checked ? styles.itemActive : ""}`}
              onClick={() => toggleLista(id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleLista(id);
              }}
            >
              <div className={`${styles.cb} ${checked ? styles.cbChecked : ""}`}>
                {checked && <span className={styles.cbMark}>✓</span>}
              </div>

              <div className={styles.nome}>{lista.nomeLista}</div>

              <div className={styles.meta}>
                ({(lista.jogadores?.length || 0)} jogadores)
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnOutline}`}
          onClick={onBack || onClose}
        >
          Voltar
        </button>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => onNext(selecionadas)}
          disabled={!podeContinuar}
        >
          Próximo
        </button>
      </div>
    </div>
  );

}
