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

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return NextResponse.json({ error: "OneSignal no configurado" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: suscriptores } = await supabaseAdmin
    .from("suscriptores")
    .select("player_id")
    .eq("activo", true)
    .not("player_id", "is", null);

  if (!suscriptores || suscriptores.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, total: 0 });
  }

  const etiqueta: Record<string, string> = {
    "#e74c3c": "🔴 Urgente",
    "#f39c12": "🟠 Importante",
    "#27ae60": "🟢 Informativo",
    "#3498db": "🔵 General",
  };
  const color = etiqueta[color_borde || ""] || "🟢 Informativo";

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_player_ids: suscriptores.map((s) => s.player_id),
      headings: { es: `${color} ${titulo}` },
      contents: { es: contenido || "Nuevo comunicado institucional" },
      url: "https://notificaciones-ctp-quepos.vercel.app",
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("OneSignal error:", json);
    return NextResponse.json({ error: json.errors?.join(", ") || "Error al enviar" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, enviados: json.recipients || 0, total: suscriptores.length, id: json.id });
}
