"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, SignOut, List, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const inPanel = pathname.startsWith("/docentes");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u as { id: string; email?: string } | null);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    setMenuOpen(false);
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
            {!user ? (
              <Link href="/login"
                className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200] hover:text-primary hover:shadow-[0_4px_12px_rgba(232,180,0,0.3)]">
                Acceso Personal
              </Link>
            ) : (
              <>
                {!inPanel && (
                  <Link href="/docentes"
                    className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200] hover:shadow-[0_4px_12px_rgba(232,180,0,0.3)]">
                    <User size={14} weight="bold" />
                    Volver al Panel
                  </Link>
                )}
                <button onClick={handleLogout} disabled={loggingOut}
                  className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-white/8 px-3.5 py-2 text-[0.68rem] font-bold text-white/80 no-underline transition-all duration-200 ease-out hover:bg-white/15 hover:text-white">
                  <SignOut size={13} weight="bold" />
                  {loggingOut ? "Saliendo..." : "Salir"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 flex flex-col gap-3 border-t border-white/10 bg-primary px-4 pb-4 pt-3 shadow-lg sm:hidden">
          <div className="text-[0.64rem] font-semibold uppercase leading-tight tracking-[0.4px] text-white/88">
            <strong className="font-bold text-white">Dirección Regional de Educación Central del Pacífico</strong>
            <br />
            <strong className="font-bold text-white">Circuito 05</strong>
            <br />
            <strong className="font-bold text-white">Colegio Técnico Profesional de Quepos</strong>
          </div>
          {!user ? (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200]">
              Acceso Personal
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              {!inPanel && (
                <Link href="/docentes" onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.4px] text-primary no-underline transition-all duration-200 ease-out hover:bg-[#f0c200]">
                  <User size={14} weight="bold" />
                  Volver al Panel
                </Link>
              )}
              <button onClick={handleLogout} disabled={loggingOut}
                className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-white/8 px-3.5 py-2 text-[0.72rem] font-bold text-white/80 no-underline transition-all duration-200 ease-out hover:bg-white/15 hover:text-white">
                <SignOut size={13} weight="bold" />
                {loggingOut ? "Saliendo..." : "Salir"}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
