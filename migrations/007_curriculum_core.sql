CREATE TABLE IF NOT EXISTS education_levels (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cycle TEXT,
  sort_order INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'official',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  education_level_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  curriculum_source TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (education_level_id) REFERENCES education_levels(id)
);

CREATE TABLE IF NOT EXISTS curriculum_axes (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS learning_objectives (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  axis_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('OA', 'OAH', 'OAA')),
  official_text TEXT,
  bloom_level TEXT,
  competency TEXT,
  curriculum_source TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (axis_id) REFERENCES curriculum_axes(id)
);

CREATE TABLE IF NOT EXISTS evaluation_indicators (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  evaluation_type TEXT NOT NULL,
  observable_action TEXT,
  evidence_type TEXT,
  difficulty_level TEXT,
  source TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES learning_objectives(id)
);

CREATE TABLE IF NOT EXISTS curricular_skills (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS curricular_attitudes (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  attitude_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS methodologies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  educational_focus TEXT,
  target_levels TEXT,
  target_subjects TEXT,
  pedagogical_approach TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS methodology_strategies (
  id TEXT PRIMARY KEY,
  methodology_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy_type TEXT,
  resources_needed TEXT,
  estimated_time TEXT,
  learning_outcomes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id)
);

CREATE TABLE IF NOT EXISTS methodology_subject_fit (
  id TEXT PRIMARY KEY,
  methodology_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  fit_level TEXT NOT NULL CHECK(fit_level IN ('excellent', 'good', 'adequate', 'poor', 'unsuitable')),
  adaptation_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  UNIQUE(methodology_id, subject_id)
);

CREATE TABLE IF NOT EXISTS resource_templates (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('guide', 'presentation', 'evaluation', 'rubric', 'worksheet', 'activity', 'manual')),
  template_content TEXT,
  template_format TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generated_resources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  objective_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  template_id TEXT,
  methodology_id TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'generated', 'completed', 'published', 'archived')),
  ai_model TEXT,
  generation_params TEXT,
  curriculum_context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  FOREIGN KEY (objective_id) REFERENCES learning_objectives(id),
  FOREIGN KEY (template_id) REFERENCES resource_templates(id),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id)
);

CREATE TABLE IF NOT EXISTS generated_presentations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slide_count INTEGER,
  presentation_format TEXT,
  presentation_content TEXT,
  theme TEXT,
  layout TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  FOREIGN KEY (resource_id) REFERENCES generated_resources(id),
  UNIQUE(resource_id)
);

CREATE TABLE IF NOT EXISTS curriculum_sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('official_mineduc', 'educational_platform', 'government_document', 'academic_paper', 'teacher_material', 'imported_file')),
  name TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  organization TEXT,
  validity_period TEXT,
  access_notes TEXT,
  last_accessed TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, source_type)
);

CREATE TABLE IF NOT EXISTS objective_indicators (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  evaluation_criteria TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES learning_objectives(id),
  FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id),
  UNIQUE(objective_id, indicator_id)
);

CREATE TABLE IF NOT EXISTS objective_skills (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  competency_level TEXT,
  assessment_method TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES learning_objectives(id),
  FOREIGN KEY (skill_id) REFERENCES curricular_skills(id),
  UNIQUE(objective_id, skill_id)
);

CREATE TABLE IF NOT EXISTS objective_attitudes (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  attitude_id TEXT NOT NULL,
  attitude_strength TEXT,
  development_strategy TEXT,
  assessment_method TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES learning_objectives(id),
  FOREIGN KEY (attitude_id) REFERENCES curricular_attitudes(id),
  UNIQUE(objective_id, attitude_id)
);

CREATE TABLE IF NOT EXISTS search_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('objective','indicator','skill','attitude','methodology','template','resource')),
  ref_id TEXT NOT NULL,
  level TEXT,
  subject TEXT,
  axis TEXT,
  objective_code TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  search_vector TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  user_id TEXT,
  input_json TEXT NOT NULL DEFAULT '{}',
  context_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  tokens_used INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending','running','completed','failed','cancelled')),
  error_message TEXT,
  curriculum_context_json TEXT NOT NULL DEFAULT '{}',
  ai_provider TEXT,
  ai_model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_search_doc_type ON search_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_search_level ON search_documents(level);
CREATE INDEX IF NOT EXISTS idx_search_subject ON search_documents(subject);
CREATE INDEX IF NOT EXISTS idx_search_oa_code ON search_documents(objective_code);
CREATE INDEX IF NOT EXISTS idx_objective_indicators_objective ON objective_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_objective_skills_objective ON objective_skills(objective_id);
CREATE INDEX IF NOT EXISTS idx_objective_attitudes_objective ON objective_attitudes(objective_id);
CREATE INDEX IF NOT EXISTS idx_curricular_skills_subject ON curricular_skills(subject_id);
CREATE INDEX IF NOT EXISTS idx_curricular_attitudes_subject ON curricular_attitudes(subject_id);
CREATE INDEX IF NOT EXISTS idx_methodology_strategies_methodology ON methodology_strategies(methodology_id);
CREATE INDEX IF NOT EXISTS idx_resource_templates_type ON resource_templates(type);
CREATE INDEX IF NOT EXISTS idx_generated_resources_user ON generated_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_resources_objective ON generated_resources(objective_id);
CREATE INDEX IF NOT EXISTS idx_generated_resources_type ON generated_resources(type);
CREATE INDEX IF NOT EXISTS idx_generated_presentations_resource ON generated_presentations(resource_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_sources_url ON curriculum_sources(url);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON agent_runs(created_at DESC);
