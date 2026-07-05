"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, SignOut, List, X, SignIn } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const inPanel = pathname.startsWith("/panel-ausencias");
  const inLogin = pathname === "/login";
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u as { id: string; email?: string } | null);
    });
  }, []);

  function handleLogoutClick() {
    setShowLogoutModal(true);
    setMenuOpen(false);
  }

  async function handleLogoutConfirm() {
    setLoggingOut(true);
    setShowLogoutModal(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    router.push("/");
  }

  return (
    <header className="relative border-b-[3px] border-accent bg-primary text-white shadow-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2 min-h-14 sm:px-[22px] sm:py-2.5 sm:min-h-16">
        <div className="flex items-center gap-3 min-w-0 sm:gap-[14px]">
          <img
            src="/img/letras-blancas.png"
            alt="MEP Costa Rica"
            className="h-9 w-auto object-contain sm:h-[50px]"
          />
          <div className="hidden h-[38px] w-px flex-shrink-0 self-center bg-white/20 sm:block" />
          <div className="hidden min-w-0 text-left text-[0.64rem] font-semibold uppercase leading-tight tracking-[0.4px] text-white/88 sm:block">
            <strong className="font-bold text-white">Dirección Regional de Educación Central del Pacífico</strong>
            <br />
            <strong className="font-bold text-white">Circuito 05</strong>
            <br />
            <strong className="font-bold text-white">Colegio Técnico Profesional de Quepos</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-[14px]">
          <Link href="/" className="flex items-center no-underline">
            <img
              src="/img/descarga.png"
              alt="Escudo CTP Quepos"
              className="block h-12 w-12 flex-shrink-0 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)] sm:h-20 sm:w-20"
            />
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:hidden">
            {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            {!user && !inLogin ? (
              <Link href="/login"
                className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200] hover:text-primary hover:shadow-[0_4px_12px_rgba(232,180,0,0.3)]">
                Acceso Personal
              </Link>
            ) : user ? (
              <>
                {!inPanel && (
                  <Link href="/panel-ausencias"
                    className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200] hover:shadow-[0_4px_12px_rgba(232,180,0,0.3)]">
                    <User size={14} weight="bold" />
                    Volver al Panel
                  </Link>
                )}
                <button onClick={handleLogoutClick} disabled={loggingOut}
                  className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-white/8 px-3.5 py-2 text-[0.68rem] font-bold text-white/80 no-underline transition-all duration-200 ease-out hover:bg-white/15 hover:text-white">
                  <SignOut size={13} weight="bold" />
                  {loggingOut ? "Saliendo..." : "Salir"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 flex flex-col gap-2 border-t border-white/10 bg-primary px-4 pb-4 pt-3 shadow-lg sm:hidden">
          {!user && !inLogin ? (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200]">
              Acceso Personal
            </Link>
          ) : user ? (
            <div className="flex flex-col gap-2">
              {!inPanel && (
                <Link href="/panel-ausencias" onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200]">
                  <User size={14} weight="bold" />
                  Volver al Panel
                </Link>
              )}
              <button onClick={handleLogoutClick} disabled={loggingOut}
                className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-white/8 px-3.5 py-2 text-[0.72rem] font-bold text-white/80 no-underline transition-all duration-200 ease-out hover:bg-white/15 hover:text-white">
                <SignOut size={13} weight="bold" />
                {loggingOut ? "Saliendo..." : "Salir"}
              </button>
            </div>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", stiffness: 250, damping: 22 }} className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center px-8 pb-4 pt-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <SignIn size={26} weight="bold" className="text-red-500" />
                </div>
                <h2 className="mb-1.5 text-lg font-extrabold tracking-tight text-primary">Cerrar sesión</h2>
                <p className="max-w-[260px] text-sm leading-relaxed text-gray-500">¿Estás seguro de que deseas salir del sistema?</p>
              </div>
              <div className="flex gap-2.5 border-t border-gray-100 px-8 py-4">
                <button onClick={() => setShowLogoutModal(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.97]">
                  Cancelar
                </button>
                <button onClick={handleLogoutConfirm}
                  className="flex-1 cursor-pointer rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(239,68,68,0.35)] transition-all hover:shadow-[0_6px_20px_rgba(239,68,68,0.45)] active:scale-[0.97]">
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
