-- Migration 012: Tabla de configuración general de la aplicación
-- Almacena todas las opciones de desplegables (methodologies, evaluation types, etc.)
-- Fecha: 2026-07-06

CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  value_key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(category, value_key)
);

CREATE INDEX IF NOT EXISTS idx_app_config_category ON app_config(category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_config(active);

-- ============================================================
-- SEED: Todas las opciones de desplegables
-- ============================================================

-- Metodologías pedagógicas
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-met-01', 'methodologies', 'abp', 'Aprendizaje basado en proyectos', 1),
  ('cfg-met-02', 'methodologies', 'cooperativo', 'Aprendizaje cooperativo', 2),
  ('cfg-met-03', 'methodologies', 'indagacion', 'Indagacion', 3),
  ('cfg-met-04', 'methodologies', 'explicita', 'Clase explicita', 4),
  ('cfg-met-05', 'methodologies', 'aula_invertida', 'Aula invertida', 5),
  ('cfg-met-06', 'methodologies', 'dua', 'Diseno universal para el aprendizaje', 6),
  ('cfg-met-07', 'methodologies', 'formativa', 'Evaluacion formativa', 7),
  ('cfg-met-08', 'methodologies', 'estaciones', 'Estaciones de aprendizaje', 8),
  ('cfg-met-09', 'methodologies', 'semilleros', 'Semilleros de investigacion', 9),
  ('cfg-met-10', 'methodologies', 'otro', 'Otra metodologia', 10);

-- Tipos de evaluación
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-eval-01', 'evaluation_types', 'diagnostica', 'Evaluación diagnóstica', 1),
  ('cfg-eval-02', 'evaluation_types', 'formativa', 'Evaluación formativa', 2),
  ('cfg-eval-03', 'evaluation_types', 'sumativa', 'Evaluación sumativa', 3),
  ('cfg-eval-04', 'evaluation_types', 'simce', 'Evaluación tipo SIMCE', 4),
  ('cfg-eval-05', 'evaluation_types', 'simce_breve', 'Ensayo SIMCE breve', 5),
  ('cfg-eval-06', 'evaluation_types', 'banco_preguntas', 'Banco de preguntas', 6),
  ('cfg-eval-07', 'evaluation_types', 'rubrica', 'Rúbrica analítica', 7),
  ('cfg-eval-08', 'evaluation_types', 'holistica', 'Rúbrica holística', 8),
  ('cfg-eval-09', 'evaluation_types', 'cotejo', 'Lista de cotejo', 9),
  ('cfg-eval-10', 'evaluation_types', 'escala', 'Escala de apreciación', 10),
  ('cfg-eval-11', 'evaluation_types', 'ticket', 'Ticket de salida', 11),
  ('cfg-eval-12', 'evaluation_types', 'autoevaluacion', 'Autoevaluación', 12),
  ('cfg-eval-13', 'evaluation_types', 'coevaluacion', 'Coevaluación', 13),
  ('cfg-eval-14', 'evaluation_types', 'retroalimentacion', 'Retroalimentación automática', 14);

-- Tipos de recurso
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-res-01', 'resource_types', 'guia', 'Guía de aprendizaje', 1),
  ('cfg-res-02', 'resource_types', 'ficha', 'Ficha de trabajo', 2),
  ('cfg-res-03', 'resource_types', 'ppt', 'Presentación tipo PPT', 3),
  ('cfg-res-04', 'resource_types', 'gamificada', 'Actividad gamificada', 4),
  ('cfg-res-05', 'resource_types', 'lectura', 'Actividad de lectura', 5),
  ('cfg-res-06', 'resource_types', 'matematica', 'Actividad matemática', 6),
  ('cfg-res-07', 'resource_types', 'interdisciplinaria', 'Actividad interdisciplinaria', 7),
  ('cfg-res-08', 'resource_types', 'dua', 'Recurso DUA', 8),
  ('cfg-res-09', 'resource_types', 'rezago', 'Actividad para rezago', 9),
  ('cfg-res-10', 'resource_types', 'inicio_rapido', 'Actividad de inicio rápido', 10),
  ('cfg-res-11', 'resource_types', 'cierre', 'Actividad de cierre', 11),
  ('cfg-res-12', 'resource_types', 'ticket', 'Ticket de salida', 12),
  ('cfg-res-13', 'resource_types', 'banco_preguntas', 'Banco de preguntas', 13),
  ('cfg-res-14', 'resource_types', 'pauta', 'Pauta de corrección', 14),
  ('cfg-res-15', 'resource_types', 'rubrica', 'Rúbrica', 15),
  ('cfg-res-16', 'resource_types', 'cotejo', 'Lista de cotejo', 16),
  ('cfg-res-17', 'resource_types', 'apoderados', 'Recurso para apoderados', 17),
  ('cfg-res-18', 'resource_types', 'guion_docente', 'Guion docente', 18);

-- Duraciones
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-dur-01', 'durations', '45min', '45 minutos', 1),
  ('cfg-dur-02', 'durations', '60min', '60 minutos', 2),
  ('cfg-dur-03', 'durations', '90min', '90 minutos', 3),
  ('cfg-dur-04', 'durations', '2x45', '2 clases de 45 minutos', 4),
  ('cfg-dur-05', 'durations', 'unidad4', 'Unidad de 4 clases', 5);

-- Enfoques pedagógicos
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-enf-01', 'approaches', 'comprension_lectora', 'Comprensión lectora', 1),
  ('cfg-enf-02', 'approaches', 'colaborativo', 'Aprendizaje colaborativo', 2),
  ('cfg-enf-03', 'approaches', 'proyecto', 'Proyecto interdisciplinario', 3),
  ('cfg-enf-04', 'approaches', 'dua', 'DUA e inclusión', 4),
  ('cfg-enf-05', 'approaches', 'simce', 'Preparación SIMCE', 5),
  ('cfg-enf-06', 'approaches', 'formativa', 'Evaluación formativa', 6);

-- Dificultad
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-dif-01', 'difficulty_levels', 'progresiva', 'Progresiva', 1),
  ('cfg-dif-02', 'difficulty_levels', 'basica', 'Básica', 2),
  ('cfg-dif-03', 'difficulty_levels', 'intermedia', 'Intermedia', 3),
  ('cfg-dif-04', 'difficulty_levels', 'avanzada', 'Avanzada', 4);

-- Habilidades cognitivas
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-hab-01', 'cognitive_skills', 'localizar', 'Localizar información', 1),
  ('cfg-hab-02', 'cognitive_skills', 'inferir', 'Inferir', 2),
  ('cfg-hab-03', 'cognitive_skills', 'interpretar', 'Interpretar', 3),
  ('cfg-hab-04', 'cognitive_skills', 'argumentar', 'Argumentar', 4),
  ('cfg-hab-05', 'cognitive_skills', 'resolver', 'Resolver problemas', 5),
  ('cfg-hab-06', 'cognitive_skills', 'aplicar', 'Aplicar', 6),
  ('cfg-hab-07', 'cognitive_skills', 'analizar', 'Analizar', 7),
  ('cfg-hab-08', 'cognitive_skills', 'crear', 'Crear', 8),
  ('cfg-hab-09', 'cognitive_skills', 'comunicar', 'Comunicar', 9),
  ('cfg-hab-10', 'cognitive_skills', 'comparar', 'Comparar', 10),
  ('cfg-hab-11', 'cognitive_skills', 'evaluar', 'Evaluar', 11);

-- Tipos de actividad no lectiva
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-ntb-01', 'non_teaching_types', 'planificacion', 'Planificacion', 1),
  ('cfg-ntb-02', 'non_teaching_types', 'preparacion', 'Preparacion de material', 2),
  ('cfg-ntb-03', 'non_teaching_types', 'evaluacion', 'Revision de evaluaciones', 3),
  ('cfg-ntb-04', 'non_teaching_types', 'reunion', 'Reunion de departamento', 4),
  ('cfg-ntb-05', 'non_teaching_types', 'consejo', 'Consejo de profesores', 5),
  ('cfg-ntb-06', 'non_teaching_types', 'pie', 'Reunion PIE / Convivencia', 6),
  ('cfg-ntb-07', 'non_teaching_types', 'apoderados', 'Atencion de apoderados', 7),
  ('cfg-ntb-08', 'non_teaching_types', 'entrevista', 'Entrevista con estudiantes', 8),
  ('cfg-ntb-09', 'non_teaching_types', 'capacitacion', 'Capacitacion', 9),
  ('cfg-ntb-10', 'non_teaching_types', 'colaboracion', 'Trabajo colaborativo', 10),
  ('cfg-ntb-11', 'non_teaching_types', 'administrativo', 'Tareas administrativas', 11),
  ('cfg-ntb-12', 'non_teaching_types', 'reemplazo', 'Reemplazo / Coordinacion especial', 12),
  ('cfg-ntb-13', 'non_teaching_types', 'otro', 'Otro', 13);

-- Prioridades
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-pri-01', 'priorities', 'baja', 'Baja', 1),
  ('cfg-pri-02', 'priorities', 'media', 'Media', 2),
  ('cfg-pri-03', 'priorities', 'alta', 'Alta', 3);

-- Tipos de publicación (colaboración)
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-pub-01', 'publication_types', 'planificacion', 'Planificacion', 1),
  ('cfg-pub-02', 'publication_types', 'guia', 'Guia de aprendizaje', 2),
  ('cfg-pub-03', 'publication_types', 'evaluacion', 'Evaluacion', 3),
  ('cfg-pub-04', 'publication_types', 'recurso', 'Recurso didactico', 4),
  ('cfg-pub-05', 'publication_types', 'presentacion', 'Presentacion', 5),
  ('cfg-pub-06', 'publication_types', 'proyecto', 'Proyecto', 6),
  ('cfg-pub-07', 'publication_types', 'otro', 'Otro', 7);

-- Niveles de apoyo DUA
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-dua-01', 'support_levels', 'bajo', 'Bajo (apoyo mínimo)', 1),
  ('cfg-dua-02', 'support_levels', 'medio', 'Medio (apoyo moderado)', 2),
  ('cfg-dua-03', 'support_levels', 'alto', 'Alto (apoyo intensivo)', 3);

-- Focos de apoyo DUA
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-foc-01', 'support_focus', 'lectura', 'Lectura', 1),
  ('cfg-foc-02', 'support_focus', 'escritura', 'Escritura', 2),
  ('cfg-foc-03', 'support_focus', 'comprension', 'Comprensión', 3),
  ('cfg-foc-04', 'support_focus', 'calculo', 'Cálculo', 4),
  ('cfg-foc-05', 'support_focus', 'atencion', 'Atención', 5),
  ('cfg-foc-06', 'support_focus', 'lenguaje_oral', 'Lenguaje oral', 6),
  ('cfg-foc-07', 'support_focus', 'motricidad', 'Motricidad', 7),
  ('cfg-foc-08', 'support_focus', 'convivencia', 'Convivencia', 8);

-- Formatos de apoyo DUA
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-for-01', 'support_formats', 'visual', 'Visual (imágenes, esquemas)', 1),
  ('cfg-for-02', 'support_formats', 'oral', 'Oral (audio, habla)', 2),
  ('cfg-for-03', 'support_formats', 'manipulativo', 'Manipulativo (concreto, movimiento)', 3),
  ('cfg-for-04', 'support_formats', 'digital', 'Digital (TIC, apps)', 4),
  ('cfg-for-05', 'support_formats', 'colaborativo', 'Colaborativo (equipos, pares)', 5);

-- Tipos de clase
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-cls-01', 'class_types', 'inicio', 'Inicio', 1),
  ('cfg-cls-02', 'class_types', 'desarrollo', 'Desarrollo', 2),
  ('cfg-cls-03', 'class_types', 'cierre', 'Cierre', 3),
  ('cfg-cls-04', 'class_types', 'mixta', 'Mixta', 4);

-- Estilos de recurso
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-est-01', 'resource_styles', 'formal', 'Formal', 1),
  ('cfg-est-02', 'resource_styles', 'creativo', 'Creativo', 2),
  ('cfg-est-03', 'resource_styles', 'gamificado', 'Gamificado', 3),
  ('cfg-est-04', 'resource_styles', 'simce', 'SIMCE', 4),
  ('cfg-est-05', 'resource_styles', 'aula_invertida', 'Aula invertida', 5);

-- Formatos de salida
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-sal-01', 'output_formats', 'both', 'Docente y estudiante', 1),
  ('cfg-sal-02', 'output_formats', 'teacher', 'Solo docente', 2),
  ('cfg-sal-03', 'output_formats', 'student', 'Solo estudiante', 3);

-- Tonos de planificación
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-ton-01', 'plan_tones', 'formal', 'Formal', 1),
  ('cfg-ton-02', 'plan_tones', 'semi_formal', 'Semi-formal', 2),
  ('cfg-ton-03', 'plan_tones', 'coloquial', 'Coloquial', 3),
  ('cfg-ton-04', 'plan_tones', 'directo', 'Directo', 4);

-- Días de la semana
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-day-01', 'weekdays', '1', 'Lunes', 1),
  ('cfg-day-02', 'weekdays', '2', 'Martes', 2),
  ('cfg-day-03', 'weekdays', '3', 'Miércoles', 3),
  ('cfg-day-04', 'weekdays', '4', 'Jueves', 4),
  ('cfg-day-05', 'weekdays', '5', 'Viernes', 5),
  ('cfg-day-06', 'weekdays', '6', 'Sábado', 6),
  ('cfg-day-07', 'weekdays', '7', 'Domingo', 7);

-- Tipos de bloque (calendario institucional)
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-blk-01', 'block_types', 'lectivo', 'Lectivo', 1),
  ('cfg-blk-02', 'block_types', 'no_lectivo', 'No lectivo', 2),
  ('cfg-blk-03', 'block_types', 'reemplazo', 'Reemplazo', 3),
  ('cfg-blk-04', 'block_types', 'reunion', 'Reunión', 4),
  ('cfg-blk-05', 'block_types', 'planificacion', 'Planificación', 5);

-- Proveedores IA
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-ai-01', 'ai_providers', 'local', 'Modo local', 1),
  ('cfg-ai-02', 'ai_providers', 'gemini', 'Gemini', 2),
  ('cfg-ai-03', 'ai_providers', 'openrouter', 'OpenRouter', 3),
  ('cfg-ai-04', 'ai_providers', 'huggingface', 'Hugging Face', 4);
