"use client";

import { useEffect, useState } from "react";
import styles from "./ModalConfirmarDivisao.module.css";

function getId(j) {
    return j?.idLocal || j?._id || j?.id;
}

function overall(j) {
    const vals = [
        Number(j.qi) || 0,
        Number(j.finalizacao) || 0,
        Number(j.passes) || 0,
        Number(j.dribles) || 0,
        Number(j.defesa) || 0,
        Number(j.fisico) || 0,
    ];
    return Math.floor(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Fisher–Yates shuffle */
function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function recalc(time1, time2, capitao1Id, capitao2Id) {
    const sum1 = (time1 || []).reduce((s, j) => s + overall(j), 0);
    const sum2 = (time2 || []).reduce((s, j) => s + overall(j), 0);

    const findCap = (team, capId) => (team || []).find((x) => getId(x) === capId) || null;
    const best = (team) => [...(team || [])].sort((a, b) => overall(b) - overall(a))[0] || null;

    let capitao1 = findCap(time1, capitao1Id);
    let capitao2 = findCap(time2, capitao2Id);

    if (!capitao1) capitao1 = best(time1);
    if (!capitao2) capitao2 = best(time2);

    return { sum1, sum2, capitao1, capitao2 };
}

/** Divisão aleatória simples */
function splitRandomEqual(jogadores) {
    const list = [...(jogadores || [])];
    shuffleInPlace(list);

    const half = Math.ceil(list.length / 2);
    const time1 = list.slice(0, half);
    const time2 = list.slice(half);

    const r = recalc(time1, time2, null, null);
    return { time1, time2, ...r };
}

function pickPosicaoPrincipalRandom(j) {
    const pos = (j.posicao || [])
        .map((p) => String(p).toUpperCase())
        .filter(Boolean);
    if (pos.includes("GOL")) return "GOL";
    if (pos.length === 0) return "MEI";
    return pos[Math.floor(Math.random() * pos.length)];
}

function dividirTimesAutoV2(jogadores) {
    const base = (jogadores || [])
        .map((j) => ({
            ...j,
            _pos: pickPosicaoPrincipalRandom(j),
            _ovr: overall(j),
        }))
        .filter((j) => !!getId(j));

    shuffleInPlace(base);

    const time1 = [];
    const time2 = [];
    let sum1 = 0;
    let sum2 = 0;

    const countPos = {
        t1: { GOL: 0, ZAG: 0, LAT: 0, MEI: 0, MOF: 0, ATA: 0 },
        t2: { GOL: 0, ZAG: 0, LAT: 0, MEI: 0, MOF: 0, ATA: 0 },
    };

    const posAll = ["GOL", "ZAG", "LAT", "MEI", "MOF", "ATA"];
    const posOrdem = [...posAll].sort((a, b) => {
        const ca = base.filter((p) => p._pos === a).length;
        const cb = base.filter((p) => p._pos === b).length;
        return ca - cb;
    });

    const buckets = {};
    for (const p of posOrdem) buckets[p] = [];
    for (const p of base) {
        if (!buckets[p._pos]) buckets[p._pos] = [];
        buckets[p._pos].push(p);
    }

    for (const p of Object.keys(buckets)) {
        const arr = buckets[p];
        shuffleInPlace(arr);
        if (Math.random() < 0.6) {
            arr.sort((a, b) => b._ovr - a._ovr + (Math.random() * 6 - 3));
        }
    }

    function add(team, player) {
        if (team === 1) {
            time1.push(player);
            sum1 += player._ovr;
            countPos.t1[player._pos] = (countPos.t1[player._pos] || 0) + 1;
        } else {
            time2.push(player);
            sum2 += player._ovr;
            countPos.t2[player._pos] = (countPos.t2[player._pos] || 0) + 1;
        }
    }

    function chooseTeam(player) {
        const c1 = countPos.t1[player._pos] || 0;
        const c2 = countPos.t2[player._pos] || 0;
        if (c1 !== c2) return c1 < c2 ? 1 : 2;

        if (time1.length !== time2.length) return time1.length < time2.length ? 1 : 2;
        if (sum1 !== sum2) return sum1 <= sum2 ? 1 : 2;

        return Math.random() < 0.5 ? 1 : 2;
    }

    for (const pos of posOrdem) {
        const arr = buckets[pos] || [];
        for (const player of arr) add(chooseTeam(player), player);
    }

    const r = recalc(time1, time2, null, null);
    return { time1, time2, ...r };
}

export default function ModalConfirmarDivisao({
    modalidade,
    jogadores = [],
    onConfirmar,
    onClose,
    onBack,
}) {
    const [time1, setTime1] = useState([]);
    const [time2, setTime2] = useState([]);

    const [nomeTime1, setNomeTime1] = useState("Time 1");
    const [nomeTime2, setNomeTime2] = useState("Time 2");

    // capitão só no SELECT
    const [capitao1Id, setCapitao1Id] = useState(null);
    const [capitao2Id, setCapitao2Id] = useState(null);

    const [capitao1, setCapitao1] = useState(null);
    const [capitao2, setCapitao2] = useState(null);
    const [sum1, setSum1] = useState(0);
    const [sum2, setSum2] = useState(0);

    function applySplit(result) {
        const t1 = result.time1 || [];
        const t2 = result.time2 || [];

        setTime1(t1);
        setTime2(t2);
        setCapitao1Id(null);
        setCapitao2Id(null);

        const r = recalc(t1, t2, null, null);
        setSum1(r.sum1);
        setSum2(r.sum2);
        setCapitao1(r.capitao1);
        setCapitao2(r.capitao2);
    }

    function gerarAutoVariado() {
        applySplit(dividirTimesAutoV2(jogadores));
    }

    function gerarAleatorio() {
        applySplit(splitRandomEqual(jogadores));
    }

    useEffect(() => {
        gerarAutoVariado();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const r = recalc(time1, time2, capitao1Id, capitao2Id);
        setSum1(r.sum1);
        setSum2(r.sum2);
        setCapitao1(r.capitao1);
        setCapitao2(r.capitao2);
    }, [time1, time2, capitao1Id, capitao2Id]);

    const podeConfirmar = time1.length > 0 && time2.length > 0;

    // mover SEM LIMITE (10–8, 1–17, etc.)
    function movePlayerFree(id, from, to) {
        if (!id || from === to) return;

        const src = from === 1 ? time1 : time2;
        const dst = to === 1 ? time1 : time2;

        const idx = src.findIndex((j) => getId(j) === id);
        if (idx < 0) return;

        const player = src[idx];
        const newSrc = src.filter((j) => getId(j) !== id);
        const newDst = [...dst, player];

        if (from === 1 && to === 2) {
            setTime1(newSrc);
            setTime2(newDst);
        } else if (from === 2 && to === 1) {
            setTime2(newSrc);
            setTime1(newDst);
        }

        if (from === 1 && capitao1Id === id) setCapitao1Id(null);
        if (from === 2 && capitao2Id === id) setCapitao2Id(null);
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.topRow}>
                <div className={styles.titleBlock}>
                    <div className={styles.title}>Confirmar divisão</div>
                    <div className={styles.info}>
                        Modalidade: <strong>{modalidade || "—"}</strong> • Força Time 1:{" "}
                        <strong>{sum1}</strong> • Força Time 2: <strong>{sum2}</strong>
                    </div>
                </div>

                <div className={styles.topButtons}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDark}`}
                        onClick={gerarAleatorio}
                    >
                        Aleatório
                    </button>

                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDark}`}
                        onClick={gerarAutoVariado}
                    >
                        Dividir de novo
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* TIME 1 */}
                <div className={styles.teamCard}>
                    <div className={styles.teamHead}>
                        <input
                            className={styles.teamNameInput}
                            value={nomeTime1}
                            onChange={(e) => setNomeTime1(e.target.value)}
                            placeholder="Nome do Time 1"
                        />

                        <div className={styles.capRow}>
                            <span className={styles.capLabel}>Cap:</span>
                            <select
                                className={styles.capSelect}
                                value={capitao1Id || (capitao1 ? getId(capitao1) : "")}
                                onChange={(e) => setCapitao1Id(e.target.value || null)}
                            >
                                {(time1 || []).map((p) => (
                                    <option key={getId(p)} value={getId(p)}>
                                        {p.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div
                        className={styles.teamBody}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const txt = e.dataTransfer.getData("text/plain");
                            if (!txt) return;
                            try {
                                const data = JSON.parse(txt); // { id, from }
                                movePlayerFree(data.id, data.from, 1);
                            } catch { }
                        }}
                    >
                        {time1.map((j) => {
                            const id = getId(j);
                            return (
                                <div
                                    key={id}
                                    className={styles.row}
                                    draggable
                                    onDragStart={(e) => {
                                        const payload = JSON.stringify({ id, from: 1 });
                                        e.dataTransfer.setData("text/plain", payload);
                                        e.dataTransfer.effectAllowed = "move";
                                    }}
                                    title="Arraste para mover"
                                >
                                    <span className={styles.nome}>{j.nome}</span>
                                    <span className={styles.ovr}>{overall(j)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* TIME 2 */}
                <div className={styles.teamCard}>
                    <div className={styles.teamHead}>
                        <input
                            className={styles.teamNameInput}
                            value={nomeTime2}
                            onChange={(e) => setNomeTime2(e.target.value)}
                            placeholder="Nome do Time 2"
                        />

                        <div className={styles.capRow}>
                            <span className={styles.capLabel}>Cap:</span>
                            <select
                                className={styles.capSelect}
                                value={capitao2Id || (capitao2 ? getId(capitao2) : "")}
                                onChange={(e) => setCapitao2Id(e.target.value || null)}
                            >
                                {(time2 || []).map((p) => (
                                    <option key={getId(p)} value={getId(p)}>
                                        {p.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div
                        className={styles.teamBody}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const txt = e.dataTransfer.getData("text/plain");
                            if (!txt) return;
                            try {
                                const data = JSON.parse(txt);
                                movePlayerFree(data.id, data.from, 2);
                            } catch { }
                        }}
                    >
                        {time2.map((j) => {
                            const id = getId(j);
                            return (
                                <div
                                    key={id}
                                    className={styles.row}
                                    draggable
                                    onDragStart={(e) => {
                                        const payload = JSON.stringify({ id, from: 2 });
                                        e.dataTransfer.setData("text/plain", payload);
                                        e.dataTransfer.effectAllowed = "move";
                                    }}
                                    title="Arraste para mover"
                                >
                                    <span className={styles.nome}>{j.nome}</span>
                                    <span className={styles.ovr}>{overall(j)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnLight}`}
                    onClick={onBack || onClose}
                >
                    Voltar
                </button>

                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGreen}`}
                    onClick={() =>
                        onConfirmar({
                            time1,
                            time2,
                            capitao1,
                            capitao2,
                            nomeTime1: (nomeTime1 || "Time 1").trim(),
                            nomeTime2: (nomeTime2 || "Time 2").trim(),
                        })
                    }
                    disabled={!podeConfirmar}
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
}
