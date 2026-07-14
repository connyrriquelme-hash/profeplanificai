# Diccionario de Datos — Libro de Clases Digital

**Fecha:** 2026-07-13
**Migración:** `013_libro_clases_core.sql`
**Total:** 14 tablas nuevas + extensiones `app_config`

---

## 1. academic_years

**Propósito:** Años escolares por institución (ej: "2026", "2027")

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_academic_years_institution |
| name | TEXT | NO | Input | Nombre del año (ej: "2026") | |
| start_date | TEXT | NO | Input | ISO 8601 (YYYY-MM-DD) | idx_academic_years_dates |
| end_date | TEXT | NO | Input | ISO 8601 (YYYY-MM-DD) | idx_academic_years_dates |
| status | TEXT | NO | Default | 'planning'\|'active'\|'closed'\|'archived' | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Información sensible:** No

---

## 2. academic_terms

**Propósito:** Períodos académicos dentro de un año (semestres, trimestres, cuatrimestres)

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| academic_year_id | TEXT | NO | FK | academic_years(id) ON DELETE CASCADE | idx_academic_terms_year |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_academic_terms_institution |
| name | TEXT | NO | Input | Ej: "Semestre 1", "Trimestre 2" | |
| start_date | TEXT | NO | Input | ISO 8601 | |
| end_date | TEXT | NO | Input | ISO 8601 | |
| sort_order | INTEGER | NO | Default 0 | Orden visual | |
| status | TEXT | NO | Default 'active' | 'planning'\|'active'\|'closed'\|'archived' | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Información sensible:** No

---

## 3. course_subject_assignments

**Propósito:** Asignación concreta: qué profesor imparte qué asignatura en qué curso y año

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_csa_institution_year |
| academic_year_id | TEXT | NO | FK | academic_years(id) ON DELETE CASCADE | idx_csa_institution_year |
| course_id | TEXT | NO | FK | teacher_classes(id) ON DELETE CASCADE | idx_csa_course_subject (UNIQUE) |
| subject_id | TEXT | NO | FK | subjects(id) ON DELETE CASCADE | idx_csa_course_subject (UNIQUE) |
| teacher_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_csa_teacher |
| coordinator_id | TEXT | SÍ | FK | usuarios(id) ON DELETE SET NULL | idx_csa_coordinator |
| weekly_hours | INTEGER | SÍ | Input | Horas semanales | |
| is_active | INTEGER | NO | Default 1 | 0\|1 | idx_csa_teacher |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(academic_year_id, course_id, subject_id, teacher_id)`

**Información sensible:** No

---

## 4. coordinator_scopes

**Propósito:** Alcance de supervisión del coordinador (qué cursos/asignaturas/niveles ve)

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_coordinator_scopes_user |
| user_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_coordinator_scopes_user |
| academic_year_id | TEXT | SÍ | FK | academic_years(id) ON DELETE SET NULL | |
| course_ids_json | TEXT | NO | Default '[]' | JSON array de course_ids | |
| subject_ids_json | TEXT | NO | Default '[]' | JSON array de subject_ids | |
| level_ids_json | TEXT | NO | Default '[]' | JSON array de level_ids | |
| is_active | INTEGER | NO | Default 1 | 0\|1 | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(institution_id, user_id, academic_year_id)`

**Información sensible:** No

---

## 5. student_profiles

**Propósito:** Perfiles extendidos de estudiantes. NO duplica `usuarios`; referencia opcional.

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_student_profiles_institution |
| user_id | TEXT | SÍ | FK | usuarios(id) ON DELETE SET NULL | idx_student_profiles_user |
| internal_identifier | TEXT | NO | Input | Código interno (RUN, matrícula) | idx_student_profiles_institution (UNIQUE) |
| first_name | TEXT | NO | Input | Nombre(s) | |
| last_name | TEXT | NO | Input | Apellido(s) | |
| preferred_name | TEXT | SÍ | Input | Nombre preferido | |
| birth_date | TEXT | SÍ | Input | ISO 8601 | |
| enrollment_status | TEXT | NO | Default 'active' | 'active'\|'inactive'\|'transferred'\|'graduated'\|'withdrawn' | |
| archived_at | TEXT | SÍ | Auto | Soft delete timestamp | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(institution_id, internal_identifier)`

**Información sensible:** **SÍ** — Nombres, fecha de nacimiento, RUN. Tratar como datos personales (Ley 19.628 Chile).

---

## 6. course_enrollments

**Propósito:** Matrícula de estudiantes en cursos por año académico

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_enrollments_academic_year |
| academic_year_id | TEXT | NO | FK | academic_years(id) ON DELETE CASCADE | idx_enrollments_academic_year |
| course_id | TEXT | NO | FK | teacher_classes(id) ON DELETE CASCADE | idx_enrollments_course |
| student_id | TEXT | NO | FK | student_profiles(id) ON DELETE CASCADE | idx_enrollments_student |
| list_number | INTEGER | SÍ | Input | Número de lista | |
| start_date | TEXT | NO | Input | ISO 8601 | |
| end_date | TEXT | SÍ | Input | ISO 8601 (fecha salida) | |
| status | TEXT | NO | Default 'active' | 'active'\|'transferred'\|'dropped'\|'completed' | idx_enrollments_course |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(institution_id, academic_year_id, course_id, student_id)`

**Información sensible:** **SÍ** — Vincula estudiante a curso. Tratar como dato escolar protegido.

---

## 7. class_sessions

**Propósito:** Sesión diaria de clase — registro de lo ocurrido en una fecha/hora concreta

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_class_sessions_status |
| academic_year_id | TEXT | NO | FK | academic_years(id) ON DELETE CASCADE | idx_class_sessions_course_date |
| academic_term_id | TEXT | SÍ | FK | academic_terms(id) ON DELETE SET NULL | |
| course_id | TEXT | NO | FK | teacher_classes(id) ON DELETE CASCADE | idx_class_sessions_course_date |
| subject_id | TEXT | NO | FK | subjects(id) ON DELETE CASCADE | idx_class_sessions_subject_date |
| teacher_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_class_sessions_teacher_date |
| lesson_instance_id | TEXT | SÍ | FK | lesson_instances(id) ON DELETE SET NULL | idx_class_sessions_lesson_instance |
| lesson_plan_id | TEXT | SÍ | FK | lesson_plans(id) ON DELETE SET NULL | idx_class_sessions_lesson_plan |
| planning_id | TEXT | SÍ | Ref | Referencia a planning/lesson_plan ID | |
| date | TEXT | NO | Input | ISO 8601 (YYYY-MM-DD) | idx_class_sessions_course_date |
| start_time | TEXT | SÍ | Input | HH:MM | |
| end_time | TEXT | SÍ | Input | HH:MM | |
| planned_content | TEXT | SÍ | Input | Contenido planificado | |
| taught_content | TEXT | SÍ | Input | Contenido realmente impartido | |
| objective_ids_json | TEXT | NO | Default '[]' | JSON array de objective_ids | |
| indicators_json | TEXT | NO | Default '[]' | JSON object {indicator_id: {weight, criteria}} | |
| skills_json | TEXT | NO | Default '[]' | JSON array de skill_ids | |
| attitudes_json | TEXT | NO | Default '[]' | JSON array de attitude_ids | |
| dua_supports_json | TEXT | NO | Default '[]' | JSON array de supports | |
| formative_assessment_json | TEXT | NO | Default '[]' | JSON array de evaluaciones | |
| resources_json | TEXT | NO | Default '[]' | JSON array de recursos | |
| teacher_notes | TEXT | SÍ | Input | Notas del docente | |
| status | TEXT | NO | Default 'scheduled' | 'scheduled'\|'open'\|'completed'\|'pending_signature'\|'signed'\|'corrected'\|'cancelled' | idx_class_sessions_status |
| version | INTEGER | NO | Default 1 | Incremental | |
| signed_version | INTEGER | SÍ | Auto | Última versión firmada | |
| created_by | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |
| archived_at | TEXT | SÍ | Auto | Soft delete | |

**Información sensible:** **SÍ** — Contenido pedagógico, notas docentes. Datos internos.

---

## 8. class_session_versions

**Propósito:** Snapshot inmutable de una sesión (versionado para auditoría y firma)

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| class_session_id | TEXT | NO | FK | class_sessions(id) ON DELETE CASCADE | idx_class_session_versions_session (UNIQUE) |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | |
| version | INTEGER | NO | Auto | Versión incremental | idx_class_session_versions_session (UNIQUE) |
| snapshot_json | TEXT | NO | Auto | JSON completo de la sesión | |
| content_hash | TEXT | SÍ | Auto | SHA-256 del snapshot | |
| change_reason | TEXT | SÍ | Input | Motivo del cambio | |
| created_by | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | |
| created_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(class_session_id, version)`

**Información sensible:** **SÍ** — Contenido completo de la sesión.

---

## 9. attendance_records

**Propósito:** Registro de asistencia por sesión y estudiante

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | |
| class_session_id | TEXT | NO | FK | class_sessions(id) ON DELETE CASCADE | idx_attendance_session |
| student_id | TEXT | NO | FK | student_profiles(id) ON DELETE CASCADE | idx_attendance_student |
| status | TEXT | NO | Default 'present' | 'present'\|'absent'\|'late'\|'justified'\|'early_leave'\|'external_activity' | idx_attendance_session |
| arrival_time | TEXT | SÍ | Input | HH:MM | |
| departure_time | TEXT | SÍ | Input | HH:MM | |
| justification | TEXT | SÍ | Input | Texto libre | |
| recorded_by | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_attendance_recorded_by |
| confirmed_at | TEXT | SÍ | Auto | Timestamp confirmación | |
| updated_at | TEXT | NO | Auto | datetime('now') | |
| created_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(class_session_id, student_id)`

**Información sensible:** **SÍ** — Registro de asistencia individual. Dato escolar protegido.

---

## 10. student_observations

**Propósito:** Observaciones pedagógicas sobre estudiantes

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | |
| academic_year_id | TEXT | NO | FK | academic_years(id) ON DELETE CASCADE | |
| course_id | TEXT | NO | FK | teacher_classes(id) ON DELETE CASCADE | idx_student_obs_course |
| student_id | TEXT | NO | FK | student_profiles(id) ON DELETE CASCADE | idx_student_obs_student |
| class_session_id | TEXT | SÍ | FK | class_sessions(id) ON DELETE SET NULL | |
| category | TEXT | NO | Input | 'positive'\|'academic'\|'coexistence'\|'attendance'\|'support'\|'family_contact'\|'follow_up'\|'alert' | idx_student_obs_course |
| content | TEXT | NO | Input | Texto libre | |
| visibility | TEXT | NO | Default 'teacher' | 'teacher'\|'coordinator'\|'admin'\|'family' | |
| follow_up_date | TEXT | SÍ | Input | ISO 8601 | idx_student_obs_followup |
| created_by | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |
| archived_at | TEXT | SÍ | Auto | Soft delete | |

**Información sensible:** **SÍ** — Observaciones pedagógicas, alertas. Dato sensible (Ley 19.628, protección de menores). Acceso controlado por `visibility`.

---

## 11. teacher_signature_credentials

**Propósito:** Credenciales PIN para firma digital (solo hash/salt, NUNCA PIN en texto plano)

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_signature_creds_user |
| user_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_signature_creds_user (UNIQUE) |
| pin_hash | TEXT | NO | Derivado | PBKDF2(SHA-256, pin + salt, 100000 iteraciones) | |
| pin_salt | TEXT | NO | Auto | 32 bytes aleatorios (hex) | |
| failed_attempts | INTEGER | NO | Default 0 | Contador intentos fallidos | |
| locked_until | TEXT | SÍ | Auto | ISO 8601 (bloqueo temporal) | |
| must_change_pin | INTEGER | NO | Default 0 | 0\|1 | |
| updated_at | TEXT | NO | Auto | datetime('now') | |
| created_at | TEXT | NO | Auto | datetime('now') | |

**Restricción UNIQUE:** `(institution_id, user_id)` implícita por `user_id UNIQUE`

**Información sensible:** **CRÍTICA** — Hash y salt de PIN. Nunca exponer. Rotar salt si compromiso.

---

## 12. signature_events

**Propósito:** Registro inmutable de eventos de firma digital

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | |
| class_session_id | TEXT | NO | FK | class_sessions(id) ON DELETE CASCADE | idx_signature_events_session |
| user_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_signature_events_user |
| signed_version | INTEGER | NO | Auto | Versión firmada | |
| content_hash | TEXT | NO | Auto | SHA-256(snapshot_json) | |
| signature_method | TEXT | NO | Default 'pin' | 'pin'\|'biometric'\|'external' | |
| terminal_id | TEXT | SÍ | Input | ID terminal/kiosco | |
| signed_at | TEXT | NO | Auto | datetime('now') | idx_signature_events_session |
| result | TEXT | NO | Default 'success' | 'success'\|'failed'\|'expired'\|'revoked' | |
| created_at | TEXT | NO | Auto | datetime('now') | |

**Información sensible:** **SÍ** — Hash de contenido firmado, método, terminal.

---

## 13. planning_reviews

**Propósito:** Revisiones de planificación por coordinador

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_planning_reviews_institution |
| planning_id | TEXT | NO | Ref | Referencia a lesson_plans o class_sessions | idx_planning_reviews_planning |
| reviewer_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_planning_reviews_reviewer |
| status | TEXT | NO | Default 'pending' | 'pending'\|'approved'\|'observed'\|'returned'\|'archived' | idx_planning_reviews_planning, idx_planning_reviews_reviewer |
| comments | TEXT | SÍ | Input | Texto libre | |
| reviewed_at | TEXT | SÍ | Auto | datetime('now') al cambiar estado | |
| created_at | TEXT | NO | Auto | datetime('now') | |
| updated_at | TEXT | NO | Auto | datetime('now') | |

**Información sensible:** **SÍ** — Comentarios pedagógicos internos.

---

## 14. classbook_audit_log

**Propósito:** Auditoría específica del Libro de Clases (extiende admin_audit_log)

| Columna | Tipo | Nullable | Fuente | Regla | Índice |
|---------|------|----------|--------|-------|--------|
| id | TEXT | NO | UUID v4 | PK | PK |
| institution_id | TEXT | NO | FK | institutions(id) ON DELETE CASCADE | idx_classbook_audit_institution |
| actor_user_id | TEXT | NO | FK | usuarios(id) ON DELETE CASCADE | idx_classbook_audit_actor |
| action | TEXT | NO | Input | CREATE/UPDATE/DELETE/SIGN/REVIEW/ATTEND/OBSERVE | |
| resource_type | TEXT | NO | Input | class_session, attendance, observation, signature, review | idx_classbook_audit_resource |
| resource_id | TEXT | SÍ | Ref | ID del recurso afectado | idx_classbook_audit_resource |
| metadata_json | TEXT | SÍ | Auto | {before, after, diff, context} | |
| created_at | TEXT | NO | Auto | datetime('now') | idx_classbook_audit_institution |

**Información sensible:** **SÍ** — Trazabilidad completa de cambios.

---

## 15. Extensiones de app_config

| Categoría | Claves agregadas | Propósito |
|-----------|------------------|-----------|
| `class_session_status` | scheduled, open, completed, pending_signature, signed, corrected, cancelled | Estados de sesión |
| `observation_categories` | positive, academic, coexistence, attendance, support, family_contact, follow_up, alert | Categorías observaciones |
| `observation_visibility` | teacher, coordinator, admin, family | Visibilidad observaciones |
| `enrollment_status` | active, transferred, dropped, completed | Estados matrícula |
| `signature_method` | pin, biometric, external | Métodos firma |

**Información sensible:** No (configuración pública)

---

*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*