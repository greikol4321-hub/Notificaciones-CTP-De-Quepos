-- ============================================================
-- POLÍTICAS PARA STORAGE BUCKET "imagenes"
-- Permite eliminar objetos a admin/docente_guia_admin
-- ============================================================
CREATE POLICY "imagenes_storage_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'imagenes'
    AND EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
    )
  );

-- Permitir subir imágenes a admin/docente_guia_admin
CREATE POLICY "imagenes_storage_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imagenes'
    AND EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE user_id = auth.uid() AND rol IN ('admin', 'docente_guia_admin')
    )
  );

-- Permitir SELECT público en storage
CREATE POLICY "imagenes_storage_select_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'imagenes');
