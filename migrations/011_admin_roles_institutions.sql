-- FASE 2: Admin roles and institutions
-- Note: usuarios table already has `rol` column (TEXT DEFAULT 'docente')
-- No ALTER TABLE needed for role field.

CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rbd TEXT,
  country TEXT DEFAULT 'Chile',
  region TEXT,
  commune TEXT,
  address TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS institution_members (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'docente',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS institution_calendar_templates (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  school_year INTEGER NOT NULL,
  level_id TEXT,
  subject_id TEXT,
  weekday INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'lectivo',
  room TEXT,
  repeats_weekly INTEGER DEFAULT 1,
  starts_on TEXT,
  ends_on TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_institution_members_user_id ON institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_institution_id ON institution_members(institution_id);
CREATE INDEX IF NOT EXISTS idx_calendar_templates_institution ON institution_calendar_templates(institution_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_log(admin_user_id);
