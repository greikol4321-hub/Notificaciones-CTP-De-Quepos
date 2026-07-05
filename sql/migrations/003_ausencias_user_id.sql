-- ============================================================
-- MIGRACIÓN 003: Agregar user_id a la tabla ausencias
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase (Dashboard > SQL Editor)
-- Requiere: 002_rls_policies.sql ejecutado primero.
-- ============================================================

ALTER TABLE IF EXISTS public.ausencias
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
