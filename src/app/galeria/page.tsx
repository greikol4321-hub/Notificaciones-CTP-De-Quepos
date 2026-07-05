"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSquare } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import Lightbox from "@/components/Lightbox";

export default function GaleriaPage() {
  const [images, setImages] = useState<{ url: string; descripcion: string }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const close = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("imagenes").select("url,descripcion").eq("destino", "galeria").order("id", { ascending: true }).then(({ data }) => {
      if (data) setImages(data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ImageSquare size={22} weight="fill" className="text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">Galeria STEAM</h1>
        <p className="text-sm text-gray-500">Actividades, proyectos y momentos destacados de nuestra comunidad educativa.</p>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <ImageSquare size={48} weight="thin" />
          <p className="text-sm font-semibold text-gray-500">No hay imagenes en la Galeria</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4"
        >
          {images.map((img, i) => (
            <motion.button
              key={i}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              onClick={() => setLightbox(img.url)}
              className="mb-4 w-full cursor-pointer overflow-hidden rounded-xl shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.descripcion} className="w-full object-cover" loading="lazy" />
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {lightbox && <Lightbox src={lightbox} onClose={close} />}
      </AnimatePresence>
    </div>
  );
}
