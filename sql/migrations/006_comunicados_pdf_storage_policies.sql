-- ============================================================
-- MIGRACIÓN: Políticas RLS para bucket "comunicados-pdf"
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Proyecto: dtsblwzygrakmxgignau
-- ============================================================
-- Habilitar RLS en storage.objects (ya está por defecto, pero garantizado)
-- No es necesario si RLS ya está activo.

-- Eliminar policies previas si existen (idempotente)
DROP POLICY IF EXISTS "comunicados_pdf_storage_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "comunicados_pdf_storage_delete_admin" ON storage.objects;
DROP POLICY IF EXISTS "comunicados_pdf_storage_select_public" ON storage.objects;

-- INSERT: solo admin y docente_guia_admin pueden subir PDFs
CREATE POLICY "comunicados_pdf_storage_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comunicados-pdf'
    AND EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
    )
  );

-- DELETE: solo admin y docente_guia_admin pueden borrar PDFs
CREATE POLICY "comunicados_pdf_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'comunicados-pdf'
    AND EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
    )
  );

-- SELECT público: cualquiera puede ver/descargar los PDFs
CREATE POLICY "comunicados_pdf_storage_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'comunicados-pdf');
