# Modelo de Datos — Libro de Clases Digital

**Fecha:** 2026-07-13
**Rama:** `feature/libro-clases-digital`
**Migración:** `013_libro_clases_core.sql`

---

## 1. Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    %% Entidades existentes (reutilizadas)
    USUARIOS ||--o{ INSTITUTION_MEMBERS : "pertenece"
    INSTITUTIONS ||--o{ INSTITUTION_MEMBERS : "tiene"
    INSTITUTIONS ||--o{ ACADEMIC_YEARS : "define"
    INSTITUTIONS ||--o{ COORDINATOR_SCOPES : "define"
    INSTITUTIONS ||--o{ COURSE_SUBJECT_ASSIGNMENTS : "organiza"
    INSTITUTIONS ||--o{ STUDENT_PROFILES : "matricula"
    INSTITUTIONS ||--o{ CLASS_SESSIONS : "agenda"
    INSTITUTIONS ||--o{ CLASSBOOK_AUDIT_LOG : "audita"

    USUARIOS ||--o{ TEACHER_CLASSES : "imparte"
    USUARIOS ||--o{ CLASS_SESSIONS : "docente"
    USUARIOS ||--o{ SIGNATURE_EVENTS : "firma"
    USUARIOS ||--o{ TEACHER_SIGNATURE_CREDENTIALS : "credencial"
    USUARIOS ||--o{ PLANNING_REVIEWS : "revisa"

    TEACHER_CLASSES ||--o{ CLASS_SESSIONS : "tiene"
    TEACHER_CLASSES ||--o{ COURSE_ENROLLMENTS : "matricula"
    TEACHER_CLASSES ||--o{ COURSE_SUBJECT_ASSIGNMENTS : "asigna"

    ACADEMIC_YEARS ||--o{ ACADEMIC_TERMS : "divide"
    ACADEMIC_YEARS ||--o{ CLASS_SESSIONS : "contiene"
    ACADEMIC_YEARS ||--o{ COURSE_ENROLLMENTS : "agrupa"
    ACADEMIC_YEARS ||--o{ STUDENT_OBSERVATIONS : "contextualiza"

    ACADEMIC_TERMS ||--o{ CLASS_SESSIONS : "agrupa"

    CLASS_SESSIONS ||--o{ CLASS_SESSION_VERSIONS : "versiona"
    CLASS_SESSIONS ||--o{ ATTENDANCE_RECORDS : "registra"
    CLASS_SESSIONS ||--o{ STUDENT_OBSERVATIONS : "observa"
    CLASS_SESSIONS ||--o{ SIGNATURE_EVENTS : "firma"
    CLASS_SESSIONS ||--o{ PLANNING_REVIEWS : "revisa"

    COURSE_ENROLLMENTS ||--o{ ATTENDANCE_RECORDS : "asiste"

    STUDENT_PROFILES ||--o{ COURSE_ENROLLMENTS : "matricula"
    STUDENT_PROFILES ||--o{ ATTENDANCE_RECORDS : "asiste"
    STUDENT_PROFILES ||--o{ STUDENT_OBSERVATIONS : "observa"

    LESSON_INSTANCES ||--o| CLASS_SESSIONS : "extiende"
    LESSON_PLANS ||--o| CLASS_SESSIONS : "planifica"

    SUBJECTS ||--o{ CLASS_SESSIONS : "imparte"
    COURSES ||--o{ CLASS_SESSIONS : "nivel"

    INSTITUTION_MEMBERS ||--o{ COORDINATOR_SCOPES : "coordina"

    %% Nuevas tablas
    ACADEMIC_YEARS {
        TEXT id PK
        TEXT institution_id FK
        TEXT name
        TEXT start_date
        TEXT end_date
        TEXT status
        TEXT created_at
        TEXT updated_at
    }

    ACADEMIC_TERMS {
        TEXT id PK
        TEXT academic_year_id FK
        TEXT institution_id FK
        TEXT name
        TEXT start_date
        TEXT end_date
        INTEGER sort_order
        TEXT status
        TEXT created_at
        TEXT updated_at
    }

    COURSE_SUBJECT_ASSIGNMENTS {
        TEXT id PK
        TEXT institution_id FK
        TEXT academic_year_id FK
        TEXT course_id FK
        TEXT subject_id FK
        TEXT teacher_id FK
        TEXT coordinator_id FK
        TEXT weekly_hours
        INTEGER is_active
        TEXT created_at
        TEXT updated_at
    }

    COORDINATOR_SCOPES {
        TEXT id PK
        TEXT institution_id FK
        TEXT user_id FK
        TEXT academic_year_id FK
        TEXT course_ids_json
        TEXT subject_ids_json
        TEXT level_ids_json
        INTEGER is_active
        TEXT created_at
        TEXT updated_at
    }

    STUDENT_PROFILES {
        TEXT id PK
        TEXT institution_id FK
        TEXT user_id FK
        TEXT internal_identifier
        TEXT first_name
        TEXT last_name
        TEXT preferred_name
        TEXT birth_date
        TEXT enrollment_status
        TEXT archived_at
        TEXT created_at
        TEXT updated_at
    }

    COURSE_ENROLLMENTS {
        TEXT id PK
        TEXT institution_id FK
        TEXT academic_year_id FK
        TEXT course_id FK
        TEXT student_id FK
        TEXT list_number
        TEXT start_date
        TEXT end_date
        TEXT status
        TEXT created_at
        TEXT updated_at
    }

    CLASS_SESSIONS {
        TEXT id PK
        TEXT institution_id FK
        TEXT academic_year_id FK
        TEXT academic_term_id FK
        TEXT course_id FK
        TEXT subject_id FK
        TEXT teacher_id FK
        TEXT lesson_instance_id FK
        TEXT lesson_plan_id FK
        TEXT date
        TEXT start_time
        TEXT end_time
        TEXT planned_content
        TEXT taught_content
        TEXT objective_ids_json
        TEXT indicators_json
        TEXT skills_json
        TEXT attitudes_json
        TEXT dua_supports_json
        TEXT formative_assessment_json
        TEXT resources_json
        TEXT teacher_notes
        TEXT status
        INTEGER version
        INTEGER signed_version
        TEXT created_by FK
        TEXT created_at
        TEXT updated_at
        TEXT archived_at
    }

    CLASS_SESSION_VERSIONS {
        TEXT id PK
        TEXT class_session_id FK
        TEXT institution_id FK
        INTEGER version
        TEXT snapshot_json
        TEXT content_hash
        TEXT change_reason
        TEXT created_by FK
        TEXT created_at
    }

    ATTENDANCE_RECORDS {
        TEXT id PK
        TEXT institution_id FK
        TEXT class_session_id FK
        TEXT student_id FK
        TEXT status
        TEXT arrival_time
        TEXT departure_time
        TEXT justification
        TEXT recorded_by FK
        TEXT confirmed_at
        TEXT updated_at
        TEXT created_at
    }

    STUDENT_OBSERVATIONS {
        TEXT id PK
        TEXT institution_id FK
        TEXT academic_year_id FK
        TEXT course_id FK
        TEXT student_id FK
        TEXT class_session_id FK
        TEXT category
        TEXT content
        TEXT visibility
        TEXT follow_up_date
        TEXT created_by FK
        TEXT created_at
        TEXT updated_at
        TEXT archived_at
    }

    TEACHER_SIGNATURE_CREDENTIALS {
        TEXT id PK
        TEXT institution_id FK
        TEXT user_id FK UNIQUE
        TEXT pin_hash
        TEXT pin_salt
        INTEGER failed_attempts
        TEXT locked_until
        INTEGER must_change_pin
        TEXT updated_at
        TEXT created_at
    }

    SIGNATURE_EVENTS {
        TEXT id PK
        TEXT institution_id FK
        TEXT class_session_id FK
        TEXT user_id FK
        INTEGER signed_version
        TEXT content_hash
        TEXT signature_method
        TEXT terminal_id
        TEXT signed_at
        TEXT result
        TEXT created_at
    }

    PLANNING_REVIEWS {
        TEXT id PK
        TEXT institution_id FK
        TEXT planning_id
        TEXT reviewer_id FK
        TEXT status
        TEXT comments
        TEXT reviewed_at
        TEXT created_at
        TEXT updated_at
    }

    CLASSBOOK_AUDIT_LOG {
        TEXT id PK
        TEXT institution_id FK
        TEXT actor_user_id FK
        TEXT action
        TEXT resource_type
        TEXT resource_id
        TEXT metadata_json
        TEXT created_at
    }
```

---

## 2. Relaciones y Cardinalidades

| Relación | Cardinalidad | Integridad |
|----------|--------------|------------|
| institutions → academic_years | 1:N | CASCADE |
| academic_years → academic_terms | 1:N | CASCADE |
| institutions → course_subject_assignments | 1:N | CASCADE |
| institutions → coordinator_scopes | 1:N | CASCADE |
| institutions → student_profiles | 1:N | CASCADE |
| institutions → class_sessions | 1:N | CASCADE |
| institutions → classbook_audit_log | 1:N | CASCADE |
| academic_years → academic_terms | 1:N | CASCADE |
| academic_years → class_sessions | 1:N | CASCADE |
| academic_years → course_enrollments | 1:N | CASCADE |
| academic_years → student_observations | 1:N | CASCADE |
| academic_terms → class_sessions | 1:N | SET NULL |
| teacher_classes → class_sessions | 1:N | CASCADE |
| teacher_classes → course_enrollments | 1:N | CASCADE |
| teacher_classes → course_subject_assignments | 1:N | SET NULL |
| course_enrollments → attendance_records | 1:N | CASCADE |
| class_sessions → class_session_versions | 1:N | CASCADE |
| class_sessions → attendance_records | 1:N | CASCADE |
| class_sessions → student_observations | 1:N | SET NULL |
| class_sessions → signature_events | 1:N | CASCADE |
| class_sessions → planning_reviews | 1:N | SET NULL |
| student_profiles → course_enrollments | 1:N | CASCADE |
| student_profiles → attendance_records | 1:N | CASCADE |
| student_profiles → student_observations | 1:N | CASCADE |
| usuarios → teacher_signature_credentials | 1:1 | CASCADE |
| usuarios → signature_events | 1:N | CASCADE |
| usuarios → planning_reviews (reviewer) | 1:N | CASCADE |
| usuarios → classbook_audit_log (actor) | 1:N | CASCADE |

---

## 3. Índices Principales

| Tabla | Índices |
|-------|---------|
| `academic_years` | `idx_academic_years_institution (institution_id, start_date)` |
| `academic_terms` | `idx_academic_terms_year (academic_year_id, sort_order)` |
| `course_subject_assignments` | `idx_csa_institution_year (institution_id, academic_year_id)`, `idx_csa_teacher (teacher_id, academic_year_id)`, `idx_csa_course_subject (course_id, subject_id, academic_year_id) UNIQUE` |
| `coordinator_scopes` | `idx_coordinator_scopes_user (user_id, institution_id)` |
| `student_profiles` | `idx_student_profiles_institution (institution_id, internal_identifier) UNIQUE`, `idx_student_profiles_user (user_id)` |
| `course_enrollments` | `idx_enrollment_course (course_id, academic_year_id)`, `idx_enrollment_student (student_id, academic_year_id)`, `idx_enrollment_unique (institution_id, academic_year_id, course_id, student_id) UNIQUE` |
| `class_sessions` | `idx_class_sessions_course_date (course_id, date)`, `idx_class_sessions_teacher_date (teacher_id, date)`, `idx_class_sessions_status (status, institution_id)`, `idx_class_sessions_lesson_instance (lesson_instance_id)`, `idx_class_sessions_lesson_plan (lesson_plan_id)` |
| `class_session_versions` | `idx_class_session_versions_session (class_session_id, version DESC) UNIQUE` |
| `attendance_records` | `idx_attendance_session (class_session_id, status)`, `idx_attendance_student (student_id, institution_id)`, `idx_attendance_recorded_by (recorded_by, created_at DESC)`, `UNIQUE (class_session_id, student_id)` |
| `student_observations` | `idx_student_obs_student (student_id, academic_year_id, created_at DESC)`, `idx_student_obs_course (course_id, category, created_at DESC)`, `idx_student_obs_followup (follow_up_date) WHERE follow_up_date IS NOT NULL` |
| `teacher_signature_credentials` | `idx_signature_creds_user (user_id, institution_id) UNIQUE` |
| `signature_events` | `idx_signature_events_session (class_session_id, signed_at)`, `idx_signature_events_user (user_id, institution_id, signed_at DESC)` |
| `planning_reviews` | `idx_planning_reviews_planning (planning_id, status)`, `idx_planning_reviews_reviewer (reviewer_id, status)`, `idx_planning_reviews_institution (institution_id, created_at DESC)` |
| `classbook_audit_log` | `idx_classbook_audit_institution (institution_id, created_at DESC)`, `idx_classbook_audit_actor (actor_user_id, created_at DESC)`, `idx_classbook_audit_resource (resource_type, resource_id)` |

---

## 4. Campos JSON y sus Estructuras

| Tabla | Campo | Estructura |
|-------|-------|------------|
| `class_sessions` | `objective_ids_json` | `string[]` — IDs de objetivos de aprendizaje |
| `class_sessions` | `indicators_json` | `{indicator_id: {weight, criteria}}` |
| `class_sessions` | `skills_json` | `string[]` — IDs de habilidades curriculares |
| `class_sessions` | `attitudes_json` | `string[]` — IDs de actitudes curriculares |
| `class_sessions` | `dua_supports_json` | `{support_id: {level, format, focus}}` |
| `class_sessions` | `formative_assessment_json` | `{type, title, content_json, rubric_json}` |
| `class_sessions` | `resources_json` | `[{type, title, content_json, file_url}]` |
| `class_session_versions` | `snapshot_json` | Snapshot completo de la sesión (todos los campos) |
| `coordinator_scopes` | `course_ids_json` | `string[]` — IDs de cursos |
| `coordinator_scopes` | `subject_ids_json` | `string[]` — IDs de asignaturas |
| `coordinator_scopes` | `level_ids_json` | `string[]` — IDs de niveles |
| `attendance_records` | `justification` | Texto libre (opcional) |
| `student_observations` | `content` | Texto libre |
| `planning_reviews` | `comments` | Texto libre |
| `signature_events` | `metadata_json` | `{terminal,`{ip_hash, user_agent_hash, geo?}` |
| `classbook_audit_log` | `metadata_json` | `{before, after, diff}` |

---

## 5. Estados y Transiciones

### `class_sessions.status`
```
scheduled → open → completed → pending_signature → signed → corrected
                    ↓
               cancelled
```
- **scheduled**: Creada, pendiente de iniciar
- **open**: En curso (docente editando)
- **completed**: Docente terminó, pendiente de firma
- **pending_signature**: Esperando PIN
- **signed**: Firmada, inmutable (solo versiona)
- **corrected**: Coordinador observó, devuelta a docente
- **cancelled**: Cancelada antes de iniciar

### `attendance_records.status`
- `present` — Presente
- `absent` — Ausente
- `late` — Llegada tarde
- `justified` — Ausencia justificada
- `early_leave` — Salida anticipada
- `external_activity` — Actividad externa

### `student_observations.category`
- `positive` — Refuerzo positivo
- `academic` — Académico
- `coexistence` — Convivencia
- `attendance` — Asistencia
- `support` — Apoyo/Inclusión
- `family_contact` — Contacto familiar
- `follow_up` — Seguimiento
- `alert` — Alerta temprana

### `planning_reviews.status`
- `pending` → `approved` / `observed` / `returned` → `archived`

### `signature_events.result`
- `success` / `failed` / `expired` / `revoked`

### `course_enrollments.status` (app_config)
- `active` / `transferred` / `dropped` / `completed`

---

## 6. Reglas de Integridad y Aislamiento

1. **Aislamiento institucional**: Todas las tablas nuevas llevan `institution_id` FK → `institutions(id)` ON DELETE CASCADE
2. **No duplicar usuarios**: `student_profiles.user_id` es nullable (estudiante sin cuenta) y UNIQUE por institución
3. **Matrícula única**: UNIQUE `(institution_id, academic_year_id, course_id, student_id)` en `course_enrollments`
4. **Asistencia única**: UNIQUE `(class_session_id, student_id)` en `attendance_records`
5. **Versiones inmutables**: `class_session_versions` UNIQUE `(class_session_id, version)`, solo INSERT
6. **Firma con hash**: `signature_events.content_hash` = SHA-256 del snapshot JSON
7. **Soft delete**: `student_profiles.archived_at`, `student_observations.archived_at` — no DELETE físico
8. **PIN seguro**: `teacher_signature_credentials` guarda solo `pin_hash` (PBKDF2) + `pin_salt`, nunca texto plano

---

## 7. Trazabilidad y Versionado

- Cada `class_session` tiene `version` (incremental) y `signed_version` (última firmada)
- `class_session_versions` guarda snapshot completo en `snapshot_json` + `content_hash`
- Cambio de estado a `signed` crea versión automática
- Coordinador al `observed`/`returned` incrementa versión y crea snapshot
- Auditoría en `classbook_audit_log` para todas las operaciones CRUD

---
*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*