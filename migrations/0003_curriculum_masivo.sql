-- ============================================================
-- Migración 0003: Currículum masivo 1° Básico → 4° Medio
-- Generado automáticamente por scripts/generate-curriculum-sql.ts
-- Compatible con SQLite / Cloudflare D1
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. NIVELES
-- ============================================================
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('1-basico', '1° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('2-basico', '2° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('3-basico', '3° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('4-basico', '4° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('5-basico', '5° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('6-basico', '6° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('7-basico', '7° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('8-basico', '8° Básico', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('1-medio', '1° Medio', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('2-medio', '2° Medio', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('3-medio', '3° Medio', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('4-medio', '4° Medio', '');

-- ============================================================
-- 2. ASIGNATURAS
-- ============================================================
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-1-basico', '1-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-1-basico', '1-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-1-basico', '1-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico', '1-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-2-basico', '2-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-2-basico', '2-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-2-basico', '2-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico', '2-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-3-basico', '3-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-3-basico', '3-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-3-basico', '3-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico', '3-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-4-basico', '4-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-4-basico', '4-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-4-basico', '4-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico', '4-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-5-basico', '5-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-5-basico', '5-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-5-basico', '5-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico', '5-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-6-basico', '6-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-6-basico', '6-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-6-basico', '6-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico', '6-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-7-basico', '7-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-7-basico', '7-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-7-basico', '7-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico', '7-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-8-basico', '8-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-8-basico', '8-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-8-basico', '8-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico', '8-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-1-medio', '1-medio', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-1-medio', '1-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-1-medio', '1-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio', '1-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-2-medio', '2-medio', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-2-medio', '2-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-2-medio', '2-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio', '2-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-3-medio', '3-medio', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-3-medio', '3-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-3-medio', '3-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio', '3-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-4-medio', '4-medio', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-4-medio', '4-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-4-medio', '4-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio', '4-medio', 'Historia, Geografía y Ciencias Sociales');

-- ============================================================
-- 3. UNIDADES
-- ============================================================
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-1-basico-u1', 'lenguaje-y-comunicacion-1-basico', 1, 'Iniciación a la lectura y escritura');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-1-basico-u2', 'lenguaje-y-comunicacion-1-basico', 2, 'Producción de textos escritos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-basico-u1', 'matematica-1-basico', 1, 'Números y operaciones básicas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-1-basico-u1', 'ciencias-naturales-1-basico', 1, 'Mi cuerpo y los seres vivos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-u1', 'historia-geografia-y-ciencias-sociales-1-basico', 1, 'Mi entorno y comunidad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u1', 'lenguaje-y-comunicacion-2-basico', 1, 'Lectura comprensiva de textos narrativos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u2', 'lenguaje-y-comunicacion-2-basico', 2, 'Escritura de textos simples');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u1', 'matematica-2-basico', 1, 'Números hasta el 1000 y operaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u1', 'ciencias-naturales-2-basico', 1, 'Materia y energía');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-u1', 'historia-geografia-y-ciencias-sociales-2-basico', 1, 'Chile: mi país');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u1', 'lenguaje-y-comunicacion-3-basico', 1, 'Comprensión de textos informativos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u1', 'matematica-3-basico', 1, 'Tabla pitagórica y operaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u1', 'ciencias-naturales-3-basico', 1, 'Ecosistemas terrestres y acuáticos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u1', 'historia-geografia-y-ciencias-sociales-3-basico', 1, 'Pueblos originarios de Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u1', 'lenguaje-y-comunicacion-4-basico', 1, 'Géneros literarios: narración y descripción');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u1', 'matematica-4-basico', 1, 'Números naturales y fracciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u1', 'ciencias-naturales-4-basico', 1, 'Máquinas simples y su uso');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u1', 'historia-geografia-y-ciencias-sociales-4-basico', 1, 'Conquista y Colonia en Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-5-basico-u1', 'lenguaje-y-comunicacion-5-basico', 1, 'Comprensión de textos escritos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-5-basico-u1', 'matematica-5-basico', 1, 'Fracciones y números decimales');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-5-basico-u1', 'ciencias-naturales-5-basico', 1, 'La diversidad de la vida');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-u1', 'historia-geografia-y-ciencias-sociales-5-basico', 1, 'Chile: regiones naturales y población');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-6-basico-u1', 'matematica-6-basico', 1, 'Operaciones, fracciones y razones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-6-basico-u1', 'lenguaje-y-comunicacion-6-basico', 1, 'Profundización de la comprensión lectora');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-6-basico-u1', 'ciencias-naturales-6-basico', 1, 'El sistema solar y la Tierra');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-u1', 'historia-geografia-y-ciencias-sociales-6-basico', 1, 'Independencia de Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-7-basico-u1', 'lenguaje-y-comunicacion-7-basico', 1, 'Textos periodísticos y opinativos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u1', 'matematica-7-basico', 1, 'Álgebra elemental');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u1', 'ciencias-naturales-7-basico', 1, 'Células y tejidos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u1', 'historia-geografia-y-ciencias-sociales-7-basico', 1, 'La república en Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-8-basico-u1', 'lenguaje-y-comunicacion-8-basico', 1, 'Análisis de textos literarios');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u1', 'matematica-8-basico', 1, 'Funciones lineales y cuadráticas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-8-basico-u1', 'ciencias-naturales-8-basico', 1, 'Genética y evolución');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-u1', 'historia-geografia-y-ciencias-sociales-8-basico', 1, 'Chile en el siglo XX');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-1-medio-u1', 'lenguaje-y-comunicacion-1-medio', 1, 'Texto argumentativo y pensamiento crítico');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u1', 'matematica-1-medio', 1, 'Funciones y ecuaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-1-medio-u1', 'ciencias-naturales-1-medio', 1, 'Química: materia y transformaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u1', 'historia-geografia-y-ciencias-sociales-1-medio', 1, 'Chile en el siglo XXI');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-medio-u1', 'lenguaje-y-comunicacion-2-medio', 1, 'Análisis de textos filosóficos y ensayísticos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u1', 'matematica-2-medio', 1, 'Trigonometría y geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-medio-u1', 'ciencias-naturales-2-medio', 1, 'Física: movimiento y fuerzas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u1', 'historia-geografia-y-ciencias-sociales-2-medio', 1, 'Globalización y mundo contemporáneo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-medio-u1', 'lenguaje-y-comunicacion-3-medio', 1, 'Producción de textos académicos y creativos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-medio-u1', 'matematica-3-medio', 1, 'Probabilidad, estadística y cálculo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-medio-u1', 'ciencias-naturales-3-medio', 1, 'Biología molecular y biotecnología');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio-u1', 'historia-geografia-y-ciencias-sociales-3-medio', 1, 'Derechos humanos y democracia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-medio-u1', 'lenguaje-y-comunicacion-4-medio', 1, 'Síntesis y evaluación de textos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-medio-u1', 'matematica-4-medio', 1, 'Modelamiento matemático');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-medio-u1', 'ciencias-naturales-4-medio', 1, 'Ciencia, tecnología y sociedad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-u1', 'historia-geografia-y-ciencias-sociales-4-medio', 1, 'Chile: desafíos para el bicentenario');

-- ============================================================
-- 4. OBJETIVOS DE APRENDIZAJE
-- ============================================================
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-1', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 1', 'Reconocer y producir sonidos del habla y asociarlos con letras y sílabas.', 'fonología,conciencia fonológica,asociar grafemas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-2', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 2', 'Leer y escribir sílabas y palabras simples del vocabulario conocido.', 'lectura,escritura,sílabas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-3', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 3', 'Comprender textos escritos simples identificando su tema principal.', 'comprensión lectora,idea principal');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa2-1', 'lenguaje-y-comunicacion-1-basico-u2', 'OA 4', 'Escribir oraciones simples relacionadas con experiencias personales.', 'escritura,oraciones,expresión personal');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa2-2', 'lenguaje-y-comunicacion-1-basico-u2', 'OA 5', 'Dictar y escribir palabras y oraciones coherentes.', 'dictado,escritura,coherencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-1', 'matematica-1-basico-u1', 'OA 1', 'Contar, leer y escribir números del 0 al 100.', 'conteo,lectura numérica,escritura numérica');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-2', 'matematica-1-basico-u1', 'OA 2', 'Comparar y ordenar números naturales usando los símbolos <, >, =.', 'comparación,ordenamiento,desigualdad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-3', 'matematica-1-basico-u1', 'OA 3', 'Sumar y restar números de un dígito con resultado hasta 10.', 'suma,resta,cálculo mental');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-basico-oa1-1', 'ciencias-naturales-1-basico-u1', 'OA 1', 'Identificar y nombrar las partes principales del cuerpo humano.', 'identificación,anatomía básica,observación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-basico-oa1-2', 'ciencias-naturales-1-basico-u1', 'OA 2', 'Reconocer características de seres vivos y no vivos del entorno.', 'clasificación,observación,cuidado del medio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-1-basico-u1', 'OA 1', 'Identificar elementos de su entorno familiar, escolar y vecinal.', 'identificación,observación,sentido de pertenencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-1-basico-u1', 'OA 2', 'Reconocer normas de convivencia en la familia y la escuela.', 'normas,convivencia,responsabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-1', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 1', 'Leer comprensivamente textos narrativos identificando personajes, lugar y tiempo.', 'lectura,comprensión,elementos narrativos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-2', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 2', 'Reconocer la secuencia de eventos en un texto narrativo.', 'secuencia,orden cronológico,ordenamiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa2-1', 'lenguaje-y-comunicacion-2-basico-u2', 'OA 3', 'Escribir textos narrativos breves usando oraciones coherentes y conectores básicos.', 'escritura,conectores,coherencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa2-2', 'lenguaje-y-comunicacion-2-basico-u2', 'OA 4', 'Utilizar vocabulario variado en la producción de textos escritos.', 'vocabulario,expresión,variedad léxica');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-1', 'matematica-2-basico-u1', 'OA 1', 'Contar, leer y escribir números del 0 al 1000.', 'conteo,lectura,escritura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-2', 'matematica-2-basico-u1', 'OA 2', 'Sumar y restar números de dos dígitos con y sin reagrupación.', 'suma,resta,reagrupación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-3', 'matematica-2-basico-u1', 'OA 3', 'Resolver problemas de addition y sustracción del contexto diario.', 'resolución de problemas,contexto,operación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa1-1', 'ciencias-naturales-2-basico-u1', 'OA 1', 'Identificar estados de la materia: sólido, líquido y gaseoso.', 'identificación,estados de la materia,observación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa1-2', 'ciencias-naturales-2-basico-u1', 'OA 2', 'Reconocer fuentes de luz y calor en el entorno.', 'identificación,luz,calor');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-2-basico-u1', 'OA 1', 'Identificar elementos geográficos básicos de Chile: montañas, ríos, mar.', 'geografía,identificación,elementos naturales');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-2-basico-u1', 'OA 2', 'Reconocer símbolos patrios y su importancia en la identidad nacional.', 'símbolos,identidad,nación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-1', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 1', 'Leer comprensivamente textos informativos identificando la idea principal y datos relevantes.', 'comprensión,idea principal,datos relevantes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-2', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 2', 'Reconocer la estructura de textos informativos: título, subtitulo, párrafos.', 'estructura textos,organización,identificación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-1', 'matematica-3-basico-u1', 'OA 1', 'Reconocer la tabla pitagórica como herramienta para multiplicar.', 'tabla pitagórica,multiplicación,cálculo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-2', 'matematica-3-basico-u1', 'OA 2', 'Multiplicar y dividir números naturales de dos dígitos.', 'multiplicación,división,algoritmo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-3', 'matematica-3-basico-u1', 'OA 3', 'Resolver problemas que involucren las cuatro operaciones básicas.', 'resolución de problemas,operaciones,razonamiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa1-1', 'ciencias-naturales-3-basico-u1', 'OA 1', 'Identificar componentes bióticos y abióticos de un ecosistema.', 'identificación,componentes,ecosistema');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa1-2', 'ciencias-naturales-3-basico-u1', 'OA 2', 'Describir relaciones de alimentación en cadenas alimentarias.', 'cadena alimentaria,relaciones,descripción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-3-basico-u1', 'OA 1', 'Reconocer la existencia de pueblos originarios en Chile antes de la conquista.', 'historia,pueblos originarios,reconocimiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-3-basico-u1', 'OA 2', 'Identificar características culturales de al menos dos pueblos originarios.', 'cultura,identificación,diversidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-1', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 1', 'Leer comprensivamente textos literarios de los géneros narrativo y descriptivo.', 'comprensión,géneros literarios,lectura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-2', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 2', 'Identificar elementos constitutivos del cuento: personajes, escenario, conflicto, desenlace.', 'elementos del cuento,análisis,estructura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-1', 'matematica-4-basico-u1', 'OA 1', 'Leer, escribir y comparar números naturales hasta el millón.', 'lectura,escritura,comparación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-2', 'matematica-4-basico-u1', 'OA 2', 'Reconocer fracciones como partes de un todo y representarlas gráficamente.', 'fracciones,representación gráfica,partes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-3', 'matematica-4-basico-u1', 'OA 3', 'Sumar y restar fracciones con igual denominador.', 'suma,resta,fracciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa1-1', 'ciencias-naturales-4-basico-u1', 'OA 1', 'Identificar máquinas simples: palanca, plano inclinado, polea, tornillo, cuña.', 'identificación,máquinas simples,tecnología');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa1-2', 'ciencias-naturales-4-basico-u1', 'OA 2', 'Explicar cómo las máquinas simples facilitan las tareas cotidianas.', 'explicación,aplicación,vida cotidiana');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-4-basico-u1', 'OA 1', 'Reconocer los principales acontecimientos de la Conquista española en Chile.', 'historia,conquista,cronología');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-4-basico-u1', 'OA 2', 'Describir la vida en las ciudades coloniales y su organización social.', 'vida colonial,organización social,descripción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa1-1', 'lenguaje-y-comunicacion-5-basico-u1', 'OA 1', 'Leer comprensivamente textos escritos de diverso tipo, identificando la idea principal y los detalles relevantes.', 'leer,identificar idea principal,identificar detalles,infiriendo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa1-2', 'lenguaje-y-comunicacion-5-basico-u1', 'OA 2', 'Reconocer y aplicar estrategias de lectura: anticipación, predicción, formulación de preguntas y resumen.', 'estrategias de lectura,anticipar,predicir,formular preguntas,resumir');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa1-1', 'matematica-5-basico-u1', 'OA 1', 'Representar fracciones propias e impropias y su equivalencia con decimales, usando modelos concretos y gráficos.', 'representar,fracciones,decimales,modelo concreto,modelo gráfico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa1-2', 'matematica-5-basico-u1', 'OA 2', 'Sumar y restar fracciones con denominadores distintos, aplicando criterios de equivalencia y simplificación.', 'sumar,restar,fracciones,denominador común,equivalencia,simplificar');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa1-1', 'ciencias-naturales-5-basico-u1', 'OA 1', 'Reconocer y explicar que los seres vivos están formados por una o más células y que estas se organizan en tejidos, órganos y sistemas.', 'observar,comparar,describir,usar modelos,comunicar');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa1-2', 'ciencias-naturales-5-basico-u1', 'OA 2', 'Identificar y describir, por medio de modelos, las estructuras básicas del sistema digestivo y sus funciones principales en el proceso de digestión.', 'identificar,describir,modelar,explicar,relacionar estructura y función');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-5-basico-u1', 'OA 1', 'Identificar las regiones naturales de Chile y describir sus características geográficas, climáticas y de vegetación.', 'identificar,describir,regiones naturales,geografía,clima,vegetación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-5-basico-u1', 'OA 2', 'Explicar la relación entre las regiones naturales y las actividades económicas de la población chilena.', 'explicar,relacionar,actividades económicas,población,regiones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-1', 'matematica-6-basico-u1', 'OA 1', 'Demostrar que comprenden los factores y múltiplos determinando los mínimos comunes múltiplos.', 'factores,múltiplos,mcm');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-2', 'matematica-6-basico-u1', 'OA 3', 'Demostrar que comprenden el concepto de razón de manera concreta, pictórica y simbólica.', 'razón,concreto,pictórico,simbólico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-3', 'matematica-6-basico-u1', 'OA 8', 'Resolver problemas rutinarios y no rutinarios que involucren adiciones y sustracciones de fracciones.', 'adición,sustracción,fracciones,resolución de problemas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa1-1', 'lenguaje-y-comunicacion-6-basico-u1', 'OA 3', 'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo.', 'lectura,repertorio literario,conocimiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa1-2', 'lenguaje-y-comunicacion-6-basico-u1', 'OA 4', 'Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión.', 'análisis,narraciones,comprensión');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa1-3', 'lenguaje-y-comunicacion-6-basico-u1', 'OA 6', 'Leer de manera fluida textos variados apropiados a su edad.', 'fluidez,textos variados,adecuación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa1-1', 'ciencias-naturales-6-basico-u1', 'OA 1', 'Describir los componentes del sistema solar y las características de los planetas.', 'describir,sistema solar,planetas,componentes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa1-2', 'ciencias-naturales-6-basico-u1', 'OA 2', 'Explicar el movimiento de rotación y traslación de la Tierra y sus efectos.', 'explicar,rotación,traslación,efectos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-6-basico-u1', 'OA 1', 'Reconocer las causas y consecuencias de la Independencia de Chile.', 'historia,independencia,causas,consecuencias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-6-basico-u1', 'OA 2', 'Identificar los próceres de la Independencia y su contribución.', 'próceres,contribución,identificación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-7-basico-oa1-1', 'lenguaje-y-comunicacion-7-basico-u1', 'OA 1', 'Leer y analizar textos periodísticos identificando titulares, lead y cuerpos de la noticia.', 'lectura,análisis,periodismo,estructura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-7-basico-oa1-2', 'lenguaje-y-comunicacion-7-basico-u1', 'OA 2', 'Producir textos opinativos sobre temas de interés social.', 'escritura,opinión,temas sociales');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa1-1', 'matematica-7-basico-u1', 'OA 1', 'Reconocer expresiones algebraicas y evaluarlas sustituyendo valores.', 'expresiones algebraicas,evaluación,sustitución');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa1-2', 'matematica-7-basico-u1', 'OA 2', 'Resolver ecuaciones de primer grado con una incógnita.', 'ecuaciones,primer grado,resolución');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa1-1', 'ciencias-naturales-7-basico-u1', 'OA 1', 'Identificar las partes principales de una célula vegetal y animal.', 'célula,identificación,estructura celular');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa1-2', 'ciencias-naturales-7-basico-u1', 'OA 2', 'Comparar células vegetales y animales usando un microscopio.', 'comparación,microscopio,observación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-7-basico-u1', 'OA 1', 'Reconocer los períodos de la República en Chile y sus características políticas.', 'historia,república,períodos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-7-basico-u1', 'OA 2', 'Identificar los cambios sociales y económicos del siglo XIX en Chile.', 'cambios sociales,economía,siglo XIX');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-1', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 1', 'Analizar textos literarios de autores chilenos e iberoamericanos.', 'análisis,literatura,autores,comprensión');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-2', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 2', 'Interpretar recursos literarios: metáfora, símbolo, ironía, hipérbole.', 'recursos literarios,interpretación,análisis');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa1-1', 'matematica-8-basico-u1', 'OA 1', 'Reconocer y graficar funciones lineales y cuadráticas.', 'funciones,gráfica,lineal,cuadrática');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa1-2', 'matematica-8-basico-u1', 'OA 2', 'Resolver ecuaciones de segundo grado y aplicar la fórmula general.', 'ecuaciones,segundo grado,fórmula general');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-8-basico-oa1-1', 'ciencias-naturales-8-basico-u1', 'OA 1', 'Explicar los fundamentos de la genética mendeliana y la herencia de caracteres.', 'genética,herencia,mendel');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-8-basico-oa1-2', 'ciencias-naturales-8-basico-u1', 'OA 2', 'Describir el proceso de evolución de las especies según la teoría de Darwin.', 'evolución,Darwin,selección natural');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 1', 'Reconocer los principales acontecimientos políticos de Chile en el siglo XX.', 'historia,siglo XX,política');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 2', 'Analizar los cambios sociales, económicos y culturales del siglo XX en Chile.', 'análisis,cambios sociales,economía,cultura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-medio-oa1-1', 'lenguaje-y-comunicacion-1-medio-u1', 'OA 1', 'Analizar textos argumentativos complejos identificando tesis, argumentos y tipos de evidencia.', 'análisis,argumentación,tesis,evidencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-medio-oa1-2', 'lenguaje-y-comunicacion-1-medio-u1', 'OA 2', 'Producir ensayos argumentativos con estructura clara: introducción, desarrollo y conclusión.', 'escritura,ensayo,estructura,argumentación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa1-1', 'matematica-1-medio-u1', 'OA 1', 'Definir y representar funciones polinomiales de grado mayor a 2.', 'funciones,polinomios,grado,representación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa1-2', 'matematica-1-medio-u1', 'OA 2', 'Resolver sistemas de ecuaciones lineales con dos incógnitas.', 'sistemas,ecuaciones,incógnitas,resolución');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-medio-oa1-1', 'ciencias-naturales-1-medio-u1', 'OA 1', 'Reconocer los estados de la materia y las transformaciones físicas y químicas.', 'estados,transformaciones,físicas,químicas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-medio-oa1-2', 'ciencias-naturales-1-medio-u1', 'OA 2', 'Describir la tabla periódica y las propiedades de los elementos.', 'tabla periódica,elementos,propiedades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-1-medio-u1', 'OA 1', 'Analizar los principales desafíos políticos, sociales y económicos de Chile en el siglo XXI.', 'análisis,desafíos,siglo XXI');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa1-2', 'historia-geografia-y-ciencias-sociales-1-medio-u1', 'OA 2', 'Reconocer la diversidad cultural y la interculturalidad en Chile contemporáneo.', 'diversidad,interculturalidad,contemporáneo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-medio-oa1-1', 'lenguaje-y-comunicacion-2-medio-u1', 'OA 1', 'Leer y analizar textos filosóficos y ensayísticos de autores chilenos e iberoamericanos.', 'lectura,análisis,filosofía,ensayo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-medio-oa1-2', 'lenguaje-y-comunicacion-2-medio-u1', 'OA 2', 'Producir textos reflexivos sobre problemáticas sociales y éticas contemporáneas.', 'escritura,reflexión,problemas sociales,ética');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa1-1', 'matematica-2-medio-u1', 'OA 1', 'Definir y aplicar las razones trigonométricas en triángulos rectángulos.', 'trigonometría,razones,triángulos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa1-2', 'matematica-2-medio-u1', 'OA 2', 'Resolver problemas de geometría plana y del espacio usando fórmulas de áreas y volúmenes.', 'geometría,áreas,volúmenes,fórmulas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-medio-oa1-1', 'ciencias-naturales-2-medio-u1', 'OA 1', 'Describir los conceptos de velocidad, aceleración y movimiento rectilíneo.', 'velocidad,aceleración,movimiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-medio-oa1-2', 'ciencias-naturales-2-medio-u1', 'OA 2', 'Explicar las leyes de Newton y su aplicación en la vida cotidiana.', 'Newton,leyes,aplicación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-2-medio-u1', 'OA 1', 'Analizar el proceso de globalización y sus efectos en la cultura, economía y política.', 'globalización,análisis,efectos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa1-2', 'historia-geografia-y-ciencias-sociales-2-medio-u1', 'OA 2', 'Reconocer los desafíos ambientales globales y las políticas de sustentabilidad.', 'medio ambiente,sustentabilidad,desafíos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-medio-oa1-1', 'lenguaje-y-comunicacion-3-medio-u1', 'OA 1', 'Producir textos académicos con estructura formal: tesis, argumentación y conclusión.', 'escritura,académico,estructura,tesis');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-medio-oa1-2', 'lenguaje-y-comunicacion-3-medio-u1', 'OA 2', 'Crear textos literarios experimentales aplicando recursos estilísticos avanzados.', 'creatividad,literatura,estilo,experimentación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa1-1', 'matematica-3-medio-u1', 'OA 1', 'Calcular probabilidades de eventos simples y compuestos.', 'probabilidad,eventos,cálculo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa1-2', 'matematica-3-medio-u1', 'OA 2', 'Interpretar y analizar datos estadísticos usando medidas de tendencia central y dispersión.', 'estadística,datos,medidas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa1-3', 'matematica-3-medio-u1', 'OA 3', 'Introducción al cálculo diferencial: derivadas y sus aplicaciones.', 'cálculo,derivadas,aplicaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-medio-oa1-1', 'ciencias-naturales-3-medio-u1', 'OA 1', 'Explicar los procesos de replicación del ADN y síntesis de proteínas.', 'ADN,replicación,proteínas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-medio-oa1-2', 'ciencias-naturales-3-medio-u1', 'OA 2', 'Reconocer aplicaciones de la biotecnología en la medicina, agricultura y industria.', 'biotecnología,aplicaciones,medicina');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-3-medio-u1', 'OA 1', 'Reconocer los derechos humanos fundamentales y su importancia en sociedades democráticas.', 'derechos humanos,democracia,fundamentos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio-oa1-2', 'historia-geografia-y-ciencias-sociales-3-medio-u1', 'OA 2', 'Analizar el rol de la sociedad civil en la protección y promoción de los derechos humanos.', 'sociedad civil,análisis,protección');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-medio-oa1-1', 'lenguaje-y-comunicacion-4-medio-u1', 'OA 1', 'Sintetizar información de múltiples fuentes para producir textos argumentativos originales.', 'síntesis,múltiples fuentes,originalidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-medio-oa1-2', 'lenguaje-y-comunicacion-4-medio-u1', 'OA 2', 'Evaluar críticamente discursos mediáticos y publicitarios.', 'evaluación,crítica,medios,discurso');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-medio-oa1-1', 'matematica-4-medio-u1', 'OA 1', 'Aplicar modelos matemáticos para resolver problemas reales de diversas disciplinas.', 'modelamiento,aplicación,interdisciplinario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-medio-oa1-2', 'matematica-4-medio-u1', 'OA 2', 'Interpretar y comunicar resultados matemáticos en contextos sociales y científicos.', 'interpretación,comunicación,contexto');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-medio-oa1-1', 'ciencias-naturales-4-medio-u1', 'OA 1', 'Analizar el impacto de la ciencia y la tecnología en el desarrollo social y ambiental.', 'análisis,impacto,ciencia,tecnología');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-medio-oa1-2', 'ciencias-naturales-4-medio-u1', 'OA 2', 'Proponer soluciones a problemas ambientales usando el método científico.', 'soluciones,método científico,medio ambiente');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-4-medio-u1', 'OA 1', 'Analizar los principales desafíos de Chile para consolidar una sociedad justa, equitativa y sustentable.', 'análisis,desafíos,justicia,sustentabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-oa1-2', 'historia-geografia-y-ciencias-sociales-4-medio-u1', 'OA 2', 'Proponer alternativas de participación ciudadana para mejorar la calidad de vida en la comunidad.', 'participación,ciudadana,propuestas,calidad de vida');

-- Fin de la migración 0003