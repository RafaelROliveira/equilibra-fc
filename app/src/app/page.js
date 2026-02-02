"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./inicio.module.css";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LS_KEY = "equilibrafc:listas:v1";

export default function Home() {
  const router = useRouter();

  // ✅ Se já estiver logado, não pode ficar na página inicial
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/home"); // ou "/listas"
    }
  }, [router]);

  const [showLogin, setShowLogin] = useState(false);
  const [showCadastro, setShowCadastro] = useState(false);

  // const para entrar
  const [loginUser, setLoginUser] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // const para cadastrar
  const [cadUser, setCadUser] = useState("");
  const [cadPassword, setCadPassword] = useState("");
  const [cadConfirmPassword, setCadConfirmPassword] = useState("");
  const [cadCodVerify, setCadCodVerify] = useState("");
  const [cadError, setCadError] = useState("");
  const [cadSucesso, setCadSucesso] = useState("");

  // Funções de abrir/fechar Login
  const abrirLogin = () => setShowLogin(true);

  const fecharLogin = () => {
    setShowLogin(false);
    setLoginUser("");
    setLoginPassword("");
    setLoginError("");
  };

  // Funções de abrir/fechar Cadastro
  const abrirCadastro = () => setShowCadastro(true);

  const fecharCadastro = () => {
    setShowCadastro(false);
    setCadUser("");
    setCadPassword("");
    setCadConfirmPassword("");
    setCadCodVerify("");
    setCadError("");
  };

  const handleLogin = async () => {
    setLoginError("");

    if (!loginUser || !loginPassword) {
      setLoginError("Preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: loginUser, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.msg || "Erro ao fazer login.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.user);
      localStorage.setItem("adm", data.adm);

      // ✅ melhor que window.location.href (não recarrega tudo)
      router.replace("/home"); // ou "/listas"
    } catch (err) {
      console.error(err);
      setLoginError("Erro de conexão com o servidor.");
    }
  };

  const handleCadastro = async () => {
    setCadError("");
    setCadSucesso("");

    if (!cadUser || !cadPassword || !cadConfirmPassword || !cadCodVerify) {
      setCadError("Preencha todos os campos.");
      return;
    }

    if (cadPassword !== cadConfirmPassword) {
      setCadError("As senhas não coincidem.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: cadUser,
          password: cadPassword,
          confirmPassword: cadConfirmPassword,
          codVerify: cadCodVerify,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setCadError(data.msg || "Erro ao cadastrar.");
        return;
      }

      setCadSucesso("Cadastro realizado com sucesso!");
      setTimeout(() => setShowCadastro(false), 1500);
      toast.success("Usuário Cadastrado, faça login!");
    } catch (err) {
      console.error(err);
      setCadError("Erro de conexão com o servidor.");
      toast.error("Erro de conexão com o servidor.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.centerBox}>
        <h1 className={styles.titulo}>
          Equilibra<span className={styles.verde}>F</span>
          <span className={styles.amarelo}>C</span>
        </h1>

        <div className={styles.botoes}>
          <button className={styles.botao} onClick={abrirLogin}>
            Entrar
          </button>
          <button className={styles.botao} onClick={abrirCadastro}>
            Cadastrar
          </button>
        </div>
      </div>

      {showLogin && (
        <div className={styles.modal}>
          <div className={styles["modal-conteudo"]}>
            <button className={styles["fechar-x"]} onClick={fecharLogin}>
              ×
            </button>
            <h2 className={styles.modalTit}>Entrar</h2>

            <input
              type="text"
              placeholder="Usuário"
              className={styles.input}
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
            />

            <input
              type="password"
              placeholder="Senha"
              className={styles.input}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />

            <button className={styles.modalBtn} onClick={handleLogin}>
              Entrar
            </button>

            {loginError && (
              <div className={styles.mensagemErro}>{loginError}</div>
            )}
          </div>
        </div>
      )}

      {showCadastro && (
        <div className={styles.modal}>
          <div className={styles["modal-conteudo"]}>
            <button className={styles["fechar-x"]} onClick={fecharCadastro}>
              ×
            </button>
            <h2 className={styles.modalTit}>Cadastrar</h2>

            <input
              type="text"
              placeholder="Usuário"
              className={styles.input}
              value={cadUser}
              onChange={(e) => setCadUser(e.target.value)}
            />

            <input
              type="password"
              placeholder="Senha"
              className={styles.input}
              value={cadPassword}
              onChange={(e) => setCadPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirmar Senha"
              className={styles.input}
              value={cadConfirmPassword}
              onChange={(e) => setCadConfirmPassword(e.target.value)}
            />

            <input
              type="text"
              placeholder="Código de Acesso"
              className={styles.input}
              value={cadCodVerify}
              onChange={(e) => setCadCodVerify(e.target.value)}
            />

            <button className={styles.modalBtn} onClick={handleCadastro}>
              Cadastrar
            </button>

            {cadError && (
              <div className={styles.mensagemErro}>{cadError}</div>
            )}

            {cadSucesso && (
              <div className={styles.mensagemSucesso}>{cadSucesso}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

}
