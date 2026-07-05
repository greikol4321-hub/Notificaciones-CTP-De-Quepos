"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, FilePdf, User, Calendar } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { NotiProvider } from "@/components/NotiToast";

interface Comunicado {
  id: number; titulo: string; contenido: string; pdf_url?: string;
  pdf_nombre?: string; autor?: string; color_borde?: string; creado_en: string;
}

function ComunicadosInner() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("comunicados").select("*").order("creado_en", { ascending: false }).then(({ data }) => {
      if (data) {
        const arr = data as Comunicado[];
        arr.sort((a, b) => {
          const aU = a.color_borde === "#e74c3c" ? 0 : 1;
          const bU = b.color_borde === "#e74c3c" ? 0 : 1;
          return aU - bU;
        });
        setComunicados(arr);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Megaphone size={22} weight="fill" className="text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">Comunicados</h1>
        <p className="text-sm text-gray-500">Comunicados oficiales y anuncios institucionales.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : comunicados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <Megaphone size={48} weight="thin" />
          <p className="text-sm font-semibold text-gray-500">No hay comunicados disponibles</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {comunicados.map((c) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.04)]"
            >
              <div className="flex-1 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-base font-bold" style={{ color: c.color_borde || "#0F2B4B" }}>
                  {c.color_borde === "#e74c3c" && <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">Urgente</span>}
                  <span className="break-words">{c.titulo}</span>
                </h3>
                <p className="break-words text-sm leading-relaxed text-gray-500">{c.contenido}</p>
                {c.pdf_url && (
                  <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.72rem] font-bold text-amber-700 no-underline transition-colors duration-200 ease-out hover:bg-amber-100">
                    <FilePdf size={14} weight="bold" />
                    {c.pdf_nombre || "Documento"}
                  </a>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 px-5 py-2.5 text-[0.72rem] text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <User size={13} />
                  {c.autor || "DIRECCION"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(c.creado_en).toLocaleDateString("es-CR")}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComunicadosPage() {
  return (
    <NotiProvider>
      <ComunicadosInner />
    </NotiProvider>
  );
}
