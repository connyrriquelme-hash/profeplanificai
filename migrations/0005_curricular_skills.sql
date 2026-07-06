-- 0005_curricular_skills.sql
-- Aditiva: agrega habilidades curriculares por nivel/asignatura y las liga con OA
-- NO modifica tablas existentes de OA, indicadores, ni skills oficiales

-- ============================================================
-- 1. Enriquecer curricular_skills (tabla ya existe, vacía)
-- ============================================================
ALTER TABLE curricular_skills ADD COLUMN nivel_desde TEXT;
ALTER TABLE curricular_skills ADD COLUMN nivel_hasta TEXT;
ALTER TABLE curricular_skills ADD COLUMN actividades_principales_json TEXT;

-- ============================================================
-- 2. Enriquecer habilidades (tabla ya existe, vacía)
-- ============================================================
ALTER TABLE habilidades ADD COLUMN curricular_skill_id TEXT;
ALTER TABLE habilidades ADD COLUMN descripcion TEXT;
ALTER TABLE habilidades ADD COLUMN unidad_numero INTEGER;
ALTER TABLE habilidades ADD COLUMN keywords_json TEXT;

-- ============================================================
-- 3. Crear tabla de ligado OA ↔ habilidades curriculares
-- ============================================================
CREATE TABLE IF NOT EXISTS oa_habilidades_curriculares (
  id TEXT PRIMARY KEY,
  objetivo_id TEXT NOT NULL,
  habilidad_id TEXT NOT NULL,
  match_source TEXT NOT NULL DEFAULT 'seed_rule',
  confidence REAL DEFAULT 0.75,
  rationale TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(objetivo_id, habilidad_id)
);

CREATE INDEX IF NOT EXISTS idx_oa_hab_cur_objetivo ON oa_habilidades_curriculares(objetivo_id);
CREATE INDEX IF NOT EXISTS idx_oa_hab_cur_habilidad ON oa_habilidades_curriculares(habilidad_id);

-- ============================================================
-- 4. Seed: curricular_skills (6 grupos principales)
-- ============================================================
INSERT OR IGNORE INTO curricular_skills (id, code, name, description, nivel_desde, nivel_hasta, actividades_principales_json, source_type)
VALUES
-- Educación Parvularia
('hab_parv_transversal', 'PARV-TRANS', 'Transversal (Ámbitos y Núcleos)',
 'Habilidades transversales de Educación Parvularia: ámbitos y núcleos del currículum nacional.',
 'Prekínder', 'Kínder',
 '["Desarrollo integral a través del juego y la exploración del entorno","Formación de la identidad, autonomía y convivencia democrática","Iniciación a la lectura, escritura y lenguajes artísticos","Exploración natural y nociones lógico-matemáticas iniciales"]',
 'mineduc'),

-- Lenguaje y Comunicación (1° Básico a 2° Medio)
('hab_lenguaje_basica_media', 'LEN-BM', 'Lenguaje y Comunicación',
 'Habilidades de Lenguaje y Comunicación: lectura, escritura, comunicación oral e investigación.',
 '1° Básico', '2° Medio',
 '["Lectura: comprender, interpretar y disfrutar textos escritos","Escritura: producir textos escritos con claridad y coherencia","Comunicación Oral: expresarse oralmente con claridad y fluidez","Investigación: buscar, selecting y organizar información de diversas fuentes"]',
 'mineduc'),

-- Matemática (1° Básico a 2° Medio)
('hab_matematica_basica_media', 'MAT-BM', 'Matemática',
 'Habilidades de Matemática: resolver problemas, argumentar y comunicar, modelar, representar.',
 '1° Básico', '2° Medio',
 '["Resolver problemas: emplear diversas estrategias para resolver problemas","Argumentar y comunicar: justificar y comunicar razonamientos matemáticos","Modelar: representar situaciones del entorno con modelos matemáticos","Representar: usar representaciones pictóricas, simbólicas y formales"]',
 'mineduc'),

-- Ciencias Naturales (1° Básico a 2° Medio)
('hab_ciencias_basica_media', 'CIE-BM', 'Ciencias Naturales',
 'Habilidades de Ciencias Naturales: observar, planificar investigaciones, procesar evidencia, evaluar y comunicar.',
 '1° Básico', '2° Medio',
 '["Observar y plantear preguntas: formular interrogantes sobre el entorno natural","Planificar y conducir investigaciones: diseñar experimentos y recolectar datos","Procesar y analizar la evidencia: organizar y interpretar resultados","Evaluar y comunicar: comunicar hallazgos y evaluar fuentes de información"]',
 'mineduc'),

-- Historia, Geografía y Ciencias Sociales (1° Básico a 2° Medio)
('hab_historia_basica_media', 'HIS-BM', 'Historia, Geografía y Ciencias Sociales',
 'Habilidades de Historia, Geografía y Ciencias Sociales: pensamiento temporal y espacial, análisis de fuentes, pensamiento crítico.',
 '1° Básico', '2° Medio',
 '["Pensamiento temporal y espacial: ubicar hechos y fenómenos en tiempo y espacio","Análisis y trabajo con fuentes: identificar, interpretar y evaluar fuentes diversas","Pensamiento crítico: analizar causas, consecuencias y múltiples perspectivas"]',
 'mineduc'),

-- Siglo XXI (3° y 4° Medio)
('hab_siglo_xxi_media', 'XXI-MED', 'Transversal Siglo XXI',
 'Habilidades transversales Siglo XXI: maneras de pensar, trabajar, herramientas para trabajar, vivir en el mundo.',
 '3° Medio', '4° Medio',
 '["Maneras de pensar: creatividad, pensamiento crítico, metacognición","Maneras de trabajar: colaboración, liderazgo, responsabilidad","Herramientas para trabajar: alfabetización digital, pensamiento computacional","Maneras de vivir en el mundo: ciudadanía global, conciencia cultural, sostenibilidad"]',
 'mineduc');

-- ============================================================
-- 5. Seed: habilidades (22 sub-unidades)
-- ============================================================
INSERT OR IGNORE INTO habilidades (id, nombre, asignatura_id, curricular_skill_id, descripcion, unidad_numero, keywords_json)
VALUES
-- Parvularia (3 unidades)
('hab_parv_desarrollo_personal_social', 'Desarrollo Personal y Social',
 (SELECT id FROM asignaturas WHERE nombre = 'Desarrollo personal y social' LIMIT 1),
 'hab_parv_transversal',
 'Formación de identidad, autonomía y convivencia democrática en párvulos.',
 1,
 '["identidad","autonomía","convivencia","juego","exploración"]'),

('hab_parv_comunicacion_integral', 'Comunicación Integral',
 (SELECT id FROM asignaturas WHERE nombre = 'Comunicación integral' LIMIT 1),
 'hab_parv_transversal',
 'Iniciación a la lectura, escritura y lenguajes artísticos en párvulos.',
 2,
 '["lectura","escritura","lenguaje","expresión","comunicación"]'),

('hab_parv_interaccion_entorno', 'Interacción y Comprensión del Entorno',
 (SELECT id FROM asignaturas WHERE nombre = 'Interacción y comprensión del entorno' LIMIT 1),
 'hab_parv_transversal',
 'Exploración natural y nociones lógico-matemáticas iniciales.',
 3,
 '["exploración","entorno","naturaleza","matemáticas","inicial"]'),

-- Lenguaje y Comunicación (4 unidades)
('hab_len_lectura', 'Lectura',
 (SELECT id FROM asignaturas WHERE nombre = 'Lenguaje y Comunicación' LIMIT 1),
 'hab_lenguaje_basica_media',
 'Comprender, interpretar y disfrutar textos escritos.',
 1,
 '["lectura","texto","comprensión","interpretar","leer","biblioteca"]'),

('hab_len_escritura', 'Escritura',
 (SELECT id FROM asignaturas WHERE nombre = 'Lenguaje y Comunicación' LIMIT 1),
 'hab_lenguaje_basica_media',
 'Producir textos escritos con claridad y coherencia.',
 2,
 '["escritura","redactar","producir","texto","coherencia","borrador"]'),

('hab_len_comunicacion_oral', 'Comunicación Oral',
 (SELECT id FROM asignaturas WHERE nombre = 'Lenguaje y Comunicación' LIMIT 1),
 'hab_lenguaje_basica_media',
 'Expresarse oralmente con claridad y fluidez.',
 3,
 '["oral","diálogo","exposición","hablar","escuchar","presentación"]'),

('hab_len_investigacion', 'Investigación',
 (SELECT id FROM asignaturas WHERE nombre = 'Lenguaje y Comunicación' LIMIT 1),
 'hab_lenguaje_basica_media',
 'Buscar, seleccionar y organizar información de diversas fuentes.',
 4,
 '["investigación","fuentes","información","buscar","seleccionar","organizar"]'),

-- Matemática (4 unidades)
('hab_mat_resolver_problemas', 'Resolver problemas',
 (SELECT id FROM asignaturas WHERE nombre = 'Matemática' LIMIT 1),
 'hab_matematica_basica_media',
 'Emplear diversas estrategias para resolver problemas.',
 1,
 '["resolver","problema","estrategia","calcular","operar","solución"]'),

('hab_mat_argumentar_comunicar', 'Argumentar y comunicar',
 (SELECT id FROM asignaturas WHERE nombre = 'Matemática' LIMIT 1),
 'hab_matematica_basica_media',
 'Justificar y comunicar razonamientos matemáticos.',
 2,
 '["argumentar","justificar","explicar","comunicar","razonamiento","demostrar"]'),

('hab_mat_modelar', 'Modelar',
 (SELECT id FROM asignaturas WHERE nombre = 'Matemática' LIMIT 1),
 'hab_matematica_basica_media',
 'Representar situaciones del entorno con modelos matemáticos.',
 3,
 '["modelar","función","gráfico","representar","situación","entorno"]'),

('hab_mat_representar', 'Representar',
 (SELECT id FROM asignaturas WHERE nombre = 'Matemática' LIMIT 1),
 'hab_matematica_basica_media',
 'Usar representaciones pictóricas, simbólicas y formales.',
 4,
 '["representar","esquema","pictórico","simbólico","formal","diagrama"]'),

-- Ciencias Naturales (4 unidades)
('hab_cie_observar_preguntar', 'Observar y plantear preguntas',
 (SELECT id FROM asignaturas WHERE nombre = 'Ciencias Naturales' LIMIT 1),
 'hab_ciencias_basica_media',
 'Formular interrogantes sobre el entorno natural.',
 1,
 '["observar","pregunta","hipótesis","curiosidad","explorar","natural"]'),

('hab_cie_planificar_investigar', 'Planificar y conducir investigaciones',
 (SELECT id FROM asignaturas WHERE nombre = 'Ciencias Naturales' LIMIT 1),
 'hab_ciencias_basica_media',
 'Diseñar experimentos y recolectar datos.',
 2,
 '["investigar","experimento","variable","diseño","datos","recolectar"]'),

('hab_cie_procesar_evidencia', 'Procesar y analizar la evidencia',
 (SELECT id FROM asignaturas WHERE nombre = 'Ciencias Naturales' LIMIT 1),
 'hab_ciencias_basica_media',
 'Organizar e interpretar resultados.',
 3,
 '["datos","evidencia","tabla","gráfico","analizar","interpretar","resultado"]'),

('hab_cie_evaluar_comunicar', 'Evaluar y comunicar',
 (SELECT id FROM asignaturas WHERE nombre = 'Ciencias Naturales' LIMIT 1),
 'hab_ciencias_basica_media',
 'Comunicar hallazgos y evaluar fuentes de información.',
 4,
 '["comunicar","presentar","conclusiones","evaluar","fuente","hallazgo"]'),

-- Historia, Geografía y Ciencias Sociales (3 unidades)
('hab_his_pensamiento_temporal_espacial', 'Pensamiento temporal y espacial',
 (SELECT id FROM asignaturas WHERE nombre = 'Historia, Geografía y Ciencias Sociales' LIMIT 1),
 'hab_historia_basica_media',
 'Ubicar hechos y fenómenos en tiempo y espacio.',
 1,
 '["temporal","espacial","tiempo","espacio","mapa","cronología","ubicar"]'),

('hab_his_analisis_fuentes', 'Análisis y trabajo con fuentes',
 (SELECT id FROM asignaturas WHERE nombre = 'Historia, Geografía y Ciencias Sociales' LIMIT 1),
 'hab_historia_basica_media',
 'Identificar, interpretar y evaluar fuentes diversas.',
 2,
 '["fuentes","fuente","documento","análisis","interpretar","evaluar","primaria","secundaria"]'),

('hab_his_pensamiento_critico', 'Pensamiento crítico',
 (SELECT id FROM asignaturas WHERE nombre = 'Historia, Geografía y Ciencias Sociales' LIMIT 1),
 'hab_historia_basica_media',
 'Analizar causas, consecuencias y múltiples perspectivas.',
 3,
 '["crítico","argumento","prejuicio","causas","consecuencias","perspectiva","análisis"]'),

-- Siglo XXI (4 unidades)
('hab_xxi_maneras_pensar', 'Maneras de pensar',
 NULL,
 'hab_siglo_xxi_media',
 'Creatividad, pensamiento crítico, metacognición.',
 1,
 '["creatividad","crítico","metacognición","pensar","innovación","curiosidad"]'),

('hab_xxi_maneras_trabajar', 'Maneras de trabajar',
 NULL,
 'hab_siglo_xxi_media',
 'Colaboración, liderazgo, responsabilidad.',
 2,
 '["colaboración","liderazgo","responsabilidad","equipo","trabajo","cooperación"]'),

('hab_xxi_herramientas_trabajar', 'Herramientas para trabajar',
 NULL,
 'hab_siglo_xxi_media',
 'Alfabetización digital, pensamiento computacional.',
 3,
 '["digital","computacional","tecnología","herramientas","alfabetización","programación"]'),

('hab_xxi_vivir_mundo', 'Maneras de vivir en el mundo',
 NULL,
 'hab_siglo_xxi_media',
 'Ciudadanía global, conciencia cultural, sostenibilidad.',
 4,
 '["ciudadanía","global","cultural","sostenibilidad","mundo","diversidad","medio ambiente"]');

-- ============================================================
-- 6. Índices adicionales
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_habilidades_curricular_skill ON habilidades(curricular_skill_id);
CREATE INDEX IF NOT EXISTS idx_habilidades_asignatura ON habilidades(asignatura_id);
CREATE INDEX IF NOT EXISTS idx_curricular_skills_nivel ON curricular_skills(nivel_desde, nivel_hasta);
