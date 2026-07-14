# Flujo de Datos hacia IA — Libro de Clases Digital

**Fecha:** 2026-07-13
**Rama:** `feature/libro-clases-digital`
**Objetivo:** Documentar cómo las nuevas tablas alimentan a los agentes IA existentes

---

## 1. Principio Rector

**No crear nuevos agentes.** Reutilizar orquestador existente (`functions/core/AIEngine.ts`, `functions/core/PlanningAgent.ts`, `functions/core/PedagogicalEngine.ts`) y prompts configurables en `app_config`.

Las nuevas tablas son **fuentes de datos** que enriquecen el contexto existente.

---

## 2. Mapa de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NUEVAS FUENTES DE DATOS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  class_sessions          student_observations    attendance_records    │
│  class_session_versions  planning_reviews        signature_events      │
│  course_enrollments      academic_years/terms    coordinator_scopes    │
│  student_profiles                                                │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORQUESTADOR EXISTENTE (AIEngine)                     │
│  buildPrompt(context) → selectProvider() → parseResponse()             │
│  Con fallback obligatorio: local → gemini → openrouter → huggingface   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │  PlanningAgent  │ │  AIReviewAgent  │ │  DUAEngine      │
    │  (existente)    │ │  (existente)    │ │  (existente)    │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ Salida          │ │ Salida          │ │ Salida          │
    │ - Planificación │ │ - Observaciones │ │ - Adaptaciones  │
    │ - Recursos      │ │ - Alertas       │ │ - Apoyos DUA    │
    │ - Evaluaciones  │ │ - Recomendaciones│ │ - Barreras      │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
              ┌────────────────────────────────────────┐
              │      REVISIÓN HUMANA OBLIGATORIA        │
              │  (Docente/Coordinador aprueba o ajusta) │
              └────────────────────┬───────────────────┘
                                   ▼
              ┌────────────────────────────────────────┐
              │      PERSISTENCIA ESTRUCTURADA          │
              │  class_sessions, observations, reviews │
              │  attendance, signature_events, versions │
              └────────────────────────────────────────┘
```

---

## 3. Tablas Fuente → Contexto IA → Agente Existente → Salida

### 3.1 class_sessions (+ lesson_plans existentes)

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `class_sessions` + `lesson_plans` + `lesson_plan_curriculum` | Sesión programada + planificación base + currículo (OA, indicadores, habilidades, actitudes) | **PlanningAgent** / **PedagogicalEngine** | - Resumen de lo planificado vs ejecutado<br>- Sugerencia de ajustes DUA<br>- Detección de brechas curriculares<br>- Propuesta de recursos/actividades | Docente **confirma/ajusta** antes de marcar `completed` | `class_sessions.taught_content`, `resources_json`, `dua_supports_json`, `formative_assessment_json`; nueva versión en `class_session_versions` |

### 3.2 attendance_records (+ course_enrollments)

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `attendance_records` + `course_enrollments` + `student_profiles` | Tendencias de asistencia por estudiante/curso/período | **ReportAgent** (existente en `AIEngine.generateReport`) | - Alertas: ausentismo crónico (>20%), llegadas tarde recurrentes<br>- Patrones por día/asignatura<br>- Estudiantes en riesgo | Coordinador **revisa alerta**, decide acción (contacto familiar, derivación PIE) | `student_observations` (categoría 'attendance' + 'alert'), `classbook_audit_log` |

> **NUNCA** modificar `attendance_records` automáticamente. Solo generar `student_observations` tipo 'alert'.

### 3.3 student_observations (+ student_profiles + class_sessions)

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `student_observations` + `student_profiles` + `class_sessions` | Historial observacional + perfil estudiante + contexto de sesión | **AIReviewAgent** / **SupportAgent** (existente) | - Resumen de patrones (ej. "3 observaciones 'academic' en Matemática este semestre")<br>- Sugerencia de apoyos DUA por categoría<br>- Recomendación derivación PIE si patrón 'alert' | Docente/Coordinador **aprueba/descarta** sugerencia; decide derivación | Nueva `student_observations` (categoría 'support' o 'follow_up'), `classbook_audit_log` |

> **NUNCA** diagnóstico automático (TEA, TDAH, etc.). Solo "patrón observado → sugerencia apoyo".

### 3.4 planning_reviews (+ class_sessions/lesson_plans)

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `planning_reviews` + `lesson_plans`/`class_sessions` + currículo | Planificación + estado revisión + comentarios previos | **AIReviewAgent** | - Resumen ejecutivo de la planificación<br>- Verificación cobertura OA/indicadores<br>- Consistencia metodológica<br>- Sugerencias DUA | Coordinador **aprueba/observa/devuelve** con comentarios | `planning_reviews.status` + `comments`, `classbook_audit_log` |

### 3.5 coordinator_scopes + class_sessions

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `coordinator_scopes` + `class_sessions` (filtrado por alcance) | Sesiones dentro del alcance del coordinador | **DashboardAgent** (futuro, reusa `AIEngine`) | - KPIs: % planificadas, % firmadas, % con observaciones<br>- Alertas: cursos sin planificar, profesores sin firmar<br>- Tendencias semanales/mensuales | Coordinador **visualiza**, no modifica datos | Solo lectura; persistencia en `classbook_audit_log` de acceso |

### 3.6 signature_events + teacher_signature_credentials

| Fuente | Contexto IA | Agente | Salida | Revisión Humana | Persistencia |
|--------|-------------|--------|--------|-----------------|--------------|
| `signature_events` + `teacher_signature_credentials` | Eventos de firma (éxito/fallo/bloqueo) | **AuthAgent** (existente en `AIEngine`) | - Detección de patrones anómalos (múltiples fallos, horario inusual)<br>- Alerta de credenciales comprometidas | Admin **revisa alerta**, decide reset PIN | `teacher_signature_credentials.failed_attempts`, `locked_until`, `classbook_audit_log` |

---

## 4. Formato de Contexto Estándar (buildPrompt)

Cada agente recibe `curriculum_context_json` enriquecido:

```json
{
  "class_session": {
    "id": "uuid",
    "date": "2026-07-13",
    "course_id": "tc-uuid",
    "subject_id": "subject-uuid",
    "status": "completed",
    "planned_content": "...",
    "taught_content": "...",
    "objective_ids": ["oa-uuid-1"],
    "indicators": [...],
    "skills": ["skill-uuid-1"],
    "attitudes": ["att-uuid-1"],
    "dua_supports": [...],
    "formative_assessment": {...},
    "resources": [...]
  },
  "student_context": [
    {
      "student_id": "sp-uuid",
      "enrollment_status": "active",
      "attendance_rate": 0.92,
      "recent_observations": [
        {"category": "academic", "content": "...", "date": "2026-07-10"}
      ]
    }
  ],
  "curriculum": {
    "objectives": [...],
    "indicators": [...],
    "skills": [...],
    "attitudes": [...]
  },
  "institution": {
    "id": "inst-uuid",
    "academic_year": "2026",
    "academic_term": "Semestre 1"
  }
}
```

---

## 5. Reglas de Seguridad IA

| Regla | Implementación |
|-------|----------------|
| **Fallback obligatorio** | `AIEngine.callAI()` ya implementa local → gemini → openrouter → huggingface |
| **No diagnóstico médico** | Prompts prohíben explícitamente términos diagnósticos; validación en `parseResponse()` |
| **No modificación automática de datos** | Agentes solo generan JSON; persistencia vía `POST /api/classbook/*` con revisión humana |
| **Trazabilidad** | Todo output IA guardado en `agent_runs` + `classbook_audit_log` |
| **Privacidad** | Contexto IA anonimiza `student_id` → hash interno; `student_profiles` solo en backend |

---

## 6. Agentes Existentes Reutilizables

| Agente | Archivo | Uso en Libro de Clases |
|--------|---------|------------------------|
| `PlanningAgent` | `functions/core/PlanningAgent.ts` | Generar planificación desde `class_sessions` + currículo |
| `PedagogicalEngine` | `functions/core/PedagogicalEngine.ts` | Construir plan, validar OA, sugerir DUA |
| `AIEngine` | `functions/core/AIEngine.ts` | Orquestador central, fallback, agentes |
| `AIReviewAgent` (en `AIEngine`) | `functions/core/AIEngine.ts` | Revisar planificaciones, observaciones |
| `ReportAgent` (en `AIEngine`) | `functions/core/AIEngine.ts` | Reportes asistencia, observaciones |
| `DUAEngine` (en `AIEngine`) | `functions/core/AIEngine.ts` | Adaptaciones DUA por estudiante |

---

## 7. Próximos Pasos (FASE 6.4+)

1. **Endpoints de contexto** → `/api/classbook/context/session/:id` devuelve `curriculum_context_json` listo para IA
2. **Prompts en `app_config`** → Categoría `ai_prompts` con templates por agente
3. **Tests de integración** → `test/classbookAIContext.test.ts` validan contexto correcto
4. **Dashboard Coordinador** → FASE 6.8 consume `coordinator_scopes` + `class_sessions` filtrados

---

*Documento generado como parte de FASE 6.2 — Modelo de Datos Aditivo*