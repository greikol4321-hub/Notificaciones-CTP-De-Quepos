-- ============================================================
-- MIGRACIÓN 008: Tabla suscriptores para notificaciones WhatsApp
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: dtsblwzygrakmxgignau
-- ============================================================

CREATE TABLE IF NOT EXISTS public.suscriptores (
  id        SERIAL PRIMARY KEY,
  telefono  TEXT NOT NULL UNIQUE,
  nombre    TEXT NOT NULL,
  activo    BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- Anon puede insertar (registrarse)
DROP POLICY IF EXISTS "suscriptores_insert_anon" ON public.suscriptores;
CREATE POLICY "suscriptores_insert_anon" ON public.suscriptores
  FOR INSERT TO anon WITH CHECK (true);

-- Autenticados pueden leer (para admin broadcast)
DROP POLICY IF EXISTS "suscriptores_select_auth" ON public.suscriptores;
CREATE POLICY "suscriptores_select_auth" ON public.suscriptores
  FOR SELECT TO authenticated USING (true);

-- Anon puede actualizar (darse de baja por telefono)
DROP POLICY IF EXISTS "suscriptores_update_anon" ON public.suscriptores;
CREATE POLICY "suscriptores_update_anon" ON public.suscriptores
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
