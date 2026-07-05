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

  const mensaje = `═════════════════════════
NOTIFICACIÓN OFICIAL DE AUSENCIA DOCENTE
CTP DE QUEPOS
═════════════════════════

Estimada Dirección:

Por medio del Sistema de Notificaciones, se notifica el reporte del siguiente funcionario:

  Funcionario:  ${perfil.nombre_completo}
  Fecha:        ${fecha}
  Horario:      ${horario || "Todo el día"}
  Motivo:       ${razon}${detalle ? `\n  Detalle:      ${detalle}` : ""}

─────────────────────────
Se ruega tomar nota para los controles de asistencia y suplencias correspondientes.

─ Sistema de Notificaciones - CTP de Quepos`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(mensaje)}&apikey=${apiKey}`;

  let enviado = false;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) { enviado = true; break; }
      const text = await res.text();
      console.error(`CallMeBot error (intento ${i + 1}):`, text);
    } catch (err) {
      console.error(`CallMeBot exception (intento ${i + 1}):`, err);
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({ ok: true, whatsapp: enviado });
}
