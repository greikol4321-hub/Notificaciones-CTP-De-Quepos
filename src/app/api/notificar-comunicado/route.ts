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

  const { titulo, contenido } = await request.json();
  if (!titulo) {
    return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  }

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

  const mensaje = `━━━ NUEVO COMUNICADO OFICIAL ━━━

${titulo}${contenido ? `\n\n${contenido}` : ""}

━━━ Sistema de Notificaciones - CTP de Quepos ━━━`;

  const resultados = await Promise.allSettled(
    suscriptores.map((s) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${s.telefono}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`;
      return fetch(url);
    }),
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled" && r.value.ok).length;

  return NextResponse.json({ ok: true, enviados, total: suscriptores.length });
}
