import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

  const srv = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const ruta = url.split("/").pop();
  if (!ruta) return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });

  const { error: delErr } = await srv.storage.from("imagenes").remove([ruta]);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { error: dbErr } = await srv.from("imagenes").delete().eq("url", url);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
