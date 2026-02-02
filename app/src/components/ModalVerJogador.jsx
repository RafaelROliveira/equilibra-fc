"use client";
import React from "react";
import styles from "@/app/modal.module.css";

export default function ModalEditarLista({
    isOpen,
    onClose,
    nome,
    setNome,
    onSalvar,
    jogadores = [],
    onEditarJogador,
    onExcluirJogador
}) {
    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <div className={styles['modal-conteudo']}>
                <button className={styles['fechar-x']} onClick={onClose}>×</button>
                <h2>Editar Lista</h2>

                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={styles.inputModal}
                />

                <div className={styles.modalActions}>
                    <button onClick={onSalvar} className={styles.btnConfirmar}>Salvar</button>
                    <button onClick={onClose} className={styles.btnCancelar}>Cancelar</button>
                </div>

                <h3 className={styles.listaJogadoresTitulo}>Jogadores da lista</h3>
                <ul className={styles.listaJogadores}>
                    {jogadores.map((jogador) => (
                        <li key={jogador._id}>
                            {jogador.nome} ({jogador.posicao}, {jogador.perna})
                            <button onClick={() => onEditarJogador(jogador)} className={styles.btnEditarJogador}>
                                Editar
                            </button>
                            <button onClick={() => onExcluirJogador(jogador._id)} className={styles.btnExcluirJogador}>
                                Excluir
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
