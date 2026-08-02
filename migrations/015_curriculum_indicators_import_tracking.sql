PRAGMA foreign_keys = OFF;

-- ============================================================
-- Migración 015: trazabilidad de importación oficial de indicadores MINEDUC
-- Agrega source_url + imported_at y permite status='importado_oficial'.
-- SQLite no soporta ALTER de un CHECK constraint in-place: se reconstruye
-- la tabla (create nueva / copiar filas / drop vieja / rename), preservando
-- todas las filas existentes. Mismo patrón usado en 0000_core_schema.sql.
-- ============================================================

CREATE TABLE curriculum_indicators_new (
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
  source_url TEXT,
  imported_at TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente_revision' CHECK(status IN ('validado','pendiente_revision','rechazado','importado_oficial')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

INSERT INTO curriculum_indicators_new (
  id, objective_id, skill_id, level, grade, track, subject, oa_code, indicator_text,
  observable_action, evaluation_type, evidence_type, difficulty_level, source,
  source_url, imported_at, status, created_at, updated_at
)
SELECT
  id, objective_id, skill_id, level, grade, track, subject, oa_code, indicator_text,
  observable_action, evaluation_type, evidence_type, difficulty_level, source,
  NULL, NULL, status, created_at, updated_at
FROM curriculum_indicators;

DROP TABLE curriculum_indicators;
ALTER TABLE curriculum_indicators_new RENAME TO curriculum_indicators;

CREATE INDEX IF NOT EXISTS idx_ci_objective ON curriculum_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_ci_skill ON curriculum_indicators(skill_id);
CREATE INDEX IF NOT EXISTS idx_ci_level_grade ON curriculum_indicators(level, grade);
CREATE INDEX IF NOT EXISTS idx_ci_subject ON curriculum_indicators(subject);
CREATE INDEX IF NOT EXISTS idx_ci_oa_code ON curriculum_indicators(oa_code);
CREATE INDEX IF NOT EXISTS idx_ci_track ON curriculum_indicators(track);
CREATE INDEX IF NOT EXISTS idx_ci_status ON curriculum_indicators(status);
CREATE INDEX IF NOT EXISTS idx_ci_level_grade_subject ON curriculum_indicators(level, grade, subject);

PRAGMA foreign_keys = ON;
