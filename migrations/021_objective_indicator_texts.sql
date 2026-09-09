-- Migration 021: Objective indicator texts + curricular resource links
--
-- Reconcilia un bug real encontrado en auditoría: functions/api/curriculum/
-- generate-indicators.ts y diagnostics.ts esperan una tabla
-- `objective_indicators` que guarda el TEXTO del indicador directamente
-- (id, indicator_text, order_index, source_url, source_type, source_name),
-- pero el nombre `objective_indicators` ya está tomado por una tabla de
-- forma completamente distinta (tabla puente normalizada objective_id +
-- indicator_id -> evaluation_indicators, sin texto propio), creada antes
-- en 006_pedagogical_core.sql / 007_curriculum_core.sql. Por
-- "CREATE TABLE IF NOT EXISTS", la primera definición aplicada gana y la
-- segunda es un no-op silencioso -- exactamente el mismo patrón que causó
-- los bugs de shared_documents/evaluation_resource_sources arreglados hoy.
-- La definición que el código realmente necesita solo existía en
-- migrations.disabled-local/005_curricular_enrichment.sql (nunca
-- aplicada) bajo el mismo nombre ya ocupado -- aplicarla tal cual
-- hubiera sido otro no-op silencioso. Se renombra a
-- objective_indicator_texts para no chocar; generate-indicators.ts y
-- diagnostics.ts se actualizan para apuntar al nombre nuevo.
--
-- curricular_resource_links no choca con ninguna tabla existente, se
-- aplica con su nombre original. Las demás tablas del archivo 005
-- (textbook_references, teacher_guide_references,
-- lesson_sequence_recommendations) no las referencia ningún código vivo
-- -- se dejan fuera a propósito (esquema muerto, ver auditoría).

CREATE TABLE IF NOT EXISTS objective_indicator_texts (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL,
  indicator_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'official',
  source_name TEXT NOT NULL DEFAULT 'Currículum Nacional — MINEDUC Chile',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS curricular_resource_links (
  id TEXT PRIMARY KEY,
  objective_code TEXT NOT NULL,
  level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recurso',
  description TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'official',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_objective_indicator_texts_obj ON objective_indicator_texts(objective_id);
CREATE INDEX IF NOT EXISTS idx_curricular_resource_links_code ON curricular_resource_links(objective_code);
