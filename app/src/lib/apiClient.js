const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // tenta ler json sempre
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.msg || "Erro na requisição";
    throw new Error(msg);
  }

  return data;
}
