# Database Audit — Libro de Clases Digital

**Fecha:** 2026-07-12
**Rama:** feature/libro-clases-digital
**Commit:** 4944a4b
**Estado:** Auditoría completa, sin modificaciones

---

## 1. Configuración de Bases de Datos

### D1 Binding: `DB` (planificaia-db)
- **Propósito:** Datos de usuario, aplicación, aulas, lecciones
- **database_id:** `19c4fea3-444e-4094-8c66-610704c674be`

### D1 Binding: `CORE_DB` (profeplanificai_db)
- **Propósito:** Currículo nacional, metodologías, plantillas, recursos generados
- **database_id:** `0c1c09ca-cfd6-44b4-9c71-e6bd158f17c0`

---

## 2. Migraciones Existentes (18 archivos)

| # | Archivo | Propósito |
|---|---------|-----------|
| 001 | 001_init.sql | Schema inicial: usuarios, sessions, planes, recursos, evaluaciones, cursos, estudiantes, colaboración, drive |
| 0000 | 0000_core_schema.sql | Reestructura niveles, asignaturas, unidades, OA, textos_escolares |
| 002 | 002_curriculum.sql | Currículo relacional: courses, subjects, axes, units, objectives, skills, attitudes |
| 003 | 003_images.sql | image_cache |
| 004 | 004_mineduc_schema.sql | Schema MINEDUC: niveles, asignaturas, nivel_asignatura, OA, indicadores, habilidades |
| 005 | 005_curriculum_indicators.sql | curriculum_indicators, curriculum_import_batches |
| 0005 | 0005_curricular_skills.sql | Enriquece curricular_skills, habilidades; crea oa_habilidades_curriculares |
| 006 | 006_pedagogical_core.sql | Núcleo pedagógico: evaluation_indicators, curricular_skills/attitudes, methodologies, resource_templates, generated_resources/presentations, search_documents, agent_runs |
| 007 | 007_curriculum_core.sql | Currículo completo relacional: education_levels, subjects, curriculum_axes, learning_objectives, evaluation_indicators, curricular_skills/attitudes, methodologies, resource_templates, generated_resources/presentations, agent_runs |
| 008 | 008_mis_clases.sql | Gestión de aulas: teacher_classes, schedules, lesson_instances, lesson_plans, curriculum, methodologies, resources, evaluations, attachments, comments, autosave |
| 009 | 009_non_teaching_blocks.sql | Bloques no lectivos |
| 0010 | 010_user_sessions.sql | Sesiones de usuario |
| 0011 | 011_admin_roles_institutions.sql | Instituciones, miembros, calendario, auditoría |
| 0012 | 012_app_config.sql | Configuración de desplegables (methodologies, eval types, etc.) |
| 0004 | 0004_add_active_column_usuarios.sql | Columna active en usuarios |
| 0006 | 0006_trial_requests.sql | Solicitudes de prueba |
| 0003 | 0003_curriculum_masivo.sql | Seed masivo de currículo (1° Básico a 4° Medio) |
| 0002 | 0002_seed_curriculum.sql | Seed inicial de currículo (5° Básico) |

---

## 3. Inventario Completo de Tablas

### 3.1 DB (planificaia-db)

#### 3.1.1 `usuarios`
- **Propósito:** Usuarios del sistema (docentes, admins)
- **Columnas:** id (PK), email (UNIQUE), nombre, password_hash, rol (DEFAULT 'docente'), created_at, updated_at, active (ALTER)
- **Claves foráneas:** —
- **Endpoints:** auth/login.ts, auth/me.ts, admin/usuarios.ts, admin/dashboard.ts, admin/audit-log.ts, admin/institutions/[id]/members.ts, data/collab.ts
- **Frontend:** AdminView.tsx, AdminPanelView.tsx, LoginView.tsx
- **Riesgo:** ALTO — tabla central, no modificar
- **Reutilizable para Libro:** ✅ SÍ (profesores, coordinadores)

#### 3.1.2 `sessions`
- **Propósito:** Tokens de sesión HTTP
- **Columnas:** id (PK), usuario_id (FK), token (UNIQUE), expires_at, created_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** — (gestionada por middleware)
- **Riesgo:** ALTO — seguridad, no modificar
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.3 `user_sessions`
- **Propósito:** Sesiones de usuario con hash y expiración
- **Columnas:** id (PK), user_id (FK), session_hash (UNIQUE), created_at, last_seen_at, expires_at, revoked_at, user_agent_hash
- **Claves foráneas:** user_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** auth/me.ts, auth/sessions/index.ts, auth/sessions/[id].ts, auth/sessions/revoke-others.ts
- **Riesgo:** ALTO — seguridad
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.4 `planes`
- **Propósito:** Planificaciones guardadas por docentes
- **Columnas:** id (PK), usuario_id (FK), tipo_plan, titulo, nivel, asignatura, curso, eje, oa, tema, duracion, estudiantes, contexto, necesidades, contenido, texto, created_at, updated_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** data/plans.ts, admin/dashboard.ts
- **Frontend:** BancoRecursosView.tsx, DashboardView.tsx
- **Riesgo:** MEDIO — datos de usuario
- **Reutilizable para Libro:** ⚠️ PARCIAL (existente, pero el Libro usará lesson_plans)

#### 3.1.5 `recursos`
- **Propósito:** Recursos guardados por docentes
- **Columnas:** id (PK), usuario_id (FK), tipo_recurso, titulo, nivel, asignatura, oa, contenido, texto, created_at, updated_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** data/recursos.ts, admin/dashboard.ts
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ⚪ NO (el Libro usa generated_resources)

#### 3.1.6 `evaluaciones`
- **Propósito:** Evaluaciones guardadas por docentes
- **Columnas:** id (PK), usuario_id (FK), tipo_eval, titulo, nivel, asignatura, oa, tema, habilidad, dificultad, n_preg, config, contenido, texto, created_at, updated_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** data/evals.ts, admin/dashboard.ts
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ⚪ NO (el Libro usa lesson_generated_evaluations)

#### 3.1.7 `cursos`
- **Propósito:** Cursos del docente (legacy)
- **Columnas:** id (PK), usuario_id (FK), nombre, nivel, asignatura, estudiantes (count), created_at, updated_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE
- **Endpoints:** data/cursos.ts, admin/dashboard.ts
- **Frontend:** DocenteView.tsx
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ⚠️ PARCIAL (teacher_classes es más completa)

#### 3.1.8 `estudiantes`
- **Propósito:** Estudiantes del docente (legacy)
- **Columnas:** id (PK), usuario_id (FK), curso_id (FK), nombre, observaciones, created_at, updated_at
- **Claves foráneas:** usuario_id → usuarios(id) ON DELETE CASCADE, curso_id → cursos(id) ON DELETE CASCADE
- **Endpoints:** data/cursos.ts, admin/dashboard.ts
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ⚠️ PARCIAL (necesita extender con student_profiles)

#### 3.1.9 `teacher_classes`
- **Propósito:** Cursos asignados al docente en Mis Clases
- **Columnas:** id (PK), teacher_id, school_year, level_id, subject_id, course_name, class_name, color, is_active, created_at, updated_at
- **Claves foráneas:** — (sin FK formal, teacher_id referencia usuarios)
- **Endpoints:** my-classes/index.ts, my-classes/[id].ts, my-classes/calendar.ts, my-classes/schedule/index.ts, lessons/index.ts, _lib/my-classes.ts
- **Frontend:** MisClases.tsx, misClasesService.ts
- **Riesgo:** ALTO — tabla central de Mis Clases
- **Reutilizable para Libro:** ✅ SÍ — tabla principal

#### 3.1.10 `teacher_weekly_schedules`
- **Propósito:** Horarios semanales del docente
- **Columnas:** id (PK), teacher_id, name, school_year, starts_on, ends_on, is_active, created_at, updated_at
- **Claves foráneas:** —
- **Endpoints:** my-classes/schedule/index.ts, my-classes/schedule/[id].ts, my-classes/calendar.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.11 `teacher_schedule_slots`
- **Propósito:** Slots del horario (día/hora/curso)
- **Columnas:** id (PK), schedule_id (FK), class_id (FK), weekday (1-5), start_time, end_time, repeats_weekly, recurrence_rule, room, created_at, updated_at
- **Claves foráneas:** schedule_id → teacher_weekly_schedules(id) ON DELETE CASCADE, class_id → teacher_classes(id) ON DELETE CASCADE
- **Endpoints:** my-classes/schedule/index.ts, my-classes/schedule/[id].ts, my-classes/calendar.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.12 `lesson_instances`
- **Propósito:** Instancias de clase (una clase programada en fecha/hora específica)
- **Columnas:** id (PK), teacher_id, class_id (FK), schedule_slot_id (FK nullable), lesson_date, start_time, end_time, status (planificada|en_preparacion|realizada|pendiente), title, notes, created_at, updated_at
- **Claves foráneas:** class_id → teacher_classes(id) ON DELETE CASCADE, schedule_slot_id → teacher_schedule_slots(id) ON DELETE SET NULL
- **Endpoints:** lessons/index.ts, lessons/[id].ts, my-classes/index.ts, my-classes/calendar.ts, _lib/my-classes.ts, _lib/ai/context.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** ALTO — tabla central de lecciones
- **Reutilizable para Libro:** ✅ SÍ — se extiende a class_sessions

#### 3.1.13 `lesson_plans`
- **Propósito:** Planificación detallada de cada lección
- **Columnas:** id (PK), lesson_instance_id (FK UNIQUE), teacher_id, title, objective_text, purpose_text, beginning_text, development_text, closure_text, challenge_question, abp_project_text, resources_text, evaluation_text, instruments_text, dua_adjustments_text, teacher_observations, ai_summary, autosave_version, created_at, updated_at
- **Claves foráneas:** lesson_instance_id → lesson_instances(id) ON DELETE CASCADE
- **Endpoints:** lessons/[id].ts, lessons/[id]/autosave.ts, lessons/[id]/generate-actividades-clase.ts, _lib/my-classes.ts, _lib/ai/context.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** ALTO
- **Reutilizable para Libro:** ✅ SÍ — tabla principal de planificación

#### 3.1.14 `lesson_plan_curriculum`
- **Propósito:** Vínculo lección ↔ currículo (OA, indicadores, habilidades, actitudes)
- **Columnas:** id (PK), lesson_plan_id (FK UNIQUE), level_id, subject_id, axis_id, objective_id, indicator_ids_json, skill_ids_json, attitude_ids_json, created_at, updated_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** _lib/my-classes.ts, _lib/ai/context.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** ALTO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.15 `lesson_plan_methodologies`
- **Propósito:** Metodologías seleccionadas para la lección
- **Columnas:** id (PK), lesson_plan_id (FK), methodology_id, strategy_notes, created_at, updated_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Constraints:** UNIQUE(lesson_plan_id, methodology_id)
- **Endpoints:** _lib/my-classes.ts
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.16 `lesson_generated_resources`
- **Propósito:** Recursos IA generados para una lección
- **Columnas:** id (PK), lesson_plan_id (FK), resource_type, title, content_json, file_url, source_context_json, ai_provider, created_at, updated_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** lessons/[id]/generate-resource.ts, lessons/[id]/generate-presentation.ts, _lib/my-classes.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.17 `lesson_generated_evaluations`
- **Propósito:** Evaluaciones IA generadas para una lección
- **Columnas:** id (PK), lesson_plan_id (FK), evaluation_type, title, content_json, rubric_json, answer_key_json, source_context_json, ai_provider, created_at, updated_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** lessons/[id]/generate-evaluation.ts, _lib/my-classes.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** MEDIO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.18 `lesson_attachments`
- **Propósito:** Archivos adjuntos de una lección
- **Columnas:** id (PK), lesson_plan_id (FK), file_name, file_url, file_type, created_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** _lib/my-classes.ts
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.19 `lesson_comments`
- **Propósito:** Comentarios en una lección
- **Columnas:** id (PK), lesson_plan_id (FK), teacher_id, comment, created_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** _lib/my-classes.ts
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.20 `lesson_autosave_events`
- **Propósito:** Eventos de autoguardado
- **Columnas:** id (PK), lesson_plan_id (FK), field_name, saved_value_json, created_at
- **Claves foráneas:** lesson_plan_id → lesson_plans(id) ON DELETE CASCADE
- **Endpoints:** lessons/[id]/autosave.ts
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.21 `non_teaching_blocks`
- **Propósito:** Bloques no lectivos (reuniones, capacitaciones, etc.)
- **Columnas:** id (PK), teacher_id, school_year, block_type, non_teaching_type, title, description, block_date, start_time, end_time, location, priority, course_name, subject_name, status, reminder_*, requires_follow_up, follow_up_notes, created_at, updated_at
- **Claves foráneas:** —
- **Endpoints:** non-teaching-blocks.ts, my-classes/calendar.ts
- **Frontend:** MisClases.tsx
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.22 `institutions`
- **Propósito:** Instituciones educativas
- **Columnas:** id (PK), name, rbd, country, region, commune, address, contact_*, status, plan, created_at, updated_at
- **Claves foráneas:** —
- **Endpoints:** admin/institutions/index.ts, admin/institutions/[id].ts
- **Frontend:** AdminPanelView.tsx
- **Riesgo:** ALTO — tabla institucional
- **Reutilizable para Libro:** ✅ SÍ — obligatoria para aislamiento

#### 3.1.23 `institution_members`
- **Propósito:** Miembros de la institución con roles
- **Columnas:** id (PK), institution_id (FK), user_id (FK), role, status, created_at, updated_at
- **Claves foráneas:** institution_id → institutions(id), user_id → usuarios(id)
- **Endpoints:** admin/institutions/[id].ts, admin/institutions/[id]/members.ts, admin/institutions/[id]/members/[memberId].ts
- **Frontend:** AdminPanelView.tsx
- **Riesgo:** ALTO
- **Reutilizable para Libro:** ✅ SÍ — tabla de roles

#### 3.1.24 `institution_calendar_templates`
- **Propósito:** Plantillas de calendario institucional
- **Columnas:** id (PK), institution_id (FK), name, description, school_year, level_id, subject_id, weekday, start_time, end_time, block_type, room, repeats_weekly, starts_on, ends_on, created_by, created_at, updated_at
- **Claves foráneas:** institution_id → institutions(id)
- **Endpoints:** — (solo frontend vía adminService.ts)
- **Frontend:** AdminPanelView.tsx
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ

#### 3.1.25 `admin_audit_log`
- **Propósito:** Registro de acciones de administrador
- **Columnas:** id (PK), admin_user_id (FK), action, target_type, target_id, metadata_json, created_at
- **Claves foráneas:** admin_user_id → usuarios(id)
- **Endpoints:** admin/audit-log.ts
- **Frontend:** AdminPanelView.tsx
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ — extender a classbook_audit_log

#### 3.1.26 `app_config`
- **Propósito:** Configuración de desplegables y opciones
- **Columnas:** id (PK), category, value_key, label, sort_order, active, metadata_json, created_at, updated_at
- **Constraints:** UNIQUE(category, value_key)
- **Endpoints:** config/options.ts
- **Frontend:** useConfigOptions.ts → MisClases, Evaluaciones, Recursos, etc.
- **Riesgo:** BAJO
- **Reutilizable para Libro:** ✅ SÍ — agregar categorías nuevas

#### 3.1.27 `image_cache`
- **Propósito:** Cache de imágenes generadas
- **Columnas:** cache_key (PK), context_json, prompt, url, source, license, author, attribution, provider_meta, created_at, expires_at
- **Endpoints:** — (interno)
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.28 `trial_requests`
- **Propósito:** Solicitudes de prueba gratuita
- **Columnas:** id (PK), name, email, institution, role, message, status, source, user_agent, ip_hash, email_sent, created_at, updated_at
- **Endpoints:** trial-request.ts
- **Frontend:** TrialRequestForm.tsx
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.29 `oa_favoritos`
- **Propósito:** OA favoritos del docente
- **Columnas:** id (PK), usuario_id (FK), oa_id, created_at
- **Constraints:** UNIQUE(usuario_id, oa_id)
- **Endpoints:** — (poco usado)
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.30 `colaboracion_posts`
- **Propósito:** Publicaciones de colaboración
- **Columnas:** id (PK), usuario_id (FK), titulo, contenido, tipo, nivel, asignatura, likes, created_at, updated_at
- **Endpoints:** data/collab.ts
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.31 `colaboracion_comentarios`
- **Propósito:** Comentarios en publicaciones
- **Columnas:** id (PK), post_id (FK), usuario_id (FK), texto, created_at
- **Endpoints:** data/collab.ts
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.32 `drive_items`
- **Propósito:** Archivos del drive del docente
- **Columnas:** id (PK), usuario_id (FK), nombre, tipo, contenido, nivel, asignatura, carpeta_id, tamano, created_at, updated_at
- **Endpoints:** data/drive.ts
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.1.33 `drive_folders`
- **Propósito:** Carpetas del drive
- **Columnas:** id (PK), usuario_id (FK), nombre, created_at
- **Endpoints:** data/drive.ts
- **Riesgo:** BAJO
- **Reutilizable:** ⚪ NO REQUIERE

---

### 3.2 CORE_DB (profeplanificai_db)

#### 3.2.1 `courses` (002)
- **Propósito:** Cursos del currículo nacional
- **Columnas:** id (PK), code (UNIQUE), name, cycle, sort_order
- **Seed:** 19 cursos (Sala Cuna → 4° Medio)
- **Riesgo:** ALTO — datos oficiales, no modificar
- **Reutilizable:** ✅ SÍ

#### 3.2.2 `subjects` (002/007)
- **Propósito:** Asignaturas del currículo
- **Columnas:** id, name, normalized_name (002) / education_level_id, code, name, description, curriculum_source, status (007)
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.3 `axes` (002)
- **Propósito:** Ejes temáticos
- **Columnas:** id (PK), subject_id (FK), name
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.4 `units` (002)
- **Propósito:** Unidades del currículo
- **Columnas:** id (PK), course_id (FK), subject_id (FK), number, name, prioritization_label
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.5 `objectives` (002)
- **Propósito:** Objetivos de aprendizaje (OA)
- **Columnas:** id (PK), code (UNIQUE), type, course_id, subject_id, axis_id, unit_id, official_text, normalized_text, bloom_level, skill_tags_json, attitude_tags_json, source_url, source_name, license_note, priority_label, imported_at, updated_at
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.6 `skills` (002)
- **Propósito:** Habilidades del currículo
- **Columnas:** id (PK), code (UNIQUE), subject_id (FK), official_text, source_url
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.7 `attitudes` (002)
- **Propósito:** Actitudes del currículo
- **Columnas:** id (PK), code (UNIQUE), subject_id (FK), official_text, source_url
- **Riesgo:** ALTO
- **Reutilizable:** ✅ SÍ

#### 3.2.8 `objective_skills` (002)
- **Propósito:** Vínculo OA ↔ habilidades
- **Columnas:** objective_id (PK/FK), skill_id (PK/FK)
- **Reutilizable:** ✅ SÍ

#### 3.2.9 `objective_attitudes` (002)
- **Propósito:** Vínculo OA ↔ actitudes
- **Columnas:** objective_id (PK/FK), attitude_id (PK/FK)
- **Reutilizable:** ✅ SÍ

#### 3.2.10 `resources` (002)
- **Propósito:** Recursos del currículo
- **Columnas:** id (PK), objective_id (FK), title, type, unit_label, source_url, metadata_json
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.11 `questions` (002)
- **Propósito:** Preguntas del banco curricular
- **Columnas:** id (PK), objective_id (FK), title, statement, alternatives_json, correct_answer, correction_rubric, skill_label, source_url
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.12 `generated_activities` (002)
- **Propósito:** Actividades generadas por IA
- **Columnas:** id (PK), objective_id (FK), user_id, title, activity_type, duration_minutes, grade_level, subject, prompt_json, result_json, created_at
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.13 `generation_logs` (002)
- **Propósito:** Logs de generación IA
- **Columnas:** id (PK), provider, model, prompt_hash, status, error_message, created_at
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.14 `import_logs` (002)
- **Propósito:** Logs de importación curricular
- **Columnas:** id (PK), source_url, status, items_found, items_saved, error_message, created_at
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.15 `niveles` (0000/004)
- **Propósito:** Niveles educativos
- **Columnas:** id (PK), nombre (UNIQUE), descripcion, orden
- **Reutilizable:** ✅ SÍ

#### 3.2.16 `asignaturas` (0000/004)
- **Propósito:** Asignaturas (sistema legacy)
- **Columnas:** id (PK), nivel_id (FK), nombre, UNIQUE(nivel_id, nombre)
- **Reutilizable:** ✅ SÍ (pero subjects es más completa)

#### 3.2.17 `nivel_asignatura` (004)
- **Propósito:** Relación nivel ↔ asignatura
- **Columnas:** nivel_id (PK/FK), asignatura_id (PK/FK)
- **Reutilizable:** ✅ SÍ

#### 3.2.18 `objetivos_aprendizaje` (0000/004)
- **Propósito:** OA (sistema legacy)
- **Columnas:** id (PK), codigo, descripcion, eje_tematico, nivel_id, asignatura_id
- **Reutilizable:** ✅ SÍ (pero objectives/learning_objectives es más completa)

#### 3.2.19 `indicadores_evaluacion` (004)
- **Propósito:** Indicadores de evaluación
- **Columnas:** id (PK), descripcion, oa_id (FK)
- **Reutilizable:** ✅ SÍ

#### 3.2.20 `habilidades` (004)
- **Propósito:** Habilidades por asignatura
- **Columnas:** id (PK), nombre, asignatura_id (FK), curricular_skill_id, descripcion, unidad_numero, keywords_json
- **Reutilizable:** ✅ SÍ

#### 3.2.21 `curriculum_indicators` (005)
- **Propósito:** Indicadores curriculares detallados
- **Columnas:** id (PK), objective_id, skill_id, level, grade, track, subject, oa_code, indicator_text, observable_action, evaluation_type, evidence_type, difficulty_level, source, status, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.22 `curriculum_import_batches` (005)
- **Propósito:** Metadatos de importación
- **Columnas:** id (PK), filename, track, indicators_*, status, error_message, created_at
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.23 `education_levels` (007)
- **Propósito:** Niveles educativos (sistema completo)
- **Columnas:** id (PK), code (UNIQUE), name, description, cycle, sort_order, source_type, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.24 `curriculum_axes` (007)
- **Propósito:** Ejes curriculares (sistema completo)
- **Columnas:** id (PK), subject_id (FK), code, name, description, sort_order, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.25 `learning_objectives` (007)
- **Propósito:** OA (sistema completo)
- **Columnas:** id (PK), subject_id (FK), axis_id (FK), code (UNIQUE), description, type, official_text, bloom_level, competency, curriculum_source, source_url, status, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.26 `evaluation_indicators` (006/007)
- **Propósito:** Indicadores de evaluación (sistema completo)
- **Columnas:** id (PK), objective_id (FK), code, description, evaluation_type, observable_action, evidence_type, difficulty_level, source, status, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.27 `curricular_skills` (006/007)
- **Propósito:** Habilidades curriculares (sistema completo)
- **Columnas:** id (PK), code, name, description, subject_id, axis_id, level_id, source_type, source_url, created_at, nivel_desde, nivel_hasta, actividades_principales_json
- **Reutilizable:** ✅ SÍ

#### 3.2.28 `curricular_attitudes` (006/007)
- **Propósito:** Actitudes curriculares
- **Columnas:** id (PK), code, name, description, subject_id, axis_id, level_id, source_type, source_url, created_at
- **Reutilizable:** ✅ SÍ

#### 3.2.29 `objective_indicators` (006/007)
- **Propósito:** Vínculo OA ↔ indicadores
- **Columnas:** objective_id (PK/FK), indicator_id (PK/FK)
- **Reutilizable:** ✅ SÍ

#### 3.2.30 `methodologies` (006/007)
- **Propósito:** Metodologías pedagógicas
- **Columnas:** id (PK), code/name (UNIQUE), description, when_to_use, steps_json, advantages_json, risks_json, dua_accommodations_json, suggested_evaluations_json, classroom_examples_json, source_type, source_url, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.31 `methodology_strategies` (006/007)
- **Propósito:** Estrategias por metodología
- **Columnas:** id (PK), methodology_id (FK), code/name, description, duration_minutes, grade_range, subject_fit_json, created_at
- **Reutilizable:** ✅ SÍ

#### 3.2.32 `methodology_subject_fit` (006/007)
- **Propósito:** Ajuste metodología ↔ asignatura
- **Columnas:** methodology_id (PK/FK), subject_id (PK/FK), fit_score/fit_level, notes, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.33 `resource_templates` (006/007)
- **Propósito:** Plantillas de recursos
- **Columnas:** id (PK), code/name, type/resource_type, description, structure_json, required_fields_json, optional_fields_json, default_prompt, methodology_id, subject_id, level_id, source_type, created_at
- **Reutilizable:** ✅ SÍ

#### 3.2.34 `generated_resources` (006/007)
- **Propósito:** Recursos generados por IA
- **Columnas:** id (PK), user_id, title, type/resource_type, content/content_json, level, subject, objective_code/id, methodology_id, indicators_used_json, skills_used_json, attitudes_used_json, prompt_used, ai_provider, ai_model, dua_considerations_json, evaluation_type, duration_minutes, context_notes, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.35 `generated_presentations` (006/007)
- **Propósito:** Presentaciones generadas
- **Columnas:** id (PK), resource_id (FK), slides_json, slide_count, visual_style, include_images, prefer_regional_context, image_prompts_json, exported_format, created_at
- **Reutilizable:** ✅ SÍ

#### 3.2.36 `curriculum_sources` (006/007)
- **Propósito:** Fuentes curriculares
- **Columnas:** id (PK), name, url/source_type (UNIQUE), description, last_synced_at, sync_status, items_count, created_at, updated_at
- **Reutilizable:** ⚪ NO REQUIERE

#### 3.2.37 `search_documents` (006/007)
- **Propósito:** Índice de búsqueda para IA
- **Columnas:** id (PK), doc_type, ref_id, title, content, level, subject, axis, objective_code, tags_json, search_vector, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.38 `agent_runs` (006/007)
- **Propósito:** Registro de ejecuciones de agentes IA
- **Columnas:** id (PK), agent_name, user_id, input_json, context_json, output_json, curriculum_context_json, ai_provider, ai_model, tokens_used, duration_ms, status, error_message, created_at, updated_at
- **Reutilizable:** ✅ SÍ

#### 3.2.39 `oa_habilidades_curriculares` (0005)
- **Propósito:** Vínculo OA ↔ habilidades curriculares
- **Columnas:** id (PK), objetivo_id, habilidad_id, match_source, confidence, rationale, created_at
- **Constraints:** UNIQUE(objetivo_id, habilidad_id)
- **Reutilizable:** ✅ SÍ

---

## 4. Tablas Reutilizables para Libro de Clases

### ✅ SÍ reutilizar (directamente)

| Tabla | DB | Uso en Libro |
|-------|----|-------------|
| `usuarios` | DB | Profesores, coordinadores |
| `institutions` | DB | Aislamiento institucional |
| `institution_members` | DB | Roles (teacher, coordinator, admin) |
| `teacher_classes` | DB | Cursos del docente |
| `teacher_weekly_schedules` | DB | Horarios |
| `teacher_schedule_slots` | DB | Slots del horario |
| `lesson_instances` | DB | Clases programadas → class_sessions |
| `lesson_plans` | DB | Planificaciones |
| `lesson_plan_curriculum` | DB | Vínculo plan ↔ currículo |
| `lesson_plan_methodologies` | DB | Metodologías de la lección |
| `lesson_generated_resources` | DB | Recursos IA |
| `lesson_generated_evaluations` | DB | Evaluaciones IA |
| `lesson_attachments` | DB | Archivos adjuntos |
| `lesson_comments` | DB | Comentarios |
| `lesson_autosave_events` | DB | Autoguardado |
| `non_teaching_blocks` | DB | Bloques no lectivos |
| `admin_audit_log` | DB | Auditoría (extender) |
| `app_config` | DB | Configuración (extender) |
| `institution_calendar_templates` | DB | Calendario institucional |

### ✅ SÍ reutilizar (CORE_DB — solo lectura)

| Tabla | Uso en Libro |
|-------|-------------|
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

### ⚠️ PARCIAL (requiere extensión)

| Tabla | DB | Limitación |
|-------|----|-----------|
| `cursos` | DB | Legacy, teacher_classes es más completa |
| `estudiantes` | DB | Necesita extender con perfiles completos |

### ⚪ NO reutilizar (no aplica)

| Tabla | Razón |
|-------|-------|
| `sessions` | Seguridad interna |
| `user_sessions` | Seguridad interna |
| `planes` | Legacy, el Libro usa lesson_plans |
| `recursos` | Legacy, el Libro usa generated_resources |
| `evaluaciones` | Legacy, el Libro usa lesson_generated_evaluations |
| `image_cache` | Cache temporal |
| `trial_requests` | Landing page |
| `drive_items`, `drive_folders` | Drive del docente |
| `colaboracion_*` | Colaboración social |
| `oa_favoritos` | Funcionalidad menor |
| `generated_activities` | Sistema legacy |
| `generation_logs`, `import_logs` | Logs internos |
| `curriculum_import_batches` | Importación |
| `curriculum_sources` | Fuentes |

---

## 5. Tablas NUEVAS Necesarias (propuesta)

| Tabla | Propósito | DB |
|-------|-----------|----|
| `academic_years` | Años escolares | DB |
| `academic_terms` | Semestres/Períodos | DB |
| `course_subject_assignments` | Asignación curso ↔ asignatura ↔ profesor | DB |
| `coordinator_scopes` | Alcance del coordinador | DB |
| `student_profiles` | Perfiles extendidos de estudiantes | DB |
| `course_enrollments` | Matrícula de estudiantes | DB |
| `class_sessions` | Sesiones diarias (extiende lesson_instances) | DB |
| `class_session_versions` | Versionado de sesiones | DB |
| `attendance_records` | Asistencia | DB |
| `student_observations` | Observaciones de estudiantes | DB |
| `teacher_signature_credentials` | Credenciales PIN | DB |
| `signature_events` | Eventos de firma | DB |
| `planning_reviews` | Revisiones de planificación | DB |
| `classbook_audit_log` | Auditoría del Libro | DB |

---

## 6. Índices Existentes

### DB (planificaia-db)
- `idx_planes_usuario` → planes(usuario_id)
- `idx_recursos_usuario` → recursos(usuario_id)
- `idx_evaluaciones_usuario` → evaluaciones(usuario_id)
- `idx_drive_usuario` → drive_items(usuario_id)
- `idx_cursos_usuario` → cursos(usuario_id)
- `idx_estudiantes_curso` → estudiantes(curso_id)
- `idx_colaboracion_posts_fecha` → colaboracion_posts(created_at DESC)
- `idx_comentarios_post` → colaboracion_comentarios(post_id)
- `idx_teacher_classes_teacher` → teacher_classes(teacher_id, school_year, is_active)
- `idx_teacher_slots_schedule` → teacher_schedule_slots(schedule_id, weekday)
- `idx_lessons_teacher_date` → lesson_instances(teacher_id, lesson_date, start_time)
- `idx_lessons_class` → lesson_instances(class_id, lesson_date)
- `idx_lesson_plan_curriculum_objective` → lesson_plan_curriculum(objective_id)
- `idx_lesson_resources_plan` → lesson_generated_resources(lesson_plan_id, created_at DESC)
- `idx_lesson_evaluations_plan` → lesson_generated_evaluations(lesson_plan_id, created_at DESC)
- `idx_institution_members_user_id` → institution_members(user_id)
- `idx_institution_members_institution_id` → institution_members(institution_id)
- `idx_calendar_templates_institution` → institution_calendar_templates(institution_id)
- `idx_admin_audit_user` → admin_audit_log(admin_user_id)
- `idx_user_sessions_*` → user_sessions(user_id, session_hash, expires_at)
- `idx_ntb_teacher_date` → non_teaching_blocks(teacher_id, block_date)
- `idx_ntb_teacher_year` → non_teaching_blocks(teacher_id, school_year)
- `idx_app_config_category` → app_config(category)
- `idx_app_config_active` → app_config(active)
- `idx_trial_requests_*` → trial_requests(email, status, created_at)
- `idx_habilidades_*` → habilidades(curricular_skill_id, asignatura_id)
- `idx_curricular_skills_nivel` → curricular_skills(nivel_desde, nivel_hasta)
- `idx_oa_hab_cur_*` → oa_habilidades_curriculares(objetivo_id, habilidad_id)

### CORE_DB (profeplanificai_db)
- `idx_objectives_*` → objectives(code, course, subject, axis)
- `idx_subjects_normalized` → subjects(normalized_name)
- `idx_courses_code` → courses(code)
- `idx_questions_objective` → questions(objective_id)
- `idx_resources_objective` → resources(objective_id)
- `idx_oa_nivel_asignatura` → objetivos_aprendizaje(nivel_id, asignatura_id)
- `idx_indicadores_oa` → indicadores_evaluacion(oa_id)
- `idx_ci_*` → curriculum_indicators (8 índices)
- `idx_search_*` → search_documents (4 índices)
- `idx_objective_indicators_objective` → objective_indicators(objective_id)
- `idx_objective_skills_objective` → objective_skills(objective_id)
- `idx_objective_attitudes_objective` → objective_attitudes(objective_id)
- `idx_curricular_skills_subject` → curricular_skills(subject_id)
- `idx_curricular_attitudes_subject` → curricular_attitudes(subject_id)
- `idx_methodology_strategies_methodology` → methodology_strategies(methodology_id)
- `idx_resource_templates_type` → resource_templates(type)
- `idx_generated_resources_*` → generated_resources(user, objective, type, level, subject)
- `idx_generated_presentations_resource` → generated_presentations(resource_id)
- `idx_curriculum_sources_url` → curriculum_sources(url)
- `idx_agent_runs_*` → agent_runs(agent, user, status, created)
- `idx_eval_indicators_*` → evaluation_indicators(objective, source)
- `idx_habilidades_curricular_skill` → habilidades(curricular_skill_id)
- `idx_habilidades_asignatura` → habilidades(asignatura_id)

---

## 7. Resumen de Riesgos

| Nivel | Tablas |
|-------|--------|
| **ALTO** | usuarios, sessions, user_sessions, teacher_classes, lesson_instances, lesson_plans, lesson_plan_curriculum, institutions, institution_members, courses (CORE_DB), objectives, learning_objectives |
| **MEDIO** | planes, recursos, evaluaciones, cursos, estudiantes, teacher_weekly_schedules, teacher_schedule_slots, lesson_generated_resources, lesson_generated_evaluations |
| **BAJO** | non_teaching_blocks, institution_calendar_templates, admin_audit_log, app_config, lesson_attachments, lesson_comments, lesson_autosave_events, image_cache, trial_requests, collaboration, drive, oa_favoritos |

---

## 8. Plan de Respaldo (antes de cualquier migración)

1. Exportar schema completo de DB: `Schema<DB>`
2. Exportar schema completo de CORE_DB: `Schema<CORE_DB>`
3. Contar registros por tabla
4. Guardar en `docs/libro-clases/schema-backup-YYYY-MM-DD.md`
5. Verificar que migración nueva no toca tablas existentes
6. Probar rollback documentado

---

## 9. Conclusión

- **Total tablas DB:** 33
- **Total tablas CORE_DB:** 27
- **Tablas reutilizables para Libro:** 19 (DB) + 13 (CORE_DB) = 32
- **Tablas nuevas necesarias:** 14
- **Tablas a no tocar:** 28 (legacy, seguridad, cache)
- **Máximo riesgo:** teacher_classes, lesson_instances, lesson_plans, institutions, institution_members
