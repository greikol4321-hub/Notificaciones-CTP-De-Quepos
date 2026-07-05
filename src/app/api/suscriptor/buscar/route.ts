import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const { nombre } = await request.json();
  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: "Escribí al menos 2 caracteres" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("suscriptores")
    .select("id, nombre, telefono")
    .ilike("nombre", `%${nombre}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultados = (data || []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    telefono: s.telefono.slice(0, 5) + "****" + s.telefono.slice(-3),
  }));

  return NextResponse.json({ resultados });
}
