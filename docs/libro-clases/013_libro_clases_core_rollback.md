# Rollback — Migración 013_libro_clases_core.sql

**Fecha:** 2026-07-13
**Migración:** `013_libro_clases_core.sql`
**Rama:** `feature/libro-clases-digital`

---

## 1. Tablas Creadas por la Migración

| Tabla | Propósito |
|-------|-----------|
| `academic_years` | Años escolares |
| `academic_terms` | Semestres/Períodos |
| `course_subject_assignments` | Asignación curso ↔ asignatura ↔ profesor |
| `coordinator_scopes` | Alcance del coordinador por institución |
| `student_profiles` | Perfiles extendidos de estudiantes |
| `course_enrollments` | Matrícula de estudiantes en cursos |
| `class_sessions` | Sesiones diarias (extiende lesson_instances) |
| `class_session_versions` | Versionado de sesiones firmadas |
| `attendance_records` | Asistencia por sesión y estudiante |
| `student_observations` | Observaciones pedagógicas |
| `teacher_signature_credentials` | Credenciales PIN (hash/salt) |
| `signature_events` | Eventos de firma digital |
| `planning_reviews` | Revisiones de planificación |
| `classbook_audit_log` | Auditoría específica del Libro de Clases |

---

## 2. Dependencias y Orden de Eliminación

**ORDEN MANUAL DE ELIMINACIÓN (respetando FK):**

```sql
-- 1. Tablas hijas primero (sin dependientes)
DROP TABLE IF EXISTS classbook_audit_log;
DROP TABLE IF EXISTS planning_reviews;
DROP TABLE IF EXISTS signature_events;
DROP TABLE IF EXISTS teacher_signature_credentials;
DROP TABLE IF EXISTS student_observations;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS class_session_versions;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS coordinator_scopes;
DROP TABLE IF EXISTS course_subject_assignments;
DROP TABLE IF EXISTS academic_terms;
DROP TABLE IF EXISTS academic_years;
DROP TABLE IF EXISTS class_sessions;  -- tiene FK a lesson_instances, teacher_classes, etc.

-- 2. Eliminar seeds de app_config agregados por la migración
DELETE FROM app_config WHERE category IN (
  'class_session_status',
  'observation_categories',
  'observation_visibility',
  'enrollment_status',
  'signature_method'
);
```

---

## 3. Precauciones

1. **NO EJECUTAR** si existen datos productivos sin exportar antes
2. Verificar que NO hay vistas, triggers o índices personalizados sobre estas tablas
3. La tabla `class_sessions` tiene FK a `lesson_instances`, `teacher_classes`, `lesson_plans` — eliminar último
4. Las tablas `institutions`, `institution_members`, `usuarios`, `teacher_classes`, `lesson_instances`, `lesson_plans`, `subjects`, `courses` **NO SE TOCAN**

---

## 4. Respaldo Previo Obligatorio

Antes de aplicar rollback, ejecutar:

```bash
# Exportar schema completo
wrangler d1 execute planificaia-db --command="SELECT sql FROM sqlite_master WHERE type='table'" > schema-backup.sql

# Contar registros por tabla
wrangler d1 execute planificaia-db --command="
SELECT 'academic_years' as table, COUNT(*) as count FROM academic_years
UNION ALL SELECT 'academic_terms', COUNT(*) FROM academic_terms
UNION ALL SELECT 'course_subject_assignments', COUNT(*) FROM course_subject_assignments
UNION ALL SELECT 'coordinator_scopes', COUNT(*) FROM coordinator_scopes
UNION ALL SELECT 'student_profiles', COUNT(*) FROM student_profiles
UNION ALL SELECT 'course_enrollments', COUNT(*) FROM course_enrollments
UNION ALL SELECT 'class_sessions', COUNT(*) FROM class_sessions
UNION ALL SELECT 'class_session_versions', COUNT(*) FROM class_session_versions
UNION ALL SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL SELECT 'student_observations', COUNT(*) FROM student_observations
UNION ALL SELECT 'teacher_signature_credentials', COUNT(*) FROM teacher_signature_credentials
UNION ALL SELECT 'signature_events', COUNT(*) FROM signature_events
UNION ALL SELECT 'planning_reviews', COUNT(*) FROM planning_reviews
UNION ALL SELECT 'classbook_audit_log', COUNT(*) FROM classbook_audit_log;
"
```

Guardar resultados en `docs/libro-clases/rollback-backup-YYYY-MM-DD.md`

---

## 5. Confirmación de No Aplicación

**NO DEBE APLICARSE ESTE ROLLBACK SI:**
- Existen datos productivos en las tablas creadas
- No se ha exportado y validado el respaldo
- Hay sesiones de clase firmadas pendientes de auditoría

---

## 6. Verificación Post-Rollback

```sql
-- Confirmar que las tablas ya no existen
SELECT name FROM sqlite_master WHERE type='table' AND name IN (
  'academic_years','academic_terms','course_subject_assignments',
  'coordinator_scopes','student_profiles','course_enrollments',
  'class_sessions','class_session_versions','attendance_records',
  'student_observations','teacher_signature_credentials',
  'signature_events','planning_reviews','classbook_audit_log'
);

-- Debe retornar 0 filas
```

---
*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*