-- ============================================================
-- MIGRACIÓN 013: Modelo de Datos Aditivo — Libro de Clases Digital
-- Fecha: 2026-07-13
-- Propósito: Añadir tablas complementarias para el Libro de Clases Digital
-- Sin DROP, sin ALTER destructivo, sin DELETE/UPDATE masivo
-- Reutiliza entidades existentes: usuarios, institutions, institution_members,
-- teacher_classes, lesson_instances, lesson_plans, admin_audit_log, app_config
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. academic_years — Años escolares por institución
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning','active','closed','archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE (institution_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_institution ON academic_years(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_academic_years_dates ON academic_years(start_date, end_date);

-- ============================================================
-- 2. academic_terms — Períodos académicos (semestres, trimestres)
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_terms (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning','active','closed','archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_academic_terms_year ON academic_terms(academic_year_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_academic_terms_institution ON academic_terms(institution_id, status);

-- ============================================================
-- 3. course_subject_assignments — Asignación curso ↔ asignatura ↔ profesor ↔ año
-- ============================================================
CREATE TABLE IF NOT EXISTS course_subject_assignments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  coordinator_id TEXT,
  weekly_hours INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (coordinator_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE (academic_year_id, course_id, subject_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_course_subject_assign_teacher ON course_subject_assignments(teacher_id, academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_course_subject_assign_coordinator ON course_subject_assignments(coordinator_id, academic_year_id, is_active);
CREATE INDEX IF NOT EXISTS idx_course_subject_assign_course ON course_subject_assignments(course_id, subject_id, is_active);

-- ============================================================
-- 4. coordinator_scopes — Alcance del coordinador (cursos, asignaturas, niveles)
-- ============================================================
CREATE TABLE IF NOT EXISTS coordinator_scopes (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  academic_year_id TEXT,
  course_ids_json TEXT NOT NULL DEFAULT '[]',
  subject_ids_json TEXT NOT NULL DEFAULT '[]',
  level_ids_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  UNIQUE (institution_id, user_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_coordinator_scopes_user ON coordinator_scopes(user_id, institution_id, is_active);

-- ============================================================
-- 5. student_profiles — Perfiles extendidos de estudiantes
-- No duplica usuarios; referencia opcional a usuarios(id)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT, -- nullable: estudiante puede no tener cuenta
  internal_identifier TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  birth_date TEXT,
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('active','inactive','transferred','graduated','withdrawn')),
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE (institution_id, internal_identifier)
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_institution ON student_profiles(institution_id, enrollment_status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);

-- ============================================================
-- 6. course_enrollments — Matrícula de estudiantes en cursos
-- ============================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  list_number INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','transferred','dropped','completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  UNIQUE (institution_id, academic_year_id, course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id, academic_year_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON course_enrollments(academic_year_id, institution_id);

-- ============================================================
-- 7. class_sessions — Sesiones diarias de clase (extiende lesson_instances)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_sessions (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  academic_term_id TEXT,
  course_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  lesson_instance_id TEXT, -- vínculo opcional a lesson_instances existente
  lesson_plan_id TEXT, -- vínculo opcional a lesson_plans existente
  planning_id TEXT, -- referencia a planning/lesson_plan ID
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  planned_content TEXT,
  taught_content TEXT,
  objective_ids_json TEXT NOT NULL DEFAULT '[]',
  indicators_json TEXT NOT NULL DEFAULT '[]',
  skills_json TEXT NOT NULL DEFAULT '[]',
  attitudes_json TEXT NOT NULL DEFAULT '[]',
  dua_supports_json TEXT NOT NULL DEFAULT '[]',
  formative_assessment_json TEXT NOT NULL DEFAULT '[]',
  resources_json TEXT NOT NULL DEFAULT '[]',
  teacher_notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','completed','pending_signature','signed','corrected','cancelled')),
  version INTEGER NOT NULL DEFAULT 1,
  signed_version INTEGER,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_term_id) REFERENCES academic_terms(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_instance_id) REFERENCES lesson_instances(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_course_date ON class_sessions(course_id, date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_date ON class_sessions(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_subject_date ON class_sessions(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status, institution_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_lesson_instance ON class_sessions(lesson_instance_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_lesson_plan ON class_sessions(lesson_plan_id);

-- ============================================================
-- 8. class_session_versions — Snapshot inmutable de sesiones
-- ============================================================
CREATE TABLE IF NOT EXISTS class_session_versions (
  id TEXT PRIMARY KEY,
  class_session_id TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  content_hash TEXT,
  change_reason TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (class_session_id, version)
);

CREATE INDEX IF NOT EXISTS idx_class_session_versions_session ON class_session_versions(class_session_id, version DESC);

-- ============================================================
-- 9. attendance_records — Asistencia por sesión y estudiante
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  class_session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','justified','early_leave','external_activity')),
  arrival_time TEXT,
  departure_time TEXT,
  justification TEXT,
  recorded_by TEXT NOT NULL,
  confirmed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (class_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(class_session_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id, institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by ON attendance_records(recorded_by, created_at DESC);

-- ============================================================
-- 10. student_observations — Observaciones pedagógicas
-- ============================================================
CREATE TABLE IF NOT EXISTS student_observations (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  class_session_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('positive','academic','coexistence','attendance','support','family_contact','follow_up','alert')),
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'teacher' CHECK (visibility IN ('teacher','coordinator','admin','family')),
  follow_up_date TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_obs_student ON student_observations(student_id, academic_year_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_obs_course ON student_observations(course_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_obs_followup ON student_observations(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- ============================================================
-- 11. planning_reviews — Revisiones de planificación
-- ============================================================
CREATE TABLE IF NOT EXISTS planning_reviews (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  planning_id TEXT NOT NULL, -- referencia a lesson_plans o class_sessions
  reviewer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','observed','returned','archived')),
  comments TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_planning_reviews_planning ON planning_reviews(planning_id, status);
CREATE INDEX IF NOT EXISTS idx_planning_reviews_reviewer ON planning_reviews(reviewer_id, status);
CREATE INDEX IF NOT EXISTS idx_planning_reviews_institution ON planning_reviews(institution_id, created_at DESC);

-- ============================================================
-- 12. signature_events — Eventos de firma digital
-- ============================================================
CREATE TABLE IF NOT EXISTS signature_events (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  class_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  signed_version INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  signature_method TEXT NOT NULL DEFAULT 'pin' CHECK (signature_method IN ('pin','biometric','external')),
  terminal_id TEXT,
  signed_at TEXT NOT NULL DEFAULT (datetime('now')),
  result TEXT NOT NULL DEFAULT 'success' CHECK (result IN ('success','failed','expired','revoked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signature_events_session ON signature_events(class_session_id, signed_at);
CREATE INDEX IF NOT EXISTS idx_signature_events_user ON signature_events(user_id, institution_id, signed_at DESC);

-- ============================================================
-- 13. teacher_signature_credentials — Credenciales PIN (solo hash/salt)
-- ============================================================
CREATE TABLE IF NOT EXISTS teacher_signature_credentials (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  must_change_pin INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signature_creds_user ON teacher_signature_credentials(user_id, institution_id);

-- ============================================================
-- 14. classbook_audit_log — Auditoría específica del Libro de Clases
-- Extiende admin_audit_log con contexto de Libro
-- ============================================================
CREATE TABLE IF NOT EXISTS classbook_audit_log (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_classbook_audit_institution ON classbook_audit_log(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classbook_audit_actor ON classbook_audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classbook_audit_resource ON classbook_audit_log(resource_type, resource_id);

-- ============================================================
-- 15. EXTENSIONES DE app_config — Nuevas categorías para Libro
-- ============================================================

-- Estados de sesión de clase
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-css-01', 'class_session_status', 'scheduled', 'Programada', 1),
  ('cfg-css-02', 'class_session_status', 'open', 'Abierta', 2),
  ('cfg-css-03', 'class_session_status', 'completed', 'Completada', 3),
  ('cfg-css-04', 'class_session_status', 'pending_signature', 'Pendiente de firma', 4),
  ('cfg-css-05', 'class_session_status', 'signed', 'Firmada', 5),
  ('cfg-css-06', 'class_session_status', 'corrected', 'Corregida', 6),
  ('cfg-css-07', 'class_session_status', 'cancelled', 'Cancelada', 7);

-- Categorías de observaciones
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-obs-01', 'observation_categories', 'positive', 'Positiva', 1),
  ('cfg-obs-02', 'observation_categories', 'academic', 'Académica', 2),
  ('cfg-obs-03', 'observation_categories', 'coexistence', 'Convivencia', 3),
  ('cfg-obs-04', 'observation_categories', 'attendance', 'Asistencia', 4),
  ('cfg-obs-05', 'observation_categories', 'support', 'Apoyo', 5),
  ('cfg-obs-06', 'observation_categories', 'family_contact', 'Contacto familiar', 5),
  ('cfg-obs-07', 'observation_categories', 'follow_up', 'Seguimiento', 6),
  ('cfg-obs-08', 'observation_categories', 'alert', 'Alerta', 7);

-- Visibilidad de observaciones
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-vis-01', 'observation_visibility', 'teacher', 'Docente', 1),
  ('cfg-vis-02', 'observation_visibility', 'coordinator', 'Coordinador', 2),
  ('cfg-vis-03', 'observation_visibility', 'admin', 'Administrador', 3),
  ('cfg-vis-04', 'observation_visibility', 'family', 'Familia', 4);

-- Estados de matrícula
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-enr-01', 'enrollment_status', 'active', 'Activa', 1),
  ('cfg-enr-02', 'enrollment_status', 'transferred', 'Trasladada', 2),
  ('cfg-enr-03', 'enrollment_status', 'dropped', 'Retirada', 3),
  ('cfg-enr-04', 'enrollment_status', 'completed', 'Completada', 4);

-- Estados de firma
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order) VALUES
  ('cfg-sig-01', 'signature_method', 'pin', 'PIN', 1),
  ('cfg-sig-02', 'signature_method', 'biometric', 'Biométrica', 2),
  ('cfg-sig-03', 'signature_method', 'external', 'Externa', 3);

-- ============================================================
-- FIN DE MIGRACIÓN 013
-- ============================================================