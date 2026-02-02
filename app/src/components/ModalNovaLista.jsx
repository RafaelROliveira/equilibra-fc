// components/ModalNovaLista.jsx
import styles from "@/app/modal.module.css";

export default function ModalNovaLista({
    nome,
    setNome,
    onCriar,
    onFechar
}) {
    return (
        <div className={styles.modal}>
            <div className={styles['modal-conteudo']}>
                <button className={styles["fechar-x"]} onClick={onFechar}>×</button>
                <h2 className={styles.modalTit}>Criar nova lista</h2>
                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome da lista"
                    className={styles.input}
                    maxLength={26}
                />
                <div className={styles.modalActions}>
                    <button onClick={onFechar} className={`${styles.btn} ${styles.btnLitgh}`}>Cancelar</button>
                    <button onClick={onCriar} className={`${styles.btn} ${styles.btnGreen}`}>Criar</button>
                </div>
            </div>
        </div>
    );
}
