-- ============================================================
-- MIGRACIÓN 004: Corregir policies de ausencias
-- ============================================================
-- Reemplaza la comparación usuario = nombre_completo (rota)
-- por comparación directa user_id = auth.uid()
-- También refuerza INSERT para exigir user_id = auth.uid()
-- ============================================================

-- 1. ELIMINAR POLICÍAS ROTAS
DROP POLICY IF EXISTS "ausencias_update_own" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_delete_own" ON public.ausencias;
DROP POLICY IF EXISTS "ausencias_insert_authenticated" ON public.ausencias;

-- 2. INSERT: el user_id siempre es auth.uid(), nunca del body
CREATE POLICY "ausencias_insert_authenticated" ON public.ausencias
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid()
      AND rol IN ('docente', 'docente_guia', 'docente_guia_admin', 'admin')
    )
  );

-- 3. UPDATE: propio user o admin/docente_guia_admin
CREATE POLICY "ausencias_update_own" ON public.ausencias
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid()
      AND rol IN ('admin', 'docente_guia_admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid()
      AND rol IN ('admin', 'docente_guia_admin')
    )
  );

-- 4. DELETE: propio user o admin/docente_guia_admin
CREATE POLICY "ausencias_delete_own" ON public.ausencias
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid()
      AND rol IN ('admin', 'docente_guia_admin')
    )
  );
