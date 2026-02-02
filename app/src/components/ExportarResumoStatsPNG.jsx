"use client";

import { useMemo } from "react";
import { toPng } from "html-to-image";
import styles from "@/app/listas/listas.module.css";

function esc(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function safeFileName(s) {
    return String(s || "stats").replace(/[^\w\-]+/g, "_");
}

function pct(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
}

export default function ExportarResumoStatsPNG({ lista }) {
    const data = useMemo(() => {
        const jogadores = (lista?.jogadores || []).map((j) => {
            const J = Number(j.jogosJogados || 0);
            const V = Number(j.vitorias || 0);
            const D = Number(j.derrotas || 0);
            const E = Number(j.empates || 0);
            const G = Number(j.gols || 0);
            const MVP = Number(j.mvps || 0);

            const pV = pct(V, J);
            const pD = pct(D, J);
            const pE = pct(E, J);

            // ✅ Brasileirão
            const PTS = V * 3 + E * 1;

            return {
                nome: j.nome || "—",
                J,
                V,
                D,
                E,
                PTS,
                G,
                MVP,
                pV,
                pD,
                pE,
            };
        });

        // ✅ ordena estilo tabela: PTS, V, %V, MVP, nome
        jogadores.sort(
            (a, b) =>
                (b.PTS - a.PTS) ||   // 🔥 1º critério: pontos (SEMPRE)
                (b.V - a.V) ||       // 2º: vitórias
                (b.pV - a.pV) ||     // 3º: % de vitórias
                (b.MVP - a.MVP) ||   // 4º: MVP
                a.nome.localeCompare(b.nome) // 5º: nome (desempate final)
        );


        const titulo = `Stats — ${lista?.nomeLista || "Lista"}`;
        const sub = `Jogadores: ${jogadores.length}`;
        const file = `equilibrafc_stats_${safeFileName(lista?.nomeLista)}.png`;

        return { jogadores, titulo, sub, file };
    }, [lista]);

    async function exportPNG() {
        const W = 1400;
        const pad = 28;

        const headerH = 110;
        const rowH = 44;
        const rows = data.jogadores.length || 1;
        const H = headerH + 90 + rows * rowH + 50;

        const bg = "#0f0f10";
        const card = "#141416";
        const card2 = "#191a1d";
        const text = "#f5f5f5";
        const muted = "rgba(255,255,255,0.70)";
        const line = "rgba(255,255,255,0.10)";

        // ✅ colunas (compacto + PTS)
        const cols = [
            { key: "nome", label: "JOGADOR", w: 420, align: "start" },
            { key: "PTS", label: "PTS", w: 90, align: "end" }, // ✅ pontos
            { key: "J", label: "J", w: 70, align: "end" },
            { key: "V", label: "V", w: 140, align: "end" }, // 6 (60%)
            { key: "D", label: "D", w: 140, align: "end" }, // 2 (20%)
            { key: "E", label: "E", w: 140, align: "end" }, // 2 (20%)
            { key: "G", label: "G", w: 70, align: "end" },
            { key: "MVP", label: "MVP", w: 90, align: "end" },
        ];

        const tableX = pad;
        const tableY = headerH;
        const tableW = W - pad * 2;
        const tableH = 90 + rows * rowH;

        // posições X acumuladas
        const xPos = [];
        let acc = tableX + 18;
        for (const c of cols) {
            xPos.push(acc);
            acc += c.w;
        }

        const svgHeader = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${bg}"/>
  <text x="${pad}" y="54" fill="${text}" font-family="Arial, sans-serif" font-size="30" font-weight="800">${esc(
            data.titulo
        )}</text>
  <text x="${pad}" y="82" fill="${muted}" font-family="Arial, sans-serif" font-size="14">${esc(
            data.sub
        )}</text>
  <text x="${W - pad}" y="54" fill="${muted}" font-family="Arial, sans-serif" font-size="12" text-anchor="end">EquilibraFC</text>

  <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="16" fill="${card}" stroke="${line}"/>
  <rect x="${tableX}" y="${tableY}" width="${tableW}" height="60" rx="16" fill="${card2}"/>

  <text x="${tableX + 18}" y="${tableY + 38
            }" fill="${muted}" font-family="Arial, sans-serif" font-size="12">Resumo de estatísticas</text>
`;

        // cabeçalho das colunas
        let head = "";
        cols.forEach((c, i) => {
            const x = xPos[i];
            const anchor = c.align === "end" ? "end" : "start";
            const xText = c.align === "end" ? x + c.w - 10 : x;
            head += `<text x="${xText}" y="${tableY + 82
                }" fill="${text}" font-family="Arial, sans-serif" font-size="12" font-weight="700" text-anchor="${anchor}">${esc(
                    c.label
                )}</text>`;
        });

        // linhas
        let body = "";
        for (let i = 0; i < rows; i++) {
            const j = data.jogadores[i] || {
                nome: "—",
                J: 0,
                V: 0,
                D: 0,
                E: 0,
                PTS: 0,
                G: 0,
                MVP: 0,
                pV: 0,
                pD: 0,
                pE: 0,
            };
            const y = tableY + 90 + i * rowH;

            body += `<rect x="${tableX + 12}" y="${y + 6
                }" width="${tableW - 24}" height="${rowH - 12
                }" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>`;

            cols.forEach((c, ci) => {
                const x = xPos[ci];
                const anchor = c.align === "end" ? "end" : "start";
                const xText = c.align === "end" ? x + c.w - 10 : x;

                let val = j[c.key];

                // ✅ mostra % junto do número
                if (c.key === "V") val = `${j.V} (${j.pV}%)`;
                if (c.key === "D") val = `${j.D} (${j.pD}%)`;
                if (c.key === "E") val = `${j.E} (${j.pE}%)`;

                const isName = c.key === "nome";
                const fill = isName ? text : "rgba(255,255,255,0.90)";
                const weight = isName ? 800 : 600;
                const size = isName ? 14 : 13;

                body += `<text x="${xText}" y="${y + 30
                    }" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(
                        val
                    )}</text>`;
            });
        }

        const footer = `
  <text x="${pad}" y="${H - 18
            }" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="12">
    Ordenado por PTS (V=3, E=1) • % calculado por jogos jogados
  </text>
</svg>`;

        const svg = svgHeader + head + body + footer;

        // render temp
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
                skipFonts: true, // ✅ evita cssRules/google fonts
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
            className={styles.btnExport}
            type="button"
            onClick={exportPNG}
            title="Exportar stats (PNG)"

        >
            <img
                src="/images/stats.png"
                alt="Exportar"
                className={styles.btnIcon}
            />
            <label className={styles.labelExport}>Baixar Status</label>
        </button>
    );
}
