import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  let { accion, telefono, nombre } = await request.json();

  if (!telefono) {
    return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
  }

  const limpio = String(telefono).replace(/[\s\-\(\)]/g, "");
  if (/^\d{8}$/.test(limpio)) telefono = "+506" + limpio;

  if (!/^\+506\d{8}$/.test(telefono)) {
    return NextResponse.json({ error: "Teléfono inválido. Debe ser +506 seguido de 8 dígitos" }, { status: 400 });
  }

  if (accion === "suscribir") {
    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }
    const { error } = await supabase.from("suscriptores").upsert(
      { telefono, nombre, activo: true },
      { onConflict: "telefono" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mensaje: "Suscripción activada" });
  }

  if (accion === "baja") {
    const { error } = await supabase
      .from("suscriptores")
      .delete()
      .eq("telefono", telefono);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mensaje: "Suscripción cancelada" });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
