"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, ClipboardText, User, Calendar, FilePdf } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import Carousel from "@/components/Carousel";



interface Comunicado { id: number; titulo: string; contenido: string; color_borde?: string; pdf_url?: string; pdf_nombre?: string; autor?: string; creado_en: string }
interface Ausencia { id: number; nombre: string; usuario: string; razon: string; detalle?: string; fecha: string; fecha_fin?: string; horario?: string }

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [carousel, setCarousel] = useState<{ url: string; descripcion: string }[]>([]);
  const [galeriaCount, setGaleriaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("imagenes").select("url,descripcion").eq("destino", "carrusel").order("id", { ascending: true }),
      supabase.from("comunicados").select("*").order("creado_en", { ascending: false }).limit(6),
      supabase.from("imagenes").select("id", { count: "exact", head: true }).neq("destino", "carrusel"),
    ]).then(([car, com, gal]) => {
      if (car.data) setCarousel(car.data);
      if (com.data) {
        const arr = [...com.data] as Comunicado[];
        arr.sort((a, b) => {
          const aU = a.color_borde === "#e74c3c" ? 0 : 1;
          const bU = b.color_borde === "#e74c3c" ? 0 : 1;
          return aU - bU;
        });
        setComunicados(arr);
      }
      if (gal.count !== null) setGaleriaCount(gal.count);
      setLoading(false);
    });

    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
    const manana = new Date(`${hoy}T00:00:00-06:00`);
    manana.setDate(manana.getDate() + 1);

    supabase.from("ausencias").select("*").lte("fecha", manana.toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" })).gte("fecha_fin", hoy).then(({ data }) => {
      if (data) setAusencias(data as Ausencia[]);
    });
  }, []);

  const ahoraCR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const hoyCR = ahoraCR.toLocaleDateString("en-CA");
  const crH = ahoraCR.getHours() * 60 + ahoraCR.getMinutes();
  const ausentesVisibles = ausencias.filter((a) => {
    const activoHoy = a.fecha <= hoyCR && a.fecha_fin >= hoyCR;
    if (activoHoy) {
      if (a.horario === "Mañana" && crH >= 720) return false;
      if (a.horario === "Tarde" && crH >= 990) return false;
    }
    return activoHoy;
  });

  function formatearFecha(iso?: string) {
    if (!iso) return "N/A";
    const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00-06:00");
    return d.toLocaleDateString("es-CR", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function horarioEstilo(h: string) {
    return h === "Mañana"
      ? "bg-blue-100 text-blue-700"
      : h === "Tarde"
      ? "bg-amber-100 text-amber-700"
      : "bg-purple-100 text-purple-700";
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-10">
        <img src="/img/descarga.png" alt="" className="h-60 w-60 object-contain sm:h-72 sm:w-72" />
      </div>
      <motion.section variants={item} className="relative z-10 mb-14 -mx-6 -mt-8 overflow-hidden rounded-none px-6 py-14 sm:rounded-b-2xl md:py-20" style={{ background: "linear-gradient(135deg, rgba(15,43,75,0.88) 0%, rgba(21,62,107,0.92) 50%, rgba(26,77,128,0.88) 100%)" }}>
        <motion.div aria-hidden="true" animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }} className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border-[40px] border-white/8 md:h-[500px] md:w-[500px]" />
        <motion.div aria-hidden="true" animate={{ y: [0, -16, 0], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[30px] border-accent/10 md:h-96 md:w-96" />
        <motion.div aria-hidden="true" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="pointer-events-none absolute left-[15%] top-[20%] h-16 w-16 rounded-full bg-white/10 blur-sm md:h-24 md:w-24" />
        <motion.div aria-hidden="true" animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="pointer-events-none absolute right-[20%] top-[60%] h-20 w-20 rounded-full bg-accent/10 blur-sm md:h-28 md:w-28" />
        <motion.div aria-hidden="true" animate={{ x: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }} className="pointer-events-none absolute left-[30%] top-[15%] h-3 w-3 rounded-full bg-white/40 md:h-4 md:w-4" />
        <motion.div aria-hidden="true" animate={{ x: [0, -15, 0], opacity: [0.15, 0.35, 0.15] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1.5 }} className="pointer-events-none absolute right-[25%] top-[25%] h-3 w-3 rounded-full bg-accent/40 md:h-4 md:w-4" />
        <motion.div aria-hidden="true" animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="pointer-events-none absolute left-[10%] h-3 w-3 rounded-full bg-white/40 md:h-4 md:w-4" style={{ bottom: "-10%" }} />
        <motion.div aria-hidden="true" animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }} className="pointer-events-none absolute left-[50%] h-3 w-3 rounded-full bg-accent/40 md:h-4 md:w-4" style={{ bottom: "-10%" }} />
        <motion.div aria-hidden="true" animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 4 }} className="pointer-events-none absolute right-[15%] h-3 w-3 rounded-full bg-white/40 md:h-4 md:w-4" style={{ bottom: "-10%" }} />
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/12 px-3 py-1 font-poppins text-[0.68rem] font-bold uppercase tracking-widest text-accent">
            CTP de Quepos
          </span>
          <h1 className="mt-4 font-poppins text-3xl font-extrabold leading-tight tracking-tight md:text-5xl" style={{ background: "linear-gradient(135deg, #fff 40%, #C9972E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Sistema de Notificaciones
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-outfit text-sm leading-relaxed text-white/70">
            Mantente informado sobre comunicados oficiales, asistencia docente y actividades institucionales.
          </p>
          <div className="mt-8 flex justify-center gap-x-12 gap-y-4">
            <div>
              <p className="font-poppins text-2xl font-bold text-white md:text-3xl">{loading ? "—" : comunicados.length}</p>
              <p className="font-outfit text-[0.68rem] font-semibold uppercase tracking-wider text-white/55">Comunicados</p>
            </div>
            <div>
              <p className="font-poppins text-2xl font-bold text-white md:text-3xl">{loading ? "—" : ausentesVisibles.length}</p>
              <p className="font-outfit text-[0.68rem] font-semibold uppercase tracking-wider text-white/55">Ausentes Hoy</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="mb-14 grid gap-6 md:grid-cols-[1fr_2fr]">
        <a href="/galeria" className="group flex flex-col items-center justify-center rounded-2xl border-2 border-primary bg-white p-8 text-center shadow-[0_8px_24px_-8px_rgba(15,43,75,0.08)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(15,43,75,0.14)]">
          <img src="/img/steam.png" alt="STEAM" className="mb-5 h-auto w-[130px]" />
          <h3 className="mb-2 text-lg font-bold text-primary">Ingresa a STEAM</h3>
          <p className="max-w-xs text-sm leading-relaxed text-gray-500">
            Conservacion y Promocion de la Reserva Ecologica Institucional como estrategia para la Educacion Ambiental desde un enfoque STEAM.
          </p>
        </a>
        <Carousel images={carousel} />
      </motion.div>

      <motion.section variants={item} className="mb-14">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-accent">
            <Megaphone size={18} weight="fill" />
          </span>
          <h2 className="text-xl font-bold text-primary md:text-2xl">Comunicados Oficiales</h2>
          <span className="ml-auto text-xs font-medium text-gray-400">
            {loading ? "..." : `${comunicados.length} anuncio${comunicados.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : comunicados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-14 text-center">
            <Megaphone size={36} className="text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No hay anuncios institucionales recientes.</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
            {comunicados.map((c) => (
              <motion.article key={c.id} variants={item} className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.04)]">
                <div className="flex-1 p-5">
                  <h3 className="mb-2 flex items-center gap-2 text-base font-bold" style={{ color: c.color_borde || "#0F2B4B" }}>
                    {c.color_borde === "#e74c3c" && <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">Urgente</span>}
                    {c.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">{c.contenido}</p>
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
                    {formatearFecha(c.creado_en)}
                  </span>
                </div>
                </motion.article>
            ))}
          </motion.div>
        )}
      </motion.section>

      <motion.section variants={item} className="mb-14">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-support-blue">
            <ClipboardText size={18} weight="fill" />
          </span>
          <h2 className="text-xl font-bold text-primary md:text-2xl">Reporte de Asistencia Docente</h2>
          <span className="ml-auto text-xs font-medium text-gray-400">
            {loading ? "..." : `${ausentesVisibles.length} ausente${ausentesVisibles.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.04)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-left text-white/90">
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Docente</th>
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Motivo</th>
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Detalle</th>
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Horario</th>
                <th className="px-4 py-3.5 text-[0.68rem] font-semibold uppercase tracking-wider">Desde / Hasta</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-300">Cargando datos...</td></tr>
              ) : ausentesVisibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                      <ClipboardText size={20} className="text-gray-300" />
                      Todos los docentes estan presentes hoy y manana.
                    </div>
                  </td>
                </tr>
              ) : (
                ausentesVisibles.map((a) => {
                  const hClass = horarioEstilo(a.horario || "Todo el dia");
                  return (
                    <tr key={a.id} className="border-t border-gray-50 transition-colors duration-200 ease-out hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold text-gray-800">{a.nombre}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[0.72rem] font-bold text-red-600">Ausente</span>
                      </td>
                      <td className="px-4 py-3"><span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[0.72rem] font-semibold text-gray-600">{a.razon}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{a.detalle || ""}</td>
                      <td className="px-4 py-3"><span className={`inline-block rounded px-2 py-0.5 text-[0.72rem] font-bold ${hClass}`}>{a.horario || "Todo el dia"}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatearFecha(a.fecha)} al {formatearFecha(a.fecha_fin)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}
