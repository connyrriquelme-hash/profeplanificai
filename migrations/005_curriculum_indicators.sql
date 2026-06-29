PRAGMA foreign_keys = ON;

-- ============================================================
-- Migración 005: Indicadores Curriculares
-- NO modifica tablas existentes. Solo crea nuevas.
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_indicators (
  id TEXT PRIMARY KEY,
  objective_id TEXT,
  skill_id TEXT,
  level TEXT NOT NULL,
  grade TEXT NOT NULL,
  track TEXT NOT NULL CHECK(track IN ('parvularia','basica','humanista_cientifico','tecnico_profesional')),
  subject TEXT NOT NULL,
  oa_code TEXT NOT NULL,
  indicator_text TEXT NOT NULL,
  observable_action TEXT,
  evaluation_type TEXT NOT NULL DEFAULT 'formativa' CHECK(evaluation_type IN ('formativa','sumativa','diagnostica','autoevaluacion','coevaluacion')),
  evidence_type TEXT CHECK(evidence_type IN ('oral','escrita','practica','proyecto','desempeno','portfolio','observacion','rúbrica')),
  difficulty_level TEXT CHECK(difficulty_level IN ('basico','intermedio','avanzado')),
  source TEXT NOT NULL DEFAULT 'MINEDUC',
  status TEXT NOT NULL DEFAULT 'pendiente_revision' CHECK(status IN ('validado','pendiente_revision','rechazado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ci_objective ON curriculum_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_ci_skill ON curriculum_indicators(skill_id);
CREATE INDEX IF NOT EXISTS idx_ci_level_grade ON curriculum_indicators(level, grade);
CREATE INDEX IF NOT EXISTS idx_ci_subject ON curriculum_indicators(subject);
CREATE INDEX IF NOT EXISTS idx_ci_oa_code ON curriculum_indicators(oa_code);
CREATE INDEX IF NOT EXISTS idx_ci_track ON curriculum_indicators(track);
CREATE INDEX IF NOT EXISTS idx_ci_status ON curriculum_indicators(status);
CREATE INDEX IF NOT EXISTS idx_ci_level_grade_subject ON curriculum_indicators(level, grade, subject);

-- ============================================================
-- Tabla de metadatos de carga (para auditoría de importaciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_import_batches (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  track TEXT NOT NULL,
  indicators_read INTEGER NOT NULL DEFAULT 0,
  indicators_imported INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped INTEGER NOT NULL DEFAULT 0,
  missing_oa INTEGER NOT NULL DEFAULT 0,
  missing_skill INTEGER NOT NULL DEFAULT 0,
  pending_revision INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','completed','failed')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
