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
  ('prekinder', 'Prekínder', '');
INSERT OR IGNORE INTO niveles (id, nombre, descripcion) VALUES
  ('kinder', 'Kínder', '');
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
  ('educacion-parvularia-prekinder', 'prekinder', 'Educación Parvularia');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('identidad-y-autonomia-prekinder', 'prekinder', 'Identidad y Autonomía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('convivencia-y-ciudadania-prekinder', 'prekinder', 'Convivencia y Ciudadanía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('corporalidad-y-movimiento-prekinder', 'prekinder', 'Corporalidad y Movimiento');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('educacion-parvularia-kinder', 'kinder', 'Educación Parvularia');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('identidad-y-autonomia-kinder', 'kinder', 'Identidad y Autonomía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('convivencia-y-ciudadania-kinder', 'kinder', 'Convivencia y Ciudadanía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('corporalidad-y-movimiento-kinder', 'kinder', 'Corporalidad y Movimiento');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-1-basico', '1-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-1-basico', '1-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-1-basico', '1-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico', '1-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-mapuche-1-basico', '1-basico', 'Lengua Mapuche');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-aymara-1-basico', '1-basico', 'Lengua Aymara');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-quechua-1-basico', '1-basico', 'Lengua Quechua');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-rapa-nui-1-basico', '1-basico', 'Lengua Rapa Nui');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-indigena-intercultural-1-basico', '1-basico', 'Lengua Indígena Intercultural');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-1-basico', '1-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-2-basico', '2-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-2-basico', '2-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-2-basico', '2-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico', '2-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', '2-basico', 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Aymara');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', '2-basico', 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Quechua');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', '2-basico', 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Rapa Nui');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', '2-basico', 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Mapuche');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', '2-basico', 'Lengua y Cultura de los Pueblos Originarios Ancestrales - Interculturalidad');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-2-basico', '2-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-3-basico', '3-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-3-basico', '3-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-3-basico', '3-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico', '3-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-3-basico', '3-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-4-basico', '4-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-4-basico', '4-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-4-basico', '4-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico', '4-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-4-basico', '4-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-5-basico', '5-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-5-basico', '5-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-5-basico', '5-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico', '5-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-5-basico', '5-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-6-basico', '6-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-6-basico', '6-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-6-basico', '6-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico', '6-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-6-basico', '6-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-7-basico', '7-basico', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-7-basico', '7-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-7-basico', '7-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico', '7-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-7-basico', '7-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lenguaje-y-comunicacion-8-basico', '8-basico', 'Lenguaje y Comunicación');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-8-basico', '8-basico', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-8-basico', '8-basico', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico', '8-basico', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-8-basico', '8-basico', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-1-medio', '1-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-1-medio', '1-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio', '1-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-1-medio', '1-medio', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('biologia-1-medio', '1-medio', 'Biología');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('fisica-1-medio', '1-medio', 'Física');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('quimica-1-medio', '1-medio', 'Química');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-2-medio', '2-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-2-medio', '2-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio', '2-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-2-medio', '2-medio', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('biologia-2-medio', '2-medio', 'Biología');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('fisica-2-medio', '2-medio', 'Física');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('quimica-2-medio', '2-medio', 'Química');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-3-medio', '3-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('filosofia-3-medio', '3-medio', 'Filosofía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-3-medio', '3-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-3-medio', '3-medio', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('educacion-ciudadana-3-medio', '3-medio', 'Educación Ciudadana');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('lengua-y-literatura-4-medio', '4-medio', 'Lengua y Literatura');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('matematica-4-medio', '4-medio', 'Matemática');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ciencias-naturales-4-medio', '4-medio', 'Ciencias Naturales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio', '4-medio', 'Historia, Geografía y Ciencias Sociales');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('filosofia-4-medio', '4-medio', 'Filosofía');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('ingles-4-medio', '4-medio', 'Inglés');
INSERT OR IGNORE INTO asignaturas (id, nivel_id, nombre) VALUES
  ('educacion-ciudadana-4-medio', '4-medio', 'Educación Ciudadana');

-- ============================================================
-- 3. UNIDADES
-- ============================================================
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-parvularia-prekinder-u1', 'educacion-parvularia-prekinder', 1, 'Pensamiento Matemático');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('identidad-y-autonomia-prekinder-u1', 'identidad-y-autonomia-prekinder', 1, 'Autoconocimiento y autogestión');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('convivencia-y-ciudadania-prekinder-u1', 'convivencia-y-ciudadania-prekinder', 1, 'Normas y colaboración');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('corporalidad-y-movimiento-prekinder-u1', 'corporalidad-y-movimiento-prekinder', 1, 'Habilidades motrices');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-parvularia-kinder-u1', 'educacion-parvularia-kinder', 1, 'Juego Primero');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('identidad-y-autonomia-kinder-u1', 'identidad-y-autonomia-kinder', 1, 'Autoconocimiento y autogestión');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('convivencia-y-ciudadania-kinder-u1', 'convivencia-y-ciudadania-kinder', 1, 'Normas y colaboración');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('corporalidad-y-movimiento-kinder-u1', 'corporalidad-y-movimiento-kinder', 1, 'Habilidades motrices');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-1-basico-u1', 'lenguaje-y-comunicacion-1-basico', 1, 'Comprensión oral y escrita');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-basico-u1', 'matematica-1-basico', 1, 'Números y geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-1-basico-u1', 'ciencias-naturales-1-basico', 1, 'Observación de seres vivos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-basico-u1', 'historia-geografia-y-ciencias-sociales-1-basico', 1, 'Mi identidad y entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-mapuche-1-basico-u1', 'lengua-mapuche-1-basico', 1, 'Identidad y lengua mapuche');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-aymara-1-basico-u1', 'lengua-aymara-1-basico', 1, 'Identidad y lengua aymara');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-quechua-1-basico-u1', 'lengua-quechua-1-basico', 1, 'Identidad y lengua quechua');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-rapa-nui-1-basico-u1', 'lengua-rapa-nui-1-basico', 1, 'Identidad y lengua rapa nui');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-indigena-intercultural-1-basico-u1', 'lengua-indigena-intercultural-1-basico', 1, 'Interculturalidad y lenguas originarias');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u1', 'ingles-1-basico', 1, 'Me and my family');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u2', 'ingles-1-basico', 2, 'At school');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u3', 'ingles-1-basico', 3, 'My body');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u4', 'ingles-1-basico', 4, 'Domestic animals and pets');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u5', 'ingles-1-basico', 5, 'Food');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u6', 'ingles-1-basico', 6, 'My house');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u7', 'ingles-1-basico', 7, 'The weather');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-basico-u8', 'ingles-1-basico', 8, 'Toys and games');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u1', 'lenguaje-y-comunicacion-2-basico', 1, 'Cuentos, poemas y fábulas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u2', 'lenguaje-y-comunicacion-2-basico', 2, 'Textos informativos y curiosidades de la naturaleza');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-2-basico-u3', 'lenguaje-y-comunicacion-2-basico', 3, 'Historias, leyendas y tradiciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u1', 'matematica-2-basico', 1, 'Números, adición y sustracción hasta 100');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u2', 'matematica-2-basico', 2, 'Longitud y Gráficos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u3', 'matematica-2-basico', 3, 'Igualdad, desigualdad y patrones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-basico-u4', 'matematica-2-basico', 4, 'Multiplicación y Geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u1', 'ciencias-naturales-2-basico', 1, 'Cuidemos nuestro cuerpo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u2', 'ciencias-naturales-2-basico', 2, 'Animales en peligro');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u3', 'ciencias-naturales-2-basico', 3, 'El agua, fuente de vida');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-2-basico-u4', 'ciencias-naturales-2-basico', 4, 'El tiempo atmosférico');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-u3', 'historia-geografia-y-ciencias-sociales-2-basico', 3, 'Chile, una sociedad mestiza y multicultural');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-u4', 'historia-geografia-y-ciencias-sociales-2-basico', 4, 'Vivimos en comunidad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', 1, 'Uywa wayñu (Fiesta del ganado)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u2', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', 2, 'Willka Kuti (Retorno del Sol)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u3', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', 3, 'Pachamama (Madre naturaleza)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u4', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', 4, 'Satapacha (Tiempo de siembra)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', 1, 'Imataq Pachamama niyta munan? (¿Qué quiere decir la naturaleza?)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u2', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', 2, 'Imaynataq suyu maypi tiyani? (¿Cómo es el territorio en donde vivo?)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u3', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', 3, 'Yawar masiykuwan aylluykuwan ima sumaq tiyanapi kawsanchiq');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u4', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', 4, 'Aylluypi kawsanamanta llank''ay (El desarrollo de la cultura en mi comunidad)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', 1, 'Haka ara o te ''ariki (El camino del rey)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u2', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', 2, 'Te hauha''a tupuna Rapa Nui (El patrimonio ancestral Rapa Nui)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u3', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', 3, 'Te Rono-rono - te ''a''ati tupuna - te manu o Rapa Nui');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u4', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', 4, 'Te natura - te aŋa tupuna - te ao o te raŋi – te tupa');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', 1, 'Tayiñ mapuchegen ka tayiñ az felen (Nuestro ser mapuche y nuestras emociones)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u2', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', 2, '¡Wallontu mapu mew müley itxofill mogen! (¡Hay diversidad de vida en el universo!)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u3', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', 3, 'Fillke wirin mapuche mapu mew (Las diversas escrituras del territorio mapuche)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u4', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', 4, '¡Tañi wallontu mapu ñi zugun zugu! (¡Los mensajes de mi entorno!)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', 1, 'Territorio quechua y aymara');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u2', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', 2, 'Territorio colla y lickanantay');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u3', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', 3, '¿Qué nos contarán los pueblos Diaguita y Rapa Nui?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u4', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', 4, '¿Qué nos enseñarán los pueblos Kawésqar, Yagán y Mapuche Williche?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u1', 'ingles-2-basico', 1, 'Wild animals');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u2', 'ingles-2-basico', 2, 'Sports and free time');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u3', 'ingles-2-basico', 3, 'My clothes');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u4', 'ingles-2-basico', 4, 'Jobs and professions');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u5', 'ingles-2-basico', 5, 'My classmates');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u6', 'ingles-2-basico', 6, 'My city');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u7', 'ingles-2-basico', 7, 'Festivities');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-basico-u8', 'ingles-2-basico', 8, 'Musical instruments');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u1', 'lenguaje-y-comunicacion-3-basico', 1, 'Mis lugares, ideas y el universo (Lecciones 1-6)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u2', 'lenguaje-y-comunicacion-3-basico', 2, 'Animales, amistad y trabajo en equipo (Lecciones 7-12)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u3', 'lenguaje-y-comunicacion-3-basico', 3, 'Historias sorprendentes y nuestro entorno (Lecciones 13-18)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-3-basico-u4', 'lenguaje-y-comunicacion-3-basico', 4, 'Aventuras, tradiciones y descubrimientos (Lecciones 19-24)');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u1', 'matematica-3-basico', 1, 'Números hasta 1000, Adición, Sustracción y Patrones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u2', 'matematica-3-basico', 2, 'Tiempo, Multiplicación y División');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u3', 'matematica-3-basico', 3, 'Localización, Cuerpos Geométricos, Perímetro y Triángulos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-basico-u4', 'matematica-3-basico', 4, 'Datos, Fracciones y Masa');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u1', 'ciencias-naturales-3-basico', 1, 'El sistema solar');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u2', 'ciencias-naturales-3-basico', 2, 'Descubriendo la luz y el sonido');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u3', 'ciencias-naturales-3-basico', 3, 'Las plantas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-3-basico-u4', 'ciencias-naturales-3-basico', 4, 'Alimentación saludable');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u1', 'historia-geografia-y-ciencias-sociales-3-basico', 1, '¿Cómo podemos conocer el planeta Tierra?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u2', 'historia-geografia-y-ciencias-sociales-3-basico', 2, '¿Cómo vivían los antiguos griegos y qué nos legaron?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u3', 'historia-geografia-y-ciencias-sociales-3-basico', 3, '¿Cómo vivían los antiguos romanos y cuál es su legado?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-u4', 'historia-geografia-y-ciencias-sociales-3-basico', 4, '¿Cómo aportamos a la vida en comunidad?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u1', 'ingles-3-basico', 1, 'Ready for school');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u2', 'ingles-3-basico', 2, 'Busy morning!');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u3', 'ingles-3-basico', 3, 'Story world');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u4', 'ingles-3-basico', 4, 'Sports');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u5', 'ingles-3-basico', 5, 'Nature park');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u6', 'ingles-3-basico', 6, 'After school fun!');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u7', 'ingles-3-basico', 7, 'Transport');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-basico-u8', 'ingles-3-basico', 8, 'Summer fun');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u1', 'lenguaje-y-comunicacion-4-basico', 1, 'Un viaje sorpresivo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u2', 'lenguaje-y-comunicacion-4-basico', 2, '¡Qué animales más curiosos!');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u3', 'lenguaje-y-comunicacion-4-basico', 3, 'Aventuras salvajes');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u4', 'lenguaje-y-comunicacion-4-basico', 4, 'El universo canta');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u5', 'lenguaje-y-comunicacion-4-basico', 5, 'Sueños cumplidos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u6', 'lenguaje-y-comunicacion-4-basico', 6, 'Historias misteriosas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u7', 'lenguaje-y-comunicacion-4-basico', 7, 'Historias de la tierra');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-4-basico-u8', 'lenguaje-y-comunicacion-4-basico', 8, 'Animales extraordinarios');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u1', 'matematica-4-basico', 1, 'Unidad 1: Números, operaciones y longitud');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u2', 'matematica-4-basico', 2, 'Unidad 2: Multiplicación, división, medición y geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u3', 'matematica-4-basico', 3, 'Unidad 3: Fracciones, decimales, volumen y datos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-basico-u4', 'matematica-4-basico', 4, 'Unidad 4: Fracciones, ecuaciones, transformaciones isométricas y azar');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u1', 'ciencias-naturales-4-basico', 1, 'La Tierra en movimiento');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u2', 'ciencias-naturales-4-basico', 2, 'La materia y las fuerzas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u3', 'ciencias-naturales-4-basico', 3, 'Sistema locomotor y sistema nervioso');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-basico-u4', 'ciencias-naturales-4-basico', 4, '¿Cómo son los ecosistemas?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u1', 'historia-geografia-y-ciencias-sociales-4-basico', 1, 'Paisajes y recursos naturales de América');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u2', 'historia-geografia-y-ciencias-sociales-4-basico', 2, 'Las grandes civilizaciones americanas: mayas, aztecas e incas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u3', 'historia-geografia-y-ciencias-sociales-4-basico', 3, 'Legado y presente de las civilizaciones y los pueblos originarios de América');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-u4', 'historia-geografia-y-ciencias-sociales-4-basico', 4, 'Organización democrática, derechos y participación en Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u1', 'ingles-4-basico', 1, 'Around town');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u2', 'ingles-4-basico', 2, 'Around the world');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u3', 'ingles-4-basico', 3, 'The universe');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u4', 'ingles-4-basico', 4, 'Minibeasts');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u5', 'ingles-4-basico', 5, 'Summer camp');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-basico-u6', 'ingles-4-basico', 6, 'Story world');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-5-basico-u1', 'lenguaje-y-comunicacion-5-basico', 1, 'La unión hace la fuerza');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-5-basico-u2', 'lenguaje-y-comunicacion-5-basico', 2, 'Emociones que sanan');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-5-basico-u3', 'lenguaje-y-comunicacion-5-basico', 3, 'Coexistir en armonía');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-5-basico-u4', 'lenguaje-y-comunicacion-5-basico', 4, 'Un mundo en movimiento');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-5-basico-u1', 'matematica-5-basico', 1, 'Números naturales, operaciones y patrones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-5-basico-u2', 'matematica-5-basico', 2, 'Multiplicación, división, fracciones y decimales');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-5-basico-u3', 'matematica-5-basico', 3, 'Geometría: Ángulos, área y volumen');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-5-basico-u4', 'matematica-5-basico', 4, 'Estadística, probabilidad y transformaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-5-basico-u1', 'ciencias-naturales-5-basico', 1, 'El agua en el planeta');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-5-basico-u2', 'ciencias-naturales-5-basico', 2, 'Seres vivos y alimentación');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-5-basico-u3', 'ciencias-naturales-5-basico', 3, '¿Cómo prevenir enfermedades?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-5-basico-u4', 'ciencias-naturales-5-basico', 4, 'La electricidad en nuestra vida');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-u1', 'historia-geografia-y-ciencias-sociales-5-basico', 1, 'Chile: un país diverso');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-u2', 'historia-geografia-y-ciencias-sociales-5-basico', 2, 'El encuentro de dos mundos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-u3', 'historia-geografia-y-ciencias-sociales-5-basico', 3, 'La Colonia en América y Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-u4', 'historia-geografia-y-ciencias-sociales-5-basico', 4, 'La construcción de la identidad nacional');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-5-basico-u1', 'ingles-5-basico', 1, 'Traveling');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-5-basico-u2', 'ingles-5-basico', 2, 'Cultures and traditions');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-5-basico-u3', 'ingles-5-basico', 3, 'Languages');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-5-basico-u4', 'ingles-5-basico', 4, 'Jobs');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-6-basico-u1', 'matematica-6-basico', 1, 'Operaciones, fracciones y razones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-6-basico-u3', 'matematica-6-basico', 3, 'Fracciones, números mixtos y razones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-6-basico-u4', 'matematica-6-basico', 4, 'Porcentajes, datos y álgebra');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-6-basico-u1', 'lenguaje-y-comunicacion-6-basico', 1, 'El poder de la aventura, la imaginación y la creatividad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-6-basico-u2', 'lenguaje-y-comunicacion-6-basico', 2, 'El medioambiente y su protección');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-6-basico-u3', 'lenguaje-y-comunicacion-6-basico', 3, 'El ser humano y su vínculo con el cosmos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-6-basico-u4', 'lenguaje-y-comunicacion-6-basico', 4, 'Respetar las diferencias y la igualdad de derechos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-6-basico-u1', 'ciencias-naturales-6-basico', 1, 'Reproducción y pubertad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-6-basico-u2', 'ciencias-naturales-6-basico', 2, 'La Tierra y los seres vivos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-6-basico-u3', 'ciencias-naturales-6-basico', 3, 'Energía y recursos energéticos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-6-basico-u4', 'ciencias-naturales-6-basico', 4, 'La materia que nos rodea');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-u1', 'historia-geografia-y-ciencias-sociales-6-basico', 1, 'Organización política y derechos fundamentales en Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-u2', 'historia-geografia-y-ciencias-sociales-6-basico', 2, 'Chile en el siglo XIX: Independencia, República y territorio');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-u3', 'historia-geografia-y-ciencias-sociales-6-basico', 3, 'Chile en el siglo XX: democracia, dictadura y transición');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-u4', 'historia-geografia-y-ciencias-sociales-6-basico', 4, 'Ambientes naturales y regiones de Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-6-basico-u1', 'ingles-6-basico', 1, 'Artistic inspirations');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-6-basico-u2', 'ingles-6-basico', 2, 'World festivals');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-6-basico-u3', 'ingles-6-basico', 3, 'Climate action');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-6-basico-u4', 'ingles-6-basico', 4, 'Foreign friends');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-7-basico-u1', 'lengua-y-literatura-7-basico', 1, '¿Qué me hace sentir bien?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-7-basico-u2', 'lengua-y-literatura-7-basico', 2, '¿Cómo construimos comunidad?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-7-basico-u3', 'lengua-y-literatura-7-basico', 3, 'Somos naturaleza');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-7-basico-u4', 'lengua-y-literatura-7-basico', 4, '¿Qué nos cuenta el mundo?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u1', 'matematica-7-basico', 1, 'Números');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u2', 'matematica-7-basico', 2, 'Álgebra y funciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u3', 'matematica-7-basico', 3, 'Geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-7-basico-u4', 'matematica-7-basico', 4, 'Probabilidad y estadística');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u1', 'ciencias-naturales-7-basico', 1, 'La materia en nuestras vidas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u2', 'ciencias-naturales-7-basico', 2, 'Las fuerzas y la Tierra');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u3', 'ciencias-naturales-7-basico', 3, 'Microorganismos y barreras de defensa');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-7-basico-u4', 'ciencias-naturales-7-basico', 4, 'Sexualidad y autocuidado');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u1', 'historia-geografia-y-ciencias-sociales-7-basico', 1, '¿Cómo cambió la vida de los seres humanos desde sus orígenes hasta las primeras civilizaciones?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u2', 'historia-geografia-y-ciencias-sociales-7-basico', 2, '¿En qué ámbitos de las sociedades actuales se aprecia la influencia de las civilizaciones clásicas?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u3', 'historia-geografia-y-ciencias-sociales-7-basico', 3, '¿Cuáles fueron los principales procesos que dieron origen a la civilización europea occidental?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-u4', 'historia-geografia-y-ciencias-sociales-7-basico', 4, '¿De qué modos se manifiesta hoy la herencia de las grandes civilizaciones americanas?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-7-basico-u1', 'ingles-7-basico', 1, 'Feelings and opinions');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-7-basico-u2', 'ingles-7-basico', 2, 'Healthy habits');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-7-basico-u3', 'ingles-7-basico', 3, 'Sports and free-time activities');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-7-basico-u4', 'ingles-7-basico', 4, 'Green issues');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lenguaje-y-comunicacion-8-basico-u1', 'lenguaje-y-comunicacion-8-basico', 1, 'Comprensión y producción de textos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u1', 'matematica-8-basico', 1, 'Números');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u2', 'matematica-8-basico', 2, 'Álgebra y funciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u3', 'matematica-8-basico', 3, 'Geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-8-basico-u4', 'matematica-8-basico', 4, 'Probabilidad y estadística');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-8-basico-u1', 'ciencias-naturales-8-basico', 1, 'La célula');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-u1', 'historia-geografia-y-ciencias-sociales-8-basico', 1, 'Estado Nacional y democracia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-8-basico-u1', 'ingles-8-basico', 1, 'Information and Communication Technology');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-8-basico-u2', 'ingles-8-basico', 2, 'Countries, Cultures and Customs');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-8-basico-u3', 'ingles-8-basico', 3, 'Going Places');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-8-basico-u4', 'ingles-8-basico', 4, 'Future Matters');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-1-medio-u1', 'lengua-y-literatura-1-medio', 1, 'Caminos alternativos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-1-medio-u2', 'lengua-y-literatura-1-medio', 2, 'Un mundo en movimiento');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-1-medio-u3', 'lengua-y-literatura-1-medio', 3, 'El impulso de narrar');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-1-medio-u4', 'lengua-y-literatura-1-medio', 4, 'Imaginar el futuro');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u1', 'matematica-1-medio', 1, 'Números');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u2', 'matematica-1-medio', 2, 'Álgebra y funciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u3', 'matematica-1-medio', 3, 'Geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-1-medio-u4', 'matematica-1-medio', 4, 'Probabilidad y estadística');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u1', 'historia-geografia-y-ciencias-sociales-1-medio', 1, 'Conformación del Estado nación en Europa y América');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u2', 'historia-geografia-y-ciencias-sociales-1-medio', 2, 'El nuevo orden contemporáneo en el mundo y en Chile');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u3', 'historia-geografia-y-ciencias-sociales-1-medio', 3, 'Las políticas de expansión territorial de Chile y su impacto');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-u4', 'historia-geografia-y-ciencias-sociales-1-medio', 4, 'El funcionamiento del mercado');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-medio-u1', 'ingles-1-medio', 1, 'Jobs');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-medio-u2', 'ingles-1-medio', 2, 'Lifelong Learning');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-medio-u3', 'ingles-1-medio', 3, 'The Arts');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-1-medio-u4', 'ingles-1-medio', 4, 'Traditions and Festivities');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-1-medio-u1', 'biologia-1-medio', 1, '¿Cómo han cambiado los seres vivos a lo largo del tiempo?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-1-medio-u2', 'biologia-1-medio', 2, '¿Cómo fluyen la materia y energía en los ecosistemas?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-1-medio-u3', 'biologia-1-medio', 3, '¿Qué acciones y fenómenos alteran los ecosistemas?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('fisica-1-medio-u1', 'fisica-1-medio', 1, 'Los fenómenos sonoros en nuestro entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('fisica-1-medio-u2', 'fisica-1-medio', 2, 'La luz y los fenómenos luminosos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('quimica-1-medio-u1', 'quimica-1-medio', 1, 'Reacciones químicas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('quimica-1-medio-u2', 'quimica-1-medio', 2, 'Estequiometría de reacción');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-2-medio-u1', 'lengua-y-literatura-2-medio', 1, 'La ruta que tú caminas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-2-medio-u2', 'lengua-y-literatura-2-medio', 2, 'Quién dijo que todo está perdido');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-2-medio-u3', 'lengua-y-literatura-2-medio', 3, 'Construyendo vínculos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-2-medio-u4', 'lengua-y-literatura-2-medio', 4, 'Aquí estoy yo');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u1', 'matematica-2-medio', 1, 'Números');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u2', 'matematica-2-medio', 2, 'Álgebra y funciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u3', 'matematica-2-medio', 3, 'Geometría');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-2-medio-u4', 'matematica-2-medio', 4, 'Probabilidad y estadística');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u1', 'historia-geografia-y-ciencias-sociales-2-medio', 1, 'Primera mitad del siglo XX: crisis y transformaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u2', 'historia-geografia-y-ciencias-sociales-2-medio', 2, 'Guerra Fría y globalización');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u3', 'historia-geografia-y-ciencias-sociales-2-medio', 3, 'Chile desde 1973 a la recuperación de la democracia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-u4', 'historia-geografia-y-ciencias-sociales-2-medio', 4, 'Chile: desde la recuperación de la democracia a nuestros días');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-medio-u1', 'ingles-2-medio', 1, 'Global World');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-medio-u2', 'ingles-2-medio', 2, 'Technology Around Us');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-medio-u3', 'ingles-2-medio', 3, 'Outstanding People');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-2-medio-u4', 'ingles-2-medio', 4, 'Sustainable Development');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-2-medio-u1', 'biologia-2-medio', 1, '¿Cómo se controlan los procesos corporales?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-2-medio-u2', 'biologia-2-medio', 2, '¿Cómo ejercer una sexualidad responsable?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('biologia-2-medio-u3', 'biologia-2-medio', 3, '¿Cómo se transmite y manipula el ADN?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('fisica-2-medio-u1', 'fisica-2-medio', 1, 'El movimiento y las fuerzas en nuestro entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('fisica-2-medio-u2', 'fisica-2-medio', 2, 'Dinámica del universo y exploración espacial');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('quimica-2-medio-u1', 'quimica-2-medio', 1, 'Soluciones químicas');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('quimica-2-medio-u2', 'quimica-2-medio', 2, 'Química orgánica');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-3-medio-u1', 'lengua-y-literatura-3-medio', 1, 'Hechos y emociones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-3-medio-u2', 'lengua-y-literatura-3-medio', 2, 'Identidad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-3-medio-u3', 'lengua-y-literatura-3-medio', 3, 'Transformaciones');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-3-medio-u4', 'lengua-y-literatura-3-medio', 4, 'Decisiones y desafíos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-3-medio-u1', 'filosofia-3-medio', 1, 'Cuestionar para comprender');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-3-medio-u2', 'filosofia-3-medio', 2, 'Realidad, libertad y sentido de la vida');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-3-medio-u3', 'filosofia-3-medio', 3, 'Ciencia, conocimiento y verdad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-3-medio-u4', 'filosofia-3-medio', 4, 'Diálogo y verdad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-medio-u1', 'matematica-3-medio', 1, 'Decido hacer deporte y cuidar mi salud');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-medio-u2', 'matematica-3-medio', 2, 'Uso herramientas para aplicar modelos matemáticos');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-3-medio-u3', 'matematica-3-medio', 3, 'Resuelvo problemas en formas circulares de mi entorno');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-medio-u1', 'ingles-3-medio', 1, 'What Makes Us Succeed?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-medio-u2', 'ingles-3-medio', 2, 'Why is Media Literacy Important?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-medio-u3', 'ingles-3-medio', 3, 'What is Business For?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-3-medio-u4', 'ingles-3-medio', 4, 'What Can We Do For Our Planet?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-3-medio-u1', 'educacion-ciudadana-3-medio', 1, 'Democracia y ciudadanía');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-3-medio-u2', 'educacion-ciudadana-3-medio', 2, 'Derechos Humanos y acceso a la justicia');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-3-medio-u3', 'educacion-ciudadana-3-medio', 3, 'Estado, mercado y participación');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-3-medio-u4', 'educacion-ciudadana-3-medio', 4, 'Territorio y participación');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('lengua-y-literatura-4-medio-u1', 'lengua-y-literatura-4-medio', 1, 'Ciudadanía y comunicación');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('matematica-4-medio-u1', 'matematica-4-medio', 1, 'Modelamiento matemático');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ciencias-naturales-4-medio-u1', 'ciencias-naturales-4-medio', 1, 'Ciencia y sociedad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('historia-geografia-y-ciencias-sociales-4-medio-u1', 'historia-geografia-y-ciencias-sociales-4-medio', 1, 'Desafíos del siglo XXI');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-4-medio-u1', 'filosofia-4-medio', 1, 'Cuestionar para comprender');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-4-medio-u2', 'filosofia-4-medio', 2, 'Realidad, libertad y sentido de la vida');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-4-medio-u3', 'filosofia-4-medio', 3, 'Ciencia, conocimiento y verdad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('filosofia-4-medio-u4', 'filosofia-4-medio', 4, 'Diálogo y verdad');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-medio-u1', 'ingles-4-medio', 1, 'What Makes Us Succeed?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-medio-u2', 'ingles-4-medio', 2, 'Why is Media Literacy Important?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-medio-u3', 'ingles-4-medio', 3, 'What is Business For?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('ingles-4-medio-u4', 'ingles-4-medio', 4, 'What Can We Do For Our Planet?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-4-medio-u1', 'educacion-ciudadana-4-medio', 1, '¿Por qué es importante participar para resolver problemas sociales?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-4-medio-u2', 'educacion-ciudadana-4-medio', 2, '¿Cómo se relacionan los medios de comunicación con la democracia?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-4-medio-u3', 'educacion-ciudadana-4-medio', 3, '¿Cómo construir una democracia más inclusiva?');
INSERT OR IGNORE INTO unidades (id, asignatura_id, numero, titulo) VALUES
  ('educacion-ciudadana-4-medio-u4', 'educacion-ciudadana-4-medio', 4, 'Derechos laborales y modelos de desarrollo, ¿cómo se relacionan?');

-- ============================================================
-- 4. OBJETIVOS DE APRENDIZAJE
-- ============================================================
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-parvularia-prekinder-oa1-1', 'educacion-parvularia-prekinder-u1', 'OA 1', 'Explorar y reconocer figuras geométricas en el entorno.', 'figuras,geometría,exploración,reconocimiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-prekinder-oa1-1', 'identidad-y-autonomia-prekinder-u1', 'OA 1', 'Comunicar a otras personas desafíos alcanzados, identificando acciones que aportaron a su logro y definiendo nuevas metas.', 'comunicación,autoconocimiento,metas,logros');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-prekinder-oa1-2', 'identidad-y-autonomia-prekinder-u1', 'OA 2', 'Comunicar sus preferencias, opiniones, ideas, en diversas situaciones cotidianas y juegos.', 'comunicación,preferencias,opiniones,participación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-prekinder-oa1-3', 'identidad-y-autonomia-prekinder-u1', 'OA 3', 'Planificar proyectos y juegos, en función de sus ideas e intereses, proponiendo actividades, organizando los recursos, incorporando los ajustes necesarios e iniciándose en la apreciación de sus resultados.', 'planificación,proyectos,organización,apreciación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-prekinder-oa1-1', 'convivencia-y-ciudadania-prekinder-u1', 'OA 1', 'Respetar normas y acuerdos creados colaborativamente con pares y adultos, para el bienestar del grupo.', 'respeto,normas,acuerdos,colaboración');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-prekinder-oa1-2', 'convivencia-y-ciudadania-prekinder-u1', 'OA 2', 'Participar en actividades o juegos colaborativos, planificando, acordando estrategias para un propósito en común y asumiendo progresivamente responsabilidad en ellos.', 'participación,estrategias,propósito común,responsabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-prekinder-oa1-3', 'convivencia-y-ciudadania-prekinder-u1', 'OA 3', 'Comprender que algunas de sus acciones y decisiones con respecto al desarrollo de juegos y proyectos colectivos, influyen en sus pares.', 'comprensión,acciones,decisiones,influencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('corporalidad-y-movimiento-prekinder-oa1-1', 'corporalidad-y-movimiento-prekinder-u1', 'OA 1', 'Resolver desafíos prácticos manteniendo control, equilibrio y coordinación al coordinar diversos movimientos, posturas y desplazamientos tales como: lanzar y recibir, desplazarse en planos inclinados, seguir ritmos en una variedad de juegos.', 'control,equilibrio,coordinación,movimientos,desplazamientos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('corporalidad-y-movimiento-prekinder-oa1-2', 'corporalidad-y-movimiento-prekinder-u1', 'OA 2', 'Coordinar con precisión sus habilidades motrices finas en función de sus intereses de exploración y juego.', 'coordinación,motricidad fina,precisión,exploración');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-parvularia-kinder-oa1-1', 'educacion-parvularia-kinder-u1', 'OA 1', 'Explorar y reconocer figuras geométricas en el entorno.', 'figuras,geometría,exploración,reconocimiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-kinder-oa1-1', 'identidad-y-autonomia-kinder-u1', 'OA 1', 'Comunicar a otras personas desafíos alcanzados, identificando acciones que aportaron a su logro y definiendo nuevas metas.', 'comunicación,autoconocimiento,metas,logros');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-kinder-oa1-2', 'identidad-y-autonomia-kinder-u1', 'OA 2', 'Comunicar sus preferencias, opiniones, ideas, en diversas situaciones cotidianas y juegos.', 'comunicación,preferencias,opiniones,participación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('identidad-y-autonomia-kinder-oa1-3', 'identidad-y-autonomia-kinder-u1', 'OA 3', 'Planificar proyectos y juegos, en función de sus ideas e intereses, proponiendo actividades, organizando los recursos, incorporando los ajustes necesarios e iniciándose en la apreciación de sus resultados.', 'planificación,proyectos,organización,apreciación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-kinder-oa1-1', 'convivencia-y-ciudadania-kinder-u1', 'OA 1', 'Respetar normas y acuerdos creados colaborativamente con pares y adultos, para el bienestar del grupo.', 'respeto,normas,acuerdos,colaboración');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-kinder-oa1-2', 'convivencia-y-ciudadania-kinder-u1', 'OA 2', 'Participar en actividades o juegos colaborativos, planificando, acordando estrategias para un propósito en común y asumiendo progresivamente responsabilidad en ellos.', 'participación,estrategias,propósito común,responsabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('convivencia-y-ciudadania-kinder-oa1-3', 'convivencia-y-ciudadania-kinder-u1', 'OA 3', 'Comprender que algunas de sus acciones y decisiones con respecto al desarrollo de juegos y proyectos colectivos, influyen en sus pares.', 'comprensión,acciones,decisiones,influencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('corporalidad-y-movimiento-kinder-oa1-1', 'corporalidad-y-movimiento-kinder-u1', 'OA 1', 'Resolver desafíos prácticos manteniendo control, equilibrio y coordinación al coordinar diversos movimientos, posturas y desplazamientos tales como: lanzar y recibir, desplazarse en planos inclinados, seguir ritmos en una variedad de juegos.', 'control,equilibrio,coordinación,movimientos,desplazamientos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('corporalidad-y-movimiento-kinder-oa1-2', 'corporalidad-y-movimiento-kinder-u1', 'OA 2', 'Coordinar con precisión sus habilidades motrices finas en función de sus intereses de exploración y juego.', 'coordinación,motricidad fina,precisión,exploración');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-1', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 1', 'Expresarse oralmente con claridad usando vocabulario variado en situaciones cotidianas.', 'expresión oral,vocabulario,comunicación,turnos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-2', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 2', 'Leer textos significativos que incluyan palabras con hiatos y diptongos.', 'lectura,hiatos,diptongos,puntuación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-1-basico-oa1-3', 'lenguaje-y-comunicacion-1-basico-u1', 'OA 3', 'Identificar los sonidos que componen las palabras.', 'fonemas,segmentación,sonidos,conciencia fonológica');
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
  ('lengua-mapuche-1-basico-oa1-1', 'lengua-mapuche-1-basico-u1', 'OA 1', 'Reconocer la importancia de la lengua mapuche en la identidad cultural del pueblo mapuche.', 'identidad,cultura,lengua mapuche,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-aymara-1-basico-oa1-1', 'lengua-aymara-1-basico-u1', 'OA 1', 'Reconocer la importancia de la lengua aymara en la identidad cultural del pueblo aymara.', 'identidad,cultura,lengua aymara,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-quechua-1-basico-oa1-1', 'lengua-quechua-1-basico-u1', 'OA 1', 'Reconocer la importancia de la lengua quechua en la identidad cultural del pueblo quechua.', 'identidad,cultura,lengua quechua,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-rapa-nui-1-basico-oa1-1', 'lengua-rapa-nui-1-basico-u1', 'OA 1', 'Reconocer la importancia de la lengua rapa nui en la identidad cultural del pueblo rapa nui.', 'identidad,cultura,lengua rapa nui,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-indigena-intercultural-1-basico-oa1-1', 'lengua-indigena-intercultural-1-basico-u1', 'OA 1', 'Reconocer la diversidad de lenguas originarias de Chile y su valor en la identidad cultural del país.', 'interculturalidad,diversidad,lenguas originarias,identidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa1-1', 'ingles-1-basico-u1', 'OA 1', 'Presentarse y presentar a su familia usando vocabulario básico en inglés.', 'presentación,familia,vocabulario,saludos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa2-1', 'ingles-1-basico-u2', 'OA 2', 'Identificar y nombrar elementos del aula y materiales escolares en inglés.', 'aula,materiales,escuela,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa3-1', 'ingles-1-basico-u3', 'OA 3', 'Nombrar y describir partes del cuerpo humano en inglés.', 'cuerpo,partes,descripción,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa4-1', 'ingles-1-basico-u4', 'OA 4', 'Identificar animales domésticos y mascotas, describiendo sus características en inglés.', 'animales,mascotas,características,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa5-1', 'ingles-1-basico-u5', 'OA 5', 'Nombrar alimentos y bebidas básicos, expresando preferencias en inglés.', 'alimentos,bebidas,preferencias,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa6-1', 'ingles-1-basico-u6', 'OA 6', 'Identificar y nombrar partes de la casa y muebles en inglés.', 'casa,muebles,habitaciones,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa7-1', 'ingles-1-basico-u7', 'OA 7', 'Describir el clima y condiciones meteorológicas básicas en inglés.', 'clima,tiempo,temperatura,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-basico-oa8-1', 'ingles-1-basico-u8', 'OA 8', 'Nombrar juguetes y juegos, describiendo acciones y colores en inglés.', 'juguetes,juegos,colores,acciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa1-1', 'lenguaje-y-comunicacion-2-basico-u1', 'OA 1', 'Comprender textos literarios como fábulas y leyendas, extrayendo información y reconociendo personajes.', 'comprensión,personajes,información,fábulas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa2-1', 'lenguaje-y-comunicacion-2-basico-u2', 'OA 2', 'Leer para aprender sobre animales y el entorno, extrayendo datos explícitos de artículos informativos.', 'información explícita,artículos,animales,entorno');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-2-basico-oa3-1', 'lenguaje-y-comunicacion-2-basico-u3', 'OA 3', 'Conocer e identificar modos de vida de pueblos originarios a través de leyendas y relatos tradicionales.', 'leyendas,pueblos originarios,tradiciones,relatos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa1-1', 'matematica-2-basico-u1', 'OA 1', 'Contar, leer, comparar y calcular adiciones y sustracciones de dos dígitos en forma vertical.', 'números,comparación,suma,resta,vertical');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa2-1', 'matematica-2-basico-u2', 'OA 2', 'Medir longitudes en metros, centímetros y milímetros. Leer y construir pictogramas y gráficos de barras.', 'medición,metros,centímetros,pictogramas,gráficos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa3-1', 'matematica-2-basico-u3', 'OA 3', 'Comprender la relación de igualdad y desigualdad usando balanzas, e identificar patrones numéricos y geométricos.', 'igualdad,desigualdad,balanzas,patrones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-basico-oa4-1', 'matematica-2-basico-u4', 'OA 4', 'Comprender la multiplicación como suma iterada (tablas del 2, 5 y 10) y describir figuras y cuerpos geométricos.', 'multiplicación,tablas,figuras,cuerpos,aristas,vértices');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa1-1', 'ciencias-naturales-2-basico-u1', 'OA 1', 'Describir la función de los órganos internos (corazón, pulmones, estómago) y estructuras (huesos y músculos), e identificar los efectos de la actividad física.', 'órganos,cuerpo,actividad física,salud');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa2-1', 'ciencias-naturales-2-basico-u2', 'OA 2', 'Identificar y clasificar fauna nativa de Chile en peligro de extinción, comprender las causas de su amenaza y proponer acciones para su conservación.', 'fauna,extinción,conservación,hábitat');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa3-1', 'ciencias-naturales-2-basico-u3', 'OA 3', 'Reconocer las características del agua, su importancia vital para los seres vivos, su ciclo en la naturaleza y proponer formas de cuidarla.', 'agua,ciclo,cuidado,sequía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-2-basico-oa4-1', 'ciencias-naturales-2-basico-u4', 'OA 4', 'Describir y medir características del tiempo atmosférico (lluvia, viento, temperatura), relacionándolas con las estaciones del año.', 'clima,temperatura,estaciones,lluvia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-2-basico-u3', 'OA 3', 'Conocer y distinguir los aportes de diversas culturas (pueblos originarios, conquistadores españoles y comunidades de inmigrantes) en la formación de la sociedad chilena.', 'mestizaje,multicultural,inmigrantes,aportes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-2-basico-u4', 'OA 4', 'Identificar y aplicar normas para la convivencia, el cuidado de los espacios públicos y del medio ambiente, valorando instituciones y medios de transporte/comunicación.', 'normas,convivencia,comunidad,instituciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-oa1-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u1', 'OA 1', 'Conocer los espacios del territorio andino (araxpacha, akapacha, manqhapacha) y comprender la importancia cultural y retribución en la fiesta del ganado.', 'territorio,araxpacha,akapacha,manqhapacha,fiesta del ganado');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-oa2-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u2', 'OA 2', 'Comprender la ceremonia del retorno del sol, identificando los principios, valores andinos y las formas correctas de saludo en la comunidad.', 'Willka Kuti,valores andinos,saludo,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-oa3-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u3', 'OA 3', 'Conocer las vivencias de los antepasados, el uso de plantas medicinales, la música y la alimentación andina destacando el valor de la quinua.', 'Pachamama,plantas medicinales,música,alimentación,quinua');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-oa4-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico-u4', 'OA 4', 'Comprender el calendario agroganadero y el tiempo de siembra, identificando la historia de la comunidad y el respeto por los lugares de origen.', 'Satapacha,calendario,siembra,historia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-oa1-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u1', 'OA 1', 'Escuchar a la naturaleza, interpretar sus mensajes y comprender el sentido de ceremonias de agradecimiento como el sahumerio a la Pachamama.', 'naturaleza,mensajes,ceremonias,Pachamama,sahumerio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-oa2-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u2', 'OA 2', 'Identificar las características del propio territorio, reconociendo a las familias, a los encargados y a las autoridades de la comunidad.', 'territorio,familias,encargados,autoridades,comunidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-oa3-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u3', 'OA 3', 'Comprender los relatos de la comunidad, las relaciones de parentesco, el significado de la Chakana y los valores representados en la bandera Wiphala.', 'relatos,parentesco,Chakana,Wiphala,valores');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-oa4-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico-u4', 'OA 4', 'Aprender sobre la fiesta del Inti Raymi, los relatos tradicionales y las técnicas agrícolas en terrazas para el cuidado del entorno.', 'Inti Raymi,relatos tradicionales,agricultura,entorno');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-oa1-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u1', 'OA 1', 'Conocer la leyenda de los exploradores y la llegada a ''Ana Kena, identificando la importancia del respeto por los lugares sagrados o Tapu.', 'leyenda,exploradores,Ana Kena,Tapu,respeto');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-oa2-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u2', 'OA 2', 'Aprender sobre las tradiciones ancestrales de Rapa Nui, como la preparación del ''umu (curanto), relatos tradicionales, cantos y juegos.', 'tradiciones,umu,curanto,cantos,juegos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-oa3-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u3', 'OA 3', 'Conocer el significado de la escritura rongo-rongo, las competencias físicas y deportivas tradicionales de la Tāpati y la importancia de las aves de la isla.', 'rongo-rongo,Tāpati,aves,escritura,competencias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-oa4-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico-u4', 'OA 4', 'Comprender los mensajes de la naturaleza mediante la observación de las estaciones del año, las estrellas y los antiguos observatorios o Tupa.', 'naturaleza,estaciones,estrellas,Tupa,observatorios');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-oa1-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u1', 'OA 1', 'Reconocer emociones y comportamientos humanos a través de epew y piam, comprendiendo la importancia de los saludos y la alimentación.', 'emociones,epew,piam,saludos,alimentación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-oa2-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u2', 'OA 2', 'Identificar los distintos territorios mapuche y sus características geográficas, junto a la vestimenta tradicional y la celebración del Wiñol Txipan Antü.', 'territorios mapuche,geografía,vestimenta,Wiñol Txipantü');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-oa3-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u3', 'OA 3', 'Conocer el idioma mapuzugun mediante saludos y descripciones de oficios, comprendiendo además el valor del trabajo en platería (rütxan).', 'mapuzugun,saludos,oficios,platería,rütxan');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-oa4-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico-u4', 'OA 4', 'Comprender los mensajes que entregan los animales, las señales de la naturaleza, el significado de las banderas y los ciclos de recolección.', 'animales,naturaleza,banderas,recolección,mensajes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-oa1-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u1', 'OA 1', 'Conocer las características del territorio aymara y quechua, sus ceremonias ancestrales vinculadas a la naturaleza y los tiempos andinos.', 'territorio,aymara,quechua,ceremonias,naturaleza');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-oa2-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u2', 'OA 2', 'Conocer relatos tradicionales de la memoria lickanantay y la sabiduría del pueblo Colla sobre el bienestar, el cuidado y las ceremonias en armonía con la naturaleza.', 'colla,lickanantay,relatos,armonía,naturaleza');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-oa3-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u3', 'OA 3', 'Identificar el patrimonio y los lugares sagrados del pueblo Rapa Nui, junto con la cerámica del pueblo Diaguita y la importancia de los mensajes en piedras o petroglifos.', 'diaguita,rapa nui,patrimonio,petroglifos,cerámica');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-oa4-1', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico-u4', 'OA 4', 'Conocer los sonidos, relatos y embarcaciones tradicionales de los pueblos australes, destacando la recolección, el tejido de canastos de junco y el uso de corrales de pesca.', 'kawésqar,yagán,mapuche williche,embarcaciones,corrales de pesca');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa1-1', 'ingles-2-basico-u1', 'OA 1', 'Nombrar y describir animales salvajes favoritos, aprendiendo a formular preguntas sencillas.', 'animales,salvajes,preguntas,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa2-1', 'ingles-2-basico-u2', 'OA 2', 'Describir actividades de tiempo libre, pasatiempos y deportes favoritos, expresando habilidades.', 'deportes,tiempo libre,pasatiempos,habilidades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa3-1', 'ingles-2-basico-u3', 'OA 3', 'Identificar, nombrar y describir prendas de vestir, eligiendo la ropa adecuada según el clima.', 'ropa,prendas,clima,vestimenta');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa4-1', 'ingles-2-basico-u4', 'OA 4', 'Identificar diversas profesiones y sus herramientas de trabajo, asociándolas con elementos del entorno.', 'profesiones,herramientas,trabajo,entorno');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa5-1', 'ingles-2-basico-u5', 'OA 5', 'Describir las características físicas de los compañeros de clase y hablar sobre uno mismo reconociendo las diferencias.', 'compañeros,características,diferencias,descripción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa6-1', 'ingles-2-basico-u6', 'OA 6', 'Hablar sobre lugares de la ciudad, describir ubicaciones favoritas y dar direcciones básicas.', 'ciudad,lugares,ubicaciones,direcciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa7-1', 'ingles-2-basico-u7', 'OA 7', 'Conversar sobre celebraciones, describir tradiciones y expresar las fechas en las que ocurren estas festividades.', 'festividades,celebraciones,tradiciones,fechas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-basico-oa8-1', 'ingles-2-basico-u8', 'OA 8', 'Reconocer instrumentos musicales, mencionar cómo tocarlos y hablar sobre los gustos musicales.', 'instrumentos,música,gustos,tocar');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa1-1', 'lenguaje-y-comunicacion-3-basico-u1', 'OA 1', 'Leer y comprender narraciones y artículos informativos sobre la Tierra y el universo, extrayendo información explícita e implícita, y escribiendo textos breves.', 'lectura,comprensión,información,universo,escritura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa2-1', 'lenguaje-y-comunicacion-3-basico-u2', 'OA 2', 'Comprender poemas, fábulas y cómics valorando la ayuda mutua, y desarrollar la escritura creativa expresando opiniones y emociones.', 'poemas,fábulas,cómics,escritura creativa,emociones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa3-1', 'lenguaje-y-comunicacion-3-basico-u3', 'OA 3', 'Escribir artículos informativos y cuentos utilizando correctamente signos de puntuación, e investigar sobre temas del entorno natural y social.', 'artículos,cuentos,puntuación,investigación,entorno');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-3-basico-oa4-1', 'lenguaje-y-comunicacion-3-basico-u4', 'OA 4', 'Comprender textos orales y escritos sobre tradiciones, identificar el propósito del autor y participar en exposiciones orales expresando ideas con claridad.', 'tradiciones,propósito del autor,exposiciones,oralidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa1-1', 'matematica-3-basico-u1', 'OA 1', 'Leer, contar y representar números hasta 1000, resolver adiciones y sustracciones en forma vertical con reagrupamiento, y reconocer patrones numéricos en la tabla del 100.', 'números,hasta 1000,suma,resta,vertical,reagrupamiento,patrones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa2-1', 'matematica-3-basico-u2', 'OA 2', 'Leer la hora en relojes análogos y digitales calculando duraciones, construir y memorizar las tablas de multiplicar, y resolver problemas de división.', 'tiempo,relojes,multiplicación,tablas,división');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa3-1', 'matematica-3-basico-u3', 'OA 3', 'Describir localizaciones en una cuadrícula, identificar redes de cuerpos geométricos 3D, calcular el perímetro de rectángulos o cuadrados y clasificar triángulos según sus lados y ángulos.', 'cuadrícula,cuerpos 3D,perímetro,triángulos,clasificación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-basico-oa4-1', 'matematica-3-basico-u4', 'OA 4', 'Construir e interpretar gráficos de barras y juegos de azar, comparar fracciones de uso común, y utilizar instrumentos para medir la masa en kilogramos y gramos.', 'gráficos,fracciones,masa,kilogramos,gramos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa1-1', 'ciencias-naturales-3-basico-u1', 'OA 1', 'Identificar los componentes del sistema solar (Sol, planetas, satélites, cometas y asteroides) y explicar los movimientos de rotación y traslación de la Tierra junto con sus efectos.', 'sistema solar,planetas,rotación,traslación,Tierra');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa2-1', 'ciencias-naturales-3-basico-u2', 'OA 2', 'Explicar las características de la luz y del sonido, investigando a través de la experimentación cómo se propagan, reflejan y son absorbidos por distintos materiales.', 'luz,sonido,propagación,reflexión,absorción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa3-1', 'ciencias-naturales-3-basico-u3', 'OA 3', 'Comprender las estructuras y necesidades de las plantas, conocer la flora nativa de Chile, valorar su importancia para los seres vivos y proponer acciones para el manejo de residuos.', 'plantas,flora nativa,residuos,reciclaje,3R');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-3-basico-oa4-1', 'ciencias-naturales-3-basico-u4', 'OA 4', 'Clasificar los alimentos según su función (energéticos, constructores, reguladores) y composición nutricional, reconociendo las consecuencias de una mala dieta para aplicar hábitos saludables.', 'alimentos,nutrición,hábitos saludables,dieta');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-3-basico-u1', 'OA 1', 'Orientarse en el espacio utilizando cuadrículas y puntos cardinales, e identificar líneas imaginarias, continentes, océanos y las características de las diferentes zonas climáticas.', 'cuadrículas,puntos cardinales,continentes,océanos,clima');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa2-1', 'historia-geografia-y-ciencias-sociales-3-basico-u2', 'OA 2', 'Comprender la influencia del entorno natural en la civilización griega, cómo se desarrollaba la vida en las polis y reconocer su legado en la democracia, el arte, la filosofía y el deporte.', 'griegos,polis,democracia,arte,filosofía,deporte');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-3-basico-u3', 'OA 3', 'Describir el surgimiento de Roma, su organización en grupos sociales, la vida en la ciudad y reconocer aportes como el latín, el derecho romano y su avanzada ingeniería (acueductos y calzadas).', 'romanos,latín,derecho,ingeniería,acueductos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-3-basico-u4', 'OA 4', 'Reconocer actitudes fundamentales para la convivencia (respeto, tolerancia, empatía), comprender la importancia de los Derechos del Niño y la labor de las instituciones en la protección ciudadana.', 'convivencia,respeto,tolerancia,Derechos del Niño,instituciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa1-1', 'ingles-3-basico-u1', 'OA 1', 'Identificar y nombrar útiles escolares, y describir la ubicación espacial de los objetos usando preposiciones.', 'útiles,escolares,preposiciones,ubicación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa2-1', 'ingles-3-basico-u2', 'OA 2', 'Hablar sobre rutinas diarias (levantarse, ducharse, desayunar, etc.) e indicar la hora en inglés.', 'rutinas,mañana,hora,actividades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa3-1', 'ingles-3-basico-u3', 'OA 3', 'Describir física y psicológicamente a personajes de cuentos (pirata, bruja, princesa, etc.) a través de diálogos cortos.', 'personajes,cuentos,descripción,diálogos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa4-1', 'ingles-3-basico-u4', 'OA 4', 'Nombrar deportes, expresar habilidades físicas usando can / can''t y hablar de gustos y preferencias.', 'deportes,habilidades,can,gustos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa5-1', 'ingles-3-basico-u5', 'OA 5', 'Describir animales salvajes y formular preguntas simples sobre sus características físicas y habilidades.', 'animales,salvajes,características,preguntas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa6-1', 'ingles-3-basico-u6', 'OA 6', 'Describir acciones en progreso (presente continuo) y nombrar e identificar las diferentes partes de la casa.', 'presente continuo,acciones,casa,partes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa7-1', 'ingles-3-basico-u7', 'OA 7', 'Conocer distintos medios de transporte, usar adjetivos para describirlos (lento, rápido, viejo, nuevo) y contar hasta cien.', 'transporte,adjetivos,contar,velocidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-basico-oa8-1', 'ingles-3-basico-u8', 'OA 8', 'Aprender vocabulario relacionado a actividades de verano (acampar, surfear, etc.) y formular preguntas para interactuar con pares.', 'verano,actividades,vocabulario,interacción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa1-1', 'lenguaje-y-comunicacion-4-basico-u1', 'OA 1', 'Desarrollar la comprensión de narraciones sobre viajes, incluyendo leyendas y cuentos, practicando la descripción escrita y la secuenciación de hechos.', 'lectura,leyendas,cuentos,secuenciación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa2-1', 'lenguaje-y-comunicacion-4-basico-u2', 'OA 2', 'Explorar textos informativos sobre fauna, redactar noticias periodísticas y fortalecer el uso de tildes en palabras agudas, graves y esdrújulas.', 'informativo,noticias,ortografía,tildes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa3-1', 'lenguaje-y-comunicacion-4-basico-u3', 'OA 3', 'Reflexionar sobre hábitats mediante la lectura de fábulas y artículos, practicando el uso de adjetivos calificativos y la escritura creativa.', 'fábulas,adjetivos,escritura creativa');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa4-1', 'lenguaje-y-comunicacion-4-basico-u4', 'OA 4', 'Analizar el lenguaje poético y figurado, la personificación y la metáfora a través de la lectura y creación de poemas y retahílas.', 'poemas,metáfora,personificación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa5-1', 'lenguaje-y-comunicacion-4-basico-u5', 'OA 5', 'Fomentar la reflexión sobre las actitudes personales mediante fábulas, reforzando la redacción con el uso de sinónimos para enriquecer el vocabulario.', 'fábulas,sinónimos,vocabulario');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa6-1', 'lenguaje-y-comunicacion-4-basico-u6', 'OA 6', 'Explorar textos con elementos fantásticos, investigar sobre figuras históricas mediante biografías y utilizar correctamente conectores temporales.', 'biografías,conectores,temporales');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa7-1', 'lenguaje-y-comunicacion-4-basico-u7', 'OA 7', 'Comprender la visión de mundo del pueblo Mapuche y otros pueblos mediante leyendas, trabajando la concordancia entre sujeto y verbo.', 'leyendas,mapuche,concordancia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-4-basico-oa8-1', 'lenguaje-y-comunicacion-4-basico-u8', 'OA 8', 'Profundizar en la lectura informativa y el uso de adverbios (modo, tiempo, lugar), culminando con la escritura de artículos informativos y recetas.', 'adverbios,informativo,recetas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-1', 'matematica-4-basico-u1', 'OA 1', 'Leer, escribir, comparar y ordenar números hasta 10.000, incluyendo el redondeo y la estimación de cantidades.', 'números,redondeo,estimación,orden');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-2', 'matematica-4-basico-u1', 'OA 2', 'Resolver adiciones y sustracciones con reagrupamiento.', 'adición,sustracción,reagrupamiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa1-3', 'matematica-4-basico-u1', 'OA 3', 'Medir y calcular longitudes (cm, m, km).', 'medición,longitud,unidades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa2-1', 'matematica-4-basico-u2', 'OA 4', 'Aplicar el algoritmo estándar de la multiplicación y división (con y sin resto).', 'multiplicación,división,algoritmo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa2-2', 'matematica-4-basico-u2', 'OA 5', 'Medir tiempo, calcular áreas de figuras (cm², m²) y medir ángulos con transportador.', 'tiempo,área,ángulos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa2-3', 'matematica-4-basico-u2', 'OA 6', 'Identificar patrones en tablas.', 'patrones,tablas,regularidades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa3-1', 'matematica-4-basico-u3', 'OA 7', 'Representar, comparar y operar con fracciones de igual denominador y números decimales (hasta los décimos).', 'fracciones,decimales,comparación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa3-2', 'matematica-4-basico-u3', 'OA 8', 'Medir volumen (L, dL, mL, cm³) e identificar ejes de simetría.', 'volumen,simetría,unidades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa3-3', 'matematica-4-basico-u3', 'OA 9', 'Leer e interpretar diagramas de puntos.', 'datos,encuestas,diagramas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa4-1', 'matematica-4-basico-u4', 'OA 10', 'Operar con fracciones de igual denominador.', 'fracciones,suma,resta');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa4-2', 'matematica-4-basico-u4', 'OA 11', 'Resolver ecuaciones e inecuaciones simples de un paso usando balanzas.', 'ecuaciones,inecuaciones,balanzas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-4-basico-oa4-3', 'matematica-4-basico-u4', 'OA 12', 'Aplicar transformaciones isométricas (traslación, reflexión, rotación) y analizar probabilidades en experimentos aleatorios.', 'transformaciones,isometría,azar,probabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa1-1', 'ciencias-naturales-4-basico-u1', 'OA 1', 'Describir las capas internas de la Tierra y explicar los fenómenos naturales provocados por el movimiento de las placas tectónicas.', 'capas,tierra,placas,tectónicas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa2-1', 'ciencias-naturales-4-basico-u2', 'OA 2', 'Demostrar que la materia tiene masa y volumen, comparar los estados sólido, líquido y gaseoso, e identificar los efectos de las fuerzas.', 'materia,masa,volumen,fuerzas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa3-1', 'ciencias-naturales-4-basico-u3', 'OA 3', 'Explicar el movimiento del cuerpo a través del sistema locomotor y comprender cómo el sistema nervioso reacciona a estímulos.', 'locomotor,nervioso,huesos,músculos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-4-basico-oa4-1', 'ciencias-naturales-4-basico-u4', 'OA 4', 'Reconocer componentes bióticos y abióticos de diversos ecosistemas, describir adaptaciones e identificar cadenas alimentarias.', 'ecosistemas,bióticos,abióticos,cadenas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-4-basico-u1', 'OA 1', 'Reconocer la diversidad de paisajes (fríos, templados, áridos, tropicales, costeros y montañosos) y la distribución de recursos naturales en América.', 'paisajes,recursos,desarrollo sostenible');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa2-1', 'historia-geografia-y-ciencias-sociales-4-basico-u2', 'OA 2', 'Describir y comparar las civilizaciones Maya, Azteca e Inca, analizando sus organizaciones políticas, sociales, económicas, logros tecnológicos y legados culturales.', 'maya,azteca,inca,civilizaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-4-basico-u3', 'OA 3', 'Identificar la influencia de los pueblos originarios en la cultura actual y reconocer los desafíos y oportunidades que enfrentan en el presente.', 'legado,cultura,presente');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-4-basico-u4', 'OA 4', 'Comprender la organización democrática de Chile, el rol de las instituciones y autoridades, y la importancia de la participación ciudadana.', 'democracia,instituciones,derechos,participación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa1-1', 'ingles-4-basico-u1', 'OA 1', 'Nombrar lugares de la ciudad y partes de la casa, describir actividades que las personas realizan en el hogar y comprender mapas básicos.', 'lugares,ciudad,casa,mapas,actividades');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa2-1', 'ingles-4-basico-u2', 'OA 2', 'Nombrar países, nacionalidades y fechas de celebraciones importantes, y expresar planes a futuro.', 'países,nacionalidades,celebraciones,planes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa3-1', 'ingles-4-basico-u3', 'OA 3', 'Nombrar objetos del espacio y planetas del sistema solar, hablar sobre actividades diarias regulares y utilizar números hasta el mil.', 'espacio,planetas,sistema solar,números');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa4-1', 'ingles-4-basico-u4', 'OA 4', 'Identificar, nombrar y describir física y espacialmente a los insectos y pequeños bichos, indicando dónde viven y cómo se mueven.', 'insectos,bichos,hábitats,descripción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa5-1', 'ingles-4-basico-u5', 'OA 5', 'Describir actividades recreativas de campamento, proponer planes al aire libre y seguir instrucciones de seguridad y cuidado de la naturaleza.', 'campamento,actividades,seguridad,naturaleza');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-basico-oa6-1', 'ingles-4-basico-u6', 'OA 6', 'Describir la apariencia física y los rasgos de personalidad de personajes de historias, y explicar las acciones que realizan en el momento (Presente Continuo).', 'personajes,apariencia,personalidad,presente continuo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa1-1', 'lenguaje-y-comunicacion-5-basico-u1', 'OA 1', 'Reflexionar sobre el trabajo en equipo, la igualdad de género y el deporte a través de la lectura de novelas y artículos.', 'trabajo en equipo,igualdad,deporte,personajes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa2-1', 'lenguaje-y-comunicacion-5-basico-u2', 'OA 2', 'Explorar emociones y sentimientos en la poesía y narraciones, interpretando lenguaje figurado y comparando textos.', 'emociones,poesía,lenguaje figurado,resiliencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa3-1', 'lenguaje-y-comunicacion-5-basico-u3', 'OA 3', 'Analizar la relación entre el ser humano y el medioambiente mediante poemas, cómics y noticias, valorando la memoria histórica.', 'medioambiente,memoria,cultura,pueblos originarios');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-5-basico-oa4-1', 'lenguaje-y-comunicacion-5-basico-u4', 'OA 4', 'Investigar sobre migraciones y viajes como procesos de aprendizaje, analizando narrativas sobre cambios y nuevos comienzos.', 'migraciones,viajes,aprendizaje,cambios');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa1-1', 'matematica-5-basico-u1', 'OA 1', 'Leer, escribir y ordenar números hasta 100 millones, resolver operaciones combinadas, aplicar propiedades de las operaciones y modelar situaciones con patrones y ecuaciones.', 'números,operaciones,propiedades,patrones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa2-1', 'matematica-5-basico-u2', 'OA 2', 'Realizar divisiones por números de dos dígitos, resolver problemas con fracciones (igual y distinto denominador) y comparar/operar números decimales.', 'división,fracciones,decimales,problemas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa3-1', 'matematica-5-basico-u3', 'OA 3', 'Construir y medir ángulos, calcular áreas de triángulos y cuadriláteros, y relacionar el volumen de cubos y paralelepípedos con sus dimensiones.', 'ángulos,área,volumen,geometría');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-5-basico-oa4-1', 'matematica-5-basico-u4', 'OA 4', 'Analizar datos en gráficos de línea y doble barra, describir la probabilidad de eventos y aplicar traslaciones, reflexiones y rotaciones en el plano cartesiano.', 'estadística,probabilidad,transformaciones,gráficos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa1-1', 'ciencias-naturales-5-basico-u1', 'OA 1', 'Describir la distribución del agua en la Tierra, comprender el ciclo hidrológico y proponer medidas de protección y uso responsable de las reservas hídricas.', 'agua,ciclo,hidrológico,protección');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa2-1', 'ciencias-naturales-5-basico-u2', 'OA 2', 'Comprender la organización de los seres vivos a partir de la célula, su estructura y funciones, relacionándolas con la nutrición y el aporte energético de los alimentos.', 'célula,organización,nutrición,alimentos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa3-1', 'ciencias-naturales-5-basico-u3', 'OA 3', 'Analizar los efectos del consumo de tabaco, reconocer el rol de los microorganismos en la salud y promover medidas de higiene y prevención.', 'tabaco,microorganismos,higiene,prevención');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-5-basico-oa4-1', 'ciencias-naturales-5-basico-u4', 'OA 4', 'Explicar el funcionamiento de circuitos eléctricos simples, identificar materiales conductores y aislantes, y promover el uso eficiente y seguro de la energía.', 'electricidad,circuitos,conductores,aislantes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-5-basico-u1', 'OA 1', 'Reconocer las zonas naturales de Chile, describiendo sus paisajes, clima, recursos naturales y los riesgos de desastres naturales.', 'zonas,paisajes,clima,recursos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa2-1', 'historia-geografia-y-ciencias-sociales-5-basico-u2', 'OA 2', 'Analizar el proceso de descubrimiento y conquista de América y Chile, valorando las diferentes perspectivas y el impacto cultural.', 'descubrimiento,conquista,cultura,perspectivas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-5-basico-u3', 'OA 3', 'Comprender la organización política, económica y social durante la Colonia, destacando el rol de la Iglesia y el mestizaje cultural.', 'colonia,organización,mestizaje,iglesia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-5-basico-u4', 'OA 4', 'Identificar los procesos y actores clave que llevaron a la independencia y la formación del Estado-nación en Chile.', 'independencia,identidad,derechos,ciudadanos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-5-basico-oa1-1', 'ingles-5-basico-u1', 'OA 1', 'Comunicar preferencias sobre destinos turísticos, usar medios de transporte y redactar descripciones de ciudades mediante correos electrónicos.', 'viajes,transporte,ciudades,correos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-5-basico-oa2-1', 'ingles-5-basico-u2', 'OA 2', 'Describir tradiciones culturales y gastronomía de distintos países, utilizando adjetivos comparativos y reconociendo la diversidad global.', 'cultura,tradiciones,comparativos,diversidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-5-basico-oa3-1', 'ingles-5-basico-u3', 'OA 3', 'Expresar habilidades lingüísticas, investigar sobre la importancia de las lenguas nativas y comprender sistemas de comunicación inclusiva.', 'lenguas,habilidades,comunicación,inclusiva');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-5-basico-oa4-1', 'ingles-5-basico-u4', 'OA 4', 'Hablar sobre oficios y ocupaciones, describir rutinas diarias, decir la hora y reflexionar sobre la importancia de las profesiones para el futuro.', 'ocupaciones,rutinas,hora,profesiones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-1', 'matematica-6-basico-u1', 'OA 1', 'Demostrar que comprenden los factores y múltiplos determinando los mínimos comunes múltiplos.', 'factores,múltiplos,mcm');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-2', 'matematica-6-basico-u1', 'OA 3', 'Demostrar que comprenden el concepto de razón de manera concreta, pictórica y simbólica.', 'razón,concreto,pictórico,simbólico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa1-3', 'matematica-6-basico-u1', 'OA 8', 'Resolver problemas rutinarios y no rutinarios que involucren adiciones y sustracciones de fracciones.', 'adición,sustracción,fracciones,resolución de problemas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa3-1', 'matematica-6-basico-u3', 'OA 9', 'Operar con fracciones y números mixtos, comprendiendo su equivalencia con números decimales y aplicando razones para comparar magnitudes.', 'fracciones,mixtos,decimales,razones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-6-basico-oa4-1', 'matematica-6-basico-u4', 'OA 10', 'Analizar situaciones mediante el uso de porcentajes, expresiones algebraicas, ecuaciones simples y la interpretación de gráficos estadísticos.', 'porcentajes,álgebra,ecuaciones,gráficos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa1-1', 'lenguaje-y-comunicacion-6-basico-u1', 'OA 1', 'Analizar narraciones para identificar acciones principales, ambientes y costumbres, promoviendo el gusto por la lectura.', 'narraciones,acciones,ambientes,costumbres');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa2-1', 'lenguaje-y-comunicacion-6-basico-u2', 'OA 2', 'Comprender la importancia del cuidado ambiental a través de poemas y textos informativos, interpretando lenguaje figurado.', 'medioambiente,poemas,informativo,lenguaje figurado');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa3-1', 'lenguaje-y-comunicacion-6-basico-u3', 'OA 3', 'Reflexionar sobre la relación del ser humano con el universo, analizando textos literarios y científicos.', 'cosmos,universo,literario,científico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-6-basico-oa4-1', 'lenguaje-y-comunicacion-6-basico-u4', 'OA 4', 'Valorar la diversidad y los derechos humanos a partir del análisis de textos narrativos y biográficos.', 'diversidad,derechos,biográficos,igualdad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa1-1', 'ciencias-naturales-6-basico-u1', 'OA 1', 'Describir los sistemas reproductores y los cambios asociados a la pubertad, promoviendo el cuidado del cuerpo y la higiene personal.', 'reproducción,pubertad,cuidado,higiene');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa2-1', 'ciencias-naturales-6-basico-u2', 'OA 2', 'Caracterizar las capas externas de la Tierra, la importancia de la fotosíntesis y las interacciones alimentarias en los ecosistemas.', 'tierra,fotosíntesis,ecosistemas,tramas tróficas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa3-1', 'ciencias-naturales-6-basico-u3', 'OA 3', 'Explicar la energía y sus manifestaciones, distinguiendo entre recursos energéticos renovables y no renovables.', 'energía,renovables,no renovables,recursos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-6-basico-oa4-1', 'ciencias-naturales-6-basico-u4', 'OA 4', 'Describir el comportamiento de las partículas en los estados de la materia y los cambios de estado presentes en el entorno.', 'materia,partículas,estados,cambios');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-6-basico-u1', 'OA 1', 'Comprender la organización democrática del país, el rol de la Constitución, los poderes del Estado y la importancia de respetar los derechos fundamentales.', 'organización,constitución,poderes,derechos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa2-1', 'historia-geografia-y-ciencias-sociales-6-basico-u2', 'OA 2', 'Analizar el proceso de independencia de Hispanoamérica y Chile, la consolidación del orden republicano y la ocupación del territorio nacional.', 'independencia,república,territorio,consolidación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-6-basico-u3', 'OA 3', 'Caracterizar el desarrollo político y social del siglo XX en Chile, evaluando los procesos de democratización, el quiebre institucional y la dictadura.', 'siglo XX,democracia,dictadura,derechos humanos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-6-basico-u4', 'OA 4', 'Identificar y describir la diversidad de ambientes naturales del país y su división político-administrativa regional.', 'ambientes,regiones,división,demográfica');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-6-basico-oa1-1', 'ingles-6-basico-u1', 'OA 1', 'Explorar y describir expresiones artísticas, expresando preferencias personales y practicando habilidades de comunicación oral y escrita.', 'arte,pintura,escultura,teatro');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-6-basico-oa2-1', 'ingles-6-basico-u2', 'OA 2', 'Identificar y describir festividades chilenas y celebraciones mundiales, utilizando tiempos verbales del pasado.', 'festividades,cultura,pasado,celebraciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-6-basico-oa3-1', 'ingles-6-basico-u3', 'OA 3', 'Describir problemas ambientales, proponer acciones de cuidado para el planeta y expresar obligaciones para contribuir a la sostenibilidad.', 'medioambiente,sostenibilidad,acciones,planeta');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-6-basico-oa4-1', 'ingles-6-basico-u4', 'OA 4', 'Analizar y describir costumbres culturales de diferentes países, fomentando la empatía, el respeto por la diversidad y la comunicación intercultural.', 'costumbres,diversidad,empatía,intercultural');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-7-basico-oa1-1', 'lengua-y-literatura-7-basico-u1', 'OA 1', 'Interpretar y reflexionar sobre obras literarias conectadas al autoconocimiento, además de analizar y producir reportajes informativos empleando estrategias de lectura.', 'interpretación,autoconocimiento,reportajes,estrategias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-7-basico-oa2-1', 'lengua-y-literatura-7-basico-u2', 'OA 2', 'Fomentar el respeto por la diversidad comunitaria y los derechos ciudadanos mediante la interpretación de visiones de mundo en relatos orales y textos argumentativos.', 'diversidad,derechos,oralidad,argumentación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-7-basico-oa3-1', 'lengua-y-literatura-7-basico-u3', 'OA 3', 'Apreciar la vinculación entre el ser humano y el entorno natural interpretando textos de ciencia ficción, relatos originarios y la redacción de cartas de temática ecológica.', 'ciencia ficción,relatos originarios,cartas,ecología');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-7-basico-oa4-1', 'lengua-y-literatura-7-basico-u4', 'OA 4', 'Desarrollar un pensamiento crítico frente a las representaciones sociales de los medios informativos, así como leer romances y crónicas que retratan historias del pasado.', 'pensamiento crítico,medios,romances,crónicas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa1-1', 'matematica-7-basico-u1', 'OA 1', 'Demostrar dominio en la adición y sustracción de números enteros positivos y negativos, multiplicar decimales, dividir fracciones y representar porcentajes en escenarios de la vida real.', 'enteros,decimales,fracciones,porcentajes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa2-1', 'matematica-7-basico-u2', 'OA 2', 'Transformar situaciones al lenguaje algebraico elemental, e interpretar y evaluar problemas cotidianos aplicando relaciones de proporcionalidad directa e inversa.', 'álgebra,proporcionalidad,variables,ecuaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa3-1', 'matematica-7-basico-u3', 'OA 3', 'Reconocer coordenadas de figuras e identificar vectores en el plano cartesiano, así como deducir fórmulas para calcular el área y perímetro de la circunferencia.', 'coordenadas,vectores,plano cartesiano,circunferencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-7-basico-oa4-1', 'matematica-7-basico-u4', 'OA 4', 'Interpretar información estadística separando muestras y poblaciones, construir tablas de frecuencias relativas/absolutas y calcular la probabilidad de ocurrencia de un experimento aleatorio.', 'estadística,muestras,frecuencias,probabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa1-1', 'ciencias-naturales-7-basico-u1', 'OA 1', 'Clasificar los componentes de la materia en sustancias puras y mezclas, y comprender el comportamiento, las propiedades y las leyes que rigen a los gases.', 'materia,sustancias,mezclas,gases');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa2-1', 'ciencias-naturales-7-basico-u2', 'OA 2', 'Analizar el efecto de diferentes tipos de fuerzas mecánicas sobre los cuerpos e identificar los procesos geológicos que modelan la litósfera por el movimiento de placas tectónicas.', 'fuerzas,placas tectónicas,geología,litósfera');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa3-1', 'ciencias-naturales-7-basico-u3', 'OA 3', 'Describir el rol perjudicial y benéfico de virus, bacterias y hongos, e identificar cómo reaccionan las barreras del sistema inmunológico para combatir infecciones.', 'virus,bacterias,sistema inmunológico,infecciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-7-basico-oa4-1', 'ciencias-naturales-7-basico-u4', 'OA 4', 'Fomentar el respeto, reconocer de forma íntegra las distintas dimensiones de la sexualidad humana, la formación de gametos y promover medidas preventivas de salud e higiene.', 'sexualidad,gametos,prevención,higiene');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-7-basico-u1', 'OA 1', 'Comprender el proceso evolutivo de hominización, los cambios de adaptación al entorno durante el periodo Neolítico y la formación y legado de las civilizaciones antiguas.', 'hominización,Neolítico,civilizaciones,legado');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa2-1', 'historia-geografia-y-ciencias-sociales-7-basico-u2', 'OA 2', 'Estudiar el entorno geográfico del mar Mediterráneo, analizar el sistema de la democracia ateniense y el desarrollo político del Imperio romano.', 'Mediterráneo,democracia,Imperio romano,política');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa3-1', 'historia-geografia-y-ciencias-sociales-7-basico-u3', 'OA 3', 'Analizar la fragmentación política de Europa, el surgimiento del vasallaje y feudalismo, el rol de la Iglesia católica y la coexistencia con el Imperio bizantino y el mundo islámico.', 'feudalismo,vasallaje,Iglesia,Imperio bizantino');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-oa4-1', 'historia-geografia-y-ciencias-sociales-7-basico-u4', 'OA 4', 'Evaluar el desarrollo agrícola, la estratificación social, la cosmovisión religiosa y el legado de técnicas y arquitectura de los mayas, aztecas e incas en el presente.', 'mayas,aztecas,incas,legado');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-7-basico-oa1-1', 'ingles-7-basico-u1', 'OA 1', 'Expresar estados de ánimo, utilizar vocabulario descriptivo del aspecto físico y comprender historias cortas relacionadas con el desarrollo emocional de las personas.', 'feelings,vocabulary,emotions,descriptions');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-7-basico-oa2-1', 'ingles-7-basico-u2', 'OA 2', 'Incorporar vocabulario sobre diferentes dietas, nutrientes y rutinas de bienestar para distinguir comportamientos y tendencias propicios para un estilo de vida saludable.', 'diet,nutrients,wellness,habits');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-7-basico-oa3-1', 'ingles-7-basico-u3', 'OA 3', 'Hablar e intercambiar opiniones acerca de los diferentes tipos de pasatiempos, competencias y destrezas físicas destacando logros deportivos.', 'sports,hobbies,competitions,skills');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-7-basico-oa4-1', 'ingles-7-basico-u4', 'OA 4', 'Generar conciencia cívica sobre la conservación del ecosistema mediante el vocabulario del reciclaje, ecología y prevención de daños medioambientales.', 'recycling,ecology,environment,conservation');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-1', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 1', 'Leer y comprender textos literarios y no literarios.', 'géneros literarios,inferencia,estructura,opinión fundamentada');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-2', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 2', 'Escribir textos de distintos géneros con intención comunicativa.', 'géneros,estructura,convenciones ortográficas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lenguaje-y-comunicacion-8-basico-oa1-3', 'lenguaje-y-comunicacion-8-basico-u1', 'OA 3', 'Analizar críticamente textos de los medios de comunicación.', 'medios,hechos,opiniones,fuentes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa1-1', 'matematica-8-basico-u1', 'OA 1', 'Operar con números enteros y racionales, y comprender el cálculo de potencias, raíces cuadradas y variaciones porcentuales aplicadas a situaciones de la vida cotidiana.', 'enteros,racionales,potencias,raíces,porcentajes');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa2-1', 'matematica-8-basico-u2', 'OA 2', 'Reducir expresiones algebraicas, resolver ecuaciones e inecuaciones, y modelar situaciones matemáticas identificando y graficando funciones lineales y afines.', 'álgebra,ecuaciones,inecuaciones,funciones lineales,funciones afines');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa3-1', 'matematica-8-basico-u3', 'OA 3', 'Aplicar el Teorema de Pitágoras, efectuar transformaciones isométricas en figuras y calcular el área y el volumen de prismas rectos y cilindros.', 'Pitágoras,transformaciones,isométricas,prismas,cilindros');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-8-basico-oa4-1', 'matematica-8-basico-u4', 'OA 4', 'Analizar información a través de representaciones gráficas y medidas de posición estadística, y calcular la probabilidad de eventos aplicando el principio multiplicativo.', 'gráficos,medidas de posición,probabilidad,principio multiplicativo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ciencias-naturales-8-basico-oa1-1', 'ciencias-naturales-8-basico-u1', 'OA 1', 'Explicar el papel central de la célula como unidad básica de los seres vivos.', 'célula,organelas,animal,vegetal');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-1', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 1', 'Analizar el proceso de formación del Estado Nacional chileno.', 'Estado Nacional,independencia,Guerra del Pacífico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-8-basico-oa1-2', 'historia-geografia-y-ciencias-sociales-8-basico-u1', 'OA 2', 'Analizar el quiebre de la democracia en Chile en la década de 1970.', 'golpe de Estado,dictadura,interpretaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-8-basico-oa1-1', 'ingles-8-basico-u1', 'OA 1', 'Comprender textos orales y escritos, y dialogar sobre el impacto de las tecnologías de la información y la comunicación (TIC) en la vida diaria, utilizando el proceso de escritura para elaborar textos pertinentes.', 'TIC,comprensión,dialogar,proceso de escritura');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-8-basico-oa2-1', 'ingles-8-basico-u2', 'OA 2', 'Leer y escuchar diversos textos para presentar y debatir sobre características geográficas, lugares históricos y personajes relevantes de diversas culturas, fomentando el respeto intercultural.', 'geografía,culturas,debate,intercultural');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-8-basico-oa3-1', 'ingles-8-basico-u3', 'OA 3', 'Extraer información de relatos e instrucciones para conversar sobre lugares y la vida cotidiana, mostrando interés por el aprendizaje continuo y valorando las contribuciones de otras culturas.', 'relatos,instrucciones,lugares,vida cotidiana');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-8-basico-oa4-1', 'ingles-8-basico-u4', 'OA 4', 'Demostrar comprensión de predicciones, problemas futuros y soluciones ecológicas, trabajando de manera colaborativa para promover el cuidado y el uso eficiente de los recursos naturales.', 'predicciones,ecología,colaboración,recursos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa1-1', 'lengua-y-literatura-1-medio-u1', 'OA 1', 'Interpretar textos que exploran opciones de vida, la relación humana con la naturaleza y la ciudad, identificando propósitos explícitos e implícitos.', 'interpretación,propósitos,naturaleza,ciudad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa2-1', 'lengua-y-literatura-1-medio-u2', 'OA 2', 'Reflexionar sobre la migración, la incorporación de extranjerismos e indigenismos, y el impacto social del desplazamiento humano.', 'migración,extranjerismos,indigenismos,impacto social');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa3-1', 'lengua-y-literatura-1-medio-u3', 'OA 3', 'Analizar narraciones literarias y orales, comprendiendo el rol del narrador, el enfrentamiento de fuerzas en el teatro y la necesidad humana de contar historias.', 'narrador,teatro,conflicto,historias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-1-medio-oa4-1', 'lengua-y-literatura-1-medio-u4', 'OA 4', 'Leer obras de ciencia ficción y artículos para evaluar visiones del mañana, el avance de la inteligencia artificial y el rescate de saberes ancestrales.', 'ciencia ficción,IA,saberes ancestrales,futuro');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa1-1', 'matematica-1-medio-u1', 'OA 1', 'Resolver operaciones complejas con números racionales y analizar el comportamiento exponencial en situaciones del entorno científico y cotidiano.', 'racionales,notación científica,exponencial,potencias');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa2-1', 'matematica-1-medio-u2', 'OA 2', 'Aplicar productos notables para reducir expresiones, y plantear y resolver sistemas de ecuaciones lineales modelando contextos reales.', 'productos notables,sistemas de ecuaciones,modelamiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa3-1', 'matematica-1-medio-u3', 'OA 3', 'Representar vectores en el plano, ejecutar homotecias y aplicar criterios de semejanza geométrica y el Teorema de Euclides.', 'vectores,homotecia,semejanza,Euclides');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-1-medio-oa4-1', 'matematica-1-medio-u4', 'OA 4', 'Analizar datos de múltiples poblaciones a través de indicadores estadísticos y calcular probabilidades compuestas mediante diagramas de árbol y reglas formales.', 'estadística,probabilidad,diagramas de árbol,muestras');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-1-medio-u1', 'OA 1', 'Analizar cómo el liberalismo, la burguesía y las ideas republicanas del siglo XIX impulsaron la formación de Estados nacionales y redefinieron los derechos políticos.', 'liberalismo,burguesía,república,derechos políticos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa2-1', 'historia-geografia-y-ciencias-sociales-1-medio-u2', 'OA 2', 'Comprender los efectos tecnológicos de la Revolución Industrial, el surgimiento del proletariado urbano y el debate ideológico en torno a la cuestión social.', 'Revolución Industrial,proletariado,cuestión social,ideología');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa3-1', 'historia-geografia-y-ciencias-sociales-1-medio-u3', 'OA 3', 'Evaluar críticamente la anexión de zonas extremas, los procesos de asimilación cultural y la relación histórica y actual entre el Estado y los pueblos originarios.', 'expansión territorial,pueblos originarios,asimilación,Guerra del Pacífico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-oa4-1', 'historia-geografia-y-ciencias-sociales-1-medio-u4', 'OA 4', 'Describir el papel del mercado en la asignación de recursos, analizar el equilibrio de precios y dimensionar los efectos de las alteraciones económicas en la sociedad.', 'mercado,oferta y demanda,precios,asignación de recursos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-medio-oa1-1', 'ingles-1-medio-u1', 'OA 1', 'Identificar características de distintas ocupaciones y desarrollar la habilidad para solicitar formalmente un empleo de verano mediante la redacción de correos y currículos.', 'occupations,job application,CV,formal writing');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-medio-oa2-1', 'ingles-1-medio-u2', 'OA 2', 'Explorar la importancia de la educación permanente y la participación en programas globales de voluntariado a través del análisis de textos informativos.', 'lifelong learning,volunteering,global programs,reading');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-medio-oa3-1', 'ingles-1-medio-u3', 'OA 3', 'Debatir e intercambiar opiniones sobre cómo las expresiones artísticas reflejan la identidad individual y promueven la cohesión y el cambio social.', 'arts,identity,social change,debate');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-1-medio-oa4-1', 'ingles-1-medio-u4', 'OA 4', 'Investigar sobre costumbres mundiales y locales fomentando una postura de respeto intercultural a través de exposiciones sobre tradiciones folclóricas.', 'traditions,festivities,intercultural,research');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-1-medio-oa1-1', 'biologia-1-medio-u1', 'OA 1', 'Analizar las evidencias fósiles y anatómicas para comprender el principio de ancestralidad común y los mecanismos de selección natural propuestos por la teoría evolutiva.', 'fósiles,anatomía comparada,selección natural,evolución');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-1-medio-oa2-1', 'biologia-1-medio-u2', 'OA 2', 'Identificar los distintos tipos de relaciones e interacciones ecológicas y estudiar el mecanismo complementario entre fotosíntesis y respiración celular.', 'relaciones ecológicas,fotosíntesis,respiración,energía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-1-medio-oa3-1', 'biologia-1-medio-u3', 'OA 3', 'Investigar el efecto del cambio climático y la intervención industrial, promoviendo estrategias de desarrollo sustentable y protección de la biodiversidad.', 'cambio climático,sustentabilidad,biodiversidad,antropogénico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('fisica-1-medio-oa1-1', 'fisica-1-medio-u1', 'OA 1', 'Comprender la producción, transmisión y cualidades fisiológicas del sonido mediante el modelamiento de ondas mecánicas e interacciones acústicas.', 'sonido,ondas mecánicas,acústica,frecuencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('fisica-1-medio-oa2-1', 'fisica-1-medio-u2', 'OA 2', 'Describir el comportamiento de las ondas electromagnéticas, el fenómeno de reflexión y refracción, y generar conciencia respecto a la normativa lumínica en Chile.', 'luz,electromagnético,reflexión,refracción');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('quimica-1-medio-oa1-1', 'quimica-1-medio-u1', 'OA 1', 'Identificar transformaciones de la materia, clasificar reacciones termodinámicas (endotérmicas/exotérmicas) y estudiar factores que modifican su velocidad.', 'reacciones,termodinámica,velocidad,transformación');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('quimica-1-medio-oa2-1', 'quimica-1-medio-u2', 'OA 2', 'Aplicar las leyes ponderales de la química en el ajuste de ecuaciones para establecer relaciones proporcionales de masa, mol y volumen entre reactivos y productos.', 'estequiometría,leyes ponderales,balance,ecuaciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa1-1', 'lengua-y-literatura-2-medio-u1', 'OA 1', 'Interpretar textos literarios y no literarios vinculados a los viajes físicos y de autoconocimiento, y producir narraciones biográficas integrando el contexto de la obra.', 'viajes,autoconocimiento,biografías,contexto');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa2-1', 'lengua-y-literatura-2-medio-u2', 'OA 2', 'Analizar obras dramáticas y literarias enfocadas en problemáticas universales, y escribir reportajes sobre la responsabilidad social y la urgencia climática.', 'drama,problemáticas universales,reportajes,responsabilidad social');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa3-1', 'lengua-y-literatura-2-medio-u3', 'OA 3', 'Reflexionar sobre la importancia de las relaciones humanas y la conexión con la naturaleza a través del análisis de ensayos y la evaluación de la convivencia comunitaria.', 'vínculos,ensayos,convivencia,naturaleza');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-2-medio-oa4-1', 'lengua-y-literatura-2-medio-u4', 'OA 4', 'Leer críticamente discursos y narraciones de crecimiento personal, analizando las visiones de mundo, y producir discursos públicos argumentando ideas de impacto social.', 'discursos,crecimiento personal,visión de mundo,impacto social');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa1-1', 'matematica-2-medio-u1', 'OA 1', 'Operar con el conjunto de los números reales, comprender las propiedades matemáticas de las raíces enésimas, las potencias de exponente racional y su vinculación directa con los logaritmos.', 'números reales,raíces enésimas,potencias,logaritmos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa2-1', 'matematica-2-medio-u2', 'OA 2', 'Identificar, resolver y graficar funciones y ecuaciones cuadráticas, modelar fenómenos científicos y analizar las propiedades de inyectividad y epiyectividad para determinar la función inversa.', 'cuadráticas,vértice,inversa,modelamiento');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa3-1', 'matematica-2-medio-u3', 'OA 3', 'Aplicar las razones trigonométricas para la resolución de problemas geométricos en el entorno físico y operar matemáticamente la descomposición de vectores en el plano cartesiano.', 'trigonometría,seno,coseno,vectores');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-2-medio-oa4-1', 'matematica-2-medio-u4', 'OA 4', 'Establecer la probabilidad de ocurrencia de eventos complejos empleando la regla de Laplace y utilizar técnicas de conteo avanzado como permutaciones y combinaciones.', 'Laplace,permutaciones,combinaciones,conteo');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa1-1', 'historia-geografia-y-ciencias-sociales-2-medio-u1', 'OA 1', 'Analizar los grandes conflictos bélicos, el impacto social de los totalitarismos, la crisis económica de 1929 y el empoderamiento y democratización en la sociedad chilena.', 'Guerras Mundiales,totalitarismos,crisis 1929,democratización');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa2-1', 'historia-geografia-y-ciencias-sociales-2-medio-u2', 'OA 2', 'Comprender la confrontación geopolítica y la carrera armamentista bipolar, la polarización de América Latina y la consolidación de la internacionalización y revolución tecnológica global.', 'Guerra Fría,bipolar,América Latina,globalización');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa3-1', 'historia-geografia-y-ciencias-sociales-2-medio-u3', 'OA 3', 'Evaluar críticamente los proyectos sociopolíticos del siglo XX, caracterizar la implantación del modelo neoliberal en la dictadura e internalizar el valor irrestricto de los derechos humanos.', '1973,dictadura,neoliberalismo,derechos humanos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-oa4-1', 'historia-geografia-y-ciencias-sociales-2-medio-u4', 'OA 4', 'Analizar el complejo proceso de recuperación del Estado de derecho en Chile, valorando los desafíos constitucionales de inclusión ciudadana, diversidad y respeto en un mundo interconectado.', 'democracia,constitución,inclusión,diversidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-medio-oa1-1', 'ingles-2-medio-u1', 'OA 1', 'Interpretar información crítica acerca del impacto económico de la globalización, interactuando en debates y redactando propuestas sobre problemáticas ciudadanas.', 'globalization,debate,citizen proposals,critical thinking');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-medio-oa2-1', 'ingles-2-medio-u2', 'OA 2', 'Hablar e intercambiar puntos de vista estructurados sobre las ventajas, los problemas de adicción y las normas de seguridad asociadas a los dispositivos móviles y la web.', 'technology,mobile devices,online safety,structured opinion');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-medio-oa3-1', 'ingles-2-medio-u3', 'OA 3', 'Comprender narraciones reales y biografías de líderes destacados de la sociedad para producir textos y perfiles que reconozcan los rasgos de personalidad necesarios para alcanzar metas.', 'biographies,leadership,personality traits,profile writing');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-2-medio-oa4-1', 'ingles-2-medio-u4', 'OA 4', 'Desarrollar un vocabulario y una conciencia ecológica activa al investigar sobre fuentes de energía limpia, consecuencias del efecto invernadero y estrategias para reducir residuos.', 'sustainability,clean energy,greenhouse effect,waste reduction');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-2-medio-oa1-1', 'biologia-2-medio-u1', 'OA 1', 'Comprender el funcionamiento de los centros cerebrales y redes neuronales, valorando la importancia de la prevención de trastornos y el cuidado de la salud mental.', 'sistema nervioso,neuronas,salud mental,prevención');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-2-medio-oa2-1', 'biologia-2-medio-u2', 'OA 2', 'Reconocer integralmente la sexualidad humana, fomentando habilidades para tomar decisiones informadas sobre la afectividad, el autocuidado y la prevención de ITS.', 'sexualidad,autocuidado,ITS,decisiones informadas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('biologia-2-medio-oa3-1', 'biologia-2-medio-u3', 'OA 3', 'Describir el proceso de replicación genética y división celular, y debatir sobre las aplicaciones médicas, éticas y agrícolas de la manipulación biotecnológica.', 'ADN,replicación,biotecnología,ética');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('fisica-2-medio-oa1-1', 'fisica-2-medio-u1', 'OA 1', 'Modelar el movimiento empleando sistemas de referencia matemáticos e identificar la acción de las fuerzas concurrentes calculando la interacción neta vectorial.', 'cinemática,vectores,fuerzas,sistema de referencia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('fisica-2-medio-oa2-1', 'fisica-2-medio-u2', 'OA 2', 'Revisar los aportes de las leyes de gravitación, entender las principales teorías sobre el origen y evolución cósmica, y valorar el aporte de la infraestructura astronómica (ALMA, VLT).', 'gravitación,Big Bang,ALMA,VLT');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('quimica-2-medio-oa1-1', 'quimica-2-medio-u1', 'OA 1', 'Determinar las características cualitativas de la solubilidad en mezclas acuosas y cuantificar sus interacciones utilizando magnitudes de concentración analítica.', 'solubilidad,mezclas,concentración,disoluciones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('quimica-2-medio-oa2-1', 'quimica-2-medio-u2', 'OA 2', 'Conocer la estructura tetravalente del carbono, representar hidrocarburos en modelos tridimensionales y asociar series homólogas nitrogenadas u oxigenadas con la industria y la biología.', 'carbono,hidrocarburos,IUPAC,biomoléculas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa1-1', 'lengua-y-literatura-3-medio-u1', 'OA 1', 'Proponer interpretaciones de cuentos analizando sus componentes y leer críticamente ensayos valorando la interculturalidad y el contexto sociocultural.', 'interpretación,cuentos,ensayos,interculturalidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa2-1', 'lengua-y-literatura-3-medio-u2', 'OA 2', 'Interpretar obras y referentes culturales considerando dilemas éticos y la influencia de las tradiciones en la construcción de la identidad en la sociedad actual.', 'identidad,dilemas éticos,tradiciones,sociedad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa3-1', 'lengua-y-literatura-3-medio-u3', 'OA 3', 'Analizar la intertextualidad en la literatura y comprender de forma crítica textos argumentativos vinculados a problemáticas como la crisis climática y la transformación del medioambiente.', 'intertextualidad,argumentativos,crisis climática,medioambiente');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('lengua-y-literatura-3-medio-oa4-1', 'lengua-y-literatura-3-medio-u4', 'OA 4', 'Evaluar críticamente cómo la sociedad de consumo y los problemas de ubicación social afectan a los individuos, promoviendo el debate y el consumo responsable.', 'consumo,ubicación social,debate,responsabilidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-3-medio-oa1-1', 'filosofia-3-medio-u1', 'OA 1', 'Reflexionar sobre el origen, el asombro y el sentido de la filosofía como herramienta de análisis del mundo, identificando herramientas lógicas y ramas de la disciplina.', 'asombro,herramientas lógicas,ramas,filosofía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-3-medio-oa2-1', 'filosofia-3-medio-u2', 'OA 2', 'Explorar las preguntas fundamentales sobre el ser, la nada y el existencialismo, analizando la libertad humana y nuestra capacidad de dar sentido y valor a la existencia.', 'ser,nada,existencialismo,libertad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-3-medio-oa3-1', 'filosofia-3-medio-u3', 'OA 3', 'Analizar críticamente el origen, las posibilidades y los límites del conocimiento humano, debatiendo sobre empirismo, racionalismo y las implicancias éticas del método científico.', 'empirismo,racionalismo,conocimiento,método científico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-3-medio-oa4-1', 'filosofia-3-medio-u4', 'OA 4', 'Valorar el diálogo filosófico y la argumentación como constructores de la realidad, reflexionando sobre la alteridad, la diversidad y los conflictos ético-políticos del mundo contemporáneo.', 'diálogo,alteridad,diversidad,conflictos ético-políticos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa1-1', 'matematica-3-medio-u1', 'OA 1', 'Tomar decisiones informadas en contextos de salud y deporte mediante el uso de medidas de dispersión y la aplicación de probabilidades condicionales.', 'dispersión,varianza,probabilidad condicional,decisiones');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa2-1', 'matematica-3-medio-u2', 'OA 2', 'Caracterizar, graficar y aplicar modelos matemáticos basados en funciones exponenciales y logarítmicas para comprender fenómenos del entorno.', 'exponenciales,logarítmicas,modelos,gráfico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('matematica-3-medio-oa3-1', 'matematica-3-medio-u3', 'OA 3', 'Aplicar teoremas geométricos para calcular la medida de ángulos y la longitud de diversos segmentos asociados a una circunferencia.', 'circunferencia,cuerdas,tangentes,teoremas');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-medio-oa1-1', 'ingles-3-medio-u1', 'OA 1', 'Discutir y debatir sobre el éxito y la colaboración, describir hábitos y formular historias sobre buenas acciones (acts of kindness).', 'success,collaboration,habits,acts of kindness');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-medio-oa2-1', 'ingles-3-medio-u2', 'OA 2', 'Aprender a diferenciar hechos de ficción en los medios de comunicación, entender el impacto de los anuncios publicitarios y redactar campañas de concientización.', 'media literacy,facts vs fiction,advertising,campaigns');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-medio-oa3-1', 'ingles-3-medio-u3', 'OA 3', 'Reflexionar críticamente sobre el propósito del trabajo, los modelos de negocios sostenibles y la contribución de las ONGs al mundo.', 'business,sustainability,NGOs,purpose');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-3-medio-oa4-1', 'ingles-3-medio-u4', 'OA 4', 'Analizar problemáticas ambientales, proponer hábitos ecológicos (eco-friendly) y discutir los beneficios de la legislación sobre el cambio climático.', 'environment,eco-friendly,climate change,legislation');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-3-medio-oa1-1', 'educacion-ciudadana-3-medio-u1', 'OA 1', 'Comprender la democracia como un sistema en permanente construcción y analizar los desafíos contemporáneos como la desafección política y la desigualdad.', 'democracia,ciudadanía,desafección,desigualdad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-3-medio-oa2-1', 'educacion-ciudadana-3-medio-u2', 'OA 2', 'Valorar la promoción de los derechos humanos desde la institucionalidad democrática y entender cómo garantizar un acceso igualitario a la justicia.', 'derechos humanos,justicia,igualdad,institucionalidad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-3-medio-oa3-1', 'educacion-ciudadana-3-medio-u3', 'OA 3', 'Analizar las relaciones entre el Estado y el mercado, evaluando políticas públicas y la importancia de la participación para el bien común.', 'Estado,mercado,políticas públicas,bien común');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-3-medio-oa4-1', 'educacion-ciudadana-3-medio-u4', 'OA 4', 'Entender la configuración del territorio y promover instancias de participación democrática activa en las comunidades educativas y locales.', 'territorio,participación,comunidad,democracia activa');
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
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-4-medio-oa1-1', 'filosofia-4-medio-u1', 'OA 1', 'Reflexionar sobre el origen, el asombro y el sentido de la filosofía como herramienta de análisis del mundo, identificando herramientas lógicas y ramas de la disciplina.', 'asombro,herramientas lógicas,ramas,filosofía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-4-medio-oa2-1', 'filosofia-4-medio-u2', 'OA 2', 'Explorar las preguntas fundamentales sobre el ser, la nada y el existencialismo, analizando la libertad humana y nuestra capacidad de dar sentido y valor a la existencia.', 'ser,nada,existencialismo,libertad');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-4-medio-oa3-1', 'filosofia-4-medio-u3', 'OA 3', 'Analizar críticamente el origen, las posibilidades y los límites del conocimiento humano, debatiendo sobre empirismo, racionalismo y las implicancias éticas del método científico.', 'empirismo,racionalismo,conocimiento,método científico');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('filosofia-4-medio-oa4-1', 'filosofia-4-medio-u4', 'OA 4', 'Valorar el diálogo filosófico y la argumentación como constructores de la realidad, reflexionando sobre la alteridad, la diversidad y los conflictos ético-políticos del mundo contemporáneo.', 'diálogo,alteridad,diversidad,conflictos ético-políticos');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-medio-oa1-1', 'ingles-4-medio-u1', 'OA 1', 'Discutir y debatir sobre el éxito y la colaboración, describir hábitos y formular historias sobre buenas acciones (acts of kindness).', 'success,collaboration,habits,acts of kindness');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-medio-oa2-1', 'ingles-4-medio-u2', 'OA 2', 'Aprender a diferenciar hechos de ficción en los medios de comunicación, entender el impacto de los anuncios publicitarios y redactar campañas de concientización.', 'media literacy,facts vs fiction,advertising,campaigns');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-medio-oa3-1', 'ingles-4-medio-u3', 'OA 3', 'Reflexionar críticamente sobre el propósito del trabajo, los modelos de negocios sostenibles y la contribución de las ONGs al mundo.', 'business,sustainability,NGOs,purpose');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('ingles-4-medio-oa4-1', 'ingles-4-medio-u4', 'OA 4', 'Analizar problemáticas ambientales, proponer hábitos ecológicos (eco-friendly) y discutir los beneficios de la legislación sobre el cambio climático.', 'environment,eco-friendly,climate change,legislation');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-4-medio-oa1-1', 'educacion-ciudadana-4-medio-u1', 'OA 1', 'Comprender los mecanismos para participar en la democracia chilena y analizar las brechas sociales que deben superarse.', 'participación,democracia,brechas sociales,ciudadanía');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-4-medio-oa2-1', 'educacion-ciudadana-4-medio-u2', 'OA 2', 'Analizar el rol de los medios de comunicación y evaluar las oportunidades y riesgos que representan las TIC y redes sociales.', 'medios,TIC,redes sociales,democracia');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-4-medio-oa3-1', 'educacion-ciudadana-4-medio-u3', 'OA 3', 'Identificar los principios rectores de la democracia para promover una sociedad respetuosa y avanzar hacia un territorio inclusivo.', 'inclusión,principios democráticos,respeto,territorio');
INSERT OR IGNORE INTO objetivos_aprendizaje (id, unidad_id, codigo_oa, descripcion, habilidades_csv) VALUES
  ('educacion-ciudadana-4-medio-oa4-1', 'educacion-ciudadana-4-medio-u4', 'OA 4', 'Comprender la protección de los derechos laborales y evaluar cómo los distintos modelos de desarrollo afectan la vida cotidiana y el medioambiente.', 'derechos laborales,desarrollo,medioambiente,cotidiano');

-- ============================================================
-- 5. TEXTOS ESCOLARES
-- ============================================================
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('juego-primero-fichas-de-experiencias-pedagogicas-primer-nivel-de-transicion-prekinder', 'educacion-parvularia-prekinder', 'Juego Primero: Fichas de Experiencias Pedagógicas (Primer Nivel de Transición)', 'https://catalogotextos.mineduc.cl/catalogo-textos/privado/descargar/3259', '["Ficha 1 (Pág. 25): Exploración de figuras para trabajar nociones temporales como primero y después.","Ficha 2 (Pág. 28): Juego \"Veo Veo\" sacando figuras de una bolsa para describir atributos como vértices y caras.","Ficha 4 (Pág. 34): \"El gato de las figuras geométricas\" en tableros para afianzar conceptos de ubicación espacial.","Ficha 14 (Pág. 64): \"El cartero\", resolución de problemas de distribución y conteo usando un buzón.","Ficha 20 (Pág. 82): \"¿Dónde hay más?\" usando cuantificadores para comparar colecciones de botones."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('juego-primero-fichas-de-experiencias-pedagogicas-primer-nivel-de-transicion-kinder', 'educacion-parvularia-kinder', 'Juego Primero: Fichas de Experiencias Pedagógicas (Primer Nivel de Transición)', 'https://catalogotextos.mineduc.cl/catalogo-textos/privado/descargar/3259', '["Ficha 1 (Pág. 25): Exploración de figuras para trabajar nociones temporales como primero y después.","Ficha 2 (Pág. 28): Juego \"Veo Veo\" sacando figuras de una bolsa para describir atributos como vértices y caras.","Ficha 4 (Pág. 34): \"El gato de las figuras geométricas\" en tableros para afianzar conceptos de ubicación espacial.","Ficha 14 (Pág. 64): \"El cartero\", resolución de problemas de distribución y conteo usando un buzón.","Ficha 20 (Pág. 82): \"¿Dónde hay más?\" usando cuantificadores para comparar colecciones de botones."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('leo-primero-1-basico-tomo-1-1-basico', 'lenguaje-y-comunicacion-1-basico', 'Leo Primero 1° Básico, Tomo 1', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-1-Basico/Leo-Primero-Tomo-1/', '["Inicio: Activación con Muro de Palabras y vocales con el cuerpo (Pág. 4).","Desarrollo: Actividad \"El Elástico\" para segmentar fonemas (3-5 sonidos).","Desarrollo: Muro de Palabras Interactivo y conteo de sonidos.","Desarrollo: Juego \"El Detective de Sonidos\" con caja misteriosa.","Cierre: Reflexión grupal, registro en Muro de Palabras y Cierre Ritual."]', 'Planificación 1° Básico, OA 3: Conciencia Fonológica, 40 min. Uso de elástico para segmentación, Muro de Palabras para vocabulario, y juego de detective de sonidos.');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-1-basico-tomos-1-y-2-1-basico', 'matematica-1-basico', 'Sumo Primero 1° Básico, Tomos 1 y 2', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-1-Basico/', '["Inicio: Uso de material concreto (bloques) para conteo hasta 20.","Desarrollo: Actividades de descomposición numérica con diagramas de partes y todo.","Desarrollo: Ejercitación guiada de suma y resta con material recortable.","Cierre: Registro de resultados en cuaderno de ejercicios y metacognición."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('guia-digital-del-docente-ciencias-naturales-1-basico-tomo-1-y-2-1-basico', 'ciencias-naturales-1-basico', 'Guía Digital del Docente Ciencias Naturales 1° Básico, Tomo 1 y 2', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-1-Basico/', '["Observación de los sentidos: Exploración guiada de cada sentido con material concreto.","Cuidado del cuerpo: Actividades de higiene, alimentación y descanso.","Clasificación de materiales: Uso de los sentidos para clasificar por textura, color y estado."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('guia-digital-del-docente-historia-geografia-y-ciencias-sociales-1-basico-1-basico', 'historia-geografia-y-ciencias-sociales-1-basico', 'Guía Digital del Docente Historia, Geografía y Ciencias Sociales 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-1-Basico/', '["Unidad 1: Actividades de narración de historias personales y familiares.","Unidad 1: Uso de líneas de tiempo sencillas para ordenar eventos cotidianos.","Unidad 2: Reconocimiento de puntos cardinales en el entorno escolar.","Unidad 2: Observación y descripción de paisajes locales y planos simples."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('texto-del-estudiante-lengua-mapuche-1-basico-1-basico', 'lengua-mapuche-1-basico', 'Texto del Estudiante Lengua Mapuche 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Mapuche-1-Basico/', '["Saludos y presentaciones en lengua mapuche.","Vocabulario del entorno natural y familiar.","Canciones y rimas tradicionales mapuche."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('texto-del-estudiante-lengua-aymara-1-basico-1-basico', 'lengua-aymara-1-basico', 'Texto del Estudiante Lengua Aymara 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Aymara-1-Basico/', '["Saludos y presentaciones en lengua aymara.","Vocabulario del entorno natural y familiar.","Canciones y rimas tradicionales aymara."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('texto-del-estudiante-lengua-quechua-1-basico-1-basico', 'lengua-quechua-1-basico', 'Texto del Estudiante Lengua Quechua 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Quechua-1-Basico/', '["Saludos y presentaciones en lengua quechua.","Vocabulario del entorno natural y familiar.","Canciones y rimas tradicionales quechua."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('texto-del-estudiante-lengua-rapa-nui-1-basico-1-basico', 'lengua-rapa-nui-1-basico', 'Texto del Estudiante Lengua Rapa Nui 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Rapa-Nui-1-Basico/', '["Saludos y presentaciones en lengua rapa nui.","Vocabulario del entorno natural y familiar.","Canciones y rimas tradicionales rapa nui."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('texto-del-estudiante-lengua-indigena-intercultural-1-basico-1-basico', 'lengua-indigena-intercultural-1-basico', 'Texto del Estudiante Lengua Indígena Intercultural 1° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Indigena-Intercultural-1-Basico/', '["Reconocimiento de las principales lenguas originarias de Chile.","Saludos y expresiones en diferentes lenguas indígenas.","Actividades de convivencia intercultural y respeto a la diversidad."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('student-s-book-english-first-1-1-basico', 'ingles-1-basico', 'Student''s book ENGLISH FIRST 1', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-1-Basico/INGME26E1B_compressed.pdf', '["Make puppets: Creación de títeres para practicar vocabulario y presentaciones.","Family tree: Construcción de árbol familiar para vocabulario de familiares.","What''s this/that practice: Práctica de demostrativos con objetos del entorno.","Body game: Juego interactivo para identificar partes del cuerpo."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('leo-primero-2-basico-tomos-1-y-2-2-basico', 'lenguaje-y-comunicacion-2-basico', 'Leo Primero 2° Básico (Tomos 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-2-Basico/LYCME26E2B.pdf', '["Lectura de cuentos tradicionales, poemas y fábulas.","Escritura de fichas informativas, cuentos y biografías.","Creación de afiches y recetas.","Juego de roles y declamación de poemas."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-2-basico-tomos-1-y-2-2-basico', 'matematica-2-basico', 'Sumo Primero 2° Básico (Tomos 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-2-Basico/MATME26E2B.pdf', '["Uso de la balanza para comprender igualdades y desigualdades.","Medición con regla y huincha (m, cm, mm).","Construcción de figuras 2D y cuerpos 3D con material concreto.","Juegos de cartas (Memorice) para practicar tablas de multiplicar."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('guia-digital-del-docente-ciencias-naturales-2-basico-tomos-1-y-2-2-basico', 'ciencias-naturales-2-basico', 'Guía Digital del Docente Ciencias Naturales 2° Básico (Tomos 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-2-Basico/GUIA_DOCENTE_CIENCIAS_2B.pdf', '["Exploración de la anatomía humana, ubicando corazón, pulmones y estómago mediante la creación de modelos artístico-científicos.","Práctica de actividades de atención plena (mindfulness) y posturas de yoga para percibir los cambios del cuerpo (pulso, respiración) en reposo y en movimiento.","Investigación no experimental (bibliográfica) sobre animales nativos de Chile y su estado de conservación (ej. en peligro de extinción).","Desarrollo de proyectos interdisciplinares (ABP) para promover la actividad física o comunicar medidas de protección para la fauna local.","Reflexión sobre problemáticas socioambientales contemporáneas (ej. contaminación de los océanos, sequías, microplásticos).","Aplicación del ciclo de modelización científica (definir un problema, elegir representación, construir y poner a prueba)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('guia-digital-del-docente-historia-geografia-y-ciencias-sociales-2-basico-tomo-2-2-basico', 'historia-geografia-y-ciencias-sociales-2-basico', 'Guía Digital del Docente Historia, Geografía y Ciencias Sociales 2° Básico (Tomo 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-2-Basico/GUIA_DOCENTE_HISTORIA_2B_T2.pdf', '["Identificación de elementos de continuidad y cambio temporal mediante la secuenciación cronológica de hitos familiares o históricos.","Investigación sobre el origen familiar o el legado de comunidades de inmigrantes para presentarlo de forma oral, visual o escrita.","Análisis de fuentes visuales e iconográficas y creación de afiches o cómics (ej. campañas de cuidado del medioambiente).","Participación en diálogos y debates guiados sobre la importancia de las normas, el patrimonio cultural y la diversidad.","Elaboración e interpretación de encuestas y pictogramas en conjunto con Matemática, para conocer intereses de la comunidad escolar.","Diseño de un proyecto final (Muestra multicultural) enfocado en reconocer los aportes de las diversas culturas que forman la sociedad chilena."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('yatintiri-pankapa-aymara-marka-2-basico-2-basico', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-aymara-2-basico', 'Yatintiri Pankapa Aymara Marka 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Aymara-2-Basico/AYMME26E2B_2.pdf', '["Reconocimiento de los espacios del territorio (araxpacha, akapacha, manqhapacha).","Participación en ceremonias como la fiesta del ganado (uywa wayñu) y el corte de pelo (rutucha).","Celebración del Retorno del Sol (Willka Kuti) y el tiempo de siembra (Satapacha).","Elaboración de un diccionario ilustrado sobre los elementos de la naturaleza."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('yachaqaq-mayt-u-qhishwa-llaqta-2-basico-2-basico', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-quechua-2-basico', 'Yachaqaq Mayt''u Qhishwa Llaqta 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Quechua-2-Basico/QUEME26E2B_2.pdf', '["Escuchar y dibujar los distintos elementos y mensajes de la naturaleza.","Reconocimiento del territorio, de la Chakana y del significado de la bandera andina Wiphala.","Identificación de las autoridades, encargados de la comunidad y saberes ancestrales (amawta).","Elaboración de un museo vivo de la cultura y herbario de plantas medicinales."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('hau-rapa-nui-2-basico-2-basico', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-rapa-nui-2-basico', 'Hau Rapa Nui 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Rapa-Nui-2-Basico/RAPME26E2B_2.pdf', '["Exploración de la historia de la llegada del rey Hotu Matu''a y los siete exploradores.","Reconocimiento de la elaboración del curanto (''Umu Ta''o) y el tallado de figuras como el Mōai Kava-kava.","Identificación de la flora y fauna local (Manu Tara) y deportes ancestrales de la Tāpati.","Reconocimiento de las constelaciones (Mata Riki), estaciones del año y observatorios de piedra (Tupa)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('kuzawgeael-chi-chillka-pueblo-mapuche-2-basico-2-basico', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-mapuche-2-basico', 'Küzawgeael chi chillka Pueblo Mapuche 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-Mapuche-2-Basico/MAPME26E2B_2.pdf', '["Identificación de emociones y comportamientos a través de relatos tradicionales (epew y piam).","Reconocimiento de las identidades territoriales (Meli witxan mapu) y participación en el Wiñol Txipantü.","Identificación de símbolos, vestimenta tradicional (küpam y txariwe) y el trabajo en platería (rütxafe).","Comprensión de los mensajes de la naturaleza, las banderas ceremoniales y los ciclos de recolección de alimentos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('interculturalidad-2-basico-2-basico', 'lengua-y-cultura-de-los-pueblos-originarios-ancestrales-interculturalidad-2-basico', 'Interculturalidad 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Interculturalidad-2-Basico/Interculturalidad_2B.pdf', '["Visitar y agradecer a un espacio natural, reconociendo el tiempo andino (Ch''akiy, Qhasay, Para).","Modelar en greda o plasticina cerámica diaguita y construir jardineras o herbarios de plantas medicinales.","Crear afiches y participar en ferias de trueque de semillas para preservar el conocimiento ancestral.","Elaborar un canasto recolector (yagán/kawésqar) y dibujar el funcionamiento de los corrales de pesca."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('english-first-2-basico-2-basico', 'ingles-2-basico', 'English First 2° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-2-Basico/INTME26E2B_2.pdf', '["Juegos de vocabulario, cantos y ejercicios de escucha (listening) sobre animales, deportes, ropa y profesiones.","Lectura y representación de cuentos clásicos e historias (e.g., Puss in Boots, The Shoemaker and the Elves).","Actividades manuales, dibujos y recortables interactivos como creación de origami.","Juegos de roles y entrevistas sencillas con compañeros practicando preguntas y respuestas básicas en inglés."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('leo-primero-3-basico-3-basico', 'lenguaje-y-comunicacion-3-basico', 'Leo Primero 3° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-3-Basico/LYCME26E3B_compressed.pdf', '["Lectura comprensiva y fluida de textos literarios (cuentos, poemas, fábulas, cómics) y no literarios (artículos informativos, cartas, biografías).","Escritura guiada y creativa de anécdotas, afiches, correos electrónicos e instrucciones, aplicando el proceso de escritura (planificar, escribir, revisar).","Actividades sistemáticas de ampliación de vocabulario (palabras de uso frecuente) y reconocimiento de estructuras gramaticales (sustantivos, adjetivos, verbos).","Expresión oral mediante la representación de diálogos, declamación de poemas y participación en conversaciones grupales."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-3-basico-tomos-1-y-2-3-basico', 'matematica-3-basico', 'Sumo Primero 3° Básico (Tomos 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Basico/Sumo_Primero_3_Basico.pdf', '["Resolución de adiciones y sustracciones en forma vertical con reagrupamiento para números de hasta 3 dígitos.","Memorización de las tablas de multiplicar y aplicación del concepto de división como reparto equitativo y agrupamiento.","Ubicación de objetos en cuadrículas mediante coordenadas y descripción de trayectorias con puntos cardinales.","Construcción de redes para cuerpos geométricos (paralelepípedos, cubos, cilindros, conos) y cálculo de perímetros.","Elaboración e interpretación de gráficos de barras con escalas y representación de fracciones de uso común (medios, tercios, cuartos).","Estimación y medición de masa utilizando balanzas, gramos (g) y kilogramos (kg), y lectura del tiempo en horas y minutos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-3-basico-3-basico', 'ciencias-naturales-3-basico', 'Ciencias Naturales 3° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-3-Basico/CIENCIAS_NATURALES_3B.pdf', '["Construir modelos del sistema solar y representar los movimientos de rotación y traslación de la Tierra usando esferas de plumavit y linternas.","Realizar investigaciones experimentales para comprobar las propiedades de la luz (reflexión/descomposición) y del sonido (tono, intensidad y propagación).","Elaborar un herbario local de plantas nativas, armar una compostera y crear un plan de acción basado en la regla de las 3R (reducir, reutilizar, reciclar).","Analizar etiquetas de advertencia nutricional para distinguir alimentos saludables de los no saludables y diseñar afiches para promover un estilo de vida sano."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-3-basico-3-basico', 'historia-geografia-y-ciencias-sociales-3-basico', 'Historia, Geografía y Ciencias Sociales 3° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-3-Basico/HISSA26E3B_compressed.pdf', '["Localizar lugares y objetos utilizando cuadrículas, líneas de referencia y puntos cardinales en planos y mapas.","Investigar y comunicar información sobre el entorno geográfico, la vida cotidiana y el legado cultural de las civilizaciones griega y romana.","Extraer información temporal y espacial mediante la construcción y lectura de líneas de tiempo y mapas históricos.","Analizar situaciones cotidianas para promover actitudes ciudadanas, deberes, buena convivencia y respeto a los Derechos de los Niños.","Identificar y valorar el rol de instituciones públicas y privadas que benefician a la comunidad (hospitales, bomberos, colegios, fundaciones, etc.)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('get-ready-with-english-3-basico-3-basico', 'ingles-3-basico', 'Get ready with English 3° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Basico/ingles-1.pdf', '["Juegos de roles y entrevistas con compañeros para practicar vocabulario de útiles escolares y preposiciones de lugar (in, on, under, behind).","Creación de horarios personales (timetables) para describir rutinas diarias y decir la hora del día.","Expresión oral sobre deportes y habilidades utilizando correctamente can y can''t, junto con preferencias (like).","Lectura de historias cortas, cantos (chants) y descripción de personajes, animales salvajes, transporte y actividades de verano."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('leo-primero-4-basico-4-basico', 'lenguaje-y-comunicacion-4-basico', 'Leo Primero 4° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-4-Basico/HISSM26E4B_compressed.pdf', '["Escucha activa y comprensión de leyendas, cuentos y artículos informativos.","Uso de estrategias de comprensión lectora: secuenciar, predecir, inferir y formular preguntas.","Producción de textos escritos: descripciones, noticias, cartas, cuentos, artículos informativos y fábulas.","Aplicación de reglas ortográficas (acentuación agudas/graves/esdrújulas, combinaciones mb/nv) y gramaticales (verbos, pronombres, adverbios).","Expresión oral: declamación de poemas, dramatización de diálogos y entrevistas a personajes."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-4-basico-tomo-1-y-2-4-basico', 'matematica-4-basico', 'Sumo Primero 4° Básico (Tomo 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-4-Basico/Sumo_Primero_4B_T1_T2.pdf', '["Leer, escribir, comparar y ordenar números hasta 10.000, incluyendo el redondeo y la estimación de cantidades.","Resolver adiciones y sustracciones con reagrupamiento, y aplicar el algoritmo estándar de la multiplicación y división (con y sin resto).","Medir y calcular longitudes (cm, m, km), tiempo (horas, minutos, segundos), área de rectángulos y cuadrados (cm², m², km²) y volumen (L, dL, mL, cm³).","Representar, comparar y operar (adición y sustracción) con fracciones de igual denominador y números decimales (hasta los décimos).","Resolver ecuaciones e inecuaciones simples de un paso usando balanzas, e identificar patrones en tablas.","Aplicar transformaciones isométricas (traslación, reflexión y rotación), medir ángulos con transportador e identificar las vistas de figuras 3D.","Leer e interpretar diagramas de puntos y resultados de experimentos aleatorios (juegos de azar)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-4-basico-4-basico', 'ciencias-naturales-4-basico', 'Ciencias Naturales 4° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-4-Basico/INGSA26E4B.pdf', '["Construir modelos para describir e identificar las capas de la Tierra (corteza, manto, núcleo) y explicar el movimiento de las placas tectónicas (sismos, tsunamis, volcanes).","Medir la masa y el volumen de la materia, e investigar experimentalmente las características de los estados sólido, líquido y gaseoso (compresión y fluidez).","Reconocer y demostrar los efectos de las fuerzas sobre la forma y el movimiento de los objetos mediante la experimentación.","Identificar estructuras del sistema locomotor (huesos, músculos, articulaciones) y del sistema nervioso, explicando su función en el movimiento y en la respuesta a estímulos.","Explorar ecosistemas chilenos, diferenciando factores bióticos y abióticos, y analizando las adaptaciones de plantas y animales junto con las cadenas alimentarias."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-4-basico-4-basico', 'historia-geografia-y-ciencias-sociales-4-basico', 'Historia, Geografía y Ciencias Sociales 4° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-4-Basico/CNASA26E4B.pdf', '["Análisis de mapas y herramientas geográficas para localizar paisajes y recursos naturales en América.","Investigación y comparación de las civilizaciones Maya, Azteca e Inca (política, sociedad, economía y tecnología).","Elaboración de líneas de tiempo para comprender la cronología de las civilizaciones americanas.","Análisis de fuentes históricas y primarias sobre el legado cultural y cotidiano de los pueblos originarios.","Simulación de debates y procesos democráticos (elecciones escolares) para comprender la organización política de Chile.","Desarrollo de proyectos grupales para investigar y exponer sobre el impacto de los recursos naturales y la importancia del desarrollo sostenible."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('english-4th-grade-student-s-book-4-basico', 'ingles-4-basico', 'English 4th Grade Student''s Book', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-4-Basico/INGSA26E4B.pdf', '["Juego de roles y diálogos interactivos sobre lugares de la ciudad, partes del hogar y nacionalidades.","Uso de cuadrículas (grid maps) para localizar y dar direcciones de lugares públicos.","Descripción de las rutinas de los astronautas, datos curiosos sobre el Sistema Solar y lectura de hechos sobre la Luna.","Investigación, clasificación y descripción física de pequeños insectos (minibeasts) y sus respectivos hábitats.","Planificación de un campamento de verano, identificando actividades al aire libre (rafting, hiking, zip-lining) y reglas de seguridad.","Creación y descripción de la apariencia física y personalidad de superhéroes y personajes de cuentos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lenguaje-y-comunicacion-5-basico-5-basico', 'lenguaje-y-comunicacion-5-basico', 'Lenguaje y Comunicación 5° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-5-Basico/LYCSM26E5B_compressed.pdf', '["Lectura y análisis de textos narrativos (novelas, cuentos, leyendas) para reflexionar sobre valores como el trabajo en equipo y la resiliencia.","Análisis de artículos informativos y reportajes relacionados con la crisis climática y la diversidad cultural.","Estrategias de comprensión: inferir significados a partir del contexto, determinar consecuencias de acciones y reconocer lenguaje figurado.","Producción de textos escritos: artículos informativos sobre deportes, leyendas locales y cómics.","Expresión oral: participación en debates sobre igualdad de género y medioambiente.","Análisis de recursos gráficos y su relación con el texto (infografías, cómics, imágenes)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-5-basico-tomos-1-y-2-5-basico', 'matematica-5-basico', 'Sumo Primero 5° Básico (Tomos 1 y 2)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-5-Basico/MATME26E5B_1.pdf', '["Resolución de operaciones combinadas con números naturales y aplicación de propiedades (conmutativa, asociativa, distributiva).","Cálculo de múltiplos, divisores, números primos y compuestos, y resolución de problemas de MCM y MCD.","Operaciones con fracciones (adición, sustracción, amplificación y simplificación) y su representación gráfica.","Comparación, ordenamiento y operaciones con números decimales hasta la milésima.","Cálculo de áreas de triángulos, paralelógramos y trapecios, y uso de escalas en planos.","Interpretación de tablas y gráficos de línea y doble barra para analizar tendencias y datos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-5-basico-5-basico', 'ciencias-naturales-5-basico', 'Ciencias Naturales 5° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-5-Basico/CNASA26E5B.pdf', '["Investigación sobre la distribución del agua en la Tierra (ciclo hidrológico y reservas).","Experimentación sobre las características de los seres vivos y niveles de organización biológica (célula, tejido, órgano, sistema, organismo).","Análisis del impacto de las actividades humanas en el medio ambiente y los recursos hídricos.","Diseño y ejecución de investigaciones experimentales sobre nutrición y salud (tabaquismo, microorganismos, desinfectantes).","Construcción y análisis de circuitos eléctricos, distinguiendo entre materiales conductores y aislantes."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-5-basico-5-basico', 'historia-geografia-y-ciencias-sociales-5-basico', 'Historia, Geografía y Ciencias Sociales 5° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-5-Basico/HISSM26E5B_compressed.pdf', '["Análisis de mapas físicos y políticos de Chile, identificando zonas naturales y su diversidad de paisajes y recursos.","Investigación sobre el proceso de descubrimiento y conquista de América y Chile.","Análisis de fuentes históricas (documentos, imágenes y crónicas) sobre el impacto del encuentro entre dos mundos.","Comprensión de la organización política y social de la Colonia en Chile y América.","Debates y reflexión sobre la construcción de la identidad nacional, el mestizaje y los derechos ciudadanos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('student-s-book-english-5th-grade-5-basico', 'ingles-5-basico', 'Student''s Book English 5th Grade', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-5-Basico/INGSA26E5B.pdf', '["Desarrollo de habilidades comunicativas para hablar sobre viajes, cultura y ocupaciones.","Práctica de comprensión lectora (escaneo y skimming) en folletos, artículos informativos y cómics.","Producción de textos: correos electrónicos, descripciones de personas, artículos informativos y poemas (haikus).","Uso de gramática contextualizada: adjetivos comparativos y superlativos, adverbios de modo/tiempo/lugar y concordancia sujeto-verbo.","Pronunciación y fonética enfocada en sonidos específicos (/eɪ/, /i:/, /ɜː/).","Integración interdisciplinaria: uso de gráficos matemáticos y reflexiones ambientales (Think Green)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('sumo-primero-6-basico-tomo-2-6-basico', 'matematica-6-basico', 'Sumo Primero 6° Básico Tomo 2', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-6-Basico/MATME26E6B_1.pdf', '["Resolución de problemas de adición y sustracción con fracciones y números mixtos.","Operaciones combinadas con números decimales y fracciones.","Modelamiento de patrones y resolución de ecuaciones de primer grado.","Comparación de cantidades mediante el concepto de razón y cálculo de densidad.","Representación y análisis de datos en gráficos de barras dobles y circulares."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lenguaje-y-comunicacion-6-basico-6-basico', 'lenguaje-y-comunicacion-6-basico', 'Lenguaje y Comunicación 6° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lenguaje-y-Comunicacion-6-Basico/LYCSM26E6B_3.pdf', '["Lectura y análisis de textos narrativos, poéticos e informativos.","Identificación de acciones principales y caracterización de personajes en relatos.","Producción de artículos informativos y relatos de experiencias personales.","Interpretación de figuras literarias y lenguaje figurado.","Exposición oral sobre temáticas de medioambiente y pueblos originarios."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-6-basico-6-basico', 'ciencias-naturales-6-basico', 'Ciencias Naturales 6° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-6-Basico/CNASA26E6B_3.pdf', '["Identificación de estructuras y funciones de los sistemas reproductores humanos.","Análisis de cambios físicos y sicológicos durante la pubertad y autocuidado.","Descripción de las capas de la Tierra (atmósfera, litósfera, hidrósfera) y fenómenos de erosión.","Análisis de redes y tramas tróficas en ecosistemas chilenos y el impacto humano.","Investigación sobre la fotosíntesis y el uso eficiente de recursos energéticos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-6-basico-6-basico', 'historia-geografia-y-ciencias-sociales-6-basico', 'Historia, Geografía y Ciencias Sociales 6° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-6-Basico/HISSM26E6B_compressed.pdf', '["Análisis del sistema político chileno, la Constitución y los poderes del Estado mediante esquemas y estudios de caso.","Formulación de preguntas, debates y expresión de opiniones fundamentadas sobre derechos humanos y participación ciudadana.","Uso de líneas de tiempo y periodizaciones para comprender la independencia, la organización de la república (siglo XIX) y la historia del siglo XX.","Contraste y análisis de múltiples fuentes históricas (primarias y secundarias) para comprender la multicausalidad de hitos como el quiebre de la democracia.","Análisis espacial utilizando mapas, cartografía y climogramas para identificar los ambientes naturales y las regiones de Chile.","Desarrollo de proyectos grupales orientados a proponer soluciones para problemáticas territoriales y medioambientales locales."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('student-s-book-english-6th-grade-6-basico', 'ingles-6-basico', 'Student''s Book English 6th Grade', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-6-Basico/INGSA26E6B_2.pdf', '["Identificación y descripción de diversas expresiones artísticas como pintura, escultura, teatro y alfarería.","Expresión de gustos, preferencias y opiniones sobre el arte.","Lectura y análisis de textos literarios (como The Picture of Dorian Gray).","Investigación sobre festividades tradicionales chilenas y del mundo.","Producción de textos escritos (correos electrónicos y entradas de blog) sobre experiencias personales y eventos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lengua-y-literatura-7-basico-7-basico', 'lengua-y-literatura-7-basico', 'Lengua y Literatura 7° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-7-Basico/LYLSA26E7B.pdf', '["Análisis del relato narrativo, reconociendo al narrador, la estructura del conflicto y la evolución de los personajes.","Lectura crítica de textos en medios de comunicación (reportajes y noticias) para deducir propósitos implícitos.","Composición de textos literarios e informativos, incluyendo la redacción argumentativa de cartas al director.","Interpretación de poemas e identificación de elementos del lenguaje poético como rima, musicalidad e imágenes lúdicas.","Investigación sobre el contexto literario y la cosmovisión para vincular las obras con autores o pueblos originarios."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-7-basico-7-basico', 'matematica-7-basico', 'Matemática 7° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-7-Basico/MATSM26E7B.pdf', '["Resolución de problemas con operaciones combinadas de números enteros (Z) utilizando la recta numérica.","Multiplicación y división de decimales y fracciones, además del cálculo de proporciones y porcentajes.","Traducción a lenguaje algebraico y modelamiento de ecuaciones con variables dependientes e independientes.","Identificación de proporciones directas e inversas y deducción del valor de la constante de proporcionalidad.","Uso del plano cartesiano, cálculo de área y perímetro de figuras poligonales circulares y organización estadística."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-7-basico-7-basico', 'ciencias-naturales-7-basico', 'Ciencias Naturales 7° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Ciencias-Naturales-7-Basico/CNASM26E7B_compressed.pdf', '["Diferenciación entre sustancias puras y mezclas, aplicando métodos físicos de separación y disolución.","Análisis del estado gaseoso mediante el modelo cinético-molecular y las leyes de los gases.","Estudio de las fuerzas mecánicas, interacción tectónica de placas y el efecto del cambio climático.","Investigación sobre características de microorganismos, virus y los mecanismos del sistema inmunológico.","Comprensión de los aspectos biológicos, afectivos y sociales de la sexualidad humana y el autocuidado."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-7-basico-7-basico', 'historia-geografia-y-ciencias-sociales-7-basico', 'Historia, Geografía y Ciencias Sociales 7° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-7-Basico/HISSM20E7B.pdf', '["Análisis del proceso de hominización y expansión del Homo sapiens por el mundo.","Reconocimiento de las características del Neolítico y el desarrollo de las primeras civilizaciones.","Estudio de las instituciones de Grecia clásica y de la República y el Imperio romano.","Comprensión de los procesos de la civilización europea occidental durante la Edad Media.","Estudio detallado del territorio, economía, ritualidad y legado de las civilizaciones maya, azteca e inca."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('english-7th-grade-7-basico', 'ingles-7-basico', 'English 7th Grade', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-7-Basico/INGCC26E7B.pdf', '["Expresión de sentimientos y descripciones de características físicas y de personalidad.","Desarrollo de habilidades de comprensión para narrar experiencias y relatar un diario de vida.","Identificación de hábitos saludables, comida, nutrición y beneficios del bienestar físico y mental.","Descripción de rutinas, deportes, actividades de tiempo libre e intereses recreativos personales.","Discusión y sensibilización sobre la ecología, el reciclaje y las problemáticas de contaminación ambiental."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-8-basico-8-basico', 'matematica-8-basico', 'Matemática 8° Básico', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-8-Basico/MATSA26E8B.pdf', '["Cálculo de multiplicaciones y divisiones con números enteros y racionales, además de potencias, raíces cuadradas y porcentajes.","Uso de lenguaje algebraico para operar expresiones, plantear y resolver ecuaciones e inecuaciones.","Comprensión y modelamiento de funciones lineales y afines mediante sus diferentes representaciones gráficas y algebraicas.","Aplicación del teorema de Pitágoras, desarrollo de transformaciones isométricas en el plano y cálculo de volumen en cuerpos geométricos.","Construcción e interpretación de gráficos, uso de medidas de posición y cálculo de probabilidades mediante el principio multiplicativo."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('english-8th-grade-student-s-book-8-basico', 'ingles-8-basico', 'English 8th Grade Student''s Book', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-8-Basico/INGBC26E8B.pdf', '["Desarrollo de comprensión auditiva y lectora sobre tecnologías de la información, multiculturalidad y temas medioambientales.","Expresión oral mediante discusiones y presentaciones sobre el impacto de las TIC, el turismo y el cambio climático.","Producción escrita de correos electrónicos, infografías y folletos siguiendo un proceso estructurado.","Valoración de la diversidad cultural y reflexión activa sobre el respeto, la tolerancia y el cuidado del medio ambiente."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lengua-y-literatura-1-medio-1-medio', 'lengua-y-literatura-1-medio', 'Lengua y Literatura 1º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-1-Medio/LYLSA26E1M.pdf', '["Lectura e interpretación de textos literarios e informativos enfocados en el crecimiento personal y las visiones de mundo.","Reflexión acerca del movimiento humano, la migración y la evolución del lenguaje a través de reportajes y crónicas.","Análisis de relatos, novelas y obras dramáticas para identificar la estructura del conflicto y la evolución de los personajes.","Escritura de textos argumentativos, columnas de opinión y microensayos anticipando desarrollos futuros.","Investigación sobre problemáticas tecnológicas, sociales y ambientales evaluando la confiabilidad de las fuentes."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-1-medio-1-medio', 'matematica-1-medio', 'Matemática 1º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-1-Medio/MATSA26E1M.pdf', '["Resolución de problemas con operaciones combinadas de números racionales y uso de notación científica.","Modelamiento de procesos de crecimiento y decrecimiento utilizando potencias de base racional y exponente entero.","Aplicación de productos notables (cuadrado de binomio, suma por su diferencia) y factorización algebraica.","Resolución de sistemas de ecuaciones lineales con dos incógnitas a través de métodos gráficos y algebraicos.","Estudio de transformaciones isométricas, homotecia, propiedades de los vectores y criterios de semejanza de figuras.","Cálculo de la probabilidad de eventos empleando la regla aditiva y multiplicativa, y análisis comparativo de muestras estadísticas."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-1-medio-1-medio', 'historia-geografia-y-ciencias-sociales-1-medio', 'Historia, Geografía y Ciencias Sociales 1º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-1-Medio/HISSA26E1M.pdf', '["Análisis de las revoluciones liberales, la formación de repúblicas y el desarrollo del orden político y constitucional.","Estudio del impacto de la industrialización, las migraciones campo-ciudad y las problemáticas surgidas con la \"cuestión social\".","Evaluación del modelo económico primario exportador chileno y los debates políticos entre conservadores y liberales.","Investigación sobre la expansión territorial nacional, incluyendo la Guerra del Pacífico y la ocupación militar de La Araucanía.","Comprensión del sistema de mercado, el juego de oferta y demanda, y el rol que cumplen el Estado y los agentes privados."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('english-1st-high-school-1-medio', 'ingles-1-medio', 'English 1st High School', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-1-Medio/INGSA26E1M.pdf', '["Desarrollo de comprensión auditiva y lectora en torno a responsabilidades laborales, profesiones y trabajo de verano.","Simulación oral de entrevistas de trabajo y discusiones sobre fortalezas, debilidades y postulación a cargos.","Producción de correos electrónicos formales, resumes (currículos) y volantes promocionando programas de voluntariado.","Análisis del impacto global del aprendizaje continuo y exploración del arte como medio de transformación y diversidad cultural."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-biologia-1-y-2-medio-ejes-1-medio-1-medio', 'biologia-1-medio', 'Ciencias Naturales - Biología 1º y 2º Medio (Ejes 1º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Biologia-1-Medio/BIOSA26E1M.pdf', '["Estudio comparativo de restos fósiles, anatomía comparada y embriología como prueba del desarrollo evolutivo.","Revisión de los postulados de Charles Darwin, la teoría de la selección natural y su impacto en la biodiversidad.","Análisis ecológico de poblaciones, simbiosis y las dinámicas energéticas a nivel de transferencia y fotosíntesis.","Evaluación del impacto antropogénico como la deforestación, la bioacumulación tóxica y las emisiones de carbono."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-fisica-1-y-2-medio-ejes-1-medio-1-medio', 'fisica-1-medio', 'Ciencias Naturales - Física 1º y 2º Medio (Ejes 1º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Fisica-1-Medio/FISSM26E1M_compressed.pdf', '["Estudio del sonido, su naturaleza ondulatoria, parámetros que lo definen (amplitud, frecuencia) y fenómenos acústicos.","Análisis del espectro electromagnético, comprendiendo la naturaleza y propagación de la luz visible e invisible.","Experimentación óptica utilizando lentes para demostrar cómo incide el índice de refracción en la trayectoria lumínica.","Evaluación del impacto de la contaminación lumínica artificial en los ecosistemas y la astronomía nacional."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-quimica-1-y-2-medio-ejes-1-medio-1-medio', 'quimica-1-medio', 'Ciencias Naturales - Química 1º y 2º Medio (Ejes 1º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Quimica-1-Medio/QUISM26E1M_compressed.pdf', '["Diferenciación entre cambios físicos y químicos identificando variables (temperatura, energía) y manifestaciones empíricas.","Experimentación variando temperatura y agitación para determinar su incidencia en la velocidad de una reacción química.","Resolución estequiométrica aplicando el método de balance por tanteo o algebraico en ecuaciones químicas.","Aplicación de los fundamentos de Dalton, Proust y Lavoisier mediante el cálculo de la ley de conservación de la materia."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lengua-y-literatura-2-medio-2-medio', 'lengua-y-literatura-2-medio', 'Lengua y Literatura 2º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-2-Medio/LYLSA26E2M.pdf', '["Lectura y análisis de textos literarios e informativos enfocados en la identidad, el viaje y el descubrimiento personal.","Reflexión sobre los desafíos actuales, la crisis ambiental y social a través de reportajes y literatura contemporánea.","Comprensión de los vínculos humanos y la convivencia mediante el diálogo, debates y la redacción de ensayos.","Interpretación de obras dramáticas, discursos y relatos de formación, evaluando los personajes y sus motivaciones.","Producción escrita de textos autobiográficos, reportajes y discursos públicos enfocados en la participación ciudadana."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-2-medio-2-medio', 'matematica-2-medio', 'Matemática 2º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-2-Medio/MATSA26E2M.pdf', '["Resolución de problemas matemáticos involucrando números reales, raíces enésimas, potencias de exponente racional y propiedades de los logaritmos.","Modelamiento de situaciones con funciones y ecuaciones cuadráticas, analizando vértices, concavidad y desplazamientos de gráficas.","Determinación de las condiciones de existencia y el cálculo de la función inversa (lineal, afín y cuadrática).","Aplicación de las razones trigonométricas (seno, coseno, tangente) y teorema de Pitágoras, además de la descomposición de vectores.","Cálculo probabilístico empleando técnicas de combinatoria, permutaciones, variables aleatorias y la regla de Laplace."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('historia-geografia-y-ciencias-sociales-2-medio-2-medio', 'historia-geografia-y-ciencias-sociales-2-medio', 'Historia, Geografía y Ciencias Sociales 2º Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Historia-Geografia-y-Ciencias-Sociales-2-Medio/HISSM26E2M.pdf', '["Análisis de la crisis del Estado liberal decimonónico, el surgimiento de modelos totalitarios y el impacto destructivo de las Guerras Mundiales.","Estudio de las dinámicas bipolares de amenaza nuclear durante la Guerra Fría y los hitos del proceso de descolonización mundial.","Evaluación de los proyectos políticos en Chile en el siglo XX, el quiebre democrático de 1973 y la imposición de reformas neoliberales.","Investigación sobre las violaciones a los Derechos Humanos durante la dictadura militar chilena y el establecimiento de Comisiones de Verdad.","Revisión de los desafíos del mundo contemporáneo vinculados a la globalización, revolución tecnológica, diversidad ciudadana y no discriminación."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('high-school-english-2-2-medio', 'ingles-2-medio', 'High School English 2', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-2-Medio/INGSM26E2M.pdf', '["Desarrollo de habilidades de comprensión auditiva y lectora debatiendo sobre el mundo globalizado y problemas a escala internacional.","Expresión oral y argumentación sobre el uso diario de la tecnología, las redes sociales y la prevención de riesgos de privacidad en línea.","Investigación bibliográfica y análisis descriptivo del perfil de personas destacadas, identificando modelos a seguir y cualidades de liderazgo.","Producción de material escrito enfocado en planes y campañas de sustentabilidad, impacto ambiental de las industrias y reciclaje local."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-biologia-1-y-2-medio-ejes-2-medio-2-medio', 'biologia-2-medio', 'Ciencias Naturales - Biología 1º y 2º Medio (Ejes 2º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Biologia-1-Medio/BIOSA26E1M.pdf', '["Estudio de la anatomía del sistema nervioso, transmisión del impulso sináptico y respuestas automáticas (reflejos).","Análisis sobre la importancia del sueño, la salud mental, el estrés y los efectos del consumo de drogas en la neuroquímica.","Investigación sobre identidad de género, autocuidado preventivo, infecciones de transmisión sexual (ITS) y métodos de protección.","Comprensión de la estructura de la molécula de ADN, procesos del ciclo celular y biotecnología aplicada a la ingeniería genética."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-fisica-1-y-2-medio-ejes-2-medio-2-medio', 'fisica-2-medio', 'Ciencias Naturales - Física 1º y 2º Medio (Ejes 2º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Fisica-1-Medio/FISSM26E1M_compressed.pdf', '["Diferenciación cualitativa entre trayectoria y desplazamiento, y cálculo de rapidez y velocidad utilizando magnitudes cinemáticas.","Uso de sistemas de referencia vectoriales bi y tridimensionales para ubicar y describir el movimiento de cuerpos físicos.","Estudio de las fuerzas mecánicas aplicadas y el concepto de fuerza neta empleando diagramas de vectores.","Investigación astronómica acerca del Big Bang, la expansión acelerada del universo y la tecnología espacial de observatorios chilenos."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('ciencias-naturales-quimica-1-y-2-medio-ejes-2-medio-2-medio', 'quimica-2-medio', 'Ciencias Naturales - Química 1º y 2º Medio (Ejes 2º Medio)', 'https://www.curriculumnacional.cl/portal/Estudiantes/Quimica-1-Medio/QUISM26E1M_compressed.pdf', '["Identificación de solutos y disolventes en mezclas homogéneas y técnicas de separación asociadas.","Cálculos matemáticos para determinar unidades físicas (%m/m, %m/v) y unidades químicas (Molaridad) en disoluciones.","Análisis de las propiedades del átomo de carbono, su capacidad de hibridación y su rol como base de la estructura orgánica.","Nomenclatura sistemática (IUPAC) para hidrocarburos alifáticos y cíclicos, e identificación de biomoléculas (lípidos, proteínas)."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lengua-y-literatura-3-y-4-medio-3-medio', 'lengua-y-literatura-3-medio', 'Lengua y Literatura 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-3-Medio/LYLSM26E3M_compressed.pdf', '["Lectura y análisis de obras narrativas y dramáticas, proponiendo interpretaciones basadas en sus componentes, lenguaje y elementos simbólicos.","Lectura crítica de ensayos y textos no literarios, evaluando intenciones, posicionamientos, creencias e influencia del contexto sociocultural.","Participación en foros de discusión y debates argumentativos, respetando las convenciones del género y formulando argumentos y contraargumentos.","Investigación sobre temas socioculturales y medioambientales, redactando ensayos, artículos informativos y columnas de opinión.","Análisis de las relaciones de intertextualidad entre diferentes referentes culturales y obras de la literatura."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('filosofia-3-y-4-medio-3-medio', 'filosofia-3-medio', 'Filosofía 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Filosofia-3-Medio/FILSM26E3M_compressed.pdf', '["Reflexión y diálogo sobre problemas filosóficos contemporáneos, cuestionando lo obvio y analizando la realidad desde el asombro y la duda metódica.","Aplicación de habilidades lógico-argumentativas, distinguiendo la lógica formal e informal, analizando silogismos y estructurando argumentos sólidos.","Exploración de contextos filosóficos fundamentales (ontología, epistemología, ética, estética) y cuestionamiento de perspectivas eurocéntricas.","Análisis de textos filosóficos para investigar sobre la libertad, el sentido de la vida, el origen del universo y la construcción del conocimiento.","Desarrollo de proyectos interdisciplinarios que vinculan la ética, la política y la ciencia con fenómenos actuales como la crisis medioambiental y el rol de las inteligencias artificiales."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-3-y-4-medio-3-medio', 'matematica-3-medio', 'Matemática 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Medio/MATSA26E3M.pdf', '["Cálculo y análisis de medidas de dispersión (varianza, desviación estándar, coeficiente de variación) en datos agrupados y no agrupados.","Toma de decisiones en contextos de incerteza mediante la construcción de diagramas de árbol y el cálculo de probabilidades condicionales.","Modelamiento de fenómenos de crecimiento y decrecimiento utilizando funciones exponenciales y logarítmicas, analizando sus desplazamientos gráficos.","Resolución de problemas geométricos calculando longitudes de cuerdas, secantes y tangentes, y determinando ángulos en la circunferencia."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('high-school-english-3-4-3-medio', 'ingles-3-medio', 'High School English 3-4', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Medio/INGSA26E3M.pdf', '["Desarrollo de habilidades comunicativas (Reading, Listening, Speaking, Writing) debatiendo sobre el éxito, la competencia y los actos de bondad.","Análisis de la alfabetización mediática, discerniendo entre hechos y ficción, y evaluando el impacto de la publicidad.","Reflexión en idioma inglés sobre la ética empresarial, el trabajo remunerado frente al voluntariado y el apoyo a la comunidad.","Investigación sobre acciones sostenibles y el cuidado del medioambiente, implementando proyectos interdisciplinarios."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('educacion-ciudadana-3-medio-3-medio', 'educacion-ciudadana-3-medio', 'Educación Ciudadana 3° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Educacion-Ciudadana-3-Medio/EDCSM26E3M.pdf', '["Análisis de los fundamentos, atributos y dimensiones que componen la democracia y la ciudadanía contemporánea.","Reconocimiento de la dignidad humana y estudio de los principios que sustentan los Derechos Humanos.","Comprensión de las relaciones e interacciones económicas, destacando el rol del Estado frente al mercado.","Evaluación de la configuración interescalar del territorio y dinámicas de participación comunitaria en el ámbito escolar."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('lengua-y-literatura-3-y-4-medio-4-medio', 'lengua-y-literatura-4-medio', 'Lengua y Literatura 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Lengua-y-Literatura-3-Medio/LYLSM26E3M_compressed.pdf', '["Lectura y análisis de obras narrativas y dramáticas, proponiendo interpretaciones basadas en sus componentes, lenguaje y elementos simbólicos.","Lectura crítica de ensayos y textos no literarios, evaluando intenciones, posicionamientos, creencias e influencia del contexto sociocultural.","Participación en foros de discusión y debates argumentativos, respetando las convenciones del género y formulando argumentos y contraargumentos.","Investigación sobre temas socioculturales y medioambientales, redactando ensayos, artículos informativos y columnas de opinión.","Análisis de las relaciones de intertextualidad entre diferentes referentes culturales y obras de la literatura."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('matematica-3-y-4-medio-4-medio', 'matematica-4-medio', 'Matemática 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Matematica-3-Medio/MATSA26E3M.pdf', '["Cálculo y análisis de medidas de dispersión (varianza, desviación estándar, coeficiente de variación) en datos agrupados y no agrupados.","Toma de decisiones en contextos de incerteza mediante la construcción de diagramas de árbol y el cálculo de probabilidades condicionales.","Modelamiento de fenómenos de crecimiento y decrecimiento utilizando funciones exponenciales y logarítmicas, analizando sus desplazamientos gráficos.","Resolución de problemas geométricos calculando longitudes de cuerdas, secantes y tangentes, y determinando ángulos en la circunferencia."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('filosofia-3-y-4-medio-4-medio', 'filosofia-4-medio', 'Filosofía 3° y 4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Filosofia-3-Medio/FILSM26E3M_compressed.pdf', '["Reflexión y diálogo sobre problemas filosóficos contemporáneos, cuestionando lo obvio y analizando la realidad desde el asombro y la duda metódica.","Aplicación de habilidades lógico-argumentativas, distinguiendo la lógica formal e informal, analizando silogismos y estructurando argumentos sólidos.","Exploración de contextos filosóficos fundamentales (ontología, epistemología, ética, estética) y cuestionamiento de perspectivas eurocéntricas.","Análisis de textos filosóficos para investigar sobre la libertad, el sentido de la vida, el origen del universo y la construcción del conocimiento.","Desarrollo de proyectos interdisciplinarios que vinculan la ética, la política y la ciencia con fenómenos actuales como la crisis medioambiental y el rol de las inteligencias artificiales."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('high-school-english-3-4-4-medio', 'ingles-4-medio', 'High School English 3-4', 'https://www.curriculumnacional.cl/portal/Estudiantes/Inglés-3-Medio/INGSA26E3M.pdf', '["Desarrollo de habilidades comunicativas (Reading, Listening, Speaking, Writing) debatiendo sobre el éxito, la competencia y los actos de bondad.","Análisis de la alfabetización mediática, discerniendo entre hechos y ficción, y evaluando el impacto de la publicidad.","Reflexión en idioma inglés sobre la ética empresarial, el trabajo remunerado frente al voluntariado y el apoyo a la comunidad.","Investigación sobre acciones sostenibles y el cuidado del medioambiente, implementando proyectos interdisciplinarios."]', '');
INSERT OR IGNORE INTO textos_escolares (id, asignatura_id, titulo, url, actividades, planificacion_detalle) VALUES
  ('educacion-ciudadana-3-4-medio-4-medio', 'educacion-ciudadana-4-medio', 'Educación Ciudadana 3°-4° Medio', 'https://www.curriculumnacional.cl/portal/Estudiantes/Educacion-Ciudadana-4-Medio/EDCSS26E4M.pdf', '["Participación ciudadana para resolver problemas sociales y superar brechas de desigualdad.","Análisis crítico del rol de los medios de comunicación y las TIC en la democracia moderna.","Promoción de principios éticos para construir una democracia más inclusiva y un territorio equitativo.","Reflexión sobre los derechos laborales y evaluación del impacto de los modelos de desarrollo en el cambio climático."]', '');

-- Fin de la migración 0003