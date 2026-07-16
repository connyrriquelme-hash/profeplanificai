# FASE 6.6 — Teacher Workflow Audit

## Current Architecture

### Components

| Component | Location | Purpose |
|---|---|---|
| `MisClases` | `src/components/MisClases.tsx` (971 lines) | Lesson planner, calendar, IA generation, autosave |
| `ClassbookView` | `src/pages/ClassbookView.tsx` | Main Libro de Clases view with sidebar routing |
| `ClassSessionDetailView` | `src/components/classbook/ClassSessionDetailView.tsx` (224 lines) | Session detail — only taught_content + notes editable |
| `AttendancePanel` | `src/components/classbook/AttendancePanel.tsx` | Attendance — separate tab, not linked to session detail |
| `ObservationsPanel` | `src/components/classbook/ObservationsPanel.tsx` | Observations — separate tab, no session linkage |
| `PlanningReviewsPanel` | `src/components/classbook/PlanningReviewsPanel.tsx` | Reviews — read-only list, no actions |
| `ClassbookOverview` | `src/components/classbook/ClassbookOverview.tsx` | Stats + recent sessions |

### Data Flow (Current)

```
Mis Clases                     Libro de Clases
───────────                    ──────────────
Create lesson ───────────────── POST /sessions/from-lesson ──> ClassSession (scheduled)
Edit plan (autosave) ─────────> PATCH /lessons/:id/autosave
Generate IA ───────────────────> POST /lessons/:id/generate-*
Save to Bank ──────────────────> POST /api/resources

Separate tab:                   Separate tab:
Asistencia ───────────────────> GET/PUT /sessions/:id/attendance
Observaciones ─────────────────> GET/POST /observations
Revisiones ────────────────────> GET /planning-reviews (read-only)
Firmas ────────────────────────> (NO COMPONENT)
```

### Identified Gaps

| # | Gap | Impact |
|---|---|---|
| G1 | Session detail only edits taught_content + notes — not the plan fields | Teacher cannot edit plan during class |
| G2 | No automatic versioning — update() never creates snapshots | No history, no comparison, no audit trail |
| G3 | No signing from frontend — Signatures tab has no component | Cannot complete the workflow |
| G4 | Frontend observation categories don't match backend | Data mismatch, potential errors |
| G5 | Observations not linked to session context | No per-session observation view |
| G6 | Reviews panel is read-only — no approve/observe/return actions | Coordinator cannot act |
| G7 | Attendance in separate tab — not visible in session detail | Teacher must navigate away |
| G8 | Status enum mismatch (backend: open/corrected, frontend: in_progress) | Possible runtime errors |
| G9 | No session state flow UI (scheduled → completed → signed → archived) | No visual lifecycle |
| G10 | No inline observation creation from session detail | Must leave session to add observation |
| G11 | No resource/evaluation display in session detail | IA-generated content invisible in Libro |
| G12 | Mis Clases sends to Libro but never opens the created session | Dead-end after sending |
| G13 | `batchUpsert()` bug — references existing.institution_id when existing is null | Runtime crash on new attendance records |

### Session Status Lifecycle (Backend)

```
scheduled ──[POST /complete, finalize=false]──> completed
scheduled ──[DELETE /sessions/:id]────────────> cancelled
completed ──[POST /complete, finalize=true]───> pending_signature
completed ──[PATCH /status: 'completed']──────> completed (no-op)
pending_signature ──[POST /signature]─────────> signed
```

### Permission Model

| Role | Scope |
|---|---|
| super_admin | Global |
| institution_admin | Institution |
| coordinator | Scope (grade/department) |
| teacher | Own sessions only |

### Versioning (Backend Only — Not Wired)

- `class_session_versions` table exists
- `ClassSessionService.createVersion()` exists but is NEVER called
- `GET /sessions/:id/versions` endpoint exists but returns empty
- Version field on session is static at 1

### What PlanningAgent Produces (Available for Read-Only Display)

**LessonPlan fields:**
- objective_text, purpose_text, beginning_text, development_text, closure_text
- challenge_question, abp_project_text, resources_text, evaluation_text, instruments_text
- dua_adjustments_text, teacher_observations

**Curriculum:**
- level, subject, OA (code + text), indicators[], skills[], attitudes[], methodology

**Generated resources** (from `lesson_generated_resources`):
- resource_type, title, content_json, ai_provider, created_at

**Generated evaluations** (from `lesson_generated_evaluations`):
- evaluation_type, title, content_json, rubric_json, answer_key_json

**ClassSession has:**
- planned_content, taught_content, objective_ids_json, indicators_json
- skills_json, attitudes_json, dua_supports_json, resources_json
- status, version, signed_version
