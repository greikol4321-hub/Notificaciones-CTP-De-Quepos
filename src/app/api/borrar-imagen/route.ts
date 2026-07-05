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

  const { url } = await request.json();
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
