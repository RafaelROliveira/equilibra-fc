"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "@/app/globals.css";
import styles from "@/app/navbar.module.css";

export default function NavBar() {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [logado, setLogado] = useState(false);

  // ✅ só depois que montar no client
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ sempre que mudar de rota, recalcula login
  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem("token");
    setLogado(!!token);
  }, [mounted, pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adm");
    window.location.href = "/";
  }

  // ✅ evita mismatch: no SSR e no 1º render do client, não mostra nada
  if (!mounted) return null;

  // ✅ não mostrar na tela inicial
  if (pathname === "/") return null;

  if (!logado) return null;

  const isActive = (href) => pathname === href;

  return (
    <nav className={styles.navbar}>
      {/* DESKTOP (1 linha) */}
      <div className={styles["navbar-left"]}>
        <Link href="/home" className={`${styles.logo} ${styles.textNav}`}>
          Equilibra<span className={styles.verde}>F</span>
          <span className={styles.amarelo}>C</span>
        </Link>
      </div>

      <div className={styles["navbar-center"]}>
        <Link
          href="/historico"
          className={`${styles["nav-item"]} ${isActive("/historico") ? styles.active : ""
            }`}
        >
          <img
            src="/images/historico_branco.png"
            alt="Histórico"
            className={styles["nav-icon"]}
          />
          <span className={styles.textNav}>Histórico</span>
        </Link>

        <Link
          href="/home"
          className={`${styles["nav-item"]} ${isActive("/home") ? styles.active : ""}`}
        >
          <img
            src="/images/jogo_branco.png"
            alt="Jogos"
            className={styles["nav-icon"]}
          />
          <span className={styles.textNav}>Jogos</span>
        </Link>

        <Link
          href="/listas"
          className={`${styles["nav-item"]} ${isActive("/listas") ? styles.active : ""
            }`}
        >
          <img
            src="/images/jogadores_branco.png"
            alt="Listas"
            className={styles["nav-icon"]}
          />
          <span className={styles.textNav}>Listas</span>
        </Link>
      </div>

      <div className={styles["navbar-right"]}>
        <button onClick={handleLogout} className={styles.navLogout}>
          <Image
            src="/images/sairB.png"
            alt="Sair"
            className={styles["logout-img"]}
            width={25}
            height={25}
          />
          <span className={styles.textNav}>Sair</span>
        </button>
      </div>

      {/* MOBILE (hub) */}
      <div className={styles.navTop}>
        <Link href="/home" className={`${styles.logo} ${styles.textNav}`}>
          Equilibra<span className={styles.verde}>F</span>
          <span className={styles.amarelo}>C</span>
        </Link>

        <button onClick={handleLogout} className={styles.navLogout}>
          <Image
            src="/images/sairB.png"
            alt="Sair"
            className={styles["logout-img"]}
            width={25}
            height={25}
          />
          <span className={styles.textNav}>Sair</span>
        </button>
      </div>

      <div className={styles.navBottom}>
        <div className={styles["navbar-center"]}>
          <Link
            href="/historico"
            className={`${styles["nav-item"]} ${isActive("/historico") ? styles.active : ""
              }`}
          >
            <img
              src="/images/historico_branco.png"
              alt="Histórico"
              className={styles["nav-icon"]}
            />
            <span className={styles.textNav}>Histórico</span>
          </Link>

          <Link
            href="/home"
            className={`${styles["nav-item"]} ${isActive("/home") ? styles.active : ""}`}
          >
            <img
              src="/images/jogo_branco.png"
              alt="Jogos"
              className={styles["nav-icon"]}
            />
            <span className={styles.textNav}>Jogos</span>
          </Link>

          <Link
            href="/listas"
            className={`${styles["nav-item"]} ${isActive("/listas") ? styles.active : ""
              }`}
          >
            <img
              src="/images/jogadores_branco.png"
              alt="Listas"
              className={styles["nav-icon"]}
            />
            <span className={styles.textNav}>Jogadores</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
