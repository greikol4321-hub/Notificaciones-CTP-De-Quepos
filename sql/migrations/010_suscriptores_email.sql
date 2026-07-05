-- ============================================================
-- MIGRACIÓN 010: Adaptar suscriptores para notificaciones por email
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: dtsblwzygrakmxgignau
-- ============================================================

-- Vaciar la tabla (no hay suscriptores reales todavía, son datos de prueba de sistemas anteriores)
TRUNCATE public.suscriptores;

-- Eliminar columnas de los sistemas anteriores (WhatsApp/OneSignal), ya no se usan
ALTER TABLE public.suscriptores
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS nombre,
  DROP COLUMN IF EXISTS player_id;

-- La columna email ya existe (agregada en 009), la dejamos como identificador único y obligatorio
ALTER TABLE public.suscriptores
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.suscriptores
  DROP CONSTRAINT IF EXISTS suscriptores_email_unique;

ALTER TABLE public.suscriptores
  ADD CONSTRAINT suscriptores_email_unique UNIQUE (email);

-- Reemplazar políticas RLS viejas por las que corresponden al flujo de email
DROP POLICY IF EXISTS "suscriptores_insert_anon" ON public.suscriptores;
CREATE POLICY "suscriptores_insert_anon" ON public.suscriptores
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "suscriptores_update_anon" ON public.suscriptores;

DROP POLICY IF EXISTS "suscriptores_delete_anon" ON public.suscriptores;
CREATE POLICY "suscriptores_delete_anon" ON public.suscriptores
  FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "suscriptores_select_auth" ON public.suscriptores;
CREATE POLICY "suscriptores_select_auth" ON public.suscriptores
  FOR SELECT TO authenticated USING (true);
