
"use client";
import React, { useMemo } from "react";
import styles from "@/app/modal.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LS_KEY = "equilibrafc:listas:v1";

const subposicaoParaPosicao = {
  CA: "ATA",
  PTA: "ATA",
  SA: "ATA",
  MO: "MEI",
  MC: "MEI",
  VOL: "MEI",
  LE: "LAT",
  LD: "LAT",
  ALAE: "LAT",
  ALAD: "LAT",
  ZAGE: "ZAG",
  ZAGD: "ZAG",
  GOL: "GOL",
};

// opções mostradas no select (ajuste se quiser)
const SUBPOSICOES = [
  "CA", "PTA", "SA", "MO", "MC", "VOL",
  "LE", "LD", "ALAE", "ALAD", "ZAGE", "ZAGD", "GOL"
];

export default function ModalAdicionarJogador({
  isOpen,
  onClose,
  lista,
  jogador,
  setJogador,
  onSubmit,
}) {
  if (!isOpen) return null;

  function addSubposicao(sub) {
    if (!sub) return;

    const atual = jogador.subposicoes || [];
    if (atual.includes(sub)) return;
    if (atual.length >= 2) return;

    const atualizadas = [...atual, sub];
    const posicoes = [...new Set(atualizadas.map((s) => subposicaoParaPosicao[s]))];

    setJogador((prev) => ({
      ...prev,
      subposicoes: atualizadas,
      posicao: posicoes,
    }));
  }

  function removeSubposicao(sub) {
    const atual = jogador.subposicoes || [];
    const novaLista = atual.filter((s) => s !== sub);
    const posicoes = [...new Set(novaLista.map((s) => subposicaoParaPosicao[s]))];

    setJogador((prev) => ({
      ...prev,
      subposicoes: novaLista,
      posicao: posicoes,
    }));
  }

  // garante número nos atributos
  function setNum(key, val) {
    const n = Number(val);
    setJogador((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  }

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
  function salvar() {
    // aqui você decide se quer validar antes
    onSubmit?.();
  }

  return (
    <div className={styles.modal}>
      <div className={styles["modal-conteudo"]}>
        <button className={styles["fechar-x"]} onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <h2 className={styles.textTitulo}>Adicionar Jogador</h2>
        <p>
          <strong className={styles.textNomeLista}>{lista?.nomeLista}</strong>
        </p>

        {/* ✅ Linha: Nome + Perna */}
        <div className={styles.nomeContainer}>
          <div className={styles.nomeForm}>
            <p className={styles.textInputNome}>Nome:</p>
            <input
              type="text"
              placeholder="Nome do jogador"
              value={jogador.nome || ""}
              onChange={(e) => setJogador((prev) => ({ ...prev, nome: e.target.value }))}
              className={styles.inputNome}
              maxLength={22}
            />
          </div>

          <div className={styles.pernaForm}>
            <p className={styles.textInputNome}>Perna:</p>
            <select
              value={jogador.perna || ""}
              onChange={(e) => setJogador((prev) => ({ ...prev, perna: e.target.value }))}
              className={styles.inputPerna}
            >
              <option value="">Selecione...</option>
              <option value="Direita">Direita</option>
              <option value="Esquerda">Esquerda</option>
              <option value="Ambidestro">Ambidestro</option>
            </select>
          </div>
        </div>

        {/* ✅ Posições: tags + select (máx 2) */}
        <div className={styles.multiSelectWrapper}>
          <label className={styles.textPosicoes}>Posições (máx. 2)</label>

          <div className={styles.multiSelectBox}>
            {(jogador.subposicoes || []).map((sub) => (
              <div key={sub} className={styles.tag}>
                {sub}
                <span className={styles.removeTag} onClick={() => removeSubposicao(sub)}>
                  ×
                </span>
              </div>
            ))}

            {(jogador.subposicoes || []).length < 2 && (
              <select
                className={styles.multiSelect}
                defaultValue=""
                onChange={(e) => {
                  addSubposicao(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">Selecione...</option>
                {SUBPOSICOES.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ✅ Atributos em grid (2 linhas de 3) */}
        <div className={styles.atributosLinha}>
          <div>
            <p className={styles.textInputAtributos}>Inteligência:</p>
            <input
              type="number"
              min="0"
              value={jogador.qi ?? 0}
              onChange={(e) => setNum("qi", e.target.value)}
              className={styles.inputModal}
            />
          </div>

          <div>
            <p className={styles.textInputAtributos}>Finalização:</p>
            <input
              type="number"
              min="0"
              value={jogador.finalizacao ?? 0}
              onChange={(e) => setNum("finalizacao", e.target.value)}
              className={styles.inputModal}
            />
          </div>

          <div>
            <p className={styles.textInputAtributos}>Passes:</p>
            <input
              type="number"
              min="0"
              value={jogador.passes ?? 0}
              onChange={(e) => setNum("passes", e.target.value)}
              className={styles.inputModal}
            />
          </div>
        </div>

        <div className={styles.atributosLinha}>
          <div>
            <p className={styles.textInputAtributos}>Dribles:</p>
            <input
              type="number"
              min="0"
              value={jogador.dribles ?? 0}
              onChange={(e) => setNum("dribles", e.target.value)}
              className={styles.inputModal}
            />
          </div>

          <div>
            <p className={styles.textInputAtributos}>Defesa:</p>
            <input
              type="number"
              min="0"
              value={jogador.defesa ?? 0}
              onChange={(e) => setNum("defesa", e.target.value)}
              className={styles.inputModal}
            />
          </div>

          <div>
            <p className={styles.textInputAtributos}>Físico:</p>
            <input
              type="number"
              min="0"
              value={jogador.fisico ?? 0}
              onChange={(e) => setNum("fisico", e.target.value)}
              className={styles.inputModal}
            />
          </div>
        </div>

        {/* ✅ Foto */}
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
              onClick={() => setJogador((prev) => ({ ...prev, foto: "" }))}
            >
              Remover imagem
            </button>
          </div>
        )}

        {/* ✅ Ações */}
        <div className={styles.modalActions}>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnLigth}`}>
            Cancelar
          </button>
          <button onClick={salvar} className={`${styles.btn} ${styles.btnGreen}`}>
            Salvar
          </button>

        </div>
      </div>
    </div>
  );
}
