-- Migration 001: Initial schema for PlanificaIA Chile
-- D1 database: planificaia-db

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'docente',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS drive_folders (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS colaboracion_comentarios (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES colaboracion_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oa_favoritos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  oa_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, oa_id)
);

CREATE INDEX IF NOT EXISTS idx_planes_usuario ON planes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recursos_usuario ON recursos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_usuario ON evaluaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_drive_usuario ON drive_items(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cursos_usuario ON cursos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON estudiantes(curso_id);
CREATE INDEX IF NOT EXISTS idx_colaboracion_posts_fecha ON colaboracion_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_post ON colaboracion_comentarios(post_id);
