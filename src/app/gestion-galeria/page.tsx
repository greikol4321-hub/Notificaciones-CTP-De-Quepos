"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ImageSquare, Upload, TrashSimple, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { NotiProvider, useNoti } from "@/components/NotiToast";

interface Imagen {
  url: string;
  descripcion: string;
  destino: string;
}

function UploadInner() {
  const router = useRouter();
  const supabase = createClient();
  const { toast, confirm, loading } = useNoti();

  const [galeria, setGaleria] = useState<Imagen[]>([]);
  const [carrusel, setCarrusel] = useState<Imagen[]>([]);
  const [tab, setTab] = useState<"galeria" | "carrusel">("galeria");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const cargar = useCallback(async (silent?: boolean) => {
    if (!silent) loading(true, "Cargando...");
    const { data } = await supabase
      .from("imagenes")
      .select("url,descripcion,destino")
      .order("id", { ascending: false });
    if (data) {
      setGaleria(data.filter((i) => i.destino !== "carrusel"));
      setCarrusel(data.filter((i) => i.destino === "carrusel"));
    }
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login?redirect=/gestion-galeria"); return; }
      supabase
        .from("usuarios_perfil")
        .select("rol")
        .eq("user_id", user.id)
        .single()
        .then(({ data: perfil }) => {
          if (!perfil || !["admin", "docente_guia_admin"].includes((perfil as { rol: string }).rol)) {
            router.push("/panel-ausencias");
            return;
          }
          loading(true, "Cargando imagenes...");
          cargar().finally(() => loading(false));
        });
    });
  }, [router, supabase, cargar]);

  function normalizarNombre(n: string) {
    return n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "imagen";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("imagen") as File;
    const destino = fd.get("destino") as string;
    if (!file || !destino) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      toast("error", "Error", "Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG, GIF o WEBP.");
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast("error", "Error", "El archivo excede el tamaño máximo de 10 MB.");
      return;
    }

    loading(true, "Publicando imagen...");
    try {
      const ruta = `${destino}/${Date.now()}-${normalizarNombre(file.name)}`;
      const { error: uploadErr } = await supabase.storage.from("imagenes").upload(ruta, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("imagenes").getPublicUrl(ruta);
      const { error: dbErr } = await supabase.from("imagenes").insert({
        url: pub.publicUrl, destino, descripcion: file.name,
      });
      if (dbErr) {
        await supabase.storage.from("imagenes").remove([ruta]).catch(() => {});
        throw dbErr;
      }
      toast("success", "Imagen publicada", "Actualizá la página para verla.");
      form?.reset();
      setPreview(null);
      const nueva: Imagen = { url: pub.publicUrl, destino, descripcion: file.name };
      if (destino === "carrusel") setCarrusel((p) => [nueva, ...p]);
      else setGaleria((p) => [nueva, ...p]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen";
      toast("error", "Error", msg);
    } finally {
      loading(false);
    }
  }

  async function borrar(img: Imagen) {
    const ok = await confirm("Eliminar imagen", "Esta acción no se puede deshacer.", true);
    if (!ok) return;
    loading(true, "Borrando imagen...");
    try {
      const prefix = supabase.storage.from("imagenes").getPublicUrl("").data.publicUrl;
      const ruta = img.url.replace(prefix, "");
      if (!ruta) throw new Error("URL inválida");
      const { error: delErr } = await supabase.storage.from("imagenes").remove([ruta]);
      if (delErr) throw delErr;
      const { error: dbErr } = await supabase.from("imagenes").delete().eq("url", img.url);
      if (dbErr) throw dbErr;
      toast("success", "Imagen borrada", "La imagen se eliminó correctamente del servidor.");
      setGaleria((p) => p.filter((i) => i.url !== img.url));
      setCarrusel((p) => p.filter((i) => i.url !== img.url));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al borrar la imagen";
      toast("error", "Error", msg);
    } finally {
      loading(false);
    }
  }

  const mostrar = tab === "galeria" ? galeria : carrusel;

  return (
    <div className="mx-auto max-w-[800px] space-y-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ImageSquare size={22} weight="fill" className="text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">Panel de Administraci&oacute;n de Galer&iacute;a</h1>
        <p className="text-sm text-gray-500">Gestiona las im&aacute;genes de la galer&iacute;a y el carrusel de inicio.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
            <ImageSquare size={13} weight="bold" />
            Seleccionar imagen
          </label>
          <label className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-4 py-6 text-center transition-all hover:border-primary/40 hover:bg-primary/5">
            <input type="file" name="imagen" accept="image/*" required
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setPreview(ev.target?.result as string);
                  reader.readAsDataURL(f);
                } else {
                  setPreview(null);
                }
              }}
              className="hidden" />
            {preview ? (
              <div className="w-full max-w-[400px]">
                <img src={preview} alt="" className="mx-auto max-h-[200px] w-auto rounded-lg object-contain shadow-md" />
                <p className="mt-2 text-xs text-gray-400">Toca para cambiar imagen</p>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Upload size={22} weight="bold" className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">Arrastra una imagen o haz clic para seleccionar</p>
                  <p className="mt-0.5 text-xs text-gray-400">JPG, PNG, GIF — hasta 10 MB</p>
                </div>
              </>
            )}
          </label>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">
            <ImageSquare size={13} weight="bold" />
            Seccion
          </label>
          <div className="relative">
            <select name="destino" required
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm outline-none transition-all focus:border-primary/30 focus:ring-3 focus:ring-primary/8">
              <option value="">-- Selecciona una opcion --</option>
              <option value="galeria">Galeria de Fotos (Actividades/Eventos)</option>
              <option value="carrusel">Carrusel Principal (Banners de Inicio)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={sending}
          className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
          <Upload size={16} weight="bold" />
          {sending ? "Publicando..." : "Publicar Imagen"}
        </button>
      </form>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <ImageSquare size={14} weight="bold" className="text-primary" />
          </div>
          <h2 className="text-sm font-extrabold tracking-tight text-primary">Contenido Visual</h2>
        </div>

        <div className="mb-4 flex gap-2">
          <button onClick={() => setTab("galeria")}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              tab === "galeria"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Galeria ({galeria.length})
          </button>
          <button onClick={() => setTab("carrusel")}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              tab === "carrusel"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Carrusel ({carrusel.length})
          </button>
        </div>

        {mostrar.length === 0 ? (
          <p className="py-12 text-center text-gray-400">No hay imagenes en {tab === "galeria" ? "la galeria" : "el carrusel"}.</p>
        ) : (
          <div className={
            tab === "galeria"
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3"
          }>
            {mostrar.map((img, i) => (
              <div key={i}
                className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                  tab === "galeria" ? "aspect-square" : "aspect-video"
                }`}>
                <button onClick={() => setLightbox(img.url)} className="block h-full w-full cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.descripcion} className="h-full w-full object-cover" loading="lazy" />
                </button>
                <button onClick={() => borrar(img)}
                  className="absolute right-1.5 top-1.5 cursor-pointer rounded-md bg-red-600/90 px-2 py-1 text-xs font-bold text-white transition-all hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100">
                  <TrashSimple size={12} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}
          >
            <button onClick={() => setLightbox(null)}
              className="absolute right-5 top-5 cursor-pointer text-white/60 transition-colors hover:text-white">
              <X size={28} weight="bold" />
            </button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              src={lightbox} alt=""
              className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SubirImagenPage() {
  return (
    <NotiProvider>
      <UploadInner />
    </NotiProvider>
  );
}
