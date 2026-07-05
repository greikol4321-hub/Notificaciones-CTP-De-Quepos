-- ============================================================
-- MIGRACIÓN 002: RLS Policies basadas en rol
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- No se ejecuta automáticamente — revísalo antes de correrlo.
-- Requiere: tabla usuarios_perfil creada y auth.users poblada.
-- ============================================================

-- 1. HABILITAR RLS EN CADA TABLA (si no lo está ya)
ALTER TABLE IF EXISTS public.usuarios_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.imagenes ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLICÍAS ANON EXISTENTES (reemplazar)
DROP POLICY IF EXISTS "anon_select_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_insert_ausencias" ON public.ausencias;
DROP POLICY IF EXISTS "anon_select_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_insert_comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "anon_select_imagenes" ON public.imagenes;
DROP POLICY IF EXISTS "anon_insert_imagenes" ON public.imagenes;

-- ============================================================
-- POLICÍAS PARA usuarios_perfil
-- ============================================================

-- Lectura: cualquier usuario autenticado puede leer perfiles (para verificar roles)
CREATE POLICY "perfil_select_authenticated" ON public.usuarios_perfil
  FOR SELECT
  TO authenticated
  USING (true);

-- Cada usuario solo puede modificar su propio perfil
CREATE POLICY "perfil_update_own" ON public.usuarios_perfil
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo admin puede insertar/eliminar perfiles
CREATE POLICY "perfil_insert_admin" ON public.usuarios_perfil
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "perfil_delete_admin" ON public.usuarios_perfil
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍCICAS PARA ausencias
-- ============================================================

-- SELECT público: cualquiera ve las ausencias activas (sigue siendo parte del sitio público)
CREATE POLICY "ausencias_select_public" ON public.ausencias
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: solo usuarios autenticados con rol docente o superior
CREATE POLICY "ausencias_insert_authenticated" ON public.ausencias
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('docente', 'docente_guia', 'docente_guia_admin', 'admin'))
  );

-- UPDATE/DELETE: solo el propio usuario o admin
CREATE POLICY "ausencias_update_own" ON public.ausencias
  FOR UPDATE
  TO authenticated
  USING (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  )
  WITH CHECK (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "ausencias_delete_own" ON public.ausencias
  FOR DELETE
  TO authenticated
  USING (
    usuario = (SELECT nombre_completo FROM public.usuarios_perfil WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍCICAS PARA comunicados
-- ============================================================

-- SELECT público: cualquiera puede ver comunicados (página principal)
CREATE POLICY "comunicados_select_public" ON public.comunicados
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: solo admin y docente_guia_admin
CREATE POLICY "comunicados_insert_admin" ON public.comunicados
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- UPDATE/DELETE: solo admin y docente_guia_admin
CREATE POLICY "comunicados_update_admin" ON public.comunicados
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

CREATE POLICY "comunicados_delete_admin" ON public.comunicados
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- ============================================================
-- POLÍCICAS PARA imagenes
-- ============================================================

-- SELECT público: cualquiera puede ver imágenes (galería pública)
CREATE POLICY "imagenes_select_public" ON public.imagenes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: solo admin y docente_guia_admin
CREATE POLICY "imagenes_insert_admin" ON public.imagenes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );

-- DELETE: solo admin y docente_guia_admin
CREATE POLICY "imagenes_delete_admin" ON public.imagenes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin'))
  );
