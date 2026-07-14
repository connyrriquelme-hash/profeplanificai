# Integración con Mis Clases — Libro de Clases Digital

**Fecha:** 2026-07-13
**Rama:** `feature/libro-clases-digital`

---

## 1. Flujo Principal: Mis Clases → Libro de Clases

```
Mis Clases (teacher_classes + lesson_instances + lesson_plans)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Crear class_session desde lesson_instance existente        │
│  (botón "Iniciar sesión" en vista de lección)               │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  class_sessions (nueva tabla)                               │
│  - Referencia: lesson_instance_id (FK nullable)             │
│  - Referencia: lesson_plan_id (FK nullable)                 │
│  - Campos extendidos: objective_ids, indicators, skills,    │
│    attitudes, dua_supports, formative_assessment, resources │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Durante la clase:                                          │
│  - Editar taught_content, teacher_notes                     │
│  - Marcar asistencia (attendance_records)                   │
│  - Agregar observaciones (student_observations)             │
│  - Versionado automático (class_session_versions)           │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Al finalizar:                                              │
│  - Marcar status = 'pending_signature'                      │
│  - Generar content_hash (SHA-256)                           │
│  - Firmar con PIN (signature_events + teacher_signature)    │
│  - Status → 'signed', signed_version = version actual       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Mapeo de Campos: lesson_instances → class_sessions

| lesson_instances | class_sessions | Nota |
|------------------|----------------|------|
| `id` | `lesson_instance_id` (FK) | Referencia original |
| `teacher_id` | `teacher_id` | Igual |
| `class_id` | `course_id` | Renombrado (teacher_classes.id) |
| `lesson_date` | `date` | Renombrado |
| `start_time` | `start_time` | Igual |
| `end_time` | `end_time` | Igual |
| `title` | — | Se usa `lesson_plan_id` para título |
| `status` | `status` | Extendido: scheduled\|open\|completed\|pending_signature\|signed\|corrected\|cancelled |
| `created_at` | `created_at` | Igual |
| `updated_at` | `updated_at` | Igual |

**Nuevos en class_sessions:**
- `institution_id` (aislamiento)
- `academic_year_id`, `academic_term_id` (contexto temporal)
- `subject_id` (FK a CORE_DB subjects)
- `lesson_plan_id` (FK a lesson_plans)
- `planning_id` (referencia genérica)
- `objective_ids_json`, `indicators_json`, `skills_json`, `attitudes_json` (currículo)
- `planned_content`, `taught_content` (separación plan/ejecución)
- `dua_supports_json`, `formative_assessment_json`, `resources_json` (estructurado)
- `version`, `signed_version`, `content_hash` (versionado/firma)
- `teacher_notes` (notas libres)
- `created_by` (auditoría)

---

## 3. Endpoints Reutilizados (Sin Cambios)

| Endpoint | Uso en Libro | Estado |
|----------|--------------|--------|
| `GET /api/my-classes` | Listar cursos del docente | ✅ Reutilizar |
| `GET /api/my-classes/calendar` | Calendario semanal | ✅ Reutilizar |
| `POST /api/lessons` | Crear lesson_instance (opcional, legacy) | ✅ Reutilizar |
| `GET /api/lessons/:id` | Ver lesson_instance + lesson_plan | ✅ Reutilizar |
| `POST /api/lessons/:id/autosave` | Autosave lesson_plan | ✅ Reutilizar |
| `POST /api/lessons/:id/generate-resource` | Generar recurso IA | ✅ Reutilizar |
| `POST /api/lessons/:id/generate-evaluation` | Generar evaluación IA | ✅ Reutilizar |
| `POST /api/lessons/:id/generate-presentation` | Generar presentación IA | ✅ Reutilizar |

---

## 4. Endpoints Nuevos (Extensión)

| Endpoint | Propósito |
|----------|-----------|
| `POST /api/classbook/sessions/from-lesson/:lessonInstanceId` | Crear class_session desde lesson_instance |
| `GET /api/classbook/sessions?course_id=&date=` | Listar sesiones del día/curso |
| `PATCH /api/classbook/sessions/:id` | Editar taught_content, notes, recursos |
| `POST /api/classbook/sessions/:id/attendance` | Marcar asistencia masiva/individual |
| `POST /api/classbook/sessions/:id/observations` | Agregar observación estudiante |
| `POST /api/classbook/sessions/:id/sign` | Firmar sesión con PIN |
| `GET /api/classbook/sessions/:id/versions` | Historial de versiones |
| `POST /api/classbook/sessions/:id/review` | Solicitar revisión coordinador |

---

## 4. Frontend — Componentes Reutilizados

| Componente | Uso en Libro |
|------------|--------------|
| `ProductRenderer` | Renderizar recursos/evaluaciones generados en sesión |
| `EditorialHeader/Footer` | Encabezado/pie institucional en vista de sesión |
| `TeacherInfoFields` | Datos del docente en sesión |
| `StudentInfoFields` | Datos del estudiante en asistencia/observaciones |
| `ResponseArea` | Áreas de respuesta en evaluaciones de sesión |
| `PedagogicalBlock` | Bloques pedagógicos en planificación de sesión |
| `CurriculumCallout` | Referencias curriculares (OA, indicadores) |
| `InstructionCallout` | Instrucciones en recursos de sesión |
| `ExampleBox` | Ejemplos en recursos |
| `ChallengeBox` | Desafíos en planificación |
| `ReflectionBox` | Reflexiones en cierre de sesión |
| `VocabularyBox` | Vocabulario en recursos |
| `MaterialsGrid` | Materiales en sesión |
| `ProcedureTimeline` | Línea de tiempo procedural en desarrollo |
| `EditableTable` | Grilla de asistencia, lista de estudiantes |
| `SelfAssessment` | Autoevaluación en cierre de sesión |
| `TeacherFeedbackBox` | Retroalimentación docente en observaciones |
| `PrintToolbar` | Imprimir sesión firmada |
| `useConfigOptions` | Dropdowns de estados, categorías, metodologías |
| `AppShell` | Layout principal |
| `Stepper` | Wizard de firma, importación estudiantes |

---

## 5. Frontend — Componentes Nuevos

| Componente | Propósito |
|------------|-----------|
| `ClassBookView` | Vista principal del Libro (tabs: Hoy, Semana, Curso, Estudiantes) |
| `DayJournal` | Diario de clases del día (lista sesiones + acciones rápidas) |
| `AttendanceGrid` | Grilla asistencia rápida (checkbox + estados) |
| `SignaturePad` | Firma con PIN (modal + kiosco) |
| `KioskMode` | Modo kiosco para firma en tablet/pizarra |
| `ClassSessionDetail` | Detalle completo de sesión (plan, ejecución, recursos, firma) |
| `YearTimeline` | Línea de tiempo del año escolar (sesiones, hitos) |
| `ImportWizard` | Asistente importación CSV/XLSX estudiantes |
| `CoordinadorDashboard` | Dashboard coordinador (FASE 6.8) |
| `PlanningReviewPanel` | Panel revisión planificación |
| `StudentProgressCard` | Tarjeta progreso estudiante (asistencia, observaciones, logros) |
| `ClassSessionDetail` | Detalle sesión diaria |

---

## 6. Servicios Reutilizados

| Servicio | Uso en Libro |
|----------|--------------|
| `misClasesService.ts` | CRUD teacher_classes, schedules, lesson_instances |
| `aiService.ts` | Generación IA (recursos, evaluaciones, presentaciones) |
| `authService.ts` | Auth, PIN validation |
| `configService.ts` | Opciones dropdown (app_config) |

## 7. Servicios Nuevos

| Servicio | Propósito |
|----------|-----------|
| `classbookService.ts` | CRUD class_sessions, attendance, observations, signatures |
| `studentService.ts` | CRUD student_profiles, course_enrollments, importación |
| `academicService.ts` | CRUD academic_years, terms, course_subject_assignments |
| `reviewService.ts` | Planning reviews, coordinator workflows |

---

## 8. Validación de Datos Existentes

| Tabla Existente | Validación | Acción si Fallo |
|-----------------|------------|-----------------|
| `teacher_classes` | FK a `usuarios` (teacher_id) | No crear class_session |
| `lesson_instances` | FK a `teacher_classes` | No vincular lesson_instance_id |
| `lesson_plans` | FK a `lesson_instances` | No vincular lesson_plan_id |
| `usuarios` | Existe teacher_id | No crear class_session |
| `institutions` | Existe institution_id | No crear nada |
| `institution_members` | teacher_id miembro activo | No crear class_session |
| `subjects` (CORE_DB) | Existe subject_id | No crear class_session |

---

## 9. Pruebas de Regresión (Mis Clases)

| Caso | Esperado |
|------|----------|
| Crear curso en Mis Clases | Se crea en `teacher_classes` (sin cambios) |
| Programar clase en calendario | Se crea en `lesson_instances` (sin cambios) |
| Escribir planificación | Se guarda en `lesson_plans` (sin cambios) |
| Generar recurso IA | Se guarda en `lesson_generated_resources` (sin cambios) |
| Ver calendario semanal | Muestra `lesson_instances` + `class_sessions` (merge en frontend) |
| Autoguardado planificación | Funciona igual (lesson_autosave_events) |

---

*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*