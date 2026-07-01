-- Migration 006: Núcleo curricular pedagógico completo
-- NO destruye datos existentes. Solo crea nuevas tablas.
-- Fecha: 2026-07-01
-- Propósito: Completar modelo curricular relacional chileno con metodologías,
-- plantillas, recursos generados, agentes y búsqueda.

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. TABLAS CURRICULARES COMPLEMENTARIAS
-- ============================================================

-- Indicadores de evaluación (tabla puente oficial OA ↔ indicadores)
CREATE TABLE IF NOT EXISTS evaluation_indicators (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  indicator_text TEXT NOT NULL,
  observable_action TEXT,
  evaluation_type TEXT DEFAULT 'formativa' CHECK(evaluation_type IN ('formativa','sumativa','diagnostica','autoevaluacion','coevaluacion')),
  evidence_type TEXT CHECK(evidence_type IN ('oral','escrita','practica','proyecto','desempeno','portfolio','observacion','rubrica')),
  difficulty_level TEXT CHECK(difficulty_level IN ('basico','intermedio','avanzado')),
  source_type TEXT NOT NULL DEFAULT 'mineduc' CHECK(source_type IN ('mineduc','seed_pedagogico','docente')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
);

-- Habilidades curriculares (complementa skills existentes)
CREATE TABLE IF NOT EXISTS curricular_skills (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subject_id TEXT,
  axis_id TEXT,
  level_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'mineduc' CHECK(source_type IN ('mineduc','seed_pedagogico')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (axis_id) REFERENCES axes(id) ON DELETE SET NULL,
  FOREIGN KEY (level_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Actitudes curriculares (complementa attitudes existentes)
CREATE TABLE IF NOT EXISTS curricular_attitudes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subject_id TEXT,
  axis_id TEXT,
  level_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'mineduc' CHECK(source_type IN ('mineduc','seed_pedagogico')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (axis_id) REFERENCES axes(id) ON DELETE SET NULL,
  FOREIGN KEY (level_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Relación OA ↔ indicadores (tabla puente)
CREATE TABLE IF NOT EXISTS objective_indicators (
  objective_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  PRIMARY KEY (objective_id, indicator_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id) ON DELETE CASCADE
);

-- ============================================================
-- 2. METODOLOGÍAS PEDAGÓGICAS
-- ============================================================

CREATE TABLE IF NOT EXISTS methodologies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT,
  description TEXT NOT NULL,
  when_to_use TEXT,
  steps_json TEXT NOT NULL DEFAULT '[]',
  advantages_json TEXT NOT NULL DEFAULT '[]',
  risks_json TEXT NOT NULL DEFAULT '[]',
  dua_accommodations_json TEXT NOT NULL DEFAULT '[]',
  suggested_evaluations_json TEXT NOT NULL DEFAULT '[]',
  classroom_examples_json TEXT NOT NULL DEFAULT '[]',
  source_type TEXT NOT NULL DEFAULT 'seed_pedagogico' CHECK(source_type IN ('mineduc','seed_pedagogico','docente')),
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Estrategias por metodología
CREATE TABLE IF NOT EXISTS methodology_strategies (
  id TEXT PRIMARY KEY,
  methodology_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  grade_range TEXT,
  subject_fit_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id) ON DELETE CASCADE
);

-- Ajuste metodología-asignatura
CREATE TABLE IF NOT EXISTS methodology_subject_fit (
  methodology_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  fit_score INTEGER NOT NULL DEFAULT 5 CHECK(fit_score BETWEEN 1 AND 10),
  notes TEXT,
  PRIMARY KEY (methodology_id, subject_id),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. PLANTILLAS DE RECURSOS
-- ============================================================

CREATE TABLE IF NOT EXISTS resource_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('planificacion','guia_estudiante','guia_docente','evaluacion','rubrica','ticket_salida','actividad_dua','presentacion')),
  description TEXT,
  structure_json TEXT NOT NULL DEFAULT '{}',
  required_fields_json TEXT NOT NULL DEFAULT '[]',
  optional_fields_json TEXT NOT NULL DEFAULT '[]',
  default_prompt TEXT,
  methodology_id TEXT,
  subject_id TEXT,
  level_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'seed_pedagogico' CHECK(source_type IN ('mineduc','seed_pedagogico','docente')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (level_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- ============================================================
-- 4. RECURSOS GENERADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS generated_resources (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('planificacion','guia_estudiante','guia_docente','evaluacion','rubrica','ticket_salida','actividad_dua','presentacion','otro')),
  content TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '{}',
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  objective_code TEXT,
  objective_id TEXT,
  methodology_id TEXT,
  indicators_used_json TEXT NOT NULL DEFAULT '[]',
  skills_used_json TEXT NOT NULL DEFAULT '[]',
  attitudes_used_json TEXT NOT NULL DEFAULT '[]',
  prompt_used TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  dua_considerations_json TEXT NOT NULL DEFAULT '[]',
  evaluation_type TEXT,
  duration_minutes INTEGER,
  context_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE SET NULL,
  FOREIGN KEY (methodology_id) REFERENCES methodologies(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. PRESENTACIONES GENERADAS
-- ============================================================

CREATE TABLE IF NOT EXISTS generated_presentations (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  slides_json TEXT NOT NULL DEFAULT '[]',
  slide_count INTEGER NOT NULL DEFAULT 0,
  visual_style TEXT,
  include_images INTEGER NOT NULL DEFAULT 1,
  prefer_regional_context TEXT NOT NULL DEFAULT 'chile' CHECK(prefer_regional_context IN ('chile','latam','general')),
  image_prompts_json TEXT NOT NULL DEFAULT '[]',
  exported_format TEXT CHECK(exported_format IN ('pptx','pdf','html','revealjs')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resource_id) REFERENCES generated_resources(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. FUENTES CURRICULARES
-- ============================================================

CREATE TABLE IF NOT EXISTS curriculum_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'mineduc' CHECK(source_type IN ('mineduc','biblioteca_mineduc','otro_oficial')),
  description TEXT,
  last_synced_at TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','failed','partial')),
  items_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 7. DOCUMENTOS DE BÚSQUEDA (para motor de búsqueda)
-- ============================================================

CREATE TABLE IF NOT EXISTS search_documents (
  id TEXT PRIMARY KEY,
  doc_type TEXT NOT NULL CHECK(doc_type IN ('objective','indicator','skill','attitude','methodology','template','resource')),
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT,
  subject TEXT,
  axis TEXT,
  objective_code TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  search_vector TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_search_doc_type ON search_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_search_level ON search_documents(level);
CREATE INDEX IF NOT EXISTS idx_search_subject ON search_documents(subject);
CREATE INDEX IF NOT EXISTS idx_search_oa_code ON search_documents(objective_code);

-- ============================================================
-- 8. EJECUCIONES DE AGENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  user_id TEXT,
  input_json TEXT NOT NULL DEFAULT '{}',
  context_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT NOT NULL DEFAULT '{}',
  curriculum_context_json TEXT NOT NULL DEFAULT '{}',
  ai_provider TEXT,
  ai_model TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending','running','completed','failed','cancelled')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON agent_runs(created_at DESC);

-- ============================================================
-- 9. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_eval_indicators_objective ON evaluation_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_eval_indicators_source ON evaluation_indicators(source_type);
CREATE INDEX IF NOT EXISTS idx_curricular_skills_subject ON curricular_skills(subject_id);
CREATE INDEX IF NOT EXISTS idx_curricular_attitudes_subject ON curricular_attitudes(subject_id);
CREATE INDEX IF NOT EXISTS idx_methodology_strategies_methodology ON methodology_strategies(methodology_id);
CREATE INDEX IF NOT EXISTS idx_resource_templates_type ON resource_templates(type);
CREATE INDEX IF NOT EXISTS idx_generated_resources_user ON generated_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_resources_objective ON generated_resources(objective_id);
CREATE INDEX IF NOT EXISTS idx_generated_resources_type ON generated_resources(type);
CREATE INDEX IF NOT EXISTS idx_generated_resources_level ON generated_resources(level);
CREATE INDEX IF NOT EXISTS idx_generated_resources_subject ON generated_resources(subject);
CREATE INDEX IF NOT EXISTS idx_generated_presentations_resource ON generated_presentations(resource_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_sources_url ON curriculum_sources(url);
