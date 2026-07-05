-- ============================================================
-- MIGRACIÓN COMPLETA: Todas las políticas RLS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: dtsblwzygrakmxgignau
-- ============================================================

-- 1. HABILITAR RLS EN CADA TABLA
ALTER TABLE IF EXISTS public.usuarios_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imagenes ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS ANON EXISTENTES
DROP POLICY IF EXISTS "anon_select_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_insert_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_select_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_insert_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_select_imagenes" ON public.imagenes;
DROP POLICY IF EXISTS "anon_insert_imagenes" ON public.imagenes;

-- ============================================================
-- POLÍTICAS PARA usuarios_perfil
-- ============================================================
DROP POLICY IF EXISTS "perfil_select_authenticated" ON public.usuarios_perfil;
DROP POLICY IF EXISTS "perfil_update_own" ON public.usuarios_perfil;
DROP POLICY IF EXISTS "perfil_insert_admin" ON public.usuarios_perfil;
DROP POLICY IF EXISTS "perfil_delete_admin" ON public.usuarios_perfil;

CREATE POLICY "perfil_select_authenticated" ON public.usuarios_perfil
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "perfil_update_own" ON public.usuarios_perfil
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "perfil_insert_admin" ON public.usuarios_perfil
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "perfil_delete_admin" ON public.usuarios_perfil
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍTICAS PARA ausencias
-- ============================================================
DROP POLICY IF EXISTS "ausencias_select_public" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_insert_authenticated" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_update_own" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_delete_own" ON public.ausencias;

CREATE POLICY "ausencias_select_public" ON public.ausencias
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ausencias_insert_authenticated" ON public.ausencias
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('docente', 'docente_guia', 'docente_guia_admin', 'admin'))
  );

CREATE POLICY "ausencias_update_own" ON public.ausencias
  FOR UPDATE TO authenticated
  USING (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  ) WITH CHECK (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "ausencias_delete_own" ON public.ausencias
  FOR DELETE TO authenticated
  USING (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍTICAS PARA comunicados (tabla)
-- ============================================================
DROP POLICY IF EXISTS "comunicados_select_public" ON public.comunicados;
DROP POLICY IF EXISTS "comunicados_insert_admin" ON public.comunicados;
DROP POLICY IF EXISTS "comunicados_update_admin" ON public.comunicados;
DROP POLICY IF EXISTS "comunicados_delete_admin" ON public.comunicados;

CREATE POLICY "comunicados_select_public" ON public.comunicados
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "comunicados_insert_admin" ON public.comunicados
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "comunicados_update_admin" ON public.comunicados
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "comunicados_delete_admin" ON public.comunicados
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍTICAS PARA imagenes (tabla)
-- ============================================================
DROP POLICY IF EXISTS "imagenes_select_public" ON public.imagenes;
DROP POLICY IF EXISTS "imagenes_insert_admin" ON public.imagenes;
DROP POLICY IF EXISTS "imagenes_delete_admin" ON public.imagenes;

CREATE POLICY "imagenes_select_public" ON public.imagenes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "imagenes_insert_admin" ON public.imagenes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "imagenes_delete_admin" ON public.imagenes
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍTICAS DE STORAGE: bucket "imagenes"
-- ============================================================
DROP POLICY IF EXISTS "imagenes_storage_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_storage_delete_admin" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_storage_select_public" ON storage.objects;

CREATE POLICY "imagenes_storage_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imagenes'
    AND EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "imagenes_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'imagenes'
    AND EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "imagenes_storage_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'imagenes');

-- ============================================================
-- POLÍTICAS DE STORAGE: bucket "comunicados-pdf"
-- ============================================================
DROP POLICY IF EXISTS "comunicados_pdf_storage_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "comunicados_pdf_storage_delete_admin" ON storage.objects;
DROP POLICY IF EXISTS "comunicados_pdf_storage_select_public" ON storage.objects;

CREATE POLICY "comunicados_pdf_storage_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comunicados-pdf'
    AND EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "comunicados_pdf_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'comunicados-pdf'
    AND EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "comunicados_pdf_storage_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'comunicados-pdf');
