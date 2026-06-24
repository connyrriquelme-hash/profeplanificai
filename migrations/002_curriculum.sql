PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cycle TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS axes (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  number INTEGER,
  name TEXT NOT NULL,
  prioritization_label TEXT,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(course_id, subject_id, number, name)
);

CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'OA' CHECK(type IN ('OA','OAH','OAA')),
  course_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  axis_id TEXT,
  unit_id TEXT,
  official_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  bloom_level TEXT,
  skill_tags_json TEXT NOT NULL DEFAULT '[]',
  attitude_tags_json TEXT NOT NULL DEFAULT '[]',
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT 'Currículum Nacional — MINEDUC Chile',
  license_note TEXT NOT NULL DEFAULT 'Fuente oficial MINEDUC. Reutilización con atribución y enlace a la fuente original.',
  priority_label TEXT,
  imported_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (axis_id) REFERENCES axes(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  official_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attitudes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  official_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objective_skills (
  objective_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  PRIMARY KEY (objective_id, skill_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objective_attitudes (
  objective_id TEXT NOT NULL,
  attitude_id TEXT NOT NULL,
  PRIMARY KEY (objective_id, attitude_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (attitude_id) REFERENCES attitudes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  unit_label TEXT,
  source_url TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  UNIQUE(objective_id, source_url)
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  alternatives_json TEXT NOT NULL DEFAULT '[]',
  correct_answer TEXT,
  correction_rubric TEXT,
  skill_label TEXT,
  source_url TEXT NOT NULL,
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS generated_activities (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  prompt_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id),
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS import_logs (
  id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL,
  items_found INTEGER NOT NULL DEFAULT 0,
  items_saved INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_objectives_code ON objectives(code);
CREATE INDEX IF NOT EXISTS idx_objectives_course ON objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_objectives_subject ON objectives(subject_id);
CREATE INDEX IF NOT EXISTS idx_objectives_axis ON objectives(axis_id);
CREATE INDEX IF NOT EXISTS idx_subjects_normalized ON subjects(normalized_name);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_questions_objective ON questions(objective_id);
CREATE INDEX IF NOT EXISTS idx_resources_objective ON resources(objective_id);

INSERT OR IGNORE INTO courses (id, code, name, cycle, sort_order) VALUES
('course-sc','SC','Sala Cuna','Educación Parvularia',1),
('course-nm','NM','Nivel Medio','Educación Parvularia',2),
('course-nt','NT','Nivel Transición','Educación Parvularia',3),
('course-1b','1B','1° Básico','Educación Básica',10),
('course-2b','2B','2° Básico','Educación Básica',20),
('course-3b','3B','3° Básico','Educación Básica',30),
('course-4b','4B','4° Básico','Educación Básica',40),
('course-5b','5B','5° Básico','Educación Básica',50),
('course-6b','6B','6° Básico','Educación Básica',60),
('course-7b','7B','7° Básico','Educación Básica',70),
('course-8b','8B','8° Básico','Educación Básica',80),
('course-1m','1M','1° Medio','Educación Media',90),
('course-2m','2M','2° Medio','Educación Media',100),
('course-3m-fg','3M-FG','3° Medio FG','Educación Media',110),
('course-3m-hc','3M-HC','3° Medio HC','Educación Media',111),
('course-3m-tp','3M-TP','3° Medio TP','Educación Media',112),
('course-4m-fg','4M-FG','4° Medio FG','Educación Media',120),
('course-4m-hc','4M-HC','4° Medio HC','Educación Media',121),
('course-4m-tp','4M-TP','4° Medio TP','Educación Media',122);
