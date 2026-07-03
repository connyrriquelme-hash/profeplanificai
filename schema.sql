PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS objetivos_aprendizaje;
DROP TABLE IF EXISTS unidades;
DROP TABLE IF EXISTS asignaturas;
DROP TABLE IF EXISTS niveles;

CREATE TABLE niveles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT ''
);

CREATE TABLE asignaturas (
  id TEXT PRIMARY KEY,
  nivel_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE,
  UNIQUE (nivel_id, nombre)
);

CREATE TABLE unidades (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  numero INTEGER NOT NULL CHECK (numero > 0),
  titulo TEXT NOT NULL,
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE,
  UNIQUE (asignatura_id, numero)
);

CREATE TABLE objetivos_aprendizaje (
  id TEXT PRIMARY KEY,
  unidad_id TEXT NOT NULL,
  codigo_oa TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  habilidades_csv TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE,
  UNIQUE (unidad_id, codigo_oa)
);

CREATE INDEX idx_asignaturas_nivel ON asignaturas(nivel_id);
CREATE INDEX idx_unidades_asignatura ON unidades(asignatura_id);
CREATE INDEX idx_oa_unidad ON objetivos_aprendizaje(unidad_id);
CREATE INDEX idx_oa_codigo ON objetivos_aprendizaje(codigo_oa);

INSERT INTO niveles (id, nombre, descripcion) VALUES
('5-basico', '5° Básico', 'Quinto año de Educación Básica del currículum chileno.');

INSERT INTO asignaturas (id, nivel_id, nombre) VALUES
('ciencias-naturales-5-basico', '5-basico', 'Ciencias Naturales');

INSERT INTO unidades (id, asignatura_id, numero, titulo) VALUES
('cn-5b-u1', 'ciencias-naturales-5-basico', 1, 'La diversidad de la vida y la organización de los seres vivos');

INSERT INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
(
  'cn-5b-oa1',
  'cn-5b-u1',
  'OA 1',
  'Reconocer y explicar que los seres vivos están formados por una o más células y que estas se organizan en tejidos, órganos y sistemas.',
  'observar,comparar,describir,usar modelos,comunicar'
),
(
  'cn-5b-oa2',
  'cn-5b-u1',
  'OA 2',
  'Identificar y describir, por medio de modelos, las estructuras básicas del sistema digestivo y sus funciones principales en el proceso de digestión.',
  'identificar,describir,modelar,explicar,relacionar estructura y función'
);
