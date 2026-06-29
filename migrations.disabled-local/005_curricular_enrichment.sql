-- Migration 005: Curricular enrichment
-- Adds textbook references, teacher guides, resource links, and lesson sequence recommendations

CREATE TABLE IF NOT EXISTS objective_indicators (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  indicator_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS textbook_references (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'texto_escolar',
  unit TEXT NOT NULL DEFAULT '',
  page_start INTEGER NOT NULL DEFAULT 0,
  page_end INTEGER NOT NULL DEFAULT 0,
  objective_code TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_guide_references (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  lesson_title TEXT NOT NULL DEFAULT '',
  objective_code TEXT NOT NULL DEFAULT '',
  suggested_activity TEXT NOT NULL DEFAULT '',
  didactic_orientation TEXT NOT NULL DEFAULT '',
  assessment_suggestion TEXT NOT NULL DEFAULT '',
  page_start INTEGER NOT NULL DEFAULT 0,
  page_end INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS curricular_resource_links (
  id TEXT PRIMARY KEY,
  objective_code TEXT NOT NULL,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recurso',
  description TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lesson_sequence_recommendations (
  id TEXT PRIMARY KEY,
  objective_code TEXT NOT NULL,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  complexity TEXT NOT NULL DEFAULT 'media' CHECK(complexity IN ('baja','media','alta','muy_alta')),
  recommended_lessons INTEGER NOT NULL DEFAULT 1 CHECK(recommended_lessons >= 1 AND recommended_lessons <= 5),
  rationale TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_objective_indicators_obj ON objective_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_textbook_refs_code ON textbook_references(objective_code);
CREATE INDEX IF NOT EXISTS idx_teacher_guide_refs_code ON teacher_guide_references(objective_code);
CREATE INDEX IF NOT EXISTS idx_curricular_resource_links_code ON curricular_resource_links(objective_code);
CREATE INDEX IF NOT EXISTS idx_lesson_sequence_code ON lesson_sequence_recommendations(objective_code);
