"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/app");
    } catch (err: any) {
      console.error("Login Error:", err);
      
      // Mapeamento de erros comuns do Firebase
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Email ou senha incorretos.");
          break;
        case "auth/invalid-email":
          setError("O formato do email é inválido.");
          break;
        case "auth/user-disabled":
          setError("Esta conta foi desativada.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas falhas. Tente novamente mais tarde.");
          break;
        case "auth/network-request-failed":
          setError("Erro de rede. Verifique sua conexão.");
          break;
        default:
          setError("Ocorreu um erro ao tentar entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="space-y-4 border p-6 rounded-lg shadow-sm bg-white max-w-sm w-full">
        <h1 className="text-2xl font-bold">Login</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="border p-2 w-full rounded focus:ring-2 focus:ring-black outline-none"
            placeholder="seu@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <input
            type="password"
            required
            className="border p-2 w-full rounded focus:ring-2 focus:ring-black outline-none"
            placeholder="Sua senha"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
            {error}
          </div>
        )}

        <button 
          disabled={loading}
          className="bg-black text-white w-full py-2 rounded font-medium hover:bg-zinc-800 transition-colors disabled:bg-zinc-400"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
