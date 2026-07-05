"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, CalendarBlank, Clock, Note, MagnifyingGlass,
  PencilSimple, TrashSimple,
  PaperPlaneTilt, Megaphone, Image as ImageIcon, ShieldCheck, CaretDown,
  FileText, Plus, FloppyDisk,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { NotiProvider, useNoti } from "@/components/NotiToast";

interface Ausencia {
  id: number; user_id: string; nombre: string; usuario: string;
  fecha: string; fecha_fin?: string; razon: string; horario?: string; detalle?: string;
}

interface Perfil { nombre_completo: string; usuario: string; rol: string }

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/60" />
        ))}
      </div>
      <div className="h-10 rounded-xl bg-white/60" />
      <div className="h-64 rounded-xl bg-white/60" />
    </div>
  );
}

function HistorialEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FileText size={48} weight="thin" className="mb-4" />
      <p className="text-sm font-semibold text-gray-500">No tiene ausencias registradas</p>
      <p className="mt-1 text-xs text-gray-400">Use el formulario de arriba para registrar un periodo de ausencia.</p>
    </div>
  );
}

const rowAnim = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
};

const rolesLabel: Record<string, string> = {
  admin: "Administrador",
  docente_guia_admin: "Docente Guía Admin",
  docente_guia: "Docente Guía",
  docente: "Docente",
};

const horarioEstilos: Record<string, { bg: string; color: string }> = {
  Mañana: { bg: "bg-blue-50", color: "text-blue-700" },
  Tarde: { bg: "bg-amber-50", color: "text-amber-700" },
};

function DocentesInner() {
  const router = useRouter();
  const { toast, confirm, loading } = useNoti();
  const supabase = createClient();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [historial, setHistorial] = useState<Ausencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
  const [fInicio, setFInicio] = useState("");
  const [fFin, setFFin] = useState("");
  const [razon, setRazon] = useState("");
  const [horario, setHorario] = useState("Todo el día");
  const [detalle, setDetalle] = useState("");

  const cargarHistorial = useCallback(async (userId: string) => {
    loading(true, "Cargando historial...");
    const { data } = await supabase.from("ausencias").select("*").eq("user_id", userId).order("fecha", { ascending: false });
    if (data) setHistorial(data as Ausencia[]);
    loading(false);
  }, [supabase, loading]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/login"); return; }
      setUser(u as { id: string });
      supabase.from("usuarios_perfil").select("nombre_completo, usuario, rol").eq("user_id", u.id).single().then(({ data: p, error }) => {
        setLoadingAuth(false);
        if (error || !p) { router.push("/login"); return; }
        setPerfil(p as Perfil);
        cargarHistorial(u.id);
      });
    });
  }, [router, supabase, cargarHistorial]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (fInicio < today) { toast("warning", "Fecha inválida", "No puedes registrar ausencias en fechas pasadas."); return; }
    if (fFin < fInicio) { toast("warning", "Fechas incorrectas", "La fecha final no puede ser anterior a la fecha de inicio."); return; }
    if (razon === "Otro" && !detalle.trim()) { toast("warning", "Detalle requerido", "Si eliges Otro, escribe el motivo."); return; }

    loading(true, "Guardando...");
    const datos = { user_id: user.id, usuario: perfil?.usuario, nombre: perfil?.nombre_completo, fecha: fInicio, fecha_fin: fFin, razon, horario, detalle };
    const { error } = await supabase.from("ausencias").insert(datos);
    loading(false);

    if (error) { toast("error", "Error", error.message); return; }
    toast("success", "Periodo de ausencia guardado");

    fetch("/api/notificar-ausencia", {
      method: "POST",
      body: JSON.stringify({ razon, detalle, fecha: fInicio, horario, fecha_fin: fFin }),
    }).catch(() => {});

    setFInicio(""); setFFin(""); setRazon(""); setHorario("Todo el día"); setDetalle("");
    cargarHistorial(user.id);
  }, [fInicio, fFin, razon, horario, detalle, user, perfil, toast, loading, supabase, cargarHistorial, today]);

  async function eliminar(id: number) {
    if (!user) return;
    const ok = await confirm("Eliminar ausencia", "Esta accion no se puede deshacer.", true);
    if (!ok) return;
    loading(true, "Borrando...");
    const { error } = await supabase.from("ausencias").delete().eq("id", id);
    loading(false);
    if (error) { toast("error", "Error", error.message); return; }
    toast("success", "Ausencia eliminada");
    cargarHistorial(user.id);
  }

  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ fecha: "", fecha_fin: "", razon: "", horario: "Todo el día", detalle: "" });

  function abrirEditar(a: Ausencia) {
    setEditId(a.id);
    setEditData({ fecha: a.fecha, fecha_fin: a.fecha_fin || "", razon: a.razon, horario: a.horario || "Todo el día", detalle: a.detalle || "" });
  }

  async function guardarEdicion() {
    if (!editId) return;
    if (editData.fecha < today) { toast("warning", "Fecha inválida", "No puedes registrar ausencias en fechas pasadas."); return; }
    if (editData.fecha_fin < editData.fecha) { toast("warning", "Fechas incorrectas", "La fecha final no puede ser anterior a la fecha de inicio."); return; }
    loading(true, "Guardando cambios...");
    const { error } = await supabase.from("ausencias").update(editData).eq("id", editId);
    loading(false);
    if (error) { toast("error", "Error", error.message); return; }
    toast("success", "Ausencia actualizada");
    setEditId(null);
    if (user) cargarHistorial(user.id);
  }

  const historialFiltrado = historial.filter((a) => {
    const f = busqueda.toUpperCase();
    return a.razon?.toUpperCase().includes(f) || a.detalle?.toUpperCase().includes(f) || a.fecha?.includes(f);
  });

  const esAdmin = perfil?.rol === "admin" || perfil?.rol === "docente_guia_admin";

  if (loadingAuth) {
    return (
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg bg-white/60" />
          <div className="h-6 w-56 animate-pulse rounded bg-white/60" />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <User size={18} weight="bold" className="text-primary" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-primary">
          Panel de Ausencias
        </h1>
      </div>


      {esAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-white p-5 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} weight="fill" className="text-amber-600" />
            <h3 className="text-sm font-bold text-primary">Gestion de comunicados</h3>
          </div>
          <p className="mb-4 mt-1.5 text-xs text-gray-500">
            Usted cuenta con acceso al gestor de comunicados institucionales.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/comunicados/admin")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
            >
              <Megaphone size={14} weight="bold" />
              Ir a Gestion de Comunicados
            </button>
            <button
              onClick={() => router.push("/gestion-galeria")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
            >
              <ImageIcon size={14} weight="bold" />
              Gesti&oacute;n de Galer&iacute;a
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm md:grid-cols-4">
        <div className="bg-white p-5 md:col-span-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Nombre completo</p>
          <div className="mt-1 flex items-center gap-2">
            <User size={16} weight="fill" className="text-primary/40" />
            <p className="font-semibold text-gray-900">{perfil?.nombre_completo || "—"}</p>
          </div>
        </div>
        <div className="bg-white p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Usuario</p>
          <p className="mt-1 font-semibold text-gray-900">{perfil?.usuario || "—"}</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Perfil</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="inline-block rounded-md bg-primary/8 px-2.5 py-1 text-[0.72rem] font-bold text-primary">
              {rolesLabel[perfil?.rol || ""] || perfil?.rol || "—"}
            </span>

          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Plus size={14} weight="bold" className="text-primary" />
          </div>
          <h2 className="text-sm font-extrabold tracking-tight text-primary">Registrar Nueva Ausencia</h2>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                <CalendarBlank size={13} weight="bold" />
                Fecha de inicio
              </label>
              <input type="date" value={fInicio} onChange={(e) => setFInicio(e.target.value)} required min={today}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                <CalendarBlank size={13} weight="bold" />
                Fecha de finalizacion
              </label>
              <input type="date" value={fFin} onChange={(e) => setFFin(e.target.value)} required min={fInicio || today}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
            </div>
          </div>
          <div className="mb-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                <Note size={13} weight="bold" />
                Motivo
              </label>
              <div className="relative">
                <select value={razon} onChange={(e) => setRazon(e.target.value)} required
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8">
                  <option value="">-- Seleccionar motivo --</option>
                  <option value="Enfermedad">Enfermedad / Incapacidad</option>
                  <option value="Permiso">Permiso Personal</option>
                  <option value="Capacitacion">Capacitacion MEP</option>
                  <option value="Cita Medica">Cita Medica</option>
                  <option value="Otro">Otro Motivo</option>
                </select>
                <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                <Clock size={13} weight="bold" />
                Horario
              </label>
              <div className="relative">
                <select value={horario} onChange={(e) => setHorario(e.target.value)} required
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8">
                  <option value="Todo el dia">Todo el dia</option>
                  <option value="Manana">Manana (7:00 - 12:00)</option>
                  <option value="Tarde">Tarde (12:00 - 16:30)</option>
                </select>
                <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="mb-5">
            <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
              <Note size={13} weight="bold" />
              Detalle breve
            </label>
            <input type="text" value={detalle} onChange={(e) => setDetalle(e.target.value)}
              placeholder="Ej: Cita en la Caja"
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
          </div>
          <button type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-support-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]">
            <PaperPlaneTilt size={15} weight="bold" />
            Registrar Periodo de Ausencia
          </button>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <FileText size={14} weight="bold" className="text-primary" />
            </div>
            <h2 className="text-sm font-extrabold tracking-tight text-primary">Mi Historial Reciente</h2>
          </div>
          <span className="hidden rounded-md bg-gray-100 px-2.5 py-1 text-[0.65rem] font-bold text-gray-500 md:inline-block">
            {historial.length} registro{historial.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="relative mb-4">
          <MagnifyingGlass size={15} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por motivo, detalle o fecha..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3.5 text-sm shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
        </div>

        {historialFiltrado.length === 0 ? (
          historial.length === 0 ? <HistorialEmpty /> : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MagnifyingGlass size={40} weight="thin" className="mb-4" />
              <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
              <p className="mt-1 text-xs text-gray-400">Intente con otros terminos de busqueda.</p>
            </div>
          )
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-left text-[0.68rem] font-bold uppercase tracking-wider text-white/90">
                    <th className="px-4 py-3.5 pl-5">
                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={13} weight="bold" />
                        Desde
                      </div>
                    </th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={13} weight="bold" />
                        Hasta
                      </div>
                    </th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Note size={13} weight="bold" />
                        Motivo y Detalle
                      </div>
                    </th>
                    <th className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} weight="bold" />
                        Horario
                      </div>
                    </th>
                    <th className="px-4 py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PencilSimple size={13} weight="bold" />
                        Accion
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {historialFiltrado.map((a) => {
                      const hEst = horarioEstilos[a.horario || ""] || { bg: "bg-purple-50", color: "text-purple-700" };
                      return (
                        <motion.tr
                          key={a.id}
                          initial={rowAnim.initial}
                          animate={rowAnim.animate}
                          exit={rowAnim.exit}
                          layout
                          className="border-t border-gray-100 transition-colors hover:bg-gray-50/80"
                        >
                          <td className="px-4 py-3.5 pl-5 font-semibold text-gray-800">{a.fecha}</td>
                          <td className="px-4 py-3.5 font-semibold text-gray-800">{a.fecha_fin || "—"}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[0.68rem] font-semibold text-gray-700">{a.razon}</span>
                            <div className="mt-1 text-[0.72rem] text-gray-500">{a.detalle || "Sin detalle adicional"}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block rounded-md px-2.5 py-1 text-[0.68rem] font-bold ${hEst.bg} ${hEst.color}`}>
                              {a.horario || "Todo el dia"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => abrirEditar(a)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-[0.68rem] font-bold text-blue-600 transition-all hover:bg-blue-100 active:scale-[0.95]"
                              >
                                <PencilSimple size={12} weight="bold" />
                                Editar
                              </button>
                              <button
                                onClick={() => eliminar(a.id)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[0.68rem] font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.95]"
                              >
                                <TrashSimple size={12} weight="bold" />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 p-3 md:hidden">
              {historialFiltrado.map((a) => {
                const hEst = horarioEstilos[a.horario || ""] || { bg: "bg-purple-50", color: "text-purple-700" };
                return (
                  <div key={a.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <CalendarBlank size={13} weight="bold" className="text-gray-400" />
                        {a.fecha}{a.fecha_fin ? ` — ${a.fecha_fin}` : ""}
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.6rem] font-bold ${hEst.bg} ${hEst.color}`}>
                        {a.horario || "Todo el dia"}
                      </span>
                    </div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Note size={12} weight="bold" className="text-gray-400" />
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold text-gray-700">{a.razon}</span>
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-gray-500">{a.detalle || "Sin detalle adicional"}</p>
                    <div className="flex gap-2 border-t border-gray-50 pt-2.5">
                      <button onClick={() => abrirEditar(a)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-[0.65rem] font-bold text-blue-600 transition-all hover:bg-blue-100 active:scale-[0.95]">
                        <PencilSimple size={12} weight="bold" />
                        Editar
                      </button>
                      <button onClick={() => eliminar(a.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[0.65rem] font-bold text-red-600 transition-all hover:bg-red-100 active:scale-[0.95]">
                        <TrashSimple size={12} weight="bold" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editId && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setEditId(null)}
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                <PencilSimple size={18} weight="bold" className="text-primary" />
                <h3 className="text-sm font-extrabold tracking-tight text-primary">Editar Ausencia</h3>
              </div>
              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                      <CalendarBlank size={12} weight="bold" />
                      Fecha de inicio
                    </label>
                    <input type="date" value={editData.fecha}
                      onChange={(e) => setEditData({ ...editData, fecha: e.target.value })} min={today}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                      <CalendarBlank size={12} weight="bold" />
                      Fecha de finalizacion
                    </label>
                    <input type="date" value={editData.fecha_fin}
                      onChange={(e) => setEditData({ ...editData, fecha_fin: e.target.value })} min={editData.fecha || today}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                      <Note size={12} weight="bold" />
                      Motivo
                    </label>
                    <div className="relative">
                      <select value={editData.razon}
                        onChange={(e) => setEditData({ ...editData, razon: e.target.value })}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8">
                        <option value="Enfermedad">Enfermedad / Incapacidad</option>
                        <option value="Permiso">Permiso Personal</option>
                        <option value="Capacitacion">Capacitacion MEP</option>
                        <option value="Cita Medica">Cita Medica</option>
                        <option value="Otro">Otro Motivo</option>
                      </select>
                      <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                      <Clock size={12} weight="bold" />
                      Horario
                    </label>
                    <div className="relative">
                      <select value={editData.horario}
                        onChange={(e) => setEditData({ ...editData, horario: e.target.value })}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8">
                        <option value="Todo el dia">Todo el dia</option>
                        <option value="Manana">Manana (7:00 - 12:00)</option>
                        <option value="Tarde">Tarde (12:00 - 16:30)</option>
                      </select>
                      <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                    <Note size={12} weight="bold" />
                    Detalle
                  </label>
                  <input type="text" value={editData.detalle}
                    onChange={(e) => setEditData({ ...editData, detalle: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                </div>
              </div>
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
                <button onClick={() => setEditId(null)}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100 active:scale-[0.97]">
                  Cancelar
                </button>
                <button onClick={guardarEdicion}
                  className="flex-1 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]">
                  <span className="inline-flex items-center gap-1.5">
                    <FloppyDisk size={15} weight="bold" />
                    Guardar Cambios
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocentesPage() {
  return (
    <NotiProvider>
      <DocentesInner />
    </NotiProvider>
  );
}
