-- Migration 004: Resources table for Banco de Recursos
-- D1 database: planificaia-db

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recurso',
  source TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  objective_code TEXT NOT NULL DEFAULT '',
  objective_text TEXT NOT NULL DEFAULT '',
  skill TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_level ON resources(level);
