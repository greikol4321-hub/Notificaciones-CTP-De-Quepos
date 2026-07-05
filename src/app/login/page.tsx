"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("password");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/docentes";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "magic") {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSent(true);
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    window.location.href = redirect;
  }

  if (sent) {
    return (
      <div className="mx-auto mt-20 max-w-md text-center">
        <h1 className="text-2xl font-bold text-primary">Revisa tu correo</h1>
        <p className="mt-4 text-gray-600">
          Te enviamos un enlace magico a <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="mx-auto mt-20 max-w-md"
    >
      <h1 className="text-2xl font-bold text-primary">Iniciar sesion</h1>
      <p className="mb-6 mt-2 text-gray-600">
        {mode === "password" ? "Ingresa tu correo y contrasena." : "Ingresa tu correo para recibir un enlace magico."}
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="correo@institucion.ed.cr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-[#d4ccc0] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
        />

        {mode === "password" && (
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[#d4ccc0] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
          />
        )}

        {error && (
          <p className="text-sm font-semibold text-urgent">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-support-blue px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Entrando..." : mode === "password" ? "Entrar" : "Enviar enlace magico"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "password" ? "magic" : "password"); setError(""); }}
        className="mt-4 w-full cursor-pointer text-center text-xs font-semibold text-gray-500 underline underline-offset-2 transition-colors duration-200 ease-out hover:text-primary"
      >
        {mode === "password" ? "Usar enlace magico por correo" : "Usar contrasena"}
      </button>
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
