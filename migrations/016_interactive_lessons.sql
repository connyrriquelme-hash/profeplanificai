-- ============================================================
-- MIGRACIÓN 016: Lecciones Interactivas
-- Fecha: 2026-08-17
-- Propósito: Persistir lecciones interactivas generadas con IA
-- (functions/api/materials/interactive-lesson.ts +
-- functions/core/InteractiveLessonEngine.ts).
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS interactive_lessons (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  oa TEXT NOT NULL,
  slides_json TEXT NOT NULL,
  ai_model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_interactive_lessons_user ON interactive_lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_interactive_lessons_subject ON interactive_lessons(subject, grade);
