import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Faltan campos requeridos: email, password" }, { status: 400 });
  }

  if (password.length < 12) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 12 caracteres" }, { status: 400 });
  }

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

  const srv = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: newUser, error: createError } = await srv.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already exists")) {
      const { data: existing } = await srv.auth.admin.listUsers();
      const found = existing?.users.find((u) => u.email === email);
      if (found) {
        const { error: upsertError } = await srv.from("usuarios_perfil").upsert({
          user_id: found.id,
          nombre_completo: "Administrador",
          usuario: "admin",
          rol: "admin",
        }, { onConflict: "user_id" });

        if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
        return NextResponse.json({ email, mensaje: "Admin ya existía, perfil actualizado." });
      }
    }
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const { error: profileError } = await srv.from("usuarios_perfil").insert({
    user_id: newUser.user.id,
    nombre_completo: "Administrador",
    usuario: "admin",
    rol: "admin",
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ email, mensaje: "Admin creado exitosamente." });
}
