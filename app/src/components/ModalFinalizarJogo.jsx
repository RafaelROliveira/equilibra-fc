"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import styles from "./ModalFinalizarJogo.module.css";

function getId(j) {
    return j?.idLocal || j?._id || j?.id;
}

export default function ModalFinalizarJogo({ open, onClose, jogo, onFinalizar }) {
    const [placar1, setPlacar1] = useState(0);
    const [placar2, setPlacar2] = useState(0);
    const [mvp1, setMvp1] = useState("");
    const [mvp2, setMvp2] = useState("");

    const time1 = useMemo(() => jogo?.snapshot?.teams?.time1 || [], [jogo]);
    const time2 = useMemo(() => jogo?.snapshot?.teams?.time2 || [], [jogo]);

    useEffect(() => {
        if (open) {
            setPlacar1(0);
            setPlacar2(0);
            setMvp1("");
            setMvp2("");
        }
    }, [open]);

    if (!jogo) return null;

    const nomeT1 = jogo?.time1Nome || jogo?.snapshot?.teamNames?.time1 || "Time 1";
    const nomeT2 = jogo?.time2Nome || jogo?.snapshot?.teamNames?.time2 || "Time 2";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
            <DialogContent className={styles.content} showCloseButton={false}>
                <DialogTitle className={styles.srOnly}>Finalizar jogo</DialogTitle>

                <button className={styles.close} onClick={onClose} type="button" aria-label="Fechar">
                    ✕
                </button>

                <div className={styles.header}>
                    <h2 className={styles.title}>Finalizar jogo</h2>
                    <p className={styles.subtitle}>
                        Informe o placar e selecione os MVPs (opcional).
                    </p>
                </div>

                <div className={styles.body}>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Placar {nomeT1}</label>
                            <input
                                type="number"
                                min="0"
                                value={placar1}
                                onChange={(e) => setPlacar1(Number(e.target.value))}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Placar {nomeT2}</label>
                            <input
                                type="number"
                                min="0"
                                value={placar2}
                                onChange={(e) => setPlacar2(Number(e.target.value))}
                                className={styles.input}
                            />
                        </div>
                    </div>

                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label}>MVP {nomeT1} (opcional)</label>
                            <select
                                value={mvp1}
                                onChange={(e) => setMvp1(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">—</option>
                                {time1.map((j) => {
                                    const id = getId(j);
                                    return (
                                        <option key={id} value={id}>
                                            {j.nome}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>MVP {nomeT2} (opcional)</label>
                            <select
                                value={mvp2}
                                onChange={(e) => setMvp2(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">—</option>
                                {time2.map((j) => {
                                    const id = getId(j);
                                    return (
                                        <option key={id} value={id}>
                                            {j.nome}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button type="button" className={`${styles.btn} ${styles.btnGray}`} onClick={onClose}>
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGreen}`}
                        onClick={() =>
                            onFinalizar({
                                placarTime1: placar1,
                                placarTime2: placar2,
                                mvpTime1Id: mvp1 || null,
                                mvpTime2Id: mvp2 || null,
                            })
                        }
                    >
                        Finalizar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
