const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://dtsblwzygrakmxgignau.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0c2Jsd3p5Z3Jha214Z2lnbmF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcyOTMxNiwiZXhwIjoyMDk3MzA1MzE2fQ.u4Eh09tLPO0MvrdgIRwbuFHWNs6a1pEDB_j1-HFoEoM",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const usuarios = [
  // { email: "docente1@ctpq.ed.cr", password: "pass12345678", nombre: "María López", usuario: "mlopez", rol: "docente" },
  // Agregá acá todos los que quieras
];

(async () => {
  for (const u of usuarios) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error) { console.log("✗", u.email, error.message); continue; }

    const { error: perfilError } = await supabase.from("usuarios_perfil").insert({
      user_id: data.user.id,
      nombre_completo: u.nombre,
      usuario: u.usuario,
      rol: u.rol,
    });
    if (perfilError) { console.log("✗", u.email, "perfil:", perfilError.message); continue; }

    console.log("✓", u.email, "-", u.nombre);
  }
  console.log("\nListo.");
})();
