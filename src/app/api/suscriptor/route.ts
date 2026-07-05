import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accion } = body;

  if (accion === "suscribir_push") {
    const { player_id } = body;
    if (!player_id) return NextResponse.json({ error: "player_id requerido" }, { status: 400 });
    const { error } = await supabase
      .from("suscriptores")
      .upsert({ player_id, activo: true }, { onConflict: "player_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mensaje: "Notificaciones activadas" });
  }

  if (accion === "baja_push") {
    const { player_id } = body;
    if (!player_id) return NextResponse.json({ error: "player_id requerido" }, { status: 400 });
    const { error } = await supabase.from("suscriptores").delete().eq("player_id", player_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mensaje: "Notificaciones desactivadas" });
  }

  if (accion === "suscribir") {
    const { telefono, nombre } = body;
    if (!telefono) return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    const limpio = String(telefono).replace(/[\s\-\(\)]/g, "");
    const tel = /^\d{8}$/.test(limpio) ? "+506" + limpio : limpio;
    if (!/^\+506\d{8}$/.test(tel)) {
      return NextResponse.json({ error: "Teléfono inválido. Debe ser +506 seguido de 8 dígitos" }, { status: 400 });
    }
    const { error } = await supabase.from("suscriptores").upsert(
      { telefono: tel, nombre, activo: true },
      { onConflict: "telefono" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mensaje: "Suscripción activada" });
  }

  if (accion === "baja") {
    const { telefono } = body;
    if (!telefono) return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    const { error } = await supabase.from("suscriptores").delete().eq("telefono", telefono);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mensaje: "Suscripción cancelada" });
  }

  if (accion === "baja_por_id") {
    const { id } = body;
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const { error } = await supabase.from("suscriptores").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mensaje: "Suscripción cancelada" });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
