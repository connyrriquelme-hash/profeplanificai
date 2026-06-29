-- Migration 007: Evaluation resource sources & links
-- External sources for evaluation resources (SIMCE, CPEIP, Educarchile, etc.)
-- Safe metadata-only storage — no copyrighted content copied

CREATE TABLE IF NOT EXISTS external_resource_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'public' CHECK(source_type IN ('official','public','private_account','user_saved','derived')),
  access_type TEXT NOT NULL DEFAULT 'open' CHECK(access_type IN ('open','login_required','paid','manual_upload','unknown')),
  license_note TEXT NOT NULL DEFAULT '',
  is_official INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluation_resource_links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  resource_type TEXT NOT NULL DEFAULT 'recurso',
  subject TEXT NOT NULL DEFAULT '',
  course TEXT NOT NULL DEFAULT '',
  objective_code TEXT NOT NULL DEFAULT '',
  skill TEXT NOT NULL DEFAULT '',
  evaluation_type TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  access_type TEXT NOT NULL DEFAULT 'unknown' CHECK(access_type IN ('open','login_required','paid','manual_upload','unknown')),
  license_note TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK(validation_status IN ('pending','validated','rejected')),
  user_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES external_resource_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_erl_source ON evaluation_resource_links(source_id);
CREATE INDEX IF NOT EXISTS idx_erl_subject ON evaluation_resource_links(subject);
CREATE INDEX IF NOT EXISTS idx_erl_course ON evaluation_resource_links(course);
CREATE INDEX IF NOT EXISTS idx_erl_objective_code ON evaluation_resource_links(objective_code);
CREATE INDEX IF NOT EXISTS idx_erl_skill ON evaluation_resource_links(skill);
CREATE INDEX IF NOT EXISTS idx_erl_evaluation_type ON evaluation_resource_links(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_erl_validation ON evaluation_resource_links(validation_status);
CREATE INDEX IF NOT EXISTS idx_erl_user ON evaluation_resource_links(user_id);
