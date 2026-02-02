"use client";

import styles from "./Footer.module.css";

export default function Footer({
    leftText = "EquilibraFC • Gerenciador de jogos",
    centerText,
    rightLinks = [
        { label: "Documentação", href: "https://github.com/RafaelROliveira/esquilibra-fc" },
        { label: "Créditos", href: "https://github.com/RafaelROliveira" },
    ],
}) {
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.left}>{leftText}</div>

                <div className={styles.center}>
                    {centerText ?? `Criado por Rafael R. Olivera © ${year}`}
                </div>

                <div className={styles.right}>
                    {rightLinks.map((l) => (
                        <a
                            key={l.href + l.label}
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                        >
                            {l.label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
