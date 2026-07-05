"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/docentes";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    window.location.href = redirect;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="mx-auto mt-20 max-w-md"
    >
      <h1 className="text-2xl font-bold text-primary">Iniciar sesion</h1>
      <p className="mb-6 mt-2 text-gray-600">Ingresa tu correo y contrasena.</p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="correo@institucion.ed.cr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-[#d4ccc0] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
        />

        <input
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-[#d4ccc0] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
        />

        {error && (
          <p className="text-sm font-semibold text-urgent">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-support-blue px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-20 max-w-md text-center text-gray-500">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
