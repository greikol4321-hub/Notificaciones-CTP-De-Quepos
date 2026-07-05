-- ============================================================
-- MIGRACIÓN 005: Revocar acceso anon a la tabla usuarios legacy
-- ============================================================
-- La tabla usuarios original contiene hashes bcrypt de contraseñas
-- del sistema anterior. No debe ser legible por la anon key.
-- No se elimina la tabla todavía (puede servir como fuente para
-- la migración de datos), pero se revoca TODO acceso público.
-- ============================================================

DROP POLICY IF EXISTS "anon_select_usuarios" ON public.usuarios;
REVOKE SELECT ON TABLE public.usuarios FROM anon;
