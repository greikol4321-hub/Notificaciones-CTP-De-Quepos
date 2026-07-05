"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSquare } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import Lightbox from "@/components/Lightbox";

export default function GaleriaPage() {
  const [images, setImages] = useState<{ url: string; descripcion: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("imagenes").select("url,descripcion").eq("destino", "galeria").order("id", { ascending: true }).then(({ data }) => {
      if (data) setImages(data);
      setLoading(false);
    });
  }, []);

  const lightboxIdx = lightbox ? images.findIndex((i) => i.url === lightbox) : -1;

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

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-100" style={{ aspectRatio: "1" }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-gray-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ImageSquare size={28} weight="thin" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No hay im&aacute;genes en la Galer&iacute;a</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {images.map((img) => (
            <motion.button
              key={img.url}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              onClick={() => setLightbox(img.url)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
              style={{ aspectRatio: "1" }}
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
            onPrev={lightboxIdx > 0 ? () => setLightbox(images[lightboxIdx - 1].url) : undefined}
            onNext={lightboxIdx < images.length - 1 ? () => setLightbox(images[lightboxIdx + 1].url) : undefined}
            index={lightboxIdx + 1}
            total={images.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
