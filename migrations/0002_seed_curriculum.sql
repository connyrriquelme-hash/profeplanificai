-- Migración: Poblar asignaturas del currículum chileno para 5° Básico
-- Tablas: niveles, asignaturas, unidades, objetivos_aprendizaje
-- Compatible con SQLite / Cloudflare D1

-- ============================================================
-- 1. ASIGNATURAS (3 nuevas para 5° Básico)
-- ============================================================
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-comunicacion-5-basico', '5-basico', 'Lenguaje y Comunicación'),
  ('matematica-5-basico',            '5-basico', 'Matemática'),
  ('historia-geografia-cs-5-basico', '5-basico', 'Historia, Geografía y Ciencias Sociales');

-- ============================================================
-- 2. UNIDADES (1 por asignatura)
-- ============================================================

-- Lenguaje y Comunicación — Unidad 1
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('leng-5b-u1', 'lenguaje-comunicacion-5-basico', 1, 'Comprensión de textos escritos');

-- Matemática — Unidad 1
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('mate-5b-u1', 'matematica-5-basico', 1, 'Fracciones y números decimales');

-- Historia, Geografía y Cs. Sociales — Unidad 1
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('hist-5b-u1', 'historia-geografia-cs-5-basico', 1, 'Chile: regiones naturales y población');

-- ============================================================
-- 3. OBJETIVOS DE APRENDIZAJE (2 por unidad)
-- ============================================================

-- -------------------------------------------------------
-- Lenguaje y Comunicación — OA de comprensión lectora
-- -------------------------------------------------------
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  (
    'leng-5b-oa1',
    'leng-5b-u1',
    'OA 1',
    'Leer comprensivamente textos escritos de diverso tipo, identificando la idea principal y los detalles relevantes.',
    'leer,identificar idea principal,identificar detalles,infiriendo'
  ),
  (
    'leng-5b-oa2',
    'leng-5b-u1',
    'OA 2',
    'Reconocer y aplicar estrategias de lectura: anticipación, predicción, formulación de preguntas y resumen.',
    'estrategias de lectura,anticipar,predicir,formular preguntas,resumir'
  );

-- -------------------------------------------------------
-- Matemática — OA de fracciones y decimales
-- -------------------------------------------------------
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  (
    'mate-5b-oa1',
    'mate-5b-u1',
    'OA 1',
    'Representar fracciones propias e impropias y su equivalencia con decimales, usando modelos concretos y gráficos.',
    'representar,fracciones,decimales,modelo concreto,modelo gráfico'
  ),
  (
    'mate-5b-oa2',
    'mate-5b-u1',
    'OA 2',
    'Sumar y restar fracciones con denominadores distintos, aplicando criterios de equivalencia y simplificación.',
    'sumar,restar,fracciones,denominador común,equivalencia,simplificar'
  );

-- -------------------------------------------------------
-- Historia, Geografía y Cs. Sociales — OA de regiones
-- -------------------------------------------------------
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  (
    'hist-5b-oa1',
    'hist-5b-u1',
    'OA 1',
    'Identificar las regiones naturales de Chile y describir sus características geográficas, climáticas y de vegetación.',
    'identificar,describir,regiones naturales,geografía,clima,vegetación'
  ),
  (
    'hist-5b-oa2',
    'hist-5b-u1',
    'OA 2',
    'Explicar la relación entre las regiones naturales y las actividades económicas de la población chilena.',
    'explicar,relacionar,actividades económicas,población,regiones'
  );
