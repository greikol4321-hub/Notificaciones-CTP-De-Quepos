import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("usuarios_perfil")
    .select("nombre_completo, rol")
    .eq("user_id", user.id)
    .single();

  if (!perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
  }

  const rolesPermitidos = ["docente", "docente_guia", "docente_guia_admin", "admin"];
  if (!rolesPermitidos.includes(perfil.rol)) {
    return NextResponse.json({ error: "No tienes permiso para notificar ausencias" }, { status: 403 });
  }

  const body = await request.json();
  const { razon, detalle, fecha, horario } = body;

  if (!razon || !fecha) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_APIKEY;

  if (!phone || !apiKey) {
    console.error("CallMeBot no configurado");
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 500 });
  }

  const mensaje = [
    "═".repeat(22),
    "NOTIFICACIÓN DE AUSENCIA",
    "═".repeat(22),
    "",
    `INSTITUCIÓN: CTP de Quepos`,
    `DOCENTE:     ${perfil.nombre_completo}`,
    `FECHA:       ${fecha}`,
    `HORARIO:     ${horario || "Todo el día"}`,
    `RAZÓN:       ${razon}`,
    `DETALLE:     ${detalle || "N/A"}`,
    "",
    "─".repeat(22),
    "Sistema de Notificaciones",
  ].join("\n");

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("CallMeBot error:", await res.text());
      return NextResponse.json({ error: "Error al enviar notificación" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("CallMeBot exception:", err);
    return NextResponse.json({ error: "Error de conexión" }, { status: 502 });
  }
}
