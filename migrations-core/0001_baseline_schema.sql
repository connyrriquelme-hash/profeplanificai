-- Migration 0001 (CORE_DB baseline): reproduce el esquema real de producción
--
-- CORE_DB (binding CORE_DB, D1 database profeplanificai_db) es la segunda
-- base de datos del proyecto (currículum + datos legacy de usuarios/planes/
-- evaluaciones/etc. de una versión anterior de la app). A diferencia de DB
-- (planificaia-db), que sí tenía migrations/ commiteadas y trackeadas,
-- CORE_DB nunca tuvo carpeta de migraciones ni script de apply -- su
-- esquema de producción no era reproducible desde este repo. Encontrado en
-- la auditoría completa de hoy.
--
-- Este archivo se generó introspectando el esquema real en vivo
-- (SELECT sql FROM sqlite_master WHERE type IN ('table','index')) el
-- 2026-09-XX, así que es exactamente lo que ya existe en producción --
-- aplicarlo es un no-op (CREATE TABLE/INDEX IF NOT EXISTS), no una
-- migración real de esquema. De acá en adelante, cualquier cambio a
-- CORE_DB debe ir en un archivo nuevo 0002_*.sql etc. en esta misma
-- carpeta, igual que ya se hace en migrations/ para DB.
--
-- Aplicar con: npx wrangler d1 migrations apply CORE_DB --remote
-- (usa migrations_dir = "migrations-core" configurado en wrangler.toml
-- para el binding CORE_DB; ver también migrations_table =
-- "d1_migrations_core", una tabla de tracking separada de la que usa DB).
--
-- Se excluye la tabla interna `_cf_KV` (gestionada automáticamente por
-- Cloudflare, no es responsabilidad de esta app crearla).

CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  value_key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(category, value_key)
);

CREATE TABLE IF NOT EXISTS asignaturas (
  id TEXT PRIMARY KEY,
  nivel_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE,
  UNIQUE (nivel_id, nombre)
);

CREATE TABLE IF NOT EXISTS attitudes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  official_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS axes (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS colaboracion_comentarios (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES colaboracion_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS colaboracion_posts (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL,
  nivel TEXT DEFAULT '',
  asignatura TEXT DEFAULT '',
  likes INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cycle TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS curriculum_indicators (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  oa_code TEXT NOT NULL DEFAULT '',
  objective_id TEXT NOT NULL DEFAULT '',
  skill_id TEXT DEFAULT '',
  track TEXT NOT NULL DEFAULT 'core',
  status TEXT NOT NULL DEFAULT 'active',
  indicator_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cursos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  nivel TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  estudiantes INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drive_folders (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drive_items (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'documento',
  contenido TEXT NOT NULL,
  nivel TEXT DEFAULT '',
  asignatura TEXT DEFAULT '',
  carpeta_id TEXT,
  tamano INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS estudiantes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  observaciones TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluaciones (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo_eval TEXT NOT NULL,
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  oa TEXT DEFAULT '',
  tema TEXT DEFAULT '',
  habilidad TEXT DEFAULT '',
  dificultad TEXT DEFAULT 'Progresiva',
  n_preg INTEGER DEFAULT 10,
  config TEXT DEFAULT '{}',
  contenido TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS niveles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS oa_favoritos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  oa_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, oa_id)
);

CREATE TABLE IF NOT EXISTS objective_attitudes (
  objective_id TEXT NOT NULL,
  attitude_id TEXT NOT NULL,
  PRIMARY KEY (objective_id, attitude_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (attitude_id) REFERENCES attitudes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objective_skills (
  objective_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  PRIMARY KEY (objective_id, skill_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS objetivos_aprendizaje (
  id TEXT PRIMARY KEY,
  unidad_id TEXT NOT NULL,
  codigo_oa TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  habilidades_csv TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS planes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo_plan TEXT NOT NULL DEFAULT 'clase',
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  curso TEXT DEFAULT '',
  eje TEXT DEFAULT '',
  oa TEXT DEFAULT '',
  tema TEXT DEFAULT '',
  duracion TEXT DEFAULT '90 minutos',
  estudiantes INTEGER DEFAULT 30,
  contexto TEXT DEFAULT '',
  necesidades TEXT DEFAULT '',
  contenido TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS recursos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo_recurso TEXT NOT NULL,
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL,
  asignatura TEXT NOT NULL,
  oa TEXT DEFAULT '',
  contenido TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  subject_id TEXT NOT NULL,
  official_text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS textos_escolares (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  actividades TEXT NOT NULL DEFAULT '[]',
  planificacion_detalle TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS unidades (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'docente',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_config(active);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(category);
CREATE INDEX IF NOT EXISTS idx_colaboracion_posts_fecha ON colaboracion_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_post ON colaboracion_comentarios(post_id);
CREATE INDEX IF NOT EXISTS idx_core_indicators_oa ON curriculum_indicators(oa_code);
CREATE INDEX IF NOT EXISTS idx_core_indicators_objective ON curriculum_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_cursos_usuario ON cursos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_drive_usuario ON drive_items(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON estudiantes(curso_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_usuario ON evaluaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_objectives_axis ON objectives(axis_id);
CREATE INDEX IF NOT EXISTS idx_objectives_code ON objectives(code);
CREATE INDEX IF NOT EXISTS idx_objectives_course ON objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_objectives_subject ON objectives(subject_id);
CREATE INDEX IF NOT EXISTS idx_planes_usuario ON planes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_questions_objective ON questions(objective_id);
CREATE INDEX IF NOT EXISTS idx_recursos_usuario ON recursos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resources_objective ON resources(objective_id);
CREATE INDEX IF NOT EXISTS idx_subjects_normalized ON subjects(normalized_name);
