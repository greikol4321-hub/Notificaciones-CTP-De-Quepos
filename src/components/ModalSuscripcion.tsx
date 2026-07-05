"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellSlash, X, Check } from "@phosphor-icons/react";

export default function ModalSuscripcion() {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubscribe() {
    setStatus("idle");
    const res = await fetch("/api/suscriptor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "suscribir", telefono, nombre }),
    });
    const json = await res.json();
    if (json.ok) {
      setStatus("ok");
      setMsg("Suscripción activada. Recibirás los próximos comunicados.");
    } else {
      setStatus("error");
      setMsg(json.error || "Error al suscribir");
    }
  }

  async function handleUnsubscribe() {
    setStatus("idle");
    const res = await fetch("/api/suscriptor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "baja", telefono }),
    });
    const json = await res.json();
    if (json.ok) {
      setStatus("ok");
      setMsg("Suscripción cancelada. Ya no recibirás notificaciones.");
    } else {
      setStatus("error");
      setMsg(json.error || "Error al cancelar");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-primary shadow-[0_8px_24px_-4px_rgba(232,180,0,0.4)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(232,180,0,0.55)] active:scale-90"
        aria-label="Recibir notificaciones"
      >
        <Bell size={24} weight="fill" className="group-hover:animate-wiggle" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
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
                  <h3 className="text-sm font-extrabold tracking-tight text-primary">Recibir Notificaciones</h3>
                </div>
                <button onClick={() => setOpen(false)} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <p className="text-xs leading-relaxed text-gray-500">
                  Recibí un mensaje por WhatsApp cada vez que se publique un nuevo comunicado oficial.
                </p>

                <div>
                  <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Nombre</label>
                  <input
                    type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Teléfono (WhatsApp)</label>
                  <input
                    type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+506 8888 8888"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8"
                  />
                </div>

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

                <div className="flex gap-3">
                  <button
                    onClick={handleSubscribe}
                    disabled={!nombre || !telefono}
                    className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <Bell size={15} weight="fill" />
                    Activar
                  </button>
                  <button
                    onClick={handleUnsubscribe}
                    disabled={!telefono}
                    className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-600 transition-all hover:-translate-y-0.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <BellSlash size={15} weight="bold" />
                    Desactivar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
