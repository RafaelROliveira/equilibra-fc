"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // redireciona para tela inicial (login)
    }
  }, []);

  return <>{children}</>;
}
