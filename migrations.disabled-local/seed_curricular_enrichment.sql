-- Seed: Poblar tablas curriculares enriquecidas con datos derivados
-- Solo inserta para OAs que realmente existen en la tabla objectives
-- Todos los indicadores, referencias y recomendaciones son derivados (no oficiales)
-- Se usa INSERT OR IGNORE para ser seguro en re-ejecución

-- ============================================================
-- 1. OBJECTIVE_INDICATORS — Indicadores pedagógicos derivados
-- ============================================================

-- Tecnología 1° básico OA 01 (crear diseños de objetos)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa01-01', o.id, 'Representa una idea mediante dibujo o modelo concreto.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 01';
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa01-02', o.id, 'Explica oralmente el propósito del objeto diseñado.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 01';
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa01-03', o.id, 'Ajusta su diseño siguiendo retroalimentación del docente.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 01';

-- Tecnología 1° básico OA 02 (explorar materiales y herramientas)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa02-01', o.id, 'Identifica materiales comunes por sus propiedades básicas.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 02';
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa02-02', o.id, 'Usa herramientas simples de forma segura y guiada.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 02';
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-te01-oa02-03', o.id, 'Clasifica materiales según su origen y uso.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code = 'TE01 OA 02';

-- Lenguaje 1° básico OA 02 (leer palabras y combinaciones)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa02-01', o.id, 'Lee palabras con todas las letras del alfabeto.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa02-02', o.id, 'Lee combinaciones consonánticas directas (bra, cre, dri, flo, gru).', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa02-03', o.id, 'Lee oraciones breves con fluidez inicial.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');

-- Lenguaje 2° básico OA 03 (leer con fluidez)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le02-oa03-01', o.id, 'Lee al menos 40 palabras por minuto con precisión.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le02-oa03-02', o.id, 'Responde preguntas inferenciales sobre el texto leído.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le02-oa03-03', o.id, 'Identifica el propósito del texto leído.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le02-oa03-04', o.id, 'Relaciona información del texto con sus experiencias personales.', 4, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');

-- Matemática 1° básico OA 01 (contar números 0-100)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa01-01', o.id, 'Cuenta hacia adelante desde cualquier número hasta 100.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa01-02', o.id, 'Cuenta de 2 en 2 hasta 20.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa01-03', o.id, 'Cuenta de 5 en 5 y de 10 en 10 hasta 100.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');

-- Matemática 1° básico OA 06 (resolver problemas adición/sustracción)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa06-01', o.id, 'Representa problemas con dibujos o material concreto.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 06', 'MAT01 OA 06');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa06-02', o.id, 'Resuelve problemas de cambio y combinación con números hasta 20.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 06', 'MAT01 OA 06');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ma01-oa06-03', o.id, 'Explica oralmente el procedimiento usado para resolver.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('MA01 OA 06', 'MAT01 OA 06');

-- Lenguaje 1° básico OA 05 (escribir oraciones simples)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa05-01', o.id, 'Escribe oraciones de 3 a 5 palabras con sentido completo.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 05', 'LEN01 OA 05');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa05-02', o.id, 'Usa mayúscula al inicio y punto final en sus escritos.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 05', 'LEN01 OA 05');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-le01-oa05-03', o.id, 'Respeta la secuencia de sonidos al escribir palabras.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('LE01 OA 05', 'LEN01 OA 05');

-- Ciencias Naturales 1° básico OA 01 (reconocer seres vivos)
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ci01-oa01-01', o.id, 'Clasifica animales según su hábitat.', 1, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('CI01 OA 01', 'CN01 OA 01');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ci01-oa01-02', o.id, 'Describe las partes principales de una planta.', 2, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('CI01 OA 01', 'CN01 OA 01');
INSERT OR IGNORE INTO objective_indicators (id, objective_id, indicator_text, order_index, source_url, source_type, source_name)
SELECT 'ind-ci01-oa01-03', o.id, 'Compara seres vivos e inertes identificando diferencias.', 3, o.source_url, 'derived', 'Indicador pedagógico derivado'
FROM objectives o WHERE o.code IN ('CI01 OA 01', 'CN01 OA 01');

-- ============================================================
-- 2. LESSON_SEQUENCE_RECOMMENDATIONS — Recomendaciones derivadas
-- ============================================================

-- TE01 OA 01 (crear diseños) → 2 clases (aplicar)
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-te01-oa01', o.code, c.name, s.name, 'media', 2,
  'OA de diseño y creación. Requiere una clase para exploración y boceto, y otra para construcción y retroalimentación.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 01';

-- TE01 OA 02 (explorar materiales) → 1 clase (reconocer)
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-te01-oa02', o.code, c.name, s.name, 'baja', 1,
  'OA de reconocimiento y exploración guiada. Puede trabajarse en una clase con estaciones de materiales.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 02';

-- LE01 OA 02 (leer palabras) → 3 clases (decodificación progresiva)
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-le01-oa02', o.code, c.name, s.name, 'alta', 3,
  'OA de lectoescritura inicial con múltiples combinaciones. Requiere al menos 3 clases para decodificación, práctica guiada y lectura autónoma.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');

-- LE02 OA 03 (leer con fluidez) → 2 clases (comprensión)
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-le02-oa03', o.code, c.name, s.name, 'media', 2,
  'OA de comprensión lectora. Requiere una clase de lectura guiada y otra de trabajo independiente con preguntas inferenciales.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');

-- MA01 OA 01 (contar números) → 2 clases
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-ma01-oa01', o.code, c.name, s.name, 'media', 2,
  'OA de conteo con múltiples patrones. Primera clase para conteo de 1 en 1 y 2 en 2; segunda clase para 5 en 5 y 10 en 10.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');

-- MA01 OA 06 (resolver problemas) → 3 clases
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-ma01-oa06', o.code, c.name, s.name, 'alta', 3,
  'OA de resolución de problemas. Clase 1: representación concreta; Clase 2: problemas de cambio y combinación; Clase 3: explicación y síntesis de estrategias.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 06', 'MAT01 OA 06');

-- LE01 OA 05 (escribir oraciones) → 2 clases
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-le01-oa05', o.code, c.name, s.name, 'media', 2,
  'OA de escritura inicial. Clase 1: escritura guiada de oraciones con apoyo visual; Clase 2: producción independiente con revisión de pares.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE01 OA 05', 'LEN01 OA 05');

-- CI01 OA 01 (reconocer seres vivos) → 2 clases
INSERT OR IGNORE INTO lesson_sequence_recommendations (id, objective_code, level, subject, complexity, recommended_lessons, rationale, source_type, source_name)
SELECT 'rec-ci01-oa01', o.code, c.name, s.name, 'baja', 1,
  'OA de reconocimiento y clasificación. Puede abordarse en una clase con actividad práctica de observación y clasificación.',
  'derived', 'Análisis pedagógico basado en bloom_level e indicadores'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('CI01 OA 01', 'CN01 OA 01');

-- ============================================================
-- 3. CURRICULAR_RESOURCE_LINKS — Enlaces a recursos sugeridos
-- ============================================================

-- TE01 OA 01
INSERT OR IGNORE INTO curricular_resource_links (id, objective_code, level, subject, title, type, description, source_url, source_name, source_type)
SELECT 'crl-te01-oa01-01', o.code, c.name, s.name,
  'Guía de diseño de objetos para 1° básico',
  'guia_didactica',
  'Actividad práctica donde estudiantes diseñan y construyen un objeto con materiales reciclados.',
  o.source_url,
  'Recurso pedagógico derivado',
  'derived'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 01';

INSERT OR IGNORE INTO curricular_resource_links (id, objective_code, level, subject, title, type, description, source_url, source_name, source_type)
SELECT 'crl-te01-oa01-02', o.code, c.name, s.name,
  'Plantilla de boceto para diseño tecnológico',
  'formato',
  'Formato imprimible para que estudiantes dibujen su diseño, enumeren materiales y escriban el propósito.',
  o.source_url,
  'Recurso pedagógico derivado',
  'derived'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 01';

-- LE01 OA 02
INSERT OR IGNORE INTO curricular_resource_links (id, objective_code, level, subject, title, type, description, source_url, source_name, source_type)
SELECT 'crl-le01-oa02-01', o.code, c.name, s.name,
  'Banco de tarjetas de sílabas y combinaciones',
  'material_didactico',
  'Tarjetas recortables con sílabas directas y combinaciones consonánticas para actividades de decodificación.',
  o.source_url,
  'Recurso pedagógico derivado',
  'derived'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');

-- MA01 OA 01
INSERT OR IGNORE INTO curricular_resource_links (id, objective_code, level, subject, title, type, description, source_url, source_name, source_type)
SELECT 'crl-ma01-oa01-01', o.code, c.name, s.name,
  'Tablero de conteo hasta 100',
  'material_didactico',
  'Tablero numérico imprimible para actividades de conteo progresivo y reconocimiento de patrones.',
  o.source_url,
  'Recurso pedagógico derivado',
  'derived'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');

-- MA01 OA 06
INSERT OR IGNORE INTO curricular_resource_links (id, objective_code, level, subject, title, type, description, source_url, source_name, source_type)
SELECT 'crl-ma01-oa06-01', o.code, c.name, s.name,
  'Banco de problemas ilustrados suma y resta',
  'actividad',
  'Colección de problemas visuales de cambio y combinación con números hasta 20, para resolver con material concreto.',
  o.source_url,
  'Recurso pedagógico derivado',
  'derived'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 06', 'MAT01 OA 06');

-- ============================================================
-- 4. TEXTBOOK_REFERENCES — Referencias a textos escolares
-- ============================================================

-- TE01 OA 01
INSERT OR IGNORE INTO textbook_references (id, level, subject, title, publisher, year, type, unit, objective_code, source_url, summary, source_type, source_name)
SELECT 'tb-te01-oa01-01', c.name, s.name,
  'Texto escolar Tecnología 1° básico',
  'Ministerio de Educación',
  '2024',
  'metadata',
  'Unidad asociada',
  o.code,
  o.source_url,
  'Referencia pedagógica de apoyo, no transcripción oficial. Texto escolar asociado pendiente de validación.',
  'metadata',
  'Referencia curricular inicial'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 01';

-- LE01 OA 02
INSERT OR IGNORE INTO textbook_references (id, level, subject, title, publisher, year, type, unit, objective_code, source_url, summary, source_type, source_name)
SELECT 'tb-le01-oa02-01', c.name, s.name,
  'Texto escolar Lenguaje y Comunicación 1° básico',
  'Ministerio de Educación',
  '2024',
  'metadata',
  'Unidad de lectura inicial',
  o.code,
  o.source_url,
  'Referencia pedagógica de apoyo, no transcripción oficial. Texto escolar asociado pendiente de validación.',
  'metadata',
  'Referencia curricular inicial'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');

-- LE02 OA 03
INSERT OR IGNORE INTO textbook_references (id, level, subject, title, publisher, year, type, unit, objective_code, source_url, summary, source_type, source_name)
SELECT 'tb-le02-oa03-01', c.name, s.name,
  'Texto escolar Lenguaje y Comunicación 2° básico',
  'Ministerio de Educación',
  '2024',
  'metadata',
  'Unidad de lectura y comprensión',
  o.code,
  o.source_url,
  'Referencia pedagógica de apoyo, no transcripción oficial. Texto escolar asociado pendiente de validación.',
  'metadata',
  'Referencia curricular inicial'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE02 OA 03', 'LEN02 OA 03');

-- MA01 OA 01
INSERT OR IGNORE INTO textbook_references (id, level, subject, title, publisher, year, type, unit, objective_code, source_url, summary, source_type, source_name)
SELECT 'tb-ma01-oa01-01', c.name, s.name,
  'Texto escolar Matemática 1° básico',
  'Ministerio de Educación',
  '2024',
  'metadata',
  'Unidad de números y operaciones',
  o.code,
  o.source_url,
  'Referencia pedagógica de apoyo, no transcripción oficial. Texto escolar asociado pendiente de validación.',
  'metadata',
  'Referencia curricular inicial'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');

-- ============================================================
-- 5. TEACHER_GUIDE_REFERENCES — Referencias a guías docentes
-- ============================================================

-- TE01 OA 01
INSERT OR IGNORE INTO teacher_guide_references (id, level, subject, title, unit, lesson_title, objective_code, suggested_activity, didactic_orientation, assessment_suggestion, source_url, summary, source_type, source_name)
SELECT 'tg-te01-oa01-01', c.name, s.name,
  'Guía didáctica Tecnología 1° básico',
  'Unidad de diseño',
  'Clase: Diseñar un objeto para una necesidad',
  o.code,
  'Los estudiantes identifican una necesidad del aula y diseñan un objeto sencillo que la resuelva, usando materiales reciclados.',
  'Guiar a los estudiantes en la identificación de necesidades del entorno. Modelar el proceso de diseño paso a paso.',
  'Observación directa del boceto y del producto final. Preguntas de metacognición: ¿qué problema resolviste?, ¿cómo lo hiciste?',
  o.source_url,
  'Sugerencia pedagógica de apoyo, no transcripción oficial de guía docente MINEDUC.',
  'derived',
  'Guía pedagógica derivada'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code = 'TE01 OA 01';

-- LE01 OA 02
INSERT OR IGNORE INTO teacher_guide_references (id, level, subject, title, unit, lesson_title, objective_code, suggested_activity, didactic_orientation, assessment_suggestion, source_url, summary, source_type, source_name)
SELECT 'tg-le01-oa02-01', c.name, s.name,
  'Guía didáctica Lenguaje 1° básico — Lectoescritura inicial',
  'Unidad de lectura',
  'Clase: Leer combinaciones consonánticas',
  o.code,
  'Estaciones de aprendizaje con tarjetas de sílabas: los estudiantes rotan por estaciones practicando diferentes combinaciones (bra, cre, dri, etc.).',
  'Modelar la lectura de cada combinación en voz alta. Usar gestos para asociar sonido y grafía. Trabajar en grupos pequeños.',
  'Registro de lectura individual. Ticket de salida con lectura de 3 combinaciones nuevas.',
  o.source_url,
  'Sugerencia pedagógica de apoyo, no transcripción oficial de guía docente MINEDUC.',
  'derived',
  'Guía pedagógica derivada'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('LE01 OA 02', 'LEN01 OA 02');

-- MA01 OA 01
INSERT OR IGNORE INTO teacher_guide_references (id, level, subject, title, unit, lesson_title, objective_code, suggested_activity, didactic_orientation, assessment_suggestion, source_url, summary, source_type, source_name)
SELECT 'tg-ma01-oa01-01', c.name, s.name,
  'Guía didáctica Matemática 1° básico — Conteo',
  'Unidad de números',
  'Clase: Contar de 2 en 2, 5 en 5 y 10 en 10',
  o.code,
  'Juego de la ronda numérica: estudiantes saltan en una recta numérica gigante contando de 2 en 2, 5 en 5 y 10 en 10.',
  'Usar material concreto (fichas, cubos) para que los estudiantes visualicen los saltos. Preguntar patrones que observan.',
  'Observación directa durante el juego. Pregunta escrita: completa la secuencia 5, 10, 15, __, __.',
  o.source_url,
  'Sugerencia pedagógica de apoyo, no transcripción oficial de guía docente MINEDUC.',
  'derived',
  'Guía pedagógica derivada'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('MA01 OA 01', 'MAT01 OA 01');

-- CI01 OA 01
INSERT OR IGNORE INTO teacher_guide_references (id, level, subject, title, unit, lesson_title, objective_code, suggested_activity, didactic_orientation, assessment_suggestion, source_url, summary, source_type, source_name)
SELECT 'tg-ci01-oa01-01', c.name, s.name,
  'Guía didáctica Ciencias Naturales 1° básico — Seres vivos',
  'Unidad de ciencias de la vida',
  'Clase: Clasificando seres vivos e inertes',
  o.code,
  'Los estudiantes observan imágenes y clasifican elementos del entorno en vivos e inertes, justificando sus decisiones.',
  'Llevar elementos concretos (planta, piedra, caracol vacío) para observación directa. Guiar la comparación con preguntas abiertas.',
  'Lista de cotejo: identifica características de seres vivos, clasifica correctamente, justifica su clasificación.',
  o.source_url,
  'Sugerencia pedagógica de apoyo, no transcripción oficial de guía docente MINEDUC.',
  'derived',
  'Guía pedagógica derivada'
FROM objectives o
JOIN courses c ON c.id = o.course_id
JOIN subjects s ON s.id = o.subject_id
WHERE o.code IN ('CI01 OA 01', 'CN01 OA 01');
