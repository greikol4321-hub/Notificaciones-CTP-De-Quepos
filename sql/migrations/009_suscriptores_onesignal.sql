-- ============================================================
-- MIGRACIÓN 009: Refactor suscriptores para OneSignal push
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: dtsblwzygrakmxgignau
-- ============================================================

-- Agregar columna player_id (OneSignal) y email opcional
ALTER TABLE public.suscriptores
  ADD COLUMN IF NOT EXISTS player_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Marcar telefono y nombre como nullable (para compatibilidad)
ALTER TABLE public.suscriptores
  ALTER COLUMN telefono DROP NOT NULL,
  ALTER COLUMN nombre DROP NOT NULL;

-- Actualizar RLS para permitir anon setear player_id (upsert)
DROP POLICY IF EXISTS "suscriptores_update_anon" ON public.suscriptores;
CREATE POLICY "suscriptores_update_anon" ON public.suscriptores
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
