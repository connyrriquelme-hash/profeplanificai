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
  ('lengua-y-literatura-1-medio', '1-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-1-medio', '1-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-1-medio', '1-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio', '1-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-2-medio', '2-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-2-medio', '2-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-2-medio', '2-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio', '2-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-3-medio', '3-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-3-medio', '3-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-3-medio', '3-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio', '3-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-4-medio', '4-medio', 'Lengua y Literatura');
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
  ('lenguaje-y-comunicacion-1-basico-u1', 'lenguaje-y-comunicacion-1-basico', 1, 'Comprensión oral y escrita');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-basico-u1', 'matematica-1-basico', 1, 'Números y geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-1-basico-u1', 'ciencias-naturales-1-basico', 1, 'Observación de seres vivos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-u1', 'historia-geografia-y-ciencias-sociales-1-basico', 1, 'Mi identidad y entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u1', 'lenguaje-y-comunicacion-2-basico', 1, 'Lectura y escritura');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u1', 'matematica-2-basico', 1, 'Números y medidas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u1', 'ciencias-naturales-2-basico', 1, 'Exploración del entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-u1', 'historia-geografia-y-ciencias-sociales-2-basico', 1, 'Mi comunidad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u1', 'lenguaje-y-comunicacion-3-basico', 1, 'Comprensión lectora');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u1', 'matematica-3-basico', 1, 'Operaciones y geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u1', 'ciencias-naturales-3-basico', 1, 'Seres vivos y materiales');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u1', 'historia-geografia-y-ciencias-sociales-3-basico', 1, 'Espacio geográfico');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u1', 'lenguaje-y-comunicacion-4-basico', 1, 'Lectura y producción de textos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u1', 'matematica-4-basico', 1, 'Números y operaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u1', 'ciencias-naturales-4-basico', 1, 'Materia y energía');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u1', 'historia-geografia-y-ciencias-sociales-4-basico', 1, 'Historia de Chile');
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
  ('lenguaje-y-comunicacion-7-basico-u1', 'lenguaje-y-comunicacion-7-basico', 1, 'Análisis crítico de textos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u1', 'matematica-7-basico', 1, 'Álgebra y funciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u1', 'ciencias-naturales-7-basico', 1, 'Ecosistemas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u1', 'historia-geografia-y-ciencias-sociales-7-basico', 1, 'Proceso histórico chileno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-8-basico-u1', 'lenguaje-y-comunicacion-8-basico', 1, 'Comprensión y producción de textos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u1', 'matematica-8-basico', 1, 'Proporciones y ecuaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-8-basico-u1', 'ciencias-naturales-8-basico', 1, 'La célula');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-u1', 'historia-geografia-y-ciencias-sociales-8-basico', 1, 'Estado Nacional y democracia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-1-medio-u1', 'lengua-y-literatura-1-medio', 1, 'Análisis literario');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u1', 'matematica-1-medio', 1, 'Funciones y álgebra');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-1-medio-u1', 'ciencias-naturales-1-medio', 1, 'Energía y materia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u1', 'historia-geografia-y-ciencias-sociales-1-medio', 1, 'Siglo XX chileno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-2-medio-u1', 'lengua-y-literatura-2-medio', 1, 'Producción académica');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u1', 'matematica-2-medio', 1, 'Probabilidad y estadística');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-medio-u1', 'ciencias-naturales-2-medio', 1, 'Biología molecular');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u1', 'historia-geografia-y-ciencias-sociales-2-medio', 1, 'Chile contemporáneo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-3-medio-u1', 'lengua-y-literatura-3-medio', 1, 'Literatura como construcción cultural');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-medio-u1', 'matematica-3-medio', 1, 'Geometría y trigonometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-medio-u1', 'ciencias-naturales-3-medio', 1, 'Química orgánica');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio-u1', 'historia-geografia-y-ciencias-sociales-3-medio', 1, 'Globalización y desafíos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-4-medio-u1', 'lengua-y-literatura-4-medio', 1, 'Ciudadanía y comunicación');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-medio-u1', 'matematica-4-medio', 1, 'Modelamiento matemático');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-medio-u1', 'ciencias-naturales-4-medio', 1, 'Ciencia y sociedad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-u1', 'historia-geografia-y-ciencias-sociales-4-medio', 1, 'Desafíos del siglo XXI');

-- ============================================================
-- 4. OBJETIVOS DE APRENDIZAJE
-- ============================================================
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-1', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 1', 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.', 'expresión oral,vocabulario,comunicación,turnos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-2', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 2', 'Leer textos significativos que incluyan palabras con hiatos y diptongos.', 'lectura,hiatos,diptongos,puntuación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-3', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 3', 'Escribir textos breves usando mayúsculas, puntos y conectores simples.', 'escritura,ortografía,conectores,puntuación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-1', 'matematica-1-basico-u1', 'OA 1', 'Reconocer y nombrar números hasta el 20, cuantificar colecciones.', 'números,conteo,colecciones,material concreto');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-2', 'matematica-1-basico-u1', 'OA 2', 'Establecer relaciones de correspondencia, clasificación y seriación.', 'clasificación,seriación,correspondencia,igualdad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-basico-oa1-3', 'matematica-1-basico-u1', 'OA 3', 'Reconocer figuras geométricas básicas en objetos del entorno.', 'figuras geométricas,círculo,cuadrado,triángulo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-basico-oa1-1', 'ciencias-naturales-1-basico-u1', 'OA 1', 'Observar y describir características de seres vivos y materiales.', 'observación,descripción,clasificación,comunicación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-1-basico-u1', 'OA 1', 'Reconocer su identidad personal dentro de la familia y la escuela.', 'identidad,familia,escuela,normas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-1', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 1', 'Leer textos significativos que incluyan palabras con hiatos y diptongos, con grupos consonánticos y con combinación.', 'lectura,hiatos,diptongos,combinaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-2', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 2', 'Escribir textos narrativos, descriptivos y expositivos breves.', 'escritura,narrativo,descriptivo,expositivo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-3', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 4', 'Leer independientemente y familiarizarse con un amplio repertorio de literatura.', 'lectura,repertorio literario,preferencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-1', 'matematica-2-basico-u1', 'OA 1', 'Reconocer y escribir números naturales de hasta 3 dígitos.', 'números,escritura,valor posicional,comparación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-2', 'matematica-2-basico-u1', 'OA 2', 'Resolver problemas de suma y resta hasta 3 dígitos sin reagrupar.', 'suma,resta,problemas,material concreto');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-3', 'matematica-2-basico-u1', 'OA 3', 'Medir objetos usando unidades no convencionales.', 'medición,unidades no convencionales,longitud');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa1-1', 'ciencias-naturales-2-basico-u1', 'OA 1', 'Observar y describir características de seres vivos y materiales del entorno.', 'observación,descripción,clasificación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-2-basico-u1', 'OA 1', 'Reconocer su identidad personal y los roles dentro de la familia y comunidad.', 'identidad,familia,comunidad,normas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-1', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 1', 'Leer y comprender textos narrativos, descriptivos e instructivos.', 'lectura,comprensión,idea principal,personajes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-2', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 2', 'Escribir textos narrativos y descriptivos con estructura clara.', 'escritura,planificación,coherencia,ortografía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-3', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 3', 'Participar en conversaciones respetando normas de interacción.', 'conversación,turnos,opiniones,escucha activa');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-1', 'matematica-3-basico-u1', 'OA 1', 'Demostrar comprensión de números naturales y operaciones básicas.', 'números,suma,resta,multiplicación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-2', 'matematica-3-basico-u1', 'OA 2', 'Reconocer y describir figuras geométricas en el entorno.', 'figuras,geometría,perímetro,área');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa1-1', 'ciencias-naturales-3-basico-u1', 'OA 1', 'Observar y clasificar seres vivos según sus características.', 'observación,clasificación,seres vivos,características');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-3-basico-u1', 'OA 1', 'Identificar elementos básicos del espacio geográfico local.', 'espacio,mapa,localización,entorno');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-1', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 1', 'Leer y comprender textos literarios e informativos de mayor extensión.', 'lectura,propósito comunicativo,información explícita,recursos literarios');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-2', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 2', 'Escribir textos de diversos géneros con coherencia y cohesión.', 'escritura,estructura,conectores,ortografía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-3', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 3', 'Investigar y presentar información usando múltiples fuentes.', 'investigación,fuentes,organización,presentación oral');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-1', 'matematica-4-basico-u1', 'OA 1', 'Demostrar comprensión de números naturales y sus operaciones.', 'números,operaciones,problemas,estrategias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-2', 'matematica-4-basico-u1', 'OA 2', 'Reconocer y describir propiedades de figuras geométricas.', 'figuras,propiedades,simetría,perímetro');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa1-1', 'ciencias-naturales-4-basico-u1', 'OA 1', 'Observar y describir propiedades de la materia.', 'observación,propiedades,estado,cambio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-4-basico-u1', 'OA 1', 'Reconocer hechos relevantes de la historia de Chile.', 'historia,fechos,personajes,contexto');
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
  ('lenguaje-y-comunicacion-7-basico-oa1-1', 'lenguaje-y-comunicacion-7-basico-u1', 'OA 1', 'Leer críticamente textos de diversos géneros y formatos.', 'análisis crítico,intencionalidad,posición ideológica,falacias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-7-basico-oa1-2', 'lenguaje-y-comunicacion-7-basico-u1', 'OA 2', 'Producir textos creativos y académicos con voz propia.', 'escritura creativa,ensayos,coherencia,autoevaluación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa1-1', 'matematica-7-basico-u1', 'OA 1', 'Demostrar comprensión de ecuaciones lineales y funciones.', 'ecuaciones,funciones,variables,representación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa1-1', 'ciencias-naturales-7-basico-u1', 'OA 1', 'Explicar la interacción de los seres vivos con su ambiente.', 'ecosistemas,interacción,ambiente,biodiversidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-7-basico-u1', 'OA 1', 'Analizar el proceso de formación del Estado Nacional chileno.', 'historia,Estado Nacional,independencia,guerra');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-1', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 1', 'Leer y comprender textos literarios y no literarios.', 'géneros literarios,inferencia,estructura,opinión fundamentada');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-2', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 2', 'Escribir textos de distintos géneros con intención comunicativa.', 'géneros,estructura,convenciones ortográficas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-3', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 3', 'Analizar críticamente textos de los medios de comunicación.', 'medios,hechos,opiniones,fuentes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa1-1', 'matematica-8-basico-u1', 'OA 1', 'Demostrar comprensión de proporciones y fracciones.', 'proporciones,fracciones,porcentajes,regla de tres');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa1-2', 'matematica-8-basico-u1', 'OA 2', 'Demostrar comprensión de ecuaciones de segundo grado.', 'ecuaciones,segundo grado,coeficientes,fórmula general');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-8-basico-oa1-1', 'ciencias-naturales-8-basico-u1', 'OA 1', 'Explicar el papel central de la célula como unidad básica de los seres vivos.', 'célula,organelas,animal,vegetal');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 1', 'Analizar el proceso de formación del Estado Nacional chileno.', 'Estado Nacional,independencia,Guerra del Pacífico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 2', 'Analizar el quiebre de la democracia en Chile en la década de 1970.', 'golpe de Estado,dictadura,interpretaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa1-1', 'lengua-y-literatura-1-medio-u1', 'OA 1', 'Analizar e interpretar textos literarios chilenos e hispanoamericanos.', 'contextualización,construcción de personajes,temas universales');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa1-2', 'lengua-y-literatura-1-medio-u1', 'OA 2', 'Escribir textos argumentativos complejos y académicos.', 'argumentación,evidencia,contraargumentos,normas APA');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa1-3', 'lengua-y-literatura-1-medio-u1', 'OA 3', 'Participar en debates y diálogos argumentativos formales.', 'debate,argumentación,refutación,lenguaje persuasivo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa1-1', 'matematica-1-medio-u1', 'OA 1', 'Demostrar comprensión de funciones lineales y cuadráticas.', 'funciones,lineales,cuadráticas,representación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-1-medio-oa1-1', 'ciencias-naturales-1-medio-u1', 'OA 1', 'Explicar los principios de conservación de la energía.', 'energía,conservación,transformación,fuentes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-1-medio-u1', 'OA 1', 'Analizar los procesos políticos y sociales del siglo XX en Chile.', 'siglo XX,reformas,movimientos sociales');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa1-1', 'lengua-y-literatura-2-medio-u1', 'OA 1', 'Analizar la construcción del sentido en textos literarios y no literarios.', 'intertextualidad,construcción de sentido,enfoques críticos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa1-2', 'lengua-y-literatura-2-medio-u1', 'OA 2', 'Producir textos académico-científicos con metodología de investigación.', 'investigación,hipótesis,monografías,criterios éticos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa1-1', 'matematica-2-medio-u1', 'OA 1', 'Demostrar comprensión de probabilidades y estadística descriptiva.', 'probabilidad,estadística,datos,análisis');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-medio-oa1-1', 'ciencias-naturales-2-medio-u1', 'OA 1', 'Explicar los procesos moleculares de la herencia.', 'ADN,genes,herencia,mutaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-2-medio-u1', 'OA 1', 'Analizar los procesos de democratización y desarrollo en Chile.', 'democratización,desarrollo,sociedad civil');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa1-1', 'lengua-y-literatura-3-medio-u1', 'OA 1', 'Interpretar y valorar la literatura como construcción cultural.', 'canon literario,artes,función social,lectura crítica');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa1-2', 'lengua-y-literatura-3-medio-u1', 'OA 2', 'Comunicar ideas complejas en contextos académicos y profesionales.', 'registro,presentaciones,medios digitales,portfolio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa1-1', 'matematica-3-medio-u1', 'OA 1', 'Demostrar comprensión de relaciones geométricas y trigonométricas.', 'geometría,trigonometría,relaciones,demostración');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-medio-oa1-1', 'ciencias-naturales-3-medio-u1', 'OA 1', 'Explicar la estructura y propiedades de compuestos orgánicos.', 'orgánicos,propiedades,reacciones,laboratorio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-3-medio-u1', 'OA 1', 'Analizar los efectos de la globalización en la sociedad chilena.', 'globalización,cultura,economía,desafíos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-4-medio-oa1-1', 'lengua-y-literatura-4-medio-u1', 'OA 1', 'Ejercer ciudadanía crítica a través del lenguaje y la comunicación.', 'discursos,medios,noticias falsas,debate público');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-4-medio-oa1-2', 'lengua-y-literatura-4-medio-u1', 'OA 2', 'Producir comunicaciones efectivas para su proyecto de vida.', 'CV,portfolio,negociación,autoevaluación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-medio-oa1-1', 'matematica-4-medio-u1', 'OA 1', 'Aplicar modelos matemáticos para resolver problemas del mundo real.', 'modelamiento,optimización,análisis,conclusión');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-medio-oa1-1', 'ciencias-naturales-4-medio-u1', 'OA 1', 'Analizar el impacto de la ciencia y tecnología en la sociedad.', 'ciencia,tecnología,impacto,ética');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-4-medio-u1', 'OA 1', 'Analizar los grandes desafíos de la humanidad en el siglo XXI.', 'cambio climático,desigualdad,sostenibilidad');

-- ============================================================
-- 5. TEXTOS ESCOLARES
-- ============================================================
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo) VALUES
  ('texto-del-estudiante-matematica-6-basico-2026-6-basico', 'matematica-6-basico', 'Texto del Estudiante Matemática 6° Básico 2026');

-- Fin de la migración 0003