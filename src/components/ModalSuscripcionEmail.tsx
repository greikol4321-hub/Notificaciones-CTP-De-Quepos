"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "ctpq_suscrito_email";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ModalSuscripcionEmail() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [suscritoEmail, setSuscritoEmail] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  function handleOpen() {
    setStatus("idle");
    setMsg("");
    setEmail("");
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleSuscribir(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!emailRegex.test(trimmed)) {
      setStatus("error");
      setMsg("Correo electrónico no válido");
      return;
    }
    setStatus("idle");
    const { error } = await supabase.from("suscriptores").insert({ email: trimmed });
    if (!error) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setSuscritoEmail(trimmed);
      setStatus("ok");
      setMsg(`Listo, vas a recibir los comunicados en ${trimmed}`);
    } else if (error.code === "23505") {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setSuscritoEmail(trimmed);
      setStatus("ok");
      setMsg("Este correo ya está suscrito");
    } else {
      setStatus("error");
      setMsg("Error al suscribir. Intentá de nuevo.");
    }
  }

  async function handleBaja() {
    if (!suscritoEmail) return;
    setStatus("idle");
    const { error } = await supabase.from("suscriptores").delete().eq("email", suscritoEmail);
    if (!error) {
      localStorage.removeItem(STORAGE_KEY);
      setSuscritoEmail(null);
      setStatus("ok");
      setMsg("Ya no recibirás comunicados por email");
    } else {
      setStatus("error");
      setMsg("Error al darte de baja. Intentá de nuevo.");
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-primary shadow-[0_8px_24px_-4px_rgba(232,180,0,0.4)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(232,180,0,0.55)] active:scale-90"
        aria-label="Suscribirse por email"
      >
        <Bell size={24} weight="fill" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Bell size={18} weight="fill" className="text-accent" />
                  <h3 className="text-sm font-extrabold tracking-tight text-primary">Recibir Comunicados</h3>
                </div>
                <button onClick={handleClose} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                {status === "ok" && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    <Check size={16} weight="bold" />
                    {msg}
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    <X size={16} weight="bold" />
                    {msg}
                  </div>
                )}

                {suscritoEmail ? (
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed text-gray-500">
                      Ya estás suscrito con <strong className="text-primary">{suscritoEmail}</strong>
                    </p>
                    <button onClick={handleBaja}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-100">
                      Darme de baja
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSuscribir} className="space-y-4">
                    <p className="text-xs leading-relaxed text-gray-500">
                      Dejá tu correo para recibir los comunicados oficiales apenas se publiquen.
                    </p>
                    <div className="relative">
                      <EnvelopeSimple size={15} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                    </div>
                    <button type="submit"
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <Bell size={15} weight="fill" />
                      Suscribirme
                    </button>
                  </form>
                )}

                {!suscritoEmail && status !== "ok" && (
                  <p className="text-center text-[0.65rem] text-gray-400">
                    Podés darte de baja en cualquier momento.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
