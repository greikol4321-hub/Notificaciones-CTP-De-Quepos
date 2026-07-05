-- ============================================================
-- MIGRACIÓN COMPLETA: Tablas + RLS + Políticas
-- Ejecutar UNA SOLA VEZ en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- Orden seguro: CREATE TABLE → ALTER → RLS → Policies
-- ============================================================

-- 1. CREAR TABLA usuarios_perfil (si no existe)
CREATE TABLE IF NOT EXISTS public.usuarios_perfil (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  nombre_completo TEXT NOT NULL,
  usuario TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'docente',
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- 2. AGREGAR COLUMNA user_id a ausencias (migración 003)
ALTER TABLE IF EXISTS public.ausencias
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. HABILITAR RLS EN CADA TABLA
ALTER TABLE IF EXISTS public.usuarios_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imagenes ENABLE ROW LEVEL SECURITY;

-- 4. ELIMINAR POLÍTICAS ANON EXISTENTES
DROP POLICY IF EXISTS "anon_select_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_insert_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_select_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_insert_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_select_imagenes" ON public.imagenes;
DROP POLICY IF EXISTS "anon_insert_imagenes" ON public.imagenes;

-- Eliminar políticas migración 004 (para recrearlas)
DROP POLICY IF EXISTS "ausencias_update_own" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_delete_own" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_insert_authenticated" ON public.ausencias;

-- ============================================================
-- POLÍTICAS PARA usuarios_perfil
-- ============================================================
CREATE POLICY "perfil_select_authenticated" ON public.usuarios_perfil
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfil_update_own" ON public.usuarios_perfil
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "perfil_insert_admin" ON public.usuarios_perfil
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

CREATE POLICY "perfil_delete_admin" ON public.usuarios_perfil
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

-- ============================================================
-- POLÍTICAS PARA ausencias (migración 004 corregida)
-- ============================================================
CREATE POLICY "ausencias_select_public" ON public.ausencias
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ausencias_insert_authenticated" ON public.ausencias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.usuarios_perfil
    WHERE user_id = auth.uid() AND rol IN ('docente', 'docente_guia', 'docente_guia_admin', 'admin')
  ));

CREATE POLICY "ausencias_update_own" ON public.ausencias
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
  )) WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
  ));

CREATE POLICY "ausencias_delete_own" ON public.ausencias
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
  ));

-- ============================================================
-- POLÍTICAS PARA comunicados
-- ============================================================
CREATE POLICY "comunicados_select_public" ON public.comunicados
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "comunicados_insert_admin" ON public.comunicados
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

CREATE POLICY "comunicados_update_admin" ON public.comunicados
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

CREATE POLICY "comunicados_delete_admin" ON public.comunicados
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

-- ============================================================
-- POLÍTICAS PARA imagenes
-- ============================================================
CREATE POLICY "imagenes_select_public" ON public.imagenes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "imagenes_insert_admin" ON public.imagenes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

CREATE POLICY "imagenes_delete_admin" ON public.imagenes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')));

-- ============================================================
-- REVOCAR ACCESO A TABLA usuarios LEGACY (migración 005)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_usuarios" ON public.usuarios;
REVOKE SELECT ON TABLE public.usuarios FROM anon;
