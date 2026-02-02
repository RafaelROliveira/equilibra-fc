"use client";
import React from "react";
import styles from "@/app/modal.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LS_KEY = "equilibrafc:listas:v1";

const subposicaoParaPosicao = {
    CA: 'ATA',
    PTA: 'ATA',
    SA: 'ATA',
    MO: 'MEI',
    MC: 'MEI',
    VOL: 'MEI',
    LE: 'LAT',
    LD: 'LAT',
    ALAE: 'LAT',
    ALAD: 'LAT',
    ZAGE: 'ZAG',
    ZAGD: 'ZAG',
    GOL: 'GOL'
};


export default function ModalEditarJogador({ isOpen, onClose, jogador, setJogador, onSalvar }) {
    if (!isOpen || !jogador) return null;

    async function handleFotoSelecionada(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Verifica se é uma imagem
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            console.error("Tipo de arquivo inválido. Envie uma imagem JPG ou PNG.");
            return;
        }

        const formData = new FormData();
        formData.append("foto", file);

        try {
            const response = await fetch(`${API_BASE}/api/player/upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.url) {
                setJogador(prev => ({ ...prev, foto: data.url }));
                console.log("URL da imagem:", jogador.foto);

            } else {
                console.error("Erro ao enviar imagem:", data?.msg || "Resposta inesperada.");
            }
        } catch (error) {
            console.error("Erro no upload da imagem:", error.message);
        }
    }




    return (
        <div className={styles.modal}>
            <div className={styles['modal-conteudo']}>
                <button className={styles['fechar-x']} onClick={onClose}>×</button>
                <h2 className={styles.textTitulo}>Editar Jogador</h2>
                <div className={styles.nomeContainer}>
                    <div className={styles.nomeForm}>
                        <p className={styles.textInputNome}>Nome:</p>
                        <input
                            type="text"
                            placeholder="Nome do jogador"
                            value={jogador.nome}
                            onChange={(e) => setJogador({ ...jogador, nome: e.target.value })}
                            className={styles.inputNome}
                            maxLength={16}
                        />
                    </div>
                    <div className={styles.pernaForm}>
                        <p className={styles.textInputNome}>Perna:</p>
                        <select
                            value={jogador.perna}
                            onChange={(e) => setJogador({ ...jogador, perna: e.target.value })}
                            className={styles.inputPerna}
                        >
                            <option value="">Selecione a perna</option>
                            <option value="Direita">Direita</option>
                            <option value="Esquerda">Esquerda</option>
                            <option value="Ambidestro">Ambidestro</option>
                        </select>
                    </div>
                </div>



                <div className={styles.multiSelectWrapper}>
                    <label className={styles.textPosicoes}>Posições (máx. 2)</label>

                    <div className={styles.multiSelectBox}>
                        {(jogador.subposicoes || []).map((sub) => (
                            <div key={sub} className={styles.tag}>
                                {sub}
                                <span
                                    className={styles.removeTag}
                                    onClick={() => {
                                        const atual = jogador.subposicoes || [];
                                        const novaLista = atual.filter((s) => s !== sub);
                                        const posicoes = [...new Set(novaLista.map((s) => subposicaoParaPosicao[s]))];

                                        setJogador((prev) => ({
                                            ...prev,
                                            subposicoes: novaLista,
                                            posicao: posicoes,
                                        }));
                                    }}
                                >
                                    ×
                                </span>
                            </div>
                        ))}

                        {(jogador.subposicoes || []).length < 2 && (
                            <select
                                className={styles.multiSelect}
                                value=""
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) return;

                                    const atual = jogador.subposicoes || [];
                                    if (atual.includes(value) || atual.length >= 2) return;

                                    const atualizadas = [...atual, value];
                                    const posicoes = [...new Set(atualizadas.map((s) => subposicaoParaPosicao[s]))];

                                    setJogador((prev) => ({
                                        ...prev,
                                        subposicoes: atualizadas,
                                        posicao: posicoes,
                                    }));

                                    e.target.value = ""; // reseta igual ao Adicionar
                                }}
                            >
                                <option value="">Selecione...</option>
                                {[
                                    "CA", "PTA", "SA", "MO", "MC", "VOL",
                                    "LE", "LD", "ALA", "ZAG", "GOL",
                                ].map((sub) => (
                                    <option key={sub} value={sub}>
                                        {sub}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>




                <div className={styles.atributosLinha}>
                    <div>
                        <p className={styles.textInputAtributos}>Inteligência:</p>
                        <input
                            type="number"
                            placeholder="QI"
                            value={jogador.qi}
                            onChange={(e) => setJogador({ ...jogador, qi: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                    <div>
                        <p className={styles.textInputAtributos}>Finalização:</p>
                        <input
                            type="number"
                            placeholder="Finalização"
                            value={jogador.finalizacao}
                            onChange={(e) => setJogador({ ...jogador, finalizacao: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                    <div>
                        <p className={styles.textInputAtributos}>Passes:</p>
                        <input
                            type="number"
                            placeholder="Passes"
                            value={jogador.passes}
                            onChange={(e) => setJogador({ ...jogador, passes: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                </div>

                <div className={styles.atributosLinha}>
                    <div>
                        <p className={styles.textInputAtributos}>Dribles:</p>
                        <input
                            type="number"
                            placeholder="Dribles"
                            value={jogador.dribles}
                            onChange={(e) => setJogador({ ...jogador, dribles: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                    <div>
                        <p className={styles.textInputAtributos}>Defesa:</p>
                        <input
                            type="number"
                            placeholder="Defesa"
                            value={jogador.defesa}
                            onChange={(e) => setJogador({ ...jogador, defesa: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                    <div>
                        <p className={styles.textInputAtributos}>Físico:</p>
                        <input
                            type="number"
                            placeholder="Físico"
                            value={jogador.fisico}
                            onChange={(e) => setJogador({ ...jogador, fisico: parseInt(e.target.value) || 0 })}
                            className={styles.inputModal}
                        />
                    </div>
                </div>




                <div className={styles.textImagem}>
                    <label className={styles.textImagem}>Foto do Jogador</label>
                </div>
                <label className={styles.fileLabel}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoSelecionada}
                        className={styles.fileInput}
                    />
                    <span className={styles.fileButton}>
                        Escolher foto
                    </span>
                </label>

                {jogador.foto && (
                    <div className={styles.fotoPreview}>
                        <img src={jogador.foto} alt="Prévia da foto" />
                        <button
                            type="button"
                            className={styles.removerImagemBtn}
                            onClick={() => setJogador(prev => ({ ...prev, foto: "" }))}
                        >
                            Remover imagem
                        </button>
                    </div>
                )}



                <div className={styles.modalActions}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnLigth}`}>Cancelar</button>
                    <button onClick={onSalvar} className={`${styles.btn} ${styles.btnGreen}`}>Salvar</button>

                </div>
            </div>
        </div>
    );
}
