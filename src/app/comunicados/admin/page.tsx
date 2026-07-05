"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Bell, Note, FilePdf, PencilSimple,
  TrashSimple, FloppyDisk, X, Calendar, User, MagnifyingGlass,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { NotiProvider, useNoti } from "@/components/NotiToast";

const BUCKET = "comunicados-pdf";

interface Comunicado {
  id: number; titulo: string; contenido: string; color_borde?: string;
  pdf_url?: string; pdf_nombre?: string; autor?: string; creado_en: string;
}

const colores = [
  { value: "#27ae60", label: "Informativo (Verde)" },
  { value: "#3498db", label: "General (Azul)" },
  { value: "#f39c12", label: "Importante (Naranja)" },
  { value: "#e74c3c", label: "Urgente (Rojo)" },
];

function ComAdminInner() {
  const router = useRouter();
  const { toast, confirm, loading } = useNoti();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [color, setColor] = useState("#27ae60");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [notificarEmail, setNotificarEmail] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editContenido, setEditContenido] = useState("");
  const [editColor, setEditColor] = useState("#27ae60");
  const [editPdfUrl, setEditPdfUrl] = useState("");
  const [editPdfNombre, setEditPdfNombre] = useState("");
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editQuitarPdf, setEditQuitarPdf] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push("/login"); return; }
      const { data: perfil } = await supabase.from("usuarios_perfil").select("rol, nombre_completo, usuario").eq("user_id", u.id).single();
      if (!perfil || !["admin", "docente_guia_admin"].includes((perfil as { rol: string }).rol)) {
        router.push("/panel-ausencias"); return;
      }
      setUser({ id: u.id, name: (perfil as { nombre_completo: string; usuario: string }).nombre_completo || (perfil as { usuario: string }).usuario || u.email || "Admin" });
      const { data } = await supabase.from("comunicados").select("*").order("creado_en", { ascending: false });
      if (data) setComunicados(data as Comunicado[]);
    }
    init();
  }, [router, supabase]);

  const refetch = useCallback(async () => {
    const { data } = await supabase.from("comunicados").select("*").order("creado_en", { ascending: false });
    if (data) setComunicados(data as Comunicado[]);
  }, [supabase]);

  function normalizarNombre(n: string) {
    return n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "adjunto.pdf";
  }

  const subirPdf = useCallback(async (file: File) => {
    const ruta = `comunicados/${Date.now()}-${normalizarNombre(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
    return { pdf_url: pub.publicUrl, pdf_nombre: file.name.replace(/\.pdf$/i, "").trim() || "Documento" };
  }, [supabase]);

  const eliminarPdf = useCallback(async (url: string) => {
    const prefix = supabase.storage.from(BUCKET).getPublicUrl("").data.publicUrl;
    const ruta = url.replace(prefix, "");
    if (!ruta) return;
    await supabase.storage.from(BUCKET).remove([ruta]);
  }, [supabase]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    loading(true, "Publicando comunicado...");
    let pdfData: { pdf_url?: string; pdf_nombre?: string } = {};
    try {
      if (pdfFile) pdfData = await subirPdf(pdfFile);
      const { error } = await supabase.from("comunicados").insert({
        titulo, contenido, color_borde: color, autor: user?.name, ...pdfData,
      });
      if (error) throw error;
      toast("success", "Comunicado publicado", "Visible para todos los usuarios");
      if (notificarEmail) {
        fetch("/api/notificar-comunicado-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo, contenido, color_borde: color }),
        }).then((r) => r.json()).then((j) => {
          if (j.ok) {
            if (j.enviados > 0) toast("success", `Correo enviado a ${j.enviados} de ${j.total} suscriptores`);
            else toast("warning", "Sin correos", j.total === 0 ? "No hay suscriptores registrados" : "No se pudo enviar a ningún suscriptor");
          } else toast("error", "Error al enviar correos", j.error);
        });
      }
      setTitulo(""); setContenido(""); setColor("#27ae60"); setPdfFile(null); setNotificarEmail(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast("error", "Error", msg);
      if (pdfData.pdf_url) eliminarPdf(pdfData.pdf_url).catch(() => {});
    } finally { loading(false); }
  }, [titulo, contenido, color, pdfFile, notificarEmail, user, supabase, toast, loading, refetch, subirPdf, eliminarPdf]);

  async function handleEditSave() {
    loading(true, "Guardando...");
    let pdfData: { pdf_url?: string; pdf_nombre?: string } = {};
    try {
      if (editPdfFile) {
        pdfData = await subirPdf(editPdfFile);
      } else if (editQuitarPdf) {
        pdfData = { pdf_url: "", pdf_nombre: "" };
      }
      const updates: Record<string, unknown> = { titulo: editTitulo, contenido: editContenido, color_borde: editColor, ...pdfData };
      const { error } = await supabase.from("comunicados").update(updates).eq("id", editId);
      if (error) throw error;
      if ((editPdfUrl && editPdfFile) || (editPdfUrl && editQuitarPdf)) {
        await eliminarPdf(editPdfUrl).catch(() => {});
      }
      toast("success", "Comunicado actualizado");
      setEditId(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast("error", "Error", msg);
      if (pdfData.pdf_url) eliminarPdf(pdfData.pdf_url).catch(() => {});
    } finally { loading(false); }
  }

  async function handleDelete(id: number, pdfUrl: string) {
    const ok = await confirm("Eliminar comunicado", "Esta accion <b>no se puede deshacer</b> y el comunicado desaparecera para todos los usuarios.", true);
    if (!ok) return;
    loading(true, "Eliminando...");
    const { error } = await supabase.from("comunicados").delete().eq("id", id);
    if (error) { toast("error", "Error", error.message); loading(false); return; }
    if (pdfUrl) await eliminarPdf(pdfUrl).catch(() => {});
    toast("success", "Comunicado eliminado");
    loading(false);
    refetch();
  }

  const filtrados = comunicados.filter((c) => {
    const f = busqueda.toUpperCase();
    return c.titulo?.toUpperCase().includes(f) || c.contenido?.toUpperCase().includes(f);
  });

  return (
    <div className="overflow-x-hidden space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone size={18} weight="bold" className="text-primary" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-primary">Gestion de Comunicados</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone size={16} weight="bold" className="text-primary" />
          <h3 className="text-sm font-extrabold tracking-tight text-primary">Publicar Comunicado Oficial</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Titulo del comunicado (Ej: Cambio de horario)" value={titulo} onChange={(e) => setTitulo(e.target.value)} required
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
          <textarea rows={3} placeholder="Escriba el mensaje detallado aqui..." value={contenido} onChange={(e) => setContenido(e.target.value)} required
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
              <FilePdf size={13} weight="bold" />
              PDF adjunto opcional
            </label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 px-4 py-6 transition-all hover:border-primary/30 hover:bg-primary/5">
              <FilePdf size={28} weight="thin" className="text-gray-300" />
              {pdfFile ? (
                <div className="flex items-center gap-2 text-sm">
                  <FilePdf size={16} weight="bold" className="text-red-500" />
                  <span className="font-medium text-gray-700">{pdfFile.name}</span>
                  <span className="text-gray-400">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => setPdfFile(null)} className="ml-1 cursor-pointer text-gray-400 hover:text-red-500">
                    <X size={14} weight="bold" />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-500">Haz clic para seleccionar un PDF</span>
              )}
              <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Color</label>
            <div className="flex justify-center gap-3 sm:justify-start sm:gap-4">
              {colores.map((c) => (
                <button type="button" key={c.value} onClick={() => setColor(c.value)}
                  className={`relative flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-90 ${color === c.value ? "drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]"}`}>
                  <span className="relative block h-9 w-9 rounded-full border-2 border-white/60 shadow-inner sm:h-10 sm:w-10" style={{ backgroundColor: c.value }}>
                    {color === c.value && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className="text-[0.55rem] font-bold leading-tight text-gray-500 sm:text-[0.6rem]">{c.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600">
            <input type="checkbox" checked={notificarEmail} onChange={(e) => setNotificarEmail(e.target.checked)} className="accent-primary" />
            <Bell size={15} weight="fill" className="text-accent" />
            Notificar por correo a suscriptores
          </label>
          <button type="submit"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Megaphone size={15} weight="bold" />
            Publicar Comunicado ahora
          </button>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Note size={14} weight="bold" className="text-primary" />
          </div>
          <h2 className="text-sm font-extrabold tracking-tight text-primary">Comunicados Activos</h2>
        </div>
        <div className="relative mb-4">
          <MagnifyingGlass size={15} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por titulo o contenido..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3.5 text-sm shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="hidden w-full table-fixed text-sm sm:table">
            <thead>
              <tr className="bg-primary text-left text-[0.68rem] font-bold uppercase tracking-wider text-white/90">
                <th className="w-[110px] px-4 py-3.5 pl-5">
                  <div className="flex items-center gap-1.5"><Calendar size={13} weight="bold" />Fecha</div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5"><Note size={13} weight="bold" />Titulo y Contenido</div>
                </th>
                <th className="w-[110px] px-4 py-3.5">
                  <div className="flex items-center gap-1.5"><User size={13} weight="bold" />Autor</div>
                </th>
                <th className="w-[130px] px-4 py-3.5 pr-5 text-right">
                  <div className="flex items-center justify-end gap-1.5"><PencilSimple size={13} weight="bold" />Accion</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No hay comunicados registrados.</td></tr>
              ) : (
                filtrados.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/80">
                    <td className="px-4 py-3 pl-5 font-semibold whitespace-nowrap text-gray-800">{new Date(c.creado_en).toLocaleDateString("es-CR")}</td>
                    <td className="break-words px-4 py-3">
                      <strong className="block break-words" style={{ color: c.color_borde }}>{c.titulo}</strong>
                      <div className="mt-1 break-words text-xs text-gray-500 [word-break:break-word]">{c.contenido}</div>
                      {c.pdf_url && (
                        <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 no-underline transition-colors hover:bg-amber-100">
                          <FilePdf size={13} weight="bold" />
                          {c.pdf_nombre || "Documento"}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.autor}</td>
                    <td className="px-4 py-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => {
                          setEditId(c.id); setEditTitulo(c.titulo); setEditContenido(c.contenido || "");
                          setEditColor(c.color_borde || "#3498db"); setEditPdfUrl(c.pdf_url || "");
                          setEditPdfNombre(c.pdf_nombre || ""); setEditPdfFile(null); setEditQuitarPdf(false);
                        }} className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-[0.68rem] font-bold text-blue-600 transition-all hover:bg-blue-100">
                          <PencilSimple size={12} weight="bold" />
                          Editar
                        </button>
                        <button onClick={() => handleDelete(c.id, c.pdf_url || "")} className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[0.68rem] font-bold text-red-600 transition-all hover:bg-red-100">
                          <TrashSimple size={12} weight="bold" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex flex-col gap-3 p-3 sm:hidden">
            {filtrados.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No hay comunicados registrados.</div>
            ) : (
              filtrados.map((c) => (
                <div key={c.id} className="break-words rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <strong className="block min-w-0 break-words text-sm" style={{ color: c.color_borde }}>{c.titulo}</strong>
                    <span className="shrink-0 text-[0.6rem] font-medium text-gray-400">{new Date(c.creado_en).toLocaleDateString("es-CR")}</span>
                  </div>
                  <p className="mb-2.5 break-words text-xs leading-relaxed text-gray-500">{c.contenido}</p>
                  {c.pdf_url && (
                    <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.65rem] font-bold text-amber-700 no-underline transition-colors hover:bg-amber-100">
                      <FilePdf size={12} weight="bold" />
                      {c.pdf_nombre || "Documento"}
                    </a>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-gray-50 pt-2.5 text-[0.65rem] text-gray-400">
                    <span className="flex min-w-0 items-center gap-1">
                      <User size={11} weight="bold" className="shrink-0" />
                      <span className="truncate">{c.autor}</span>
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => {
                        setEditId(c.id); setEditTitulo(c.titulo); setEditContenido(c.contenido || "");
                        setEditColor(c.color_borde || "#3498db"); setEditPdfUrl(c.pdf_url || "");
                        setEditPdfNombre(c.pdf_nombre || ""); setEditPdfFile(null); setEditQuitarPdf(false);
                      }} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[0.65rem] font-bold text-blue-600 transition-all hover:bg-blue-100">
                        <PencilSimple size={11} weight="bold" />
                        Editar
                      </button>
                      <button onClick={() => handleDelete(c.id, c.pdf_url || "")} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[0.65rem] font-bold text-red-600 transition-all hover:bg-red-100">
                        <TrashSimple size={11} weight="bold" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
              className="flex max-h-[85vh] w-full max-w-[620px] flex-col rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <PencilSimple size={18} weight="bold" className="text-primary" />
                  <h3 className="text-sm font-extrabold tracking-tight text-primary">Editar Comunicado</h3>
                </div>
                <button onClick={() => setEditId(null)} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">
                  <X size={20} weight="bold" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                    <Note size={12} weight="bold" />
                    Titulo
                  </label>
                  <input type="text" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                    <Note size={12} weight="bold" />
                    Contenido
                  </label>
                  <textarea rows={4} value={editContenido} onChange={(e) => setEditContenido(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Color</label>
                  <div className="flex justify-center gap-3 sm:justify-start sm:gap-4">
                    {colores.map((c) => (
                      <button type="button" key={c.value} onClick={() => setEditColor(c.value)}
                        className={`relative flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-90 ${editColor === c.value ? "drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]"}`}>
                        <span className="relative block h-9 w-9 rounded-full border-2 border-white/60 shadow-inner sm:h-10 sm:w-10" style={{ backgroundColor: c.value }}>
                          {editColor === c.value && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </span>
                        <span className="text-[0.55rem] font-bold leading-tight text-gray-500 sm:text-[0.6rem]">{c.label.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
                    <FilePdf size={12} weight="bold" />
                    PDF adjunto
                  </label>
                  {editPdfUrl && !editPdfFile && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <FilePdf size={13} weight="bold" className="text-red-400" />
                      PDF actual: <a href={editPdfUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary">{editPdfNombre || "Documento"}</a>
                    </p>
                  )}
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 px-4 py-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                    <FilePdf size={24} weight="thin" className="text-gray-300" />
                    {editPdfFile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FilePdf size={16} weight="bold" className="text-red-500" />
                        <span className="font-medium text-gray-700">{editPdfFile.name}</span>
                        <span className="text-gray-400">({(editPdfFile.size / 1024).toFixed(0)} KB)</span>
                        <button type="button" onClick={() => setEditPdfFile(null)} className="ml-1 cursor-pointer text-gray-400 hover:text-red-500">
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-500">Haz clic para reemplazar PDF</span>
                    )}
                    <input type="file" accept="application/pdf,.pdf" onChange={(e) => setEditPdfFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                  {editPdfUrl && (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600">
                      <input type="checkbox" checked={editQuitarPdf} onChange={(e) => setEditQuitarPdf(e.target.checked)} className="accent-primary" />
                      Quitar PDF actual
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
                <button onClick={() => setEditId(null)}
                  className="flex-1 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100">
                  Cancelar
                </button>
                <button onClick={handleEditSave}
                  className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <FloppyDisk size={15} weight="bold" />
                  Guardar cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ComunicadosAdminPage() {
  return (
    <NotiProvider>
      <ComAdminInner />
    </NotiProvider>
  );
}
