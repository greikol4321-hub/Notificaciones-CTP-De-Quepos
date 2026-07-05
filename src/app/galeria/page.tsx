"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSquare, MagnifyingGlass, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import Lightbox from "@/components/Lightbox";

const ALL = "todas";

const categorias = [
  { id: ALL, label: "Todas" },
  { id: "actividades", label: "Actividades" },
  { id: "eventos", label: "Eventos" },
  { id: "proyectos", label: "Proyectos" },
];

export default function GaleriaPage() {
  const [images, setImages] = useState<{ url: string; descripcion: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(ALL);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("imagenes").select("url,descripcion").eq("destino", "galeria").order("id", { ascending: true }).then(({ data }) => {
      if (data) setImages(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let r = images;
    if (cat !== ALL) r = r.filter((i) => i.descripcion.toLowerCase().includes(cat));
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((i) => i.descripcion.toLowerCase().includes(q));
    }
    return r;
  }, [images, cat, search]);

  const lightboxIdx = useMemo(() => lightbox ? filtered.findIndex((i) => i.url === lightbox) : -1, [lightbox, filtered]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#1a5276] to-[#0e3a5a] px-6 py-14 text-center shadow-xl sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
            <ImageSquare size={26} weight="fill" className="text-accent" />
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">Galer&iacute;a STEAM</h1>
          <p className="mx-auto max-w-[500px] text-sm leading-relaxed text-white/70 md:text-base">
            Actividades, proyectos y momentos destacados de nuestra comunidad educativa.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ease-out active:scale-95 ${
                cat === c.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              }`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <MagnifyingGlass size={14} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/10 sm:w-52" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`animate-pulse rounded-2xl bg-gray-100 ${i % 5 === 0 ? "row-span-2" : ""}`} style={{ aspectRatio: i % 3 === 0 ? "3/4" : "4/3" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-gray-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ImageSquare size={28} weight="thin" />
          </div>
          <p className="text-sm font-semibold text-gray-500">
            {search ? "No hay resultados para esa b&uacute;squeda." : "No hay im&aacute;genes en la Galer&iacute;a"}
          </p>
          {search && (
            <button onClick={() => { setSearch(""); setCat(ALL); }}
              className="cursor-pointer rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {filtered.map((img, i) => (
            <motion.button
              key={img.url}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              onClick={() => setLightbox(img.url)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${
                i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""
              } ${i % 7 === 0 ? "sm:col-span-2" : ""} ${i % 5 === 0 ? "sm:row-span-2" : ""}`}
              style={{ aspectRatio: i === 0 ? "auto" : i % 3 === 0 ? "3/4" : "4/3" }}
            >
              <img src={img.url} alt={img.descripcion} className="h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105" loading="lazy" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
                <p className="truncate text-xs font-semibold text-white drop-shadow-md">{img.descripcion.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "").replace(/[-_]/g, " ")}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {lightbox && lightboxIdx >= 0 && (
          <Lightbox
            src={lightbox}
            onClose={close}
            onPrev={lightboxIdx > 0 ? () => setLightbox(filtered[lightboxIdx - 1].url) : undefined}
            onNext={lightboxIdx < filtered.length - 1 ? () => setLightbox(filtered[lightboxIdx + 1].url) : undefined}
            index={lightboxIdx + 1}
            total={filtered.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
