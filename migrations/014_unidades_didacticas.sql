-- ============================================================
-- MIGRACIÓN 014: Unidades Didácticas
-- Fecha: 2026-07-26
-- Propósito: Persistir unidades didácticas generadas con IA
-- (functions/api/materials/unidad-didactica.ts +
-- functions/core/UnidadDidacticaEngine.ts). Sin DROP, sin ALTER
-- destructivo, sin DELETE/UPDATE masivo.
--
-- Mismo patrón que generated_resources (migrations/006_pedagogical_core.sql):
-- content_json guarda la unidad completa validada contra
-- schemas/UnidadDidacticaSchema.ts, y las columnas sueltas (nivel,
-- asignatura, metodologia_activa, user_id) son solo para poder listar y
-- filtrar sin tener que parsear el JSON.
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS unidades_didacticas (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  metodologia_activa TEXT NOT NULL CHECK (
    metodologia_activa IN ('Tradicional', 'ABP', 'Gamificacion', 'Aula Invertida', 'Design Thinking')
  ),
  clase_count INTEGER NOT NULL DEFAULT 0,
  content_json TEXT NOT NULL,
  ai_model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_unidades_didacticas_user ON unidades_didacticas(user_id);
CREATE INDEX IF NOT EXISTS idx_unidades_didacticas_nivel_asignatura ON unidades_didacticas(nivel, asignatura);
CREATE INDEX IF NOT EXISTS idx_unidades_didacticas_metodologia ON unidades_didacticas(metodologia_activa);
