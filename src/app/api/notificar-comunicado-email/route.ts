import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { init, send } from "@emailjs/nodejs";

const ETIQUETA: Record<string, string> = {
  "#e74c3c": "🔴 Urgente",
  "#f39c12": "🟠 Importante",
  "#27ae60": "🟢 Informativo",
  "#3498db": "🔵 General",
};

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("rol")
    .eq("user_id", user.id)
    .single();

  if (!perfil || !["admin", "docente_guia_admin"].includes(perfil.rol)) {
    return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
  }

  const { titulo, contenido, color_borde } = await request.json();
  if (!titulo) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: suscriptores } = await supabaseAdmin
    .from("suscriptores")
    .select("email");

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, total: 0 });
  }

  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;

  if (!publicKey || !privateKey || !serviceId || !templateId) {
    console.error("EmailJS no configurado");
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 500 });
  }

  init({ publicKey, privateKey });

  const etiqueta = ETIQUETA[color_borde || ""] || "🟢 Informativo";
  let enviados = 0;

  const batchSize = 50;
  for (let i = 0; i < suscriptores.length; i += batchSize) {
    const batch = suscriptores.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((suscriptor) =>
        send(serviceId, templateId, {
          to_email: suscriptor.email,
          titulo,
          contenido: contenido || "Nuevo comunicado institucional",
          etiqueta,
          color: color_borde || "#27ae60",
          link: "https://notificaciones-ctp-quepos.vercel.app",
        })
      )
    );
    enviados += results.filter((r) => r.status === "fulfilled").length;
    if (i + batchSize < suscriptores.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return NextResponse.json({ ok: true, enviados, total: suscriptores.length });
}
