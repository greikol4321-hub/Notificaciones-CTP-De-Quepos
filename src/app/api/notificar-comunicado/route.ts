import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

  const etiqueta: Record<string, string> = {
    "#e74c3c": "🔴 Urgente",
    "#f39c12": "🟠 Importante",
    "#27ae60": "🟢 Informativo",
    "#3498db": "🔵 General",
  };
  const color = etiqueta[color_borde || ""] || "🟢 Informativo";

  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) {
    return NextResponse.json({ error: "CallMeBot no configurado" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: suscriptores } = await supabaseAdmin
    .from("suscriptores")
    .select("telefono, nombre")
    .eq("activo", true);

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, total: 0 });
  }

  const mensaje = `📢 NUEVO COMUNICADO

${color}
"${titulo}"

Ingrese al sistema:
https://notificaciones-ctp-quepos.vercel.app`;

  const resultados: { telefono: string; ok: boolean; error?: string }[] = [];

  for (const s of suscriptores) {
    const tel = /^\d{8}$/.test(s.telefono) ? "+506" + s.telefono : s.telefono;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${tel}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`;
    let ok = false;
    let err = "";
    for (let i = 0; i < 2; i++) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (text.includes("Message queued")) { ok = true; break; }
        err = text.replace(/<[^>]+>/g, "").trim();
      } catch (e) {
        err = String(e);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    resultados.push({ telefono: tel, ok, error: err });
    await new Promise((r) => setTimeout(r, 300));
  }

  const enviados = resultados.filter((r) => r.ok).length;
  const fallos = resultados.filter((r) => !r.ok);

  if (fallos.length > 0) {
    console.error("Fallos WhatsApp:", fallos.map((f) => `${f.telefono}: ${f.error}`).join(" | "));
  }

  return NextResponse.json({ ok: true, enviados, total: suscriptores.length });
}
