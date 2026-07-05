-- Schema migration to match generate-curriculum-sql.ts expectations
-- Run before 0003_curriculum_masivo.sql

DROP TABLE IF EXISTS textos_escolares;
DROP TABLE IF EXISTS unidades;
DROP TABLE IF EXISTS objetivos_aprendizaje;
DROP TABLE IF EXISTS nivel_asignatura;
DROP TABLE IF EXISTS asignaturas;

-- niveles already exists, add descripcion column if missing
-- (ALTER TABLE IF NOT EXISTS is not supported, use PRAGMA check)
CREATE TABLE IF NOT EXISTS niveles_new (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO niveles_new (id, nombre, descripcion) SELECT id, nombre, '' FROM niveles;
DROP TABLE IF EXISTS niveles;
ALTER TABLE niveles_new RENAME TO niveles;

CREATE TABLE IF NOT EXISTS asignaturas (
  id TEXT PRIMARY KEY,
  nivel_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE,
  UNIQUE (nivel_id, nombre)
);

CREATE TABLE IF NOT EXISTS unidades (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  numero INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objetivos_aprendizaje (
  id TEXT PRIMARY KEY,
  unidad_id TEXT NOT NULL,
  codigo_oa TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  habilidades_csv TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE
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
