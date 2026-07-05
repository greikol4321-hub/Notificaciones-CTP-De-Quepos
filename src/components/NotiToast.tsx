"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, WarningCircle, Info, X, Question, TrashSimple } from "@phosphor-icons/react";

interface Toast { id: number; type: "success" | "error" | "warning" | "info"; title: string; subtitle?: string }
interface Confirm { title: string; text: string; danger?: boolean; icon?: string; resolve: (v: boolean) => void }

const Ctx = createContext<{
  toast: (t: Toast["type"], title: string, subtitle?: string) => void;
  confirm: (title: string, text: string, danger?: boolean) => Promise<boolean>;
  loading: (show: boolean, text?: string) => void;
} | null>(null);

let _id = 0;

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: WarningCircle,
  info: Info,
};

const colorMap = {
  success: "border-t-primary",
  error: "border-t-red-500",
  warning: "border-t-amber-400",
  info: "border-t-blue-400",
};

const toastAnim = {
  initial: { opacity: 0, x: 80, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 80, scale: 0.95 },
};

export function NotiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [loading, setLoading] = useState<{ show: boolean; text: string }>({ show: false, text: "Procesando..." });
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: Toast["type"], title: string, subtitle?: string) => {
    const id = ++_id;
    setToasts((p) => [...p, { id, type, title, subtitle }]);
    const timer = setTimeout(() => removeToast(id), 4000);
    timers.current.set(id, timer);
  }, [removeToast]);

  const confirmFn = useCallback((title: string, text: string, danger?: boolean) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({ title, text, danger, resolve });
    });
  }, []);

  const confirmResolve = (v: boolean) => {
    confirm?.resolve(v);
    setConfirm(null);
  };

  const IconSuccess = iconMap.success;
  const IconError = iconMap.error;
  const IconWarning = iconMap.warning;
  const IconInfo = iconMap.info;

  return (
    <Ctx.Provider value={{ toast, confirm: confirmFn, loading: (show, text) => setLoading({ show, text: text || "Procesando..." }) }}>
      {children}

      <div className="pointer-events-none fixed right-3 top-3 z-[99999] flex flex-col gap-2.5 sm:right-4 sm:top-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = t.type === "success" ? IconSuccess : t.type === "error" ? IconError : t.type === "warning" ? IconWarning : IconInfo;
            return (
              <motion.div
                key={t.id}
                layout
                {...toastAnim}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border-t-[3px] bg-white px-4 py-3.5 shadow-xl shadow-black/8 max-w-[340px] min-w-[280px] sm:min-w-[300px] ${colorMap[t.type]}`}
              >
                <Icon size={20} weight="fill" className={`mt-0.5 shrink-0 ${t.type === "success" ? "text-primary" : t.type === "error" ? "text-red-500" : t.type === "warning" ? "text-amber-500" : "text-blue-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{t.title}</p>
                  {t.subtitle && <p className="mt-0.5 text-xs text-gray-500">{t.subtitle}</p>}
                </div>
                <button onClick={() => removeToast(t.id)} className="mt-0.5 cursor-pointer text-gray-300 transition-colors hover:text-gray-500">
                  <X size={14} weight="bold" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className={`h-[5px] ${confirm.danger ? "bg-red-500" : "bg-primary"}`} />
              <div className="flex items-center justify-center px-6 pb-3 pt-6">
                <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${confirm.danger ? "bg-red-50" : "bg-blue-50"}`}>
                  {confirm.danger
                    ? <TrashSimple size={32} weight="fill" className="text-red-500" />
                    : <Question size={32} weight="fill" className="text-primary" />
                  }
                </div>
              </div>
              <h3 className="px-7 text-center text-lg font-extrabold tracking-tight text-primary">{confirm.title}</h3>
              <p className="px-7 pb-6 pt-1 text-center text-sm leading-relaxed text-gray-500" dangerouslySetInnerHTML={{ __html: confirm.text }} />
              <div className="flex gap-2.5 px-5 pb-6">
                <button onClick={() => confirmResolve(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 ease-out hover:bg-gray-100 hover:text-gray-800">
                  Cancelar
                </button>
                <button onClick={() => confirmResolve(true)}
                  className={`flex-1 cursor-pointer rounded-xl border-none px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 ${confirm.danger ? "bg-red-500 shadow-red-500/30 hover:bg-red-600" : "bg-primary shadow-primary/30 hover:bg-primary/90"}`}>
                  {confirm.danger ? "Si, eliminar" : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99997] flex items-center justify-center gap-3 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-6 py-4 backdrop-blur-md"
            >
              <div className="loading-spinner h-10 w-10 rounded-full border-4 border-white/25 border-t-white" />
              <span className="text-sm font-semibold tracking-wide text-white">{loading.text}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useNoti() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useNoti must be inside NotiProvider");
  return c;
}
