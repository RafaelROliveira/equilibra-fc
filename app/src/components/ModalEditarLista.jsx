import { useState, useEffect } from "react";
import styles from "@/app/modal.module.css";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, PolarRadiusAxis } from "recharts";

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
    const [cardAberto, setCardAberto] = useState(null);
    const [showRadar, setShowRadar] = useState(null);

    useEffect(() => {
        if (cardAberto !== null) {
            const timer = setTimeout(() => setShowRadar(cardAberto), 200);
            return () => clearTimeout(timer);
        }
        setShowRadar(null);
    }, [cardAberto]);

    if (!isOpen || !Array.isArray(jogadores)) return null;

    return (
        <div className={styles.modal}>
            <div className={styles["modal-conteudo"]}>
                <button className={styles["fechar-x"]} onClick={onClose}>×</button>

                <h2 className={styles.modalTit}>Editar Lista</h2>

                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={styles.inputModal}
                />



                {jogadores.length === 0 ? (
                    <p className={styles.semJogadores}>Nenhum jogador nesta lista.</p>
                ) : (
                    <ul className={styles.lista}>
                        {jogadores.map((jogador) => {
                            const playerKey = jogador.idLocal || jogador._id || jogador.id;

                            const overall = Math.floor(
                                (jogador.qi + jogador.finalizacao + jogador.passes + jogador.dribles + jogador.defesa + jogador.fisico) / 6
                            );
                            const overallPercent = Math.min(overall, 100);

                            const dadosGrafico = [
                                { habilidade: "FIN", valor: jogador.finalizacao },
                                { habilidade: "INT", valor: jogador.qi },
                                { habilidade: "PAS", valor: jogador.passes },
                                { habilidade: "DEF", valor: jogador.defesa },
                                { habilidade: "DRI", valor: jogador.dribles },
                                { habilidade: "FIS", valor: jogador.fisico },
                            ];

                            const acimaDe100 = dadosGrafico.filter((h) => h.valor > 100).length >= 4;

                            return (
                                <div
                                    key={playerKey}
                                    onClick={() => setCardAberto(cardAberto === playerKey ? null : playerKey)}
                                    className={styles.cardContainer}
                                >
                                    <li className={styles.card}>
                                        <img
                                            src={jogador.foto || "/images/jogador_branco.png"}
                                            alt={jogador.nome}
                                            className={styles.foto}
                                        />

                                        <div className={styles.info}>
                                            <strong className={styles.nome}>
                                                {jogador.nome}{" "}
                                                <span className={styles.posicoes}>
                                                    ({(jogador.posicao || []).join(" / ")})
                                                </span>
                                            </strong>

                                            <div className={styles.linhaInfo}>
                                                <span>Perna: {jogador.perna}</span>

                                                <div className={styles.overallWrapper}>
                                                    <span className={styles.overallLabel}>Overall:</span>
                                                    <div className={styles.barContainer}>
                                                        <div className={styles.fill} style={{ width: `${overallPercent}%` }} />
                                                    </div>
                                                    <span className={styles.overallValue}>{overall}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.botoesEditarExcluir}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditarJogador(jogador);
                                                }}
                                                className={styles.iconeBotao}
                                                title="Editar"
                                            >
                                                <img src="/images/lapis_branco.png" alt="Editar" className={styles.iconeImagem} />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onExcluirJogador(playerKey);
                                                }}
                                                className={styles.iconeBotao}
                                                title="Excluir"
                                            >
                                                <img src="/images/lixeira_branco.png" alt="Excluir" className={styles.iconeImagem} />
                                            </button>
                                        </div>
                                    </li>

                                    <div className={`${styles.cardExtras} ${cardAberto === playerKey ? styles.show : ""}`}>
                                        <div className={styles.cardExtrasInner}>
                                            <div className={styles.chartAndTopStats}>
                                                <div className={styles.atributosStats}>
                                                    <p className={`${styles.textAtributs} ${jogador.finalizacao > 100 ? styles.atributoAlto : ""}`}><strong>FIN:</strong> {jogador.finalizacao}</p>
                                                    <p className={`${styles.textAtributs} ${jogador.qi > 100 ? styles.atributoAlto : ""}`}><strong>INT:</strong> {jogador.qi}</p>
                                                    <p className={`${styles.textAtributs} ${jogador.passes > 100 ? styles.atributoAlto : ""}`}><strong>PAS:</strong> {jogador.passes}</p>
                                                    <p className={`${styles.textAtributs} ${jogador.defesa > 100 ? styles.atributoAlto : ""}`}><strong>DEF:</strong> {jogador.defesa}</p>
                                                    <p className={`${styles.textAtributs} ${jogador.dribles > 100 ? styles.atributoAlto : ""}`}><strong>DRI:</strong> {jogador.dribles}</p>
                                                    <p className={`${styles.textAtributs} ${jogador.fisico > 100 ? styles.atributoAlto : ""}`}><strong>FIS:</strong> {jogador.fisico}</p>
                                                </div>

                                                <div className={styles.chartWrapper}>
                                                    {showRadar === playerKey && (
                                                        <div className={styles.imensuravelWrapper}>
                                                            <RadarChart width={170} height={170} outerRadius={60} data={dadosGrafico}>
                                                                <PolarGrid />
                                                                <PolarAngleAxis dataKey="habilidade" tick={{ fontSize: 13, dy: 4 }} />
                                                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                                                <Radar
                                                                    dataKey="valor"
                                                                    stroke={acimaDe100 ? "#ff0000" : "rgb(0, 65, 0)"}
                                                                    fill={acimaDe100 ? "#ff0000" : "rgb(35, 158, 35)"}
                                                                    fillOpacity={0.6}
                                                                />
                                                            </RadarChart>

                                                            {acimaDe100 && <div className={styles.textoImensuravel}>IMENSURÁVEL</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.topStats}>
                                                    <p className={styles.textStats}><strong>Jogos:</strong> {jogador.jogosJogados || 0}</p>
                                                    <p className={styles.textStats}><strong>MVPs:</strong> {jogador.mvps || 0}</p>
                                                </div>
                                            </div>

                                            <div className={styles.bottomStats}>
                                                <p className={styles.textStats}><strong>Vitórias:</strong> {jogador.vitorias} ({((jogador.vitorias / jogador.jogosJogados) * 100 || 0).toFixed(1)}%)</p>
                                                <p className={styles.textStats}><strong>Empates:</strong> {jogador.empates} ({((jogador.empates / jogador.jogosJogados) * 100 || 0).toFixed(1)}%)</p>
                                                <p className={styles.textStats}><strong>Derrotas:</strong> {jogador.derrotas} ({((jogador.derrotas / jogador.jogosJogados) * 100 || 0).toFixed(1)}%)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </ul>
                )}
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={`${styles.btn} ${styles.btnLitgh}`}>Cancelar</button>
                    <button onClick={onSalvar} className={`${styles.btn} ${styles.btnGreen}`}>Salvar</button>

                </div>
            </div>
        </div>
    );
}
