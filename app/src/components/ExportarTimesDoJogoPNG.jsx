"use client";

import { useMemo } from "react";
import { toPng } from "html-to-image";
import styles from "../app/listas/listas.module.css";


function norm(s) {
    return String(s || "").trim().toLowerCase();
}

function isGoleiro(j) {
    const pos = j?.posicao;
    const subs = j?.subposicoes;
    const has = (v) => norm(v).includes("gol");
    if (Array.isArray(pos) && pos.some(has)) return true;
    if (typeof pos === "string" && has(pos)) return true;
    if (Array.isArray(subs) && subs.some(has)) return true;
    if (typeof subs === "string" && has(subs)) return true;
    return false;
}

function ordenarComGoleiroPrimeiro(jogadores = []) {
    const arr = [...(jogadores || [])];
    const gks = arr.filter(isGoleiro);
    const rest = arr.filter((j) => !isGoleiro(j));
    return [...gks, ...rest];
}

function safeFileName(s) {
    return String(s || "jogo").replace(/[^\w\-]+/g, "_");
}

// --- SVG helpers ---
function esc(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export default function ExportarTimesDoJogoPNG({ jogo, time1, time2 }) {
    const data = useMemo(() => {
        const nome1 = time1?.nome || "Time 1";
        const nome2 = time2?.nome || "Time 2";

        const t1 = ordenarComGoleiroPrimeiro(time1?.jogadores || []);
        const t2 = ordenarComGoleiroPrimeiro(time2?.jogadores || []);

        const file = `equilibrafc_times_${safeFileName(nome1)}_vs_${safeFileName(nome2)}_${safeFileName(
            jogo?.data || ""
        )}.png`;

        return { nome1, nome2, t1, t2, file };
    }, [jogo, time1, time2]);

    async function exportPNG() {
        // monta um SVG puro (sem CSS externo -> sem oklch)
        const W = 1200;
        const pad = 28;
        const colGap = 22;
        const colW = Math.floor((W - pad * 2 - colGap) / 2);

        const title = `Times — ${data.nome1} x ${data.nome2}`;
        const sub =
            `${jogo?.data ? `Dia: ${jogo.data}` : ""}` +
            `${jogo?.horaInicio ? ` • ${jogo.horaInicio}` : ""}` +
            `${jogo?.horaFim ? `–${jogo.horaFim}` : ""}` +
            `${jogo?.modalidade ? ` • ${jogo.modalidade}` : ""}`;

        const rowH = 44;
        const headerH = 46;

        // calcula altura dinamicamente (maior time define)
        const rows = Math.max(data.t1.length, data.t2.length);
        const H = 170 + headerH + rows * rowH + 40;

        const bg = "#0f0f10";
        const card = "#141416";
        const card2 = "#191a1d";
        const line = "rgba(255,255,255,0.10)";
        const text = "#f5f5f5";
        const muted = "rgba(255,255,255,0.70)";
        const pill = "rgba(255,255,255,0.08)";

        const x1 = pad;
        const x2 = pad + colW + colGap;
        const yTop = 120;

        const svgHeader = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${bg}"/>
  <text x="${pad}" y="54" fill="${text}" font-family="Arial, sans-serif" font-size="28" font-weight="700">${esc(
            title
        )}</text>
  <text x="${pad}" y="82" fill="${muted}" font-family="Arial, sans-serif" font-size="14">${esc(
            sub
        )}</text>
  <text x="${W - pad}" y="54" fill="${muted}" font-family="Arial, sans-serif" font-size="12" text-anchor="end">EquilibraFC</text>
`;

        const box = (x, nome, count) => `
  <rect x="${x}" y="${yTop}" width="${colW}" height="${headerH + rows * rowH}" rx="16" fill="${card}" stroke="${line}"/>
  <rect x="${x}" y="${yTop}" width="${colW}" height="${headerH}" rx="16" fill="${card2}"/>
  <text x="${x + 16}" y="${yTop + 30}" fill="${text}" font-family="Arial, sans-serif" font-size="18" font-weight="700">${esc(
            nome
        )}</text>
  <text x="${x + colW - 16}" y="${yTop + 30}" fill="${muted}" font-family="Arial, sans-serif" font-size="12" text-anchor="end">${count} jogadores</text>
`;

        const renderRows = (x, list) => {
            let out = "";
            for (let i = 0; i < rows; i++) {
                const j = list[i];
                const y = yTop + headerH + i * rowH;

                // linha base
                out += `<rect x="${x + 12}" y="${y + 6}" width="${colW - 24}" height="${rowH - 12}" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>`;

                // bolinha numero
                out += `<circle cx="${x + 28}" cy="${y + 22}" r="13" fill="${pill}"/>`;
                out += `<text x="${x + 28}" y="${y + 26}" fill="${text}" font-family="Arial, sans-serif" font-size="12" font-weight="700" text-anchor="middle">${i + 1
                    }</text>`;

                if (j) {
                    const nome = j.nome || j.idLocal || "?";
                    out += `<text x="${x + 52}" y="${y + 23}" fill="${text}" font-family="Arial, sans-serif" font-size="14" font-weight="700">${esc(
                        nome
                    )}</text>`;

                    if (isGoleiro(j)) {
                        out += `<text x="${x + 52}" y="${y + 38}" fill="${muted}" font-family="Arial, sans-serif" font-size="12">Goleiro</text>`;
                    }
                } else {
                    out += `<text x="${x + 52}" y="${y + 26}" fill="rgba(255,255,255,0.35)" font-family="Arial, sans-serif" font-size="13">—</text>`;
                }
            }
            return out;
        };

        const svg =
            svgHeader +
            box(x1, data.nome1, data.t1.length) +
            box(x2, data.nome2, data.t2.length) +
            renderRows(x1, data.t1) +
            renderRows(x2, data.t2) +
            `
  <text x="${pad}" y="${H - 18}" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="12">Goleiro(s) no topo • Jogadores numerados</text>
</svg>`;

        // converte SVG -> PNG usando um elemento temporário
        const holder = document.createElement("div");
        holder.style.position = "fixed";
        holder.style.left = "0";
        holder.style.top = "0";
        holder.style.transform = "translateX(-200vw)";
        holder.innerHTML = svg;
        document.body.appendChild(holder);

        try {
            const svgEl = holder.querySelector("svg");
            const dataUrl = await toPng(svgEl, {
                pixelRatio: 2,
                cacheBust: true,
                skipFonts: true,     // ✅ evita tentar ler google fonts
            });

            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = data.file;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            holder.remove();
        }
    }

    return (
        <button
            type="button"
            onClick={exportPNG}
            title="Exportar times (PNG)"
            className={styles.btnExport}
        >
            <img
                src="/images/compartilhar_branco.png"
                alt="Exportar"
                className={styles.btnIcon}
            />
            <label className={styles.labelExport}>Compartilhar Jogo</label>
        </button>
    );
}
