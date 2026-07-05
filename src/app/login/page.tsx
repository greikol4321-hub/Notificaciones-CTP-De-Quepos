"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EnvelopeSimple, LockKey, Eye, EyeClosed, SignIn } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/panel-ausencias";

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
    <div className="relative -mx-6 -mt-8 flex min-h-[calc(100dvh-3.75rem)] items-center justify-center overflow-hidden px-4 py-10 sm:-mx-[22px] sm:min-h-[calc(100dvh-4.25rem)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.06]">
        <img src="/img/descarga.png" alt="" className="h-80 w-80 object-contain md:h-96 md:w-96" />
      </div>

      <motion.div
        aria-hidden="true"
        animate={{ rotate: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border-[40px] border-primary/8 md:h-[450px] md:w-[450px]"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -14, 0], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full border-[28px] border-accent/10 md:h-80 md:w-80"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-[15%] left-[12%] h-3 w-3 rounded-full bg-primary/30 md:h-4 md:w-4"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute bottom-[25%] right-[18%] h-3 w-3 rounded-full bg-accent/30 md:h-4 md:w-4"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 shadow-[0_8px_32px_-12px_rgba(15,43,75,0.1)] sm:px-10">
          <div className="mb-8 text-center">
            <img
              src="/img/descarga.png"
              alt="CTP de Quepos"
              className="mx-auto mb-4 h-16 w-16 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]"
            />
            <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/12 px-3 py-1 font-poppins text-[0.6rem] font-bold uppercase tracking-widest text-accent">
              CTP de Quepos
            </span>
            <h1 className="mt-3 font-poppins text-xl font-extrabold text-primary sm:text-2xl">
              Acceso Personal
            </h1>
            <p className="mt-1 font-outfit text-sm text-gray-400">
              Ingresá tu correo y contraseña institucional
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block font-outfit text-[0.78rem] font-semibold text-gray-500">
                Correo electrónico
              </label>
              <div className="relative">
                <EnvelopeSimple size={16} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  id="email"
                  type="email"
                  placeholder="correo@institucion.ed.cr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-surface py-3.5 pl-10 pr-4 font-outfit text-sm text-gray-800 outline-none transition-all duration-200 ease-out placeholder:text-gray-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block font-outfit text-[0.78rem] font-semibold text-gray-500">
                Contraseña
              </label>
              <div className="relative">
                <LockKey size={16} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-surface py-3.5 pl-10 pr-10 font-outfit text-sm text-gray-800 outline-none transition-all duration-200 ease-out placeholder:text-gray-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/6"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg p-1 text-gray-300 transition-colors hover:text-gray-500"
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPw ? <EyeClosed size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 px-4 py-2.5 font-outfit text-sm font-semibold text-urgent"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-primary px-6 font-poppins text-sm font-bold text-white shadow-[0_4px_14px_rgba(15,43,75,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(15,43,75,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <span className="loading-spinner inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <SignIn size={18} weight="bold" />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center font-outfit text-[0.72rem] text-gray-400">
          Colegio Técnico Profesional de Quepos &mdash; Sistema de Notificaciones
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100dvh-3.75rem)] items-center justify-center sm:min-h-[calc(100dvh-4.25rem)]">
        <span className="loading-spinner inline-block h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
