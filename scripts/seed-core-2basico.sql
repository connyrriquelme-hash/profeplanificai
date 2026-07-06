PRAGMA foreign_keys = ON;

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

CREATE INDEX IF NOT EXISTS idx_core_indicators_objective ON curriculum_indicators(objective_id);
CREATE INDEX IF NOT EXISTS idx_core_indicators_oa ON curriculum_indicators(oa_code);

INSERT OR REPLACE INTO niveles (id, nombre, descripcion) VALUES
('2-basico', '2° Básico', 'Segundo año de Educación Básica del currículum chileno.');

INSERT OR REPLACE INTO asignaturas (id, nivel_id, nombre) VALUES
('ciencias-naturales-2-basico', '2-basico', 'Ciencias Naturales'),
('lenguaje-comunicacion-2-basico', '2-basico', 'Lenguaje y Comunicación'),
('matematica-2-basico', '2-basico', 'Matemática');

INSERT OR REPLACE INTO unidades (id, asignatura_id, numero, titulo) VALUES
('cn-2b-u1', 'ciencias-naturales-2-basico', 1, 'Los seres vivos y su hábitat'),
('lc-2b-u1', 'lenguaje-comunicacion-2-basico', 1, 'Lectura y comprensión de textos'),
('mat-2b-u1', 'matematica-2-basico', 1, 'Números y operaciones');

INSERT OR REPLACE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
('cn-2b-oa1', 'cn-2b-u1', 'OA 1', 'Observar, describir y clasificar los animales en vertebrados e invertebrados, considerando características como cubierta corporal, presencia de columna vertebral y forma de desplazamiento.', 'observar,describir,clasificar,comparar,comunicar'),
('cn-2b-oa2', 'cn-2b-u1', 'OA 2', 'Observar y comparar características de distintos hábitats, identificando necesidades de los seres vivos y formas en que estos se adaptan a su ambiente.', 'observar,comparar,relacionar,registrar,comunicar'),
('lc-2b-oa5', 'lc-2b-u1', 'OA 5', 'Demostrar comprensión de narraciones leídas, extrayendo información explícita e implícita, reconstruyendo secuencias y expresando opiniones fundamentadas.', 'leer,comprender,inferir,secuenciar,comunicar'),
('mat-2b-oa3', 'mat-2b-u1', 'OA 3', 'Comparar y ordenar números naturales hasta 100 de menor a mayor y viceversa, usando material concreto, representaciones pictóricas y simbólicas.', 'representar,comparar,ordenar,argumentar,comunicar');

INSERT OR REPLACE INTO curriculum_indicators (id, level, grade, subject, oa_code, objective_id, skill_id, track, status, indicator_text) VALUES
('ind-cn-2b-oa1-1', '2-basico', '2° Básico', 'Ciencias Naturales', 'OA 1', 'cn-2b-oa1', '', 'core', 'active', 'Identifican características observables de animales vertebrados e invertebrados.'),
('ind-cn-2b-oa1-2', '2-basico', '2° Básico', 'Ciencias Naturales', 'OA 1', 'cn-2b-oa1', '', 'core', 'active', 'Clasifican animales según criterios dados, explicando verbalmente su decisión.'),
('ind-cn-2b-oa1-3', '2-basico', '2° Básico', 'Ciencias Naturales', 'OA 1', 'cn-2b-oa1', '', 'core', 'active', 'Comunican semejanzas y diferencias entre grupos de animales usando vocabulario científico simple.'),
('ind-cn-2b-oa2-1', '2-basico', '2° Básico', 'Ciencias Naturales', 'OA 2', 'cn-2b-oa2', '', 'core', 'active', 'Describen características de hábitats cercanos y los seres vivos que los habitan.'),
('ind-cn-2b-oa2-2', '2-basico', '2° Básico', 'Ciencias Naturales', 'OA 2', 'cn-2b-oa2', '', 'core', 'active', 'Relacionan necesidades de los seres vivos con elementos del hábitat, como agua, alimento y refugio.'),
('ind-lc-2b-oa5-1', '2-basico', '2° Básico', 'Lenguaje y Comunicación', 'OA 5', 'lc-2b-oa5', '', 'core', 'active', 'Responden preguntas explícitas e implícitas sobre narraciones leídas o escuchadas.'),
('ind-lc-2b-oa5-2', '2-basico', '2° Básico', 'Lenguaje y Comunicación', 'OA 5', 'lc-2b-oa5', '', 'core', 'active', 'Ordenan los principales acontecimientos de una narración en una secuencia lógica.'),
('ind-mat-2b-oa3-1', '2-basico', '2° Básico', 'Matemática', 'OA 3', 'mat-2b-oa3', '', 'core', 'active', 'Comparan números hasta 100 usando material concreto o representaciones.'),
('ind-mat-2b-oa3-2', '2-basico', '2° Básico', 'Matemática', 'OA 3', 'mat-2b-oa3', '', 'core', 'active', 'Ordenan números de menor a mayor y justifican la estrategia utilizada.');
