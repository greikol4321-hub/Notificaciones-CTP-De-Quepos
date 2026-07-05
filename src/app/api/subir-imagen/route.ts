import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const fd = await req.formData();
  const file = fd.get("imagen") as File | null;
  const destino = fd.get("destino") as string | null;
  if (!file || !destino) return NextResponse.json({ error: "Archivo y destino requeridos" }, { status: 400 });

  const srv = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const nombre = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const { error: uploadErr } = await srv.storage.from("imagenes").upload(nombre, file, { upsert: true });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: pub } = srv.storage.from("imagenes").getPublicUrl(nombre);

  const { error: dbErr } = await srv.from("imagenes").insert({
    url: pub.publicUrl,
    destino,
    descripcion: file.name,
  });

  if (dbErr) {
    await srv.storage.from("imagenes").remove([nombre]).catch(() => {});
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: pub.publicUrl, destino, descripcion: file.name });
}
