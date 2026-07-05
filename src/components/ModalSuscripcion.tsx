"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellSlash, X, Check } from "@phosphor-icons/react";
import OneSignal from "react-onesignal";

export default function ModalSuscripcion() {
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const checkState = useCallback(async () => {
    const pid = OneSignal.User.PushSubscription.id;
    if (pid && OneSignal.User.PushSubscription.optedIn) {
      setPlayerId(pid);
    } else {
      setPlayerId(null);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      if (OneSignal.User?.PushSubscription) {
        clearInterval(id);
        checkState();
      }
    }, 300);
    return () => clearInterval(id);
  }, [open, checkState]);

  async function handleActivar() {
    setStatus("idle");
    try {
      const granted = await OneSignal.Notifications.requestPermission();
      if (!granted) { setStatus("error"); setMsg("Permiso denegado"); return; }
      const pid = OneSignal.User.PushSubscription.id;
      if (!pid || !OneSignal.User.PushSubscription.optedIn) { setStatus("error"); setMsg("No se pudo completar la suscripción. Intentá de nuevo."); return; }
      const res = await fetch("/api/suscriptor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "suscribir_push", player_id: pid }),
      });
      const json = await res.json();
      if (!json.ok) { setStatus("error"); setMsg(json.error); return; }
      setPlayerId(pid);
      setStatus("ok");
      setMsg("Notificaciones activadas. Recibirás los próximos comunicados.");
    } catch {
      setStatus("error");
      setMsg("Permiso denegado o error al activar");
    }
  }

  async function handleDesactivar() {
    setStatus("idle");
    try {
      if (playerId) {
        await fetch("/api/suscriptor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "baja_push", player_id: playerId }),
        });
      }
      setPlayerId(null);
      setStatus("ok");
      setMsg("Notificaciones desactivadas. Ya no recibirás comunicados.");
    } catch {
      setStatus("error");
      setMsg("Error al desactivar");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-primary shadow-[0_8px_24px_-4px_rgba(232,180,0,0.4)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(232,180,0,0.55)] active:scale-90"
        aria-label="Recibir notificaciones"
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
                  Recibí una notificación en tu navegador cada vez que se publique un nuevo comunicado oficial. Sin instalar apps, sin compartir tu número.
                </p>

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
                  {playerId ? (
                    <button onClick={handleDesactivar}
                      className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-100">
                      <BellSlash size={15} weight="bold" />
                      Desactivar
                    </button>
                  ) : (
                    <button onClick={handleActivar}
                      className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <Bell size={15} weight="fill" />
                      Activar
                    </button>
                  )}
                </div>

                {playerId && (
                  <p className="text-center text-xs text-green-600 font-semibold">
                    ✅ Notificaciones activadas
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
