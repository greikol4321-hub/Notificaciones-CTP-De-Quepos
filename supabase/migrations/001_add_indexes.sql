-- ============================================================================
-- Migración: Índices de optimización para tablas problemáticas
-- Fecha: 2026-07-10
-- Descripción: Agrega índices para acelerar queries identificadas como lentas
-- ============================================================================

-- ============================================================================
-- 1. COMUNICADOS
-- ============================================================================

-- Query: ORDER BY creado_en DESC (page.tsx línea 36, admin/page.tsx línea 60)
-- La tabla se ordena por fecha de creación en casi todas las consultas
CREATE INDEX IF NOT EXISTS idx_comunicados_creado_en
  ON comunicados (creado_en DESC);

-- ============================================================================
-- 2. AUSENCIAS
-- ============================================================================

-- Query: WHERE fecha <= X AND fecha_fin >= Y (page.tsx línea 55)
-- Rango de fechas para mostrar ausencias activas hoy
CREATE INDEX IF NOT EXISTS idx_ausencias_rango_fechas
  ON ausencias (fecha, fecha_fin);

-- Query: WHERE user_id = X ORDER BY fecha DESC (panel-ausencias/page.tsx línea 83)
-- Historial personal de ausencias del usuario
CREATE INDEX IF NOT EXISTS idx_ausencias_user_fecha
  ON ausencias (user_id, fecha DESC);

-- ============================================================================
-- 3. SUSCRIPTORES
-- ============================================================================

-- Query: SELECT email FROM suscriptores (notificar-comunicado-email/route.ts línea 51)
-- Selección de todos los emails para envío masivo
CREATE INDEX IF NOT EXISTS idx_suscriptores_email
  ON suscriptores (email);

-- ============================================================================
-- 4. IMÁGENES
-- ============================================================================

-- Query: WHERE destino = 'carrusel' ORDER BY id ASC (page.tsx línea 35)
-- Galería del carrusel principal
CREATE INDEX IF NOT EXISTS idx_imagenes_destino_id
  ON imagenes (destino, id);

-- ============================================================================
-- 5. USUARIOS_PERFIL
-- ============================================================================

-- Query: WHERE user_id = X (múltiples archivos)
-- Lookup de perfil por auth user_id — la query más repetida del sistema
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_user_id
  ON usuarios_perfil (user_id);

-- ============================================================================
-- Fin de migración
-- ============================================================================
