import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

  const rolesPermitidos = ["admin", "docente_guia_admin"];
  if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
    return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
  }

  const fd = await request.formData();
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
