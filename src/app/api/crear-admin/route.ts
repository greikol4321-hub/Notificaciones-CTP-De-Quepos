import { createClient } from "@supabase/supabase-js";

export async function POST() {
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

        if (upsertError) return Response.json({ error: upsertError.message }, { status: 500 });
        return Response.json({ email, password, mensaje: "Admin ya existía, perfil actualizado." });
      }
    }
    return Response.json({ error: createError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("usuarios_perfil").insert({
    user_id: user.user.id,
    nombre_completo: "Administrador",
    usuario: "admin",
    rol: "admin",
  });

  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  return Response.json({ email, password, mensaje: "Admin creado exitosamente." });
}
