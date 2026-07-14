# Integración con PlanningAgent — Libro de Clases Digital

**Fecha:** 2026-07-13
**Rama:** `feature/libro-clases-digital`

---

## 1. PlanningAgent Existente

**Archivo:** `functions/core/PlanningAgent.ts`
**Función principal:** `PlanningAgent.buildPlan(input)`
**Entrada:** `PlanningInput` { objetivo, nivel, asignatura, duracion, estudiantes, contexto, necesidades, etc. }
**Salida:** `PlanCompleto` { plan, duaGuide, recursos, evaluaciones, presentaciones }

---

## 2. Nuevo Flujo: class_sessions + PlanningAgent

```
class_session (estado: 'open' o 'scheduled')
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Endpoint: POST /api/classbook/sessions/:id/generate-plan   │
│                                                             │
│  1. Cargar class_session + lesson_plan (si existe)          │
│  2. Cargar currículo: objectives, indicators, skills,       │
│     attitudes vinculados (lesson_plan_curriculum o          │
│     class_session.objective_ids_json)                       │
│  3. Construir PlanningInput enriquecido:                    │
│     - objetivo: class_session.planned_content o             │
│       lesson_plan.objective_text                            │
│     - nivel: academic_year → education_level                │
│     - asignatura: subject_id → subjects.name                │
│     - oa_seleccionados: objective_ids_json                  │
│     - indicadores_seleccionados: indicators_json            │
│     - habilidades_seleccionadas: skills_json                │
│     - actitudes_seleccionadas: attitudes_json               │
│     - dua_soportes_previos: dua_supports_json               │
│     - evaluaciones_previas: formative_assessment_json       │
│     - recursos_previos: resources_json                      │
│     - contexto_estudiantes: enrollment + observations       │
│  4. Llamar PlanningAgent.buildPlan(enrichedInput)           │
│  5. Retornar PlanCompleto + guardar en class_session:       │
│     - resources_json ← generated_resources                  │
│     - formative_assessment_json ← evaluations               │
│     - resources_json ← generated_presentations              │
│     - version++ + snapshot en class_session_versions        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Enriquecimiento de PlanningInput

### 3.1 Mapeo de Fuentes

| PlanningInput | Fuente en Libro de Clases |
|---------------|---------------------------|
| `objetivo` | `class_sessions.planned_content` OR `lesson_plans.objective_text` |
| `nivel` | `academic_years` → `education_levels.code` (via institution) |
| `asignatura` | `subjects.name` (CORE_DB) |
| `duracion` | `class_sessions` start_time → end_time diff OR `lesson_plans.duracion` |
| `estudiantes` | `course_enrollments` count (WHERE status='active') |
| `contexto` | `class_sessions.planned_content` + `teacher_notes` |
| `necesidades` | Aggregado de `student_observations` (categoría 'support', 'alert') |
| `oa_seleccionado` | `class_sessions.objective_ids_json` (array) |
| `indicadores_seleccionados` | `class_sessions.indicators_json` |
| `habilidades_seleccionadas` | `class_sessions.skills_json` |
| `actitudes_seleccionadas` | `class_sessions.attitudes_json` |
| `dua_soportes_previos` | `class_sessions.dua_supports_json` |
| `evaluaciones_previas` | `class_sessions.formative_assessment_json` |
| `recursos_previos` | `class_sessions.resources_json` |

### 3.2 Contexto de Estudiantes (Nuevo)

```typescript
interface StudentContextForPlanning {
  total_enrolled: number;
  attendance_rate_avg: number;
  special_needs_count: number;        // observations category 'support'/'alert'
  recent_observations_summary: string; // agregado últimas 2 semanas
  diversity_indicators: {
    with_pie: number;
    with_tea: number;
    with_adhd: number;
    reading_difficulties: number;
  };
}
```

Se calcula en backend desde:
- `course_enrollments` (WHERE status='active') → total_enrolled
- `attendance_records` (últimas 10 sesiones) → attendance_rate_avg
- `student_observations` (últimas 2 sem, category IN ('support','alert')) → special_needs_count
- `student_observations.content` (keywords: PIE, TEA, TDAH, lectura) → diversity_indicators

---

## 4. Salida de PlanningAgent → Almacenamiento en class_sessions

| Salida PlanningAgent | Destino en class_sessions |
|----------------------|---------------------------|
| `plan.beginning` | `planned_content` (prepend) |
| `plan.development` | `planned_content` (append) |
| `plan.closure` | `planned_content` (append) |
| `plan.duaGuide.supports` | `dua_supports_json` (merge) |
| `plan.duaGuide.barriers` | `dua_supports_json` (merge) |
| `plan.resources[]` | `resources_json` (append, tipo 'resource') |
| `plan.evaluations[]` | `formative_assessment_json` (append) |
| `plan.presentations[]` | `resources_json` (append, tipo 'presentation') |
| `plan.skills[]` | `skills_json` (merge unique) |
| `plan.attitudes[]` | `attitudes_json` (merge unique) |

**Regla:** No sobrescribir campos editados manualmente por docente. Solo merge/append.

---

## 5. Endpoints de Integración

### 5.1 Generar Planificación Enriquecida

```
POST /api/classbook/sessions/:id/generate-plan
Body: { force_regenerate?: boolean, options?: { include_dua: true, include_eval: true } }
Response: { plan: PlanCompleto, session: ClassSessionUpdated }
```

### 5.2 Generar Solo Recursos/Evaluaciones (Reutiliza endpoints existentes)

```
POST /api/lessons/:lessonPlanId/generate-resource
POST /api/lessons/:lessonPlanId/generate-evaluation
POST /api/lessons/:lessonPlanId/generate-presentation
```
*Nota: Si class_session tiene lesson_plan_id, reutiliza endpoints legacy. Si no, crea lesson_plan temporal.*

### 5.3 Obtener Contexto para IA

```
GET /api/classbook/sessions/:id/ai-context
Response: { curriculum_context_json, student_context, session_data }
```

---

## 6. Reutilización de Agentes IA Existentes

| Agente | Archivo | Uso en Libro |
|--------|---------|--------------|
| `PlanningAgent` | `functions/core/PlanningAgent.ts` | Generar planificación completa enriquecida |
| `PedagogicalEngine` | `functions/core/PedagogicalEngine.ts` | Validar OA, sugerir DUA, construir plan |
| `AIEngine` | `functions/core/AIEngine.ts` | Orquestador, fallback, prompts |
| `AIReviewAgent` | `functions/core/AIEngine.ts` | Revisar planificación generada |
| `ReportAgent` | `functions/core/AIEngine.ts` | Resumen de sesión, observaciones |
| `DUAEngine` | `functions/core/AIEngine.ts` | Adaptaciones DUA por estudiante |

**No crear nuevos agentes.** Todos existen y tienen fallback obligatorio.

---

## 7. Prompts en app_config (Nueva Categoría)

```sql
-- Categoría: ai_prompts
INSERT OR IGNORE INTO app_config (id, category, value_key, label, sort_order, metadata_json) VALUES
('cfg-aip-01', 'ai_prompts', 'planning_enriched', 'Planificación enriquecida con contexto sesión', 1,
 '{"system": "Eres un planificador pedagógico experto en currículo chileno. Usa el contexto de sesión (lo planificado vs ejecutado, observaciones estudiantes, asistencias) para ajustar la planificación. Nunca diagnostiques. Siempre sugiere apoyos DUA.", "user_template": "Sesión: {date}, Curso: {course}, Asignatura: {subject}\nPlanificado: {planned_content}\nEjecutado: {taught_content}\nOAs: {objective_ids}\nIndicadores: {indicators}\nHabilidades: {skills}\nActitudes: {attitudes}\nApoyos DUA previos: {dua_supports}\nEvaluaciones previas: {formative_assessment}\nRecursos previos: {resources}\nContexto estudiantes: {student_context}\n\nGenera planificación ajustada."}'),

('cfg-aip-02', 'ai_prompts', 'observation_support', 'Sugerencia de apoyo desde observación', 2,
 '{"system": "Eres un apoyo pedagógico. Recibes una observación de estudiante y sugieres adaptaciones DUA. Nunca diagnostiques. Sugiere apoyos concretos (visual, oral, manipulativo, colaborativo, digital).", "user_template": "Observación: {content}\nCategoría: {category}\nEstudiante: {first_name} {last_name}\nCurso: {course}, Asignatura: {subject}\nContexto reciente: {recent_observations}\n\nSugiere 3 adaptaciones DUA concretas."}'),

('cfg-aip-03', 'ai_prompts', 'attendance_alert', 'Alerta de asistencia', 3,
 '{"system": "Eres un analista de asistencia. Detectas patrones y sugieres acción humana. Nunca actúes automáticamente.", "user_template": "Estudiante: {first_name} {last_name}\nCurso: {course}\nTasa asistencia: {rate}%\nPatrón: {pattern}\nObservaciones recientes: {observations}\n\nGenera alerta con 3 acciones recomendadas para coordinador."}'),

('cfg-aip-04', 'ai_prompts', 'review_summary', 'Resumen de revisión planificación', 4,
 '{"system": "Eres un coordinador pedagógico asistente. Resumes la planificación y verificas coherencia curricular.", "user_template": "Planificación: {title}\nOAs: {objective_ids}\nIndicadores: {indicators}\nHabilidades: {skills}\nActitudes: {attitudes}\nMetodologías: {methodologies}\nComentarios previos: {review_comments}\n\nGenera: 1) Resumen ejecutivo 2) Verificación cobertura OA 3) Consistencia metodológica 4) Sugerencias DUA 5) Estado recomendado (approved/observed/returned)."}');
```

---

## 8. Flujo de Datos en Tiempo Real (WebSocket - Futuro)

```
Frontend (ClassBookView)
    │
    ├──► Edita taught_content ──► POST /api/classbook/sessions/:id (debounced)
    │                                    │
    │                                    ▼
    │                            class_sessions updated_at
    │                                    │
    │                                    ▼
    ├──► Click "Generar con IA" ──► POST /api/classbook/sessions/:id/generate-plan
    │                                    │
    │                                    ▼
    │                            PlanningAgent.buildPlan(enrichedInput)
    │                                    │
    │                                    ▼
    ├──► Recibe PlanCompleto ◄─────── Merge en class_session (version++)
    │                                    │
    │                                    ▼
    ├──► Docente revisa/ajusta ──► PATCH /api/classbook/sessions/:id
    │                                    │
    │                                    ▼
    ├──► Click "Firmar" ──► POST /api/classbook/sessions/:id/sign (PIN)
    │                                    │
    │                                    ▼
    ├──► status='signed' ◄──────── signature_events + content_hash
    │
    └──► WebSocket broadcast (opcional) → Coordinador ve update en dashboard
```

---

## 9. Validación de Regresión (PlanningAgent)

| Caso | Esperado |
|------|----------|
| Llamar `POST /api/generate-project` (existente) | Funciona igual (sin cambios) |
| Llamar `POST /api/lessons/:id/generate-resource` | Funciona igual (usa lesson_plan_id) |
| `PlanningAgent.buildPlan(input_basico)` | Retorna PlanCompleto válido (tests existentes) |
| `PlanningAgent.buildPlan(input_enriquecido)` | Retorna PlanCompleto con DUA, evaluaciones, recursos |
| Fallback IA (gemini → openrouter → local) | Funciona en todos los endpoints nuevos |
| `ai_prompts` en app_config | Cargados correctamente por `useConfigOptions` |

---

## 10. Próximos Pasos (FASE 6.4+)

1. **Endpoint `/api/classbook/sessions/:id/generate-plan`** — Implementar en FASE 6.4
2. **Contexto de estudiantes** — Calcular `StudentContextForPlanning` en backend
3. **Prompts en app_config** — Agregar categoría `ai_prompts` (ver SQL arriba)
4. **Frontend** — Botón "Generar con IA" en `ClassSessionDetail`
5. **Tests** — `test/classbookPlanningIntegration.test.ts`

---

*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*