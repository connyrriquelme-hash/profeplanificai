# Propuesta — Libro de Clases Digital

**Fecha:** 2026-07-12
**Rama:** feature/libro-clases-digital
**Commit:** 4944a4b
**Estado:** Propuesta, sin modificaciones

---

## 1. Arquitectura Actual

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                         │
│  App.tsx → 16 views → services → API endpoints           │
│  AuthContext → CurriculumContext → ActiveLessonContext     │
└────────────────────────┬────────────────────────────────┘
                         │ fetch
┌────────────────────────▼────────────────────────────────┐
│               SERVER (Cloudflare Workers)                 │
│  functions/api/ → functions/_lib/ → functions/core/       │
│  60+ endpoints │ 7 agents │ orchestrator                  │
└────┬───────────────────────────────────┬────────────────┘
     │                                   │
┌────▼────┐                       ┌──────▼──────┐
│   DB    │                       │   CORE_DB   │
│ (D1)    │                       │   (D1)      │
│ 33 tabs │                       │ 27 tabs     │
└─────────┘                       └─────────────┘
```

### Capas existentes
1. **Auth** → usuarios, sessions, user_sessions, institution_members
2. **Currículo** → courses, subjects, objectives, skills, attitudes (CORE_DB)
3. **Mis Clases** → teacher_classes, schedules, lesson_instances, lesson_plans
4. **IA** → orchestrator → 5 proveedores con fallback
5. **Materiales** → generated_resources, generated_presentations
6. **Admin** → institutions, institution_members, admin_audit_log

---

## 2. Tablas Reutilizables

### DB (planificaia-db) — 19 tablas

| Tabla | Uso en Libro |
|-------|-------------|
| `usuarios` | Profesores, coordinadores |
| `institutions` | Aislamiento institucional |
| `institution_members` | Roles (teacher, coordinator, admin) |
| `institution_calendar_templates` | Calendario institucional |
| `teacher_classes` | Cursos del docente |
| `teacher_weekly_schedules` | Horarios |
| `teacher_schedule_slots` | Slots del horario |
| `lesson_instances` | → extiende a class_sessions |
| `lesson_plans` | Planificaciones |
| `lesson_plan_curriculum` | Vínculo plan ↔ currículo |
| `lesson_plan_methodologies` | Metodologías |
| `lesson_generated_resources` | Recursos IA |
| `lesson_generated_evaluations` | Evaluaciones IA |
| `lesson_attachments` | Archivos adjuntos |
| `lesson_comments` | Comentarios |
| `lesson_autosave_events` | Autoguardado |
| `non_teaching_blocks` | Bloques no lectivos |
| `admin_audit_log` | → extiende a classbook_audit_log |
| `app_config` | → agrega categorías nuevas |

### CORE_DB (profeplanificai_db) — 13 tablas (solo lectura)

| Tabla | Uso |
|-------|-----|
| `courses` | Cursos del currículo |
| `subjects` | Asignaturas |
| `axes` | Ejes temáticos |
| `units` | Unidades curriculares |
| `objectives` | OA |
| `skills` | Habilidades |
| `attitudes` | Actitudes |
| `learning_objectives` | OA (sistema completo) |
| `evaluation_indicators` | Indicadores |
| `curricular_skills` | Habilidades curriculares |
| `methodologies` | Metodologías |
| `search_documents` | Búsqueda IA |
| `agent_runs` | Registro IA |

---

## 3. Tablas Nuevas Necesarias

### Migración propuesta: `013_libro_clases_core.sql`

| Tabla | Propósito | Prioridad |
|-------|-----------|-----------|
| `academic_years` | Años escolares | ALTA |
| `academic_terms` | Semestres/Períodos | ALTA |
| `course_subject_assignments` | Asignación curso ↔ asignatura ↔ profesor | ALTA |
| `coordinator_scopes` | Alcance del coordinador por institución | ALTA |
| `student_profiles` | Perfiles extendidos de estudiantes | ALTA |
| `course_enrollments` | Matrícula de estudiantes en cursos | ALTA |
| `class_sessions` | Sesiones diarias (extiende lesson_instances) | ALTA |
| `class_session_versions` | Versionado de sesiones firmadas | ALTA |
| `attendance_records` | Asistencia por sesión | ALTA |
| `student_observations` | Observaciones de estudiantes | MEDIA |
| `teacher_signature_credentials` | Credenciales PIN (hash) | ALTA |
| `signature_events` | Eventos de firma | ALTA |
| `planning_reviews` | Revisiones de planificación por coordinador | MEDIA |
| `classbook_audit_log` | Auditoría específica del Libro | MEDIA |

### Relaciones

```
academic_years (1) ──→ (N) academic_terms
academic_years (1) ──→ (N) class_sessions
academic_terms (1) ──→ (N) class_sessions
institutions (1) ──→ (N) course_subject_assignments
institutions (1) ──→ (N) coordinator_scopes
institutions (1) ──→ (N) student_profiles
institutions (1) ──→ (N) class_sessions
teacher_classes (1) ──→ (N) class_sessions
teacher_classes (1) ──→ (N) course_enrollments
course_enrollments (1) ──→ (N) attendance_records
class_sessions (1) ──→ (N) class_session_versions
class_sessions (1) ──→ (N) attendance_records
class_sessions (1) ──→ (N) student_observations
class_sessions (1) ──→ (N) signature_events
class_sessions (1) ──→ (N) planning_reviews
usuarios (1) ──→ (N) teacher_signature_credentials
usuarios (1) ──→ (N) signature_events
```

---

## 4. Endpoints Reutilizables

### ✅ Reutilizar directamente

| Endpoint | Uso en Libro |
|----------|-------------|
| `GET/POST /api/my-classes` | Listar/crear cursos |
| `GET/POST /api/my-classes/calendar` | Calendario semanal |
| `GET/POST/DELETE /api/my-classes/schedule` | Gestión de horarios |
| `GET/POST/PATCH/DELETE /api/lessons` | CRUD de sesiones |
| `POST /api/lessons/:id/autosave` | Autoguardado |
| `POST /api/lessons/:id/generate-*` | Generación IA |
| `GET/POST /api/non-teaching-blocks` | Bloques no lectivos |
| `GET/POST /api/admin/institutions` | Gestión institucional |
| `GET/POST /api/admin/institutions/:id/members` | Miembros |
| `GET /api/admin/audit-log` | Auditoría |
| `GET /api/config/options` | Configuración |
| `POST /api/ai/generate` | Generación IA unificada |
| `POST /api/generate-project` | Proyecto + DUA |

### ⚠️ Crear nuevos (extensión)

| Nuevo Endpoint | Propósito |
|---------------|-----------|
| `GET/POST /api/classbook/academic-years` | Años escolares |
| `GET/POST /api/classbook/terms` | Períodos |
| `GET/POST /api/classbook/course-assignments` | Asignaciones curso-asignatura-profesor |
| `GET/POST /api/classbook/students` | Perfiles de estudiantes |
| `POST /api/classbook/students/import/validate` | Validar importación CSV |
| `POST /api/classbook/students/import/confirm` | Ejecutar importación |
| `GET/POST /api/classbook/enrollments` | Matrícula |
| `GET/POST/PATCH /api/classbook/sessions` | Sesiones del Libro |
| `POST /api/classbook/sessions/:id/sign` | Firmar sesión |
| `GET/POST /api/classbook/attendance` | Asistencia |
| `GET/POST /api/classbook/observations` | Observaciones |
| `GET/POST /api/classbook/pin` | Configurar/cambiar PIN |
| `POST /api/classbook/pin/validate` | Validar PIN |
| `GET /api/classbook/reviews` | Revisiones de coordinador |
| `GET /api/classbook/dashboard` | Dashboard coordinador |

---

## 5. Componentes Reutilizables

### ✅ Reutilizar directamente

| Componente | Uso en Libro |
|-----------|-------------|
| `ProductRenderer` | Renderizado de productos |
| `EditorialHeader/Footer` | Encabezado/pie institucional |
| `StudentInfoFields` | Campos de información del estudiante |
| `TeacherInfoFields` | Campos de información del profesor |
| `ResponseArea` | Áreas de respuesta |
| `PedagogicalBlock` | Bloques pedagógicos |
| `CurriculumCallout` | Referencias curriculares |
| `InstructionCallout` | Instrucciones |
| `ExampleBox` | Ejemplos |
| `ChallengeBox` | Desafíos |
| `ReflectionBox` | Reflexiones |
| `VocabularyBox` | Vocabulario |
| `MaterialsGrid` | Cuadrícula de materiales |
| `ProcedureTimeline` | Línea de tiempo procedural |
| `EditableTable` | Tablas editables |
| `SelfAssessment` | Autoevaluación |
| `TeacherFeedbackBox` | Retroalimentación docente |
| `PrintToolbar` | Barra de impresión |
| `useConfigOptions` | Opciones configurables |
| `AppShell` | Layout general |
| `Stepper` | Wizard de pasos |

### ⚠️ Crear nuevos

| Nuevo Componente | Propósito |
|-----------------|-----------|
| `ClassBookView` | Vista principal del Libro |
| `DayJournal` | Diario de clases del día |
| `AttendanceGrid` | Grilla de asistencia rápida |
| `SignaturePad` | Firma con PIN |
| `KioskMode` | Modo kiosco para firma |
| `CoordinadorDashboard` | Dashboard del coordinador |
| `PlanningReviewPanel` | Panel de revisión de planificación |
| `StudentProgressCard` | Tarjeta de progreso por estudiante |
| `ClassSessionDetail` | Detalle de sesión diaria |
| `YearTimeline` | Línea de tiempo del año escolar |
| `ImportWizard` | Asistente de importación CSV/XLSX |

---

## 6. Riesgos de Pérdida de Datos

| Riesgo | Nivel | Mitigación |
|--------|-------|-----------|
| Borrar tablas existentes | CRÍTICO | Solo migraciones aditivas, nunca DROP |
| Modificar columnas existentes | ALTO | Nunca ALTER COLUMN existente |
| Romper relaciones FK | ALTO | Respetar foreign keys, usar SET NULL |
| Datos curriculares | CRÍTICO | CORE_DB es solo lectura |
| Datos de usuario | ALTO | Soft delete, nunca DELETE masivo |
| Sesiones activas | MEDIO | No modificar tabla sessions |
| Autenticación | CRÍTICO | No modificar login/auth flow |
| Migraciones antiguas | CRÍTICO | Nunca modificar archivos existentes |
| Datos de prueba | BAJO | Backup antes de migración |

---

## 7. Plan de Respaldo

### Antes de cada migración

1. **Exportar schema** completo de DB y CORE_DB
2. **Contar registros** por tabla
3. **Guardar** en `docs/libro-clases/schema-backup-YYYY-MM-DD.md`
4. **Verificar** que migración nueva solo crea tablas nuevas
5. **Probar** en base local primero

### Durante desarrollo

1. **Cada fase** termina con tsc + tests + build
2. **Commit** después de cada fase exitosa
3. **Push** a feature branch
4. **Preview deploy** antes de merge a main

---

## 8. Plan de Rollback

### Por fase

| Fase | Rollback |
|------|----------|
| 6.1 Roles | Revert commit, eliminar authorization.ts |
| 6.2 Modelo datos | No aplicar migración, eliminar archivo SQL |
| 6.3 Cursos/Estudiantes | Revert commit, eliminar endpoints |
| 6.4 Planificación | Revert commit |
| 6.5 Sesiones | Revert commit |
| 6.6 Asistencia | Revert commit |
| 6.7 Firma PIN | Revert commit |
| 6.8 Coordinador | Revert commit |
| 6.9 Seguimiento | Revert commit |
| 6.10 Preview/QA | No deploy a producción |

### Si algo falla en preview

1. No merge a main
2. Investigar error
3. Corregir en feature branch
4. Re-deploy preview
5. Re-QA

---

## 9. Propuesta de Fases

### Fase 6.1 — Roles y Permisos
- `functions/core/authorization.ts`
- Middleware de permisos por endpoint
- Navegación por rol en frontend
- Tests de permisos

### Fase 6.2 — Modelo de Datos Aditivo
- Migración `013_libro_clases_core.sql`
- 14 tablas nuevas
- Rollback documentado
- Prueba local

### Fase 6.3 — Cursos, Estudiantes e Importación
- Endpoints CRUD cursos/estudiantes
- Importación CSV/XLSX con validación
- Perfiles de estudiantes
- IA para detección de duplicados

### Fase 6.4 — Planificación Anual y Unidades
- Conectar currículo + unidades + Mis Clases + PlanningAgent
- Planificación anual con OA reales
- Vinculación con clases diarias
- IA para propuestas de planificación

### Fase 6.5 — Sesiones Diarias
- Sesión diaria como registro de lo ocurrido
- "Mi Jornada" — vista del día
- Importar planificación de Mis Clases
- Copilot de clase (adaptar, resumir, sugerir)

### Fase 6.6 — Asistencia
- Estados: present, absent, late, early_leave, justified, external_activity
- Marcar todos presentes + casos individuales
- Navegación por teclado
- Estadísticas

### Fase 6.7 — Firma Docente con PIN
- PIN 6 dígitos, hash PBKDF2
- Configurar, cambiar, restablecer PIN
- Firma con content hash
- Modo kiosco
- Auditoría

### Fase 6.8 — Panel Coordinador
- Dashboard de monitoreo pedagógico
- Indicadores de planificación/clases/firmas
- Filtros por año, semestre, curso, asignatura, profesor
- IA para resúmenes y alertas

### Fase 6.9 — Observaciones, Calificaciones y Comunicaciones
- Categorías de observaciones
- Vinculación con evaluaciones existentes
- Registro de comunicaciones
- IA para borradores

### Fase 6.10 — Preview y QA
- Migración en preview
- QA por rol (admin, coordinador, profesor)
- Regresión de funcionalidades existentes
- Deploy preview

---

## 10. Cero Archivos Funcionales Modificados

### ✅ Confirmado

| Categoría | Cantidad | Acción |
|-----------|----------|--------|
| Archivos existentes modificados | 0 | Sin cambios |
| Migraciones existentes modificadas | 0 | Sin cambios |
| Endpoints existentes modificados | 0 | Sin cambios |
| Componentes existentes modificados | 0 | Sin cambios |
| Tipos existentes modificados | 0 | Sin cambios |
| Servicios existentes modificados | 0 | Sin cambios |
| Prompts existentes modificados | 0 | Sin cambios |

### Solo se crean archivos nuevos

| Tipo | Cantidad estimada |
|------|-------------------|
| Migraciones SQL | 1-2 |
| Endpoints API | 15-20 |
| Componentes React | 10-15 |
| Servicios | 3-5 |
| Tipos | 1-2 |
| Tests | 10-15 |
| Documentación | 3-5 |

---

## 11. Validación

### Al final de cada fase

```bash
npx.cmd tsc --noEmit
npm.cmd run test
npm.cmd run build
git status --short
```

### Criterios de éxito

- TypeScript: 0 errores
- Tests: todos pasan (sin decremento)
- Build: exitoso
- Working tree: limpio
- Sin cambios en archivos existentes

---

## 12. Resumen Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Tablas reutilizables** | 32 (19 DB + 13 CORE_DB) |
| **Tablas nuevas** | 14 |
| **Endpoints reutilizables** | 15+ |
| **Endpoints nuevos** | 15-20 |
| **Componentes reutilizables** | 20+ |
| **Componentes nuevos** | 10-15 |
| **Archivos modificados** | 0 |
| **Riesgo de pérdida datos** | CRÍTICO → mitigado con aditivo puro |
| **IA reutilizable** | orchestrator, PlanningAgent, AIEngine, prompts |
| **Fallback** | Obligatorio en toda generación IA |
| **Tiempo estimado** | 10 fases, ~2-3 días por fase |
