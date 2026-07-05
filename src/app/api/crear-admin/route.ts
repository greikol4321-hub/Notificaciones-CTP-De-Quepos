import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// ADVERTENCIA: Esta ruta debe eliminarse o ADMIN_SETUP_SECRET debe rotarse/eliminarse
// de las variables de entorno una vez creado el primer admin real en producción.
// El setupSecret es solo para bootstrap inicial cuando aún no hay admins en el sistema.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { setupSecret } = body;
  const isSetupMode = setupSecret && setupSecret === process.env.ADMIN_SETUP_SECRET;

  if (!isSetupMode) {
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

    if (!perfil || perfil.rol !== "admin") {
      return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = "admin@ctpq.ed.cr";
  const password = "Admin123!";

  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already exists")) {
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users.find((u) => u.email === email);
      if (found) {
        const { error: upsertError } = await supabase.from("usuarios_perfil").upsert({
          user_id: found.id,
          nombre_completo: "Administrador",
          usuario: "admin",
          rol: "admin",
        }, { onConflict: "user_id" });

        if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
        return NextResponse.json({ email, password, mensaje: "Admin ya existía, perfil actualizado." });
      }
    }
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("usuarios_perfil").insert({
    user_id: user.user.id,
    nombre_completo: "Administrador",
    usuario: "admin",
    rol: "admin",
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ email, password, mensaje: "Admin creado exitosamente." });
}
