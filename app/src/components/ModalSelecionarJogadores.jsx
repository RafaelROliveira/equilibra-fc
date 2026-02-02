"use client";
import { useMemo, useState } from "react";
import styles from "./ModalSelecionarJogadores.module.css";

function getId(j) {
    return j?.idLocal || j?._id || j?.id;
}

export default function ModalSelecionarJogadores({
    jogadores = [],
    onNext,
    onClose,
    onBack,
    minJogadores = 4,
}) {
    const [selecionados, setSelecionados] = useState([]);
    const [busca, setBusca] = useState("");
    const [filtroPos, setFiltroPos] = useState("TODOS");

    const toggle = (id) => {
        setSelecionados((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const idsPorOrdem = useMemo(() => {
        const list = (jogadores || [])
            .map((j) => ({ j, id: getId(j) }))
            .filter((x) => !!x.id);

        list.sort((a, b) => (a.j.nome || "").localeCompare(b.j.nome || ""));
        return list;
    }, [jogadores]);

    const jogadoresFiltrados = useMemo(() => {
        const q = busca.trim().toLowerCase();

        return idsPorOrdem.filter(({ j }) => {
            const nomeOk = !q || (j.nome || "").toLowerCase().includes(q);
            const pos = (j.posicao || []).map((p) => String(p).toUpperCase());
            const posOk = filtroPos === "TODOS" ? true : pos.includes(filtroPos);
            return nomeOk && posOk;
        });
    }, [idsPorOrdem, busca, filtroPos]);

    const podeContinuar = selecionados.length >= minJogadores;

    function selecionarTodosFiltrados() {
        const ids = jogadoresFiltrados.map((x) => x.id);
        setSelecionados((prev) => Array.from(new Set([...prev, ...ids])));
    }

    function limparSelecao() {
        setSelecionados([]);
    }

    function next() {
        const selecionadosObjs = idsPorOrdem
            .filter(({ id }) => selecionados.includes(id))
            .map(({ j }) => j);

        onNext(selecionadosObjs);
    }

    const contadorClass = `${styles.counter} ${podeContinuar ? "" : styles.counterBad
        }`;

    return (
        <div className={styles.wrap}>
            <div className={styles.titleOnly}>Selecionar jogadores</div>

            {/* Conteúdo que NÃO deve scrollar */}
            <div className={styles.controls}>
                <div className={styles.searchRow}>
                    <input
                        className={styles.search}
                        placeholder="Buscar jogador..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                <div className={styles.chips}>
                    {["TODOS", "GOL", "ZAG", "LAT", "MEI", "MOF", "ATA"].map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`${styles.chip} ${filtroPos === p ? styles.chipActive : ""
                                }`}
                            onClick={() => setFiltroPos(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className={styles.topActions}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={selecionarTodosFiltrados}
                    >
                        Selecionar filtrados
                    </button>

                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={limparSelecao}
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* ✅ Só a lista scrolla */}
            <div className={styles.list}>
                {jogadoresFiltrados.map(({ j, id }) => {
                    const checked = selecionados.includes(id);
                    return (
                        <div
                            key={id}
                            className={`${styles.item} ${checked ? styles.itemActive : ""}`}
                            onClick={() => toggle(id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") toggle(id);
                            }}
                        >
                            <div className={`${styles.cb} ${checked ? styles.cbChecked : ""}`}>
                                {checked && <span className={styles.cbMark}>✓</span>}
                            </div>

                            <div className={styles.info}>
                                <div className={styles.nome}>
                                    {j.nome}{" "}
                                    <span className={styles.pos}>
                                        ({(j.posicao || []).join(" / ") || "—"})
                                    </span>
                                </div>
                                <div className={styles.perna}>Perna: {j.perna || "—"}</div>
                            </div>
                        </div>
                    );
                })}

                {jogadoresFiltrados.length === 0 && (
                    <div className={styles.empty}>Nenhum jogador encontrado.</div>
                )}
            </div>

            {/* Footer fixo */}
            <div className={styles.footer}>
                <div className={styles.footerLeft}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline}`}
                        onClick={onBack || onClose}
                    >
                        Voltar
                    </button>

                    <span className={contadorClass}>
                        Selecionados: {selecionados.length} (mínimo {minJogadores})
                    </span>
                </div>

                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={next}
                    disabled={!podeContinuar}
                >
                    Próximo
                </button>
            </div>

        </div>
    );
}
