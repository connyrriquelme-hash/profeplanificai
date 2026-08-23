-- Migration 020: Evaluation resource sources & links
-- External sources for evaluation resources (SIMCE, CPEIP, Educarchile, etc.)
-- Safe metadata-only storage — no copyrighted content copied
--
-- Renombrada desde migrations.disabled-local/007_evaluation_resource_sources.sql
-- (nunca aplicada). functions/api/evaluation-resources/{sources,search,link}.ts
-- ya asumían estas tablas; sin ellas, el panel "Recursos sugeridos" (en
-- EvaluacionesView, y ahora también portado a Flujo Docente) siempre
-- mostraba "no hay recursos sugeridos" -- la búsqueda fallaba en silencio.
-- Incluye el seed de fuentes/enlaces oficiales (antes en
-- seed_evaluation_resource_sources.sql, también sin aplicar).

CREATE TABLE IF NOT EXISTS external_resource_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'public' CHECK(source_type IN ('official','public','private_account','user_saved','derived')),
  access_type TEXT NOT NULL DEFAULT 'open' CHECK(access_type IN ('open','login_required','paid','manual_upload','unknown')),
  license_note TEXT NOT NULL DEFAULT '',
  is_official INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluation_resource_links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  resource_type TEXT NOT NULL DEFAULT 'recurso',
  subject TEXT NOT NULL DEFAULT '',
  course TEXT NOT NULL DEFAULT '',
  objective_code TEXT NOT NULL DEFAULT '',
  skill TEXT NOT NULL DEFAULT '',
  evaluation_type TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  access_type TEXT NOT NULL DEFAULT 'unknown' CHECK(access_type IN ('open','login_required','paid','manual_upload','unknown')),
  license_note TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK(validation_status IN ('pending','validated','rejected')),
  user_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES external_resource_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_erl_source ON evaluation_resource_links(source_id);
CREATE INDEX IF NOT EXISTS idx_erl_subject ON evaluation_resource_links(subject);
CREATE INDEX IF NOT EXISTS idx_erl_course ON evaluation_resource_links(course);
CREATE INDEX IF NOT EXISTS idx_erl_objective_code ON evaluation_resource_links(objective_code);
CREATE INDEX IF NOT EXISTS idx_erl_skill ON evaluation_resource_links(skill);
CREATE INDEX IF NOT EXISTS idx_erl_evaluation_type ON evaluation_resource_links(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_erl_validation ON evaluation_resource_links(validation_status);
CREATE INDEX IF NOT EXISTS idx_erl_user ON evaluation_resource_links(user_id);

-- Seed: fuentes oficiales
INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-agencia-calidad', 'Agencia de Calidad de la Educacion — SIMCE', 'https://www.agenciaeducacion.cl', 'official', 'open', 'Material oficial del Sistema de Medicion de la Calidad de la Educacion (SIMCE). Contenido publico para uso pedagogico.', 1);

INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-curriculum-nacional', 'Curriculum Nacional — MINEDUC', 'https://www.curriculumnacional.cl', 'official', 'open', 'Bases curriculares oficiales, programas de estudio y estandares. Uso libre con atribucion.', 1);

INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-cpeip', 'CPEIP — Centro de Perfeccionamiento, Experimentacion e Investigaciones Pedagogicas', 'https://www.cpeip.cl', 'official', 'open', 'Recursos de formacion docente del MINEDUC. Material publico.', 1);

INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-estandares-docentes', 'Estandares Docentes — MINEDUC', 'https://estandaresdocentes.mineduc.cl', 'official', 'open', 'Estandares orientadores para egresados de pedagogia. Material publico.', 1);

-- Seed: fuentes publicas colaborativas
INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-red-maestros', 'Red Maestros de Maestros', 'https://www.maestrosdemuestros.cl', 'public', 'open', 'Red colaborativa de docentes. Contenido compartido bajo licencia abierta.', 0);

INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-educarchile', 'Educarchile', 'https://www.educarchile.cl', 'public', 'open', 'Portal educativo con recursos abiertos. Contenido gratuito para uso pedagogico no comercial.', 0);

-- Seed: fuentes gestionadas por el usuario (sin scraping automatico ni bypass de paywall)
INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-pinterest', 'Pinterest (enlaces guardados manualmente)', 'https://www.pinterest.cl', 'user_saved', 'login_required', 'Solo se guardan enlaces, titulo y tags. No se descargan imagenes ni recursos protegidos automaticamente.', 0);

INSERT OR IGNORE INTO external_resource_sources (id, name, base_url, source_type, access_type, license_note, is_official)
VALUES ('src-twinkl', 'Twinkl.cl (recursos de cuenta privada)', 'https://www.twinkl.cl', 'private_account', 'paid', 'Recursos bajo suscripcion. Solo se integra via carga manual del usuario o enlace autorizado. No se automatiza login ni descarga.', 0);

-- Seed: enlaces base de referencia (solo metadata, sin contenido copiado)
INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-simce-base', 'src-agencia-calidad', 'SIMCE — Informacion general', 'Portal oficial del Sistema de Medicion de la Calidad de la Educacion. Resultados, evaluaciones, marcos de referencia.', 'https://www.agenciaeducacion.cl/evaluaciones/que-es-el-simce/', 'referencia', '', '', '', '', '', '["simce","evaluacion","estandar"]', 'open', 'Uso oficial publico', 'validated', '', 'Enlace base institucional');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-simce-marcos', 'src-agencia-calidad', 'SIMCE — Marcos de referencia', 'Documentos tecnicos sobre las evaluaciones SIMCE por asignatura y nivel.', 'https://www.agenciaeducacion.cl/evaluaciones/marcos-de-referencia/', 'referencia', '', '', '', '', '', '["simce","marco-de-referencia","tecnico"]', 'open', 'Uso oficial publico', 'validated', '', 'Documentos tecnicos oficiales');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-curr-nac-bases', 'src-curriculum-nacional', 'Curriculum Nacional — Bases Curriculares', 'Bases curriculares vigentes desde 1° basico a 4° medio, por asignatura.', 'https://www.curriculumnacional.cl/portal/Curriculum/', 'referencia', '', '', '', '', '', '["curriculum","bases-curriculares","mineduc"]', 'open', 'Uso oficial publico', 'validated', '', 'Fuente principal de OAs y estandares');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-cpeip-recursos', 'src-cpeip', 'CPEIP — Recursos para la ensenanza', 'Cursos, talleres y materiales de formacion docente continua.', 'https://www.cpeip.cl/recursos/', 'referencia', '', '', '', '', '', '["docente","formacion","cpeip"]', 'open', 'Uso oficial publico', 'validated', '', 'Portal de formacion docente');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-estandares-docentes', 'src-estandares-docentes', 'Estandares Docentes — MINEDUC', 'Estandares orientadores para la formacion inicial docente y el desempeno profesional.', 'https://estandaresdocentes.mineduc.cl/', 'referencia', '', '', '', '', '', '["docente","estandares","formacion"]', 'open', 'Uso oficial publico', 'validated', '', 'Estandares de egreso y desempeno');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-educarchile-recursos', 'src-educarchile', 'Educarchile — Recursos educativos', 'Banco de recursos educativos abiertos por nivel, asignatura y OA.', 'https://www.educarchile.cl/recursos-educativos', 'referencia', '', '', '', '', '', '["recursos","educarchile","abierto"]', 'open', 'Uso educativo no comercial', 'validated', '', 'Portal de recursos abiertos');

INSERT OR IGNORE INTO evaluation_resource_links (id, source_id, title, description, url, resource_type, subject, course, objective_code, skill, evaluation_type, tags_json, access_type, license_note, validation_status, user_id, notes)
VALUES ('link-red-maestros', 'src-red-maestros', 'Red Maestros de Maestros — Comunidad', 'Red de docentes que comparten experiencias, planificaciones y recursos evaluativos.', 'https://www.maestrosdemuestros.cl/', 'referencia', '', '', '', '', '', '["docentes","comunidad","recursos"]', 'open', 'Contenido abierto colaborativo', 'validated', '', 'Red colaborativa docente');
