// components/ModalExcluirConfirm.jsx
import styles from "@/app/modal.module.css";

export default function ModalExcluirConfirm({ titulo, texto, texto2, onConfirmar, onCancelar }) {

    return (
        <div className={styles.modal}>
            <div className={styles['modal-conteudo']}>
                <h2 className={styles.modalTit}>{titulo}</h2>
                {/* <div className={styles.modalTextos}>
                    <p className={styles.modalText}>{texto}</p>
                    <p className={styles.modalText2}>Jogadores: {texto2}</p>
                </div> */}
                <div className={styles.modalActions}>
                    <button onClick={onCancelar} className={`${styles.btn} ${styles.btnLigth}`}>Cancelar</button>
                    <button onClick={onConfirmar} className={`${styles.btn} ${styles.btnGreen}`}>Confirmar</button>

                </div>
            </div>
        </div>
    );
}
